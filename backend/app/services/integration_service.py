import os
import httpx
from datetime import datetime, timedelta
from typing import Optional, List

from app.core.config import settings
from app.repositories.integration_repository import integration_repository
from app.repositories.document_repository import document_repository
from app.models.mongodb_models import (
    Integration, IntegrationProvider, IntegrationStatus,
    Document, DocumentCategory, CategoryFolderIds,
    ExternalLinks, ExternalLinkDetails
)
from app.utils.encryption import encrypt_data, decrypt_data
from app.integrations.google_drive_client import GoogleDriveClient
from app.integrations.notion_client import NotionClient
from app.utils.r2_storage import get_r2_storage

class IntegrationService:
    @staticmethod
    def get_google_auth_url(user_id: str) -> str:
        # Encrypt user_id to use as state for OAuth verification
        state = encrypt_data(user_id)
        return GoogleDriveClient.get_auth_url(state)

    @staticmethod
    def get_notion_auth_url(user_id: str) -> str:
        state = encrypt_data(user_id)
        return NotionClient.get_auth_url(state)

    @staticmethod
    async def handle_google_callback(user_id: str, code: str, state: str) -> Integration:
        # Verify state matches user_id
        decrypted_user_id = decrypt_data(state)
        if decrypted_user_id != user_id:
            raise Exception("State verification failed for Google OAuth callback")
            
        # Exchange code for tokens
        token_data = await GoogleDriveClient.exchange_code(code)
        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        expires_in = token_data.get("expires_in", 3600)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        # Check if integration already exists
        existing = await integration_repository.find_by_user_and_provider(user_id, IntegrationProvider.GOOGLE_DRIVE)
        
        # First-time folder setup
        root_folder_id = None
        category_folder_ids = {}
        
        if existing and existing.root_folder_id:
            root_folder_id = existing.root_folder_id
            category_folder_ids = existing.category_folder_ids.model_dump() if existing.category_folder_ids else {}
        else:
            # Create "KizunaX" root folder
            try:
                root_folder_id = await GoogleDriveClient.create_folder(access_token, "KizunaX")
                # Create subfolders for each category
                for cat in DocumentCategory:
                    folder_id = await GoogleDriveClient.create_folder(access_token, cat.value, root_folder_id)
                    category_folder_ids[cat.value] = folder_id
            except Exception as e:
                print(f"Error setting up Google Drive folders: {e}")
                raise Exception(f"Failed to set up Google Drive directory structure: {e}")
                
        # Save integration record
        integration_data = {
            "user_id": user_id,
            "provider": IntegrationProvider.GOOGLE_DRIVE,
            "status": IntegrationStatus.CONNECTED,
            "access_token_encrypted": encrypt_data(access_token),
            "refresh_token_encrypted": encrypt_data(refresh_token) if refresh_token else (existing.refresh_token_encrypted if existing else None),
            "token_expires_at": expires_at,
            "root_folder_id": root_folder_id,
            "category_folder_ids": category_folder_ids,
            "connected_at": datetime.utcnow()
        }
        
        if existing:
            return await integration_repository.update(str(existing.id), integration_data)
        else:
            return await integration_repository.create(integration_data)

    @staticmethod
    async def handle_notion_callback(user_id: str, code: str, state: str) -> Integration:
        decrypted_user_id = decrypt_data(state)
        if decrypted_user_id != user_id:
            raise Exception("State verification failed for Notion OAuth callback")
            
        token_data = await NotionClient.exchange_code(code)
        access_token = token_data.get("access_token")
        workspace_name = token_data.get("workspace_name", "Notion Workspace")
        
        # Check if integration already exists
        existing = await integration_repository.find_by_user_and_provider(user_id, IntegrationProvider.NOTION)
        
        database_id = None
        if existing and existing.database_id:
            database_id = existing.database_id
        else:
            # Create "KizunaX Journey" database
            try:
                parent_page_id = await NotionClient.get_parent_page_id(access_token)
                database_id = await NotionClient.create_database(access_token, parent_page_id)
            except Exception as e:
                print(f"Error setting up Notion database: {e}")
                raise Exception(f"Failed to set up Notion Journey database: {e}")
                
        integration_data = {
            "user_id": user_id,
            "provider": IntegrationProvider.NOTION,
            "status": IntegrationStatus.CONNECTED,
            "access_token_encrypted": encrypt_data(access_token),
            "database_id": database_id,
            "workspace_name": workspace_name,
            "connected_at": datetime.utcnow()
        }
        
        if existing:
            return await integration_repository.update(str(existing.id), integration_data)
        else:
            return await integration_repository.create(integration_data)

    @staticmethod
    async def disconnect(user_id: str, provider: IntegrationProvider) -> bool:
        existing = await integration_repository.find_by_user_and_provider(user_id, provider)
        if not existing:
            return False
            
        await integration_repository.delete(str(existing.id))
        return True

    @staticmethod
    async def get_valid_google_token(integration: Integration) -> str:
        # Check if token is expired (or close to it)
        if integration.token_expires_at and datetime.utcnow() < integration.token_expires_at - timedelta(minutes=5):
            return decrypt_data(integration.access_token_encrypted)
            
        # Expired: use refresh token to get a new one
        if not integration.refresh_token_encrypted:
            raise Exception("Access token expired and no refresh token available")
            
        refresh_tok = decrypt_data(integration.refresh_token_encrypted)
        refreshed = await GoogleDriveClient.refresh_token(refresh_tok)
        
        new_access = refreshed["access_token"]
        expires_in = refreshed.get("expires_in", 3600)
        new_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        # Update integration in db
        await integration_repository.update(str(integration.id), {
            "access_token_encrypted": encrypt_data(new_access),
            "token_expires_at": new_expires_at
        })
        
        return new_access

    @staticmethod
    async def push_document_to_integrations(document_id: str, user_id: str):
        document = await document_repository.find_by_id(document_id)
        if not document or document.user_id != user_id:
            return
            
        integrations = await integration_repository.find_by_user_id(user_id)
        if not integrations:
            return
            
        # Ensure external_links is initialized
        if not document.external_links:
            document.external_links = ExternalLinks(
                google_drive=ExternalLinkDetails(),
                notion=ExternalLinkDetails()
            )
            
        for integration in integrations:
            if integration.provider == IntegrationProvider.GOOGLE_DRIVE and integration.status == IntegrationStatus.CONNECTED:
                # Check if already pushed
                if document.external_links.google_drive and document.external_links.google_drive.status == "pushed":
                    continue
                    
                try:
                    access_token = await IntegrationService.get_valid_google_token(integration)
                    
                    # Fetch file bytes from R2
                    r2 = get_r2_storage()
                    if not r2 or not document.storage_key:
                        raise Exception("R2 storage not configured or file storage key missing")
                        
                    # Fetch raw bytes via boto3 client from r2
                    response = r2.s3_client.get_object(Bucket=r2.bucket_name, Key=document.storage_key)
                    file_bytes = response['Body'].read()
                    
                    # Resolve category folder
                    category = document.category.value if document.category else "Academics"
                    folder_id = None
                    if integration.category_folder_ids:
                        # Convert model to dict if needed
                        folder_map = integration.category_folder_ids
                        if hasattr(folder_map, 'model_dump'):
                            folder_map = folder_map.model_dump()
                        folder_id = folder_map.get(category)
                        
                    if not folder_id:
                        folder_id = integration.root_folder_id
                        
                    # Filename convention: YYYY-MM_filename.ext
                    date_prefix = document.created_at.strftime("%Y-%m")
                    sanitized_name = document.filename.replace(" ", "_")
                    gdrive_filename = f"{date_prefix}_{sanitized_name}"
                    
                    upload_res = await GoogleDriveClient.upload_file(
                        access_token=access_token,
                        folder_id=folder_id,
                        filename=gdrive_filename,
                        content_type=document.file_type or "application/octet-stream",
                        file_bytes=file_bytes
                    )
                    
                    document.external_links.google_drive = ExternalLinkDetails(
                        file_id=upload_res["file_id"],
                        web_view_link=upload_res["web_view_link"],
                        pushed_at=datetime.utcnow(),
                        status="pushed"
                    )
                except Exception as e:
                    print(f"Failed to push document to Google Drive: {e}")
                    document.external_links.google_drive.status = "failed"
                    await integration_repository.update(str(integration.id), {"last_error": str(e), "status": IntegrationStatus.ERROR})
                    
            elif integration.provider == IntegrationProvider.NOTION and integration.status == IntegrationStatus.CONNECTED:
                if document.external_links.notion and document.external_links.notion.status == "pushed":
                    continue
                    
                try:
                    access_token = decrypt_data(integration.access_token_encrypted)
                    database_id = integration.database_id
                    
                    # Skills list
                    skills = []
                    if document.extracted_fields and document.extracted_fields.skills_detected:
                        skills = document.extracted_fields.skills_detected
                        
                    date_str = document.created_at.strftime("%Y-%m-%d")
                    category = document.category.value if document.category else "Academics"
                    kizunax_link = f"http://localhost:3000/documents/{str(document.id)}" # deep link
                    
                    # Notion page push
                    page_res = await NotionClient.create_page(
                        access_token=access_token,
                        database_id=database_id,
                        title=document.filename,
                        category=category,
                        date_str=date_str,
                        skills=skills,
                        source_url=document.storage_url or "",
                        kizunax_link=kizunax_link
                    )
                    
                    document.external_links.notion = ExternalLinkDetails(
                        page_id=page_res["page_id"],
                        url=page_res["url"],
                        pushed_at=datetime.utcnow(),
                        status="pushed"
                    )
                except Exception as e:
                    print(f"Failed to push document to Notion: {e}")
                    document.external_links.notion.status = "failed"
                    await integration_repository.update(str(integration.id), {"last_error": str(e), "status": IntegrationStatus.ERROR})
                    
        # Update document in MongoDB
        await document_repository.update(str(document.id), {"external_links": document.external_links.model_dump()})

    @staticmethod
    async def resync_all(user_id: str, provider: IntegrationProvider):
        # Fetch all indexed documents for user
        docs = await document_repository.get_indexed_documents(user_id, skip=0, limit=1000)
        for doc in docs:
            # Check if this provider needs a push
            should_push = False
            if not doc.external_links:
                should_push = True
            else:
                link_details = getattr(doc.external_links, provider.value, None)
                if not link_details or link_details.status in ("failed", "skipped"):
                    should_push = True
                    
            if should_push:
                try:
                    await IntegrationService.push_document_to_integrations(str(doc.id), user_id)
                except Exception as e:
                    print(f"Manual resync failed for document {doc.id}: {e}")
