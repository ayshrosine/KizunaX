import httpx
from app.core.config import settings

class NotionClient:
    NOTION_VERSION = "2022-06-28"

    @staticmethod
    def get_auth_url(state: str) -> str:
        base_url = "https://api.notion.com/v1/oauth/authorize"
        params = {
            "client_id": settings.NOTION_CLIENT_ID,
            "redirect_uri": settings.NOTION_REDIRECT_URI,
            "response_type": "code",
            "owner": "user",
            "state": state
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{base_url}?{query_string}"

    @staticmethod
    async def exchange_code(code: str) -> dict:
        url = "https://api.notion.com/v1/oauth/token"
        headers = {
            "Content-Type": "application/json"
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(
                url,
                json={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.NOTION_REDIRECT_URI
                },
                auth=(settings.NOTION_CLIENT_ID, settings.NOTION_CLIENT_SECRET),
                headers=headers
            )
            res.raise_for_status()
            return res.json()

    @staticmethod
    async def get_parent_page_id(access_token: str) -> str:
        url = "https://api.notion.com/v1/search"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Notion-Version": NotionClient.NOTION_VERSION,
            "Content-Type": "application/json"
        }
        body = {
            "filter": {
                "value": "page",
                "property": "object"
            },
            "page_size": 1
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=body, headers=headers)
            res.raise_for_status()
            results = res.json().get("results", [])
            if not results:
                raise Exception("No shared pages found to use as parent page in Notion")
            return results[0]["id"]

    @staticmethod
    async def create_database(access_token: str, parent_page_id: str) -> str:
        url = "https://api.notion.com/v1/databases"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Notion-Version": NotionClient.NOTION_VERSION,
            "Content-Type": "application/json"
        }
        body = {
            "parent": { "type": "page_id", "page_id": parent_page_id },
            "title": [ { "type": "text", "text": { "content": "KizunaX Journey" } } ],
            "properties": {
                "Title": { "title": {} },
                "Category": {
                    "select": {
                        "options": [
                            { "name": "Projects", "color": "blue" },
                            { "name": "Skills", "color": "green" },
                            { "name": "Certifications", "color": "yellow" },
                            { "name": "Internships", "color": "purple" },
                            { "name": "Achievements", "color": "orange" },
                            { "name": "Academics", "color": "gray" }
                        ]
                    }
                },
                "Date": { "date": {} },
                "Skills": { "multi_select": {} },
                "Source": { "url": {} },
                "KizunaX Link": { "url": {} }
            }
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=body, headers=headers)
            res.raise_for_status()
            return res.json()["id"]

    @staticmethod
    async def create_page(
        access_token: str,
        database_id: str,
        title: str,
        category: str,
        date_str: str,
        skills: list[str],
        source_url: str,
        kizunax_link: str
    ) -> dict:
        url = "https://api.notion.com/v1/pages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Notion-Version": NotionClient.NOTION_VERSION,
            "Content-Type": "application/json"
        }
        
        properties = {
            "Title": {
                "title": [
                    { "type": "text", "text": { "content": title } }
                ]
            },
            "Category": {
                "select": { "name": category }
            }
        }
        
        if date_str:
            properties["Date"] = {
                "date": { "start": date_str }
            }
            
        if skills:
            properties["Skills"] = {
                "multi_select": [ { "name": skill[:100] } for skill in skills[:10] ]
            }
            
        if source_url:
            properties["Source"] = {
                "url": source_url
            }
            
        if kizunax_link:
            properties["KizunaX Link"] = {
                "url": kizunax_link
            }
            
        body = {
            "parent": { "database_id": database_id },
            "properties": properties
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=body, headers=headers)
            res.raise_for_status()
            data = res.json()
            return {
                "page_id": data["id"],
                "url": data.get("public_url") or data.get("url") or f"https://notion.so/{data['id'].replace('-', '')}"
            }
