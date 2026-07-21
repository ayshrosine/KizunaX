import os
import tempfile
from datetime import datetime
from typing import Optional

from app.models.schemas import DocumentCategory, DocumentStatus
from app.repositories.document_repository import document_repository
from app.services.ingestion import process_uploaded_file
from app.services.categorization import categorize_document
from app.services.relationships import detect_for_document

try:
    from app.services.embeddings import embedding_service
except Exception:
    embedding_service = None


class DocumentProcessingService:
    """Post-upload pipeline: extract text, classify, embed, detect relationships."""

    async def process_document(
        self,
        user_id: str,
        document_id: str,
        file_content: bytes,
        filename: str,
    ) -> None:
        file_extension = filename.split(".")[-1].lower() if "." in filename else "txt"

        try:
            document_repository.update_status(document_id, DocumentStatus.EXTRACTING.value)

            # Extract text (process_uploaded_file is async)
            extracted = await process_uploaded_file(file_content, filename, file_extension)
            content = extracted.get("content", "") or filename
            title = extracted.get("title", filename)

            document_repository.update(document_id, {
                "extracted_text": content,
            })

            document_repository.update_status(document_id, DocumentStatus.CLASSIFYING.value)

            # Categorization (categorize_document is async)
            category_result = await categorize_document(title, content, user_id, document_id)
            category_name = category_result.get("category", "Projects")

            # Validate category against enum
            try:
                category = DocumentCategory(category_name)
            except ValueError:
                category = DocumentCategory.PROJECTS
                print(f"Invalid category '{category_name}', using default")

            # Check confidence threshold
            confidence = category_result.get("confidence", 0.5)

            document_repository.update(document_id, {
                "category": category.value,
                "category_confidence": confidence,
            })

            # Generate embedding and add to Qdrant
            if embedding_service and content.strip():
                year = datetime.utcnow().year
                try:
                    embedding_service.add_document_embedding(
                        str(document_id),
                        content,
                        {
                            "user_id": user_id,  # MANDATORY for multi-tenant isolation
                            "category": category.value,
                            "year": year,
                            "filename": filename,
                        },
                    )
                except ValueError as e:
                    print(f"Failed to add embedding: {e}")
                    raise

            # Detect relationships for this specific document (detect_for_document is async)
            await detect_for_document(document_id, user_id)

            # Mark as indexed only if all steps succeeded
            document_repository.update(document_id, {
                "status": DocumentStatus.INDEXED.value,
            })

            # Non-blocking push to external integrations (Google Drive / Notion)
            try:
                from app.services.integration_service import IntegrationService
                await IntegrationService.push_document_to_integrations(document_id, user_id)
            except Exception as e:
                print(f"Non-blocking error pushing to integrations for doc {document_id}: {e}")

        except Exception as e:
            failure_reason = str(e)
            print(f"Document processing failed for {document_id}: {e}")
            document_repository.update(document_id, {
                "status": DocumentStatus.FAILED.value,
                "failure_reason": failure_reason
            })


document_processing_service = DocumentProcessingService()
