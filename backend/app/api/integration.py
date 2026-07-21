from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_active_user, UserInfo
from app.repositories.integration_repository import integration_repository
from app.services.integration_service import IntegrationService

router = APIRouter()

class IntegrationStatusResponse(BaseModel):
    provider: str
    status: str
    workspace_name: Optional[str] = None
    last_synced_at: Optional[str] = None
    last_error: Optional[str] = None
    connected_at: Optional[str] = None

class AuthUrlResponse(BaseModel):
    authUrl: str

@router.get("/status", response_model=List[IntegrationStatusResponse])
async def get_integration_statuses(current_user: UserInfo = Depends(get_current_active_user)):
    """Get active integrations status for the current user"""
    try:
        user_id = current_user.id
        integrations = integration_repository.find_by_user_id(user_id)
        
        res = []
        providers = ["google_drive", "notion"]
        for provider in providers:
            found = next((i for i in integrations if i.get("provider") == provider), None)
            if found:
                res.append(IntegrationStatusResponse(
                    provider=provider,
                    status=found.get("status", "connected"),
                    workspace_name=found.get("workspace_name") or (f"Google Drive" if provider == "google_drive" else None),
                    last_synced_at=found.get("last_synced_at"),
                    last_error=found.get("last_error"),
                    connected_at=found.get("connected_at")
                ))
            else:
                res.append(IntegrationStatusResponse(
                    provider=provider,
                    status="disconnected"
                ))
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/google/auth-url", response_model=AuthUrlResponse)
async def get_google_auth_url(current_user: UserInfo = Depends(get_current_active_user)):
    """Get Google OAuth URL"""
    try:
        url = IntegrationService.get_google_auth_url(current_user.id)
        return AuthUrlResponse(authUrl=url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/google/callback")
async def google_callback(code: str, state: str):
    """Callback for Google OAuth flow"""
    try:
        from app.utils.encryption import decrypt_data
        user_id = decrypt_data(state)
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
            
        await IntegrationService.handle_google_callback(user_id, code, state)
        return RedirectResponse(url="http://localhost:5173/settings?connected=google")
    except Exception as e:
        print(f"Google OAuth callback error: {e}")
        return RedirectResponse(url=f"http://localhost:5173/settings?error={str(e)}")

@router.get("/notion/auth-url", response_model=AuthUrlResponse)
async def get_notion_auth_url(current_user: UserInfo = Depends(get_current_active_user)):
    """Get Notion OAuth URL"""
    try:
        url = IntegrationService.get_notion_auth_url(current_user.id)
        return AuthUrlResponse(authUrl=url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notion/callback")
async def notion_callback(code: str, state: str):
    """Callback for Notion OAuth flow"""
    try:
        from app.utils.encryption import decrypt_data
        user_id = decrypt_data(state)
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
            
        await IntegrationService.handle_notion_callback(user_id, code, state)
        return RedirectResponse(url="http://localhost:5173/settings?connected=notion")
    except Exception as e:
        print(f"Notion OAuth callback error: {e}")
        return RedirectResponse(url=f"http://localhost:5173/settings?error={str(e)}")

@router.delete("/{provider}")
async def disconnect_integration(provider: str, current_user: UserInfo = Depends(get_current_active_user)):
    """Disconnect an integration provider"""
    try:
        user_id = current_user.id
        success = await IntegrationService.disconnect(user_id, provider)
        if not success:
            raise HTTPException(status_code=404, detail="Integration not found or not connected")
        return {"status": "success", "message": f"Disconnected {provider}"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{provider}/resync")
async def resync_integration(provider: str, current_user: UserInfo = Depends(get_current_active_user)):
    """Trigger manual resync of all documents to the provider"""
    try:
        user_id = current_user.id
        await IntegrationService.resync_all(user_id, provider)
        return {"status": "success", "message": f"Resync started for {provider}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
