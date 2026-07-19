import json
import httpx
from app.core.config import settings

class GoogleDriveClient:
    @staticmethod
    def get_auth_url(state: str) -> str:
        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "https://www.googleapis.com/auth/drive.file",
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{base_url}?{query_string}"

    @staticmethod
    async def exchange_code(code: str) -> dict:
        url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(url, data=data)
            res.raise_for_status()
            return res.json()

    @staticmethod
    async def refresh_token(refresh_token_str: str) -> dict:
        url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token_str,
            "grant_type": "refresh_token"
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(url, data=data)
            res.raise_for_status()
            return res.json()

    @staticmethod
    async def create_folder(access_token: str, name: str, parent_id: str = None) -> str:
        url = "https://www.googleapis.com/drive/v3/files"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        body = {
            "name": name,
            "mimeType": "application/vnd.google-apps.folder"
        }
        if parent_id:
            body["parents"] = [parent_id]
            
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=body, headers=headers)
            res.raise_for_status()
            return res.json()["id"]

    @staticmethod
    async def upload_file(access_token: str, folder_id: str, filename: str, content_type: str, file_bytes: bytes) -> dict:
        url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        
        metadata = {
            "name": filename,
            "parents": [folder_id]
        }
        
        boundary = "kizunax_boundary_12345"
        headers["Content-Type"] = f"multipart/related; boundary={boundary}"
        
        # Build body as bytes
        body = b""
        body += f"--{boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{json.dumps(metadata)}\r\n".encode('utf-8')
        body += f"--{boundary}\r\nContent-Type: {content_type}\r\n\r\n".encode('utf-8')
        body += file_bytes
        body += f"\r\n--{boundary}--\r\n".encode('utf-8')
        
        async with httpx.AsyncClient() as client:
            res = await client.post(url, content=body, headers=headers)
            res.raise_for_status()
            data = res.json()
            
            # Fetch webViewLink
            file_id = data["id"]
            get_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?fields=webViewLink"
            headers_get = {"Authorization": f"Bearer {access_token}"}
            get_res = await client.get(get_url, headers=headers_get)
            get_res.raise_for_status()
            web_view_link = get_res.json().get("webViewLink", "")
            
            return {
                "file_id": file_id,
                "web_view_link": web_view_link
            }
