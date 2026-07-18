import boto3
from botocore.client import Config
from typing import Optional, BinaryIO
import uuid
from datetime import datetime

from app.core.config import settings

class R2Storage:
    """Cloudflare R2 storage client for media files"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.R2_ENDPOINT,
            aws_access_key_id=settings.R2_ACCESS_KEY,
            aws_secret_access_key=settings.R2_SECRET_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto'
        )
        self.bucket_name = settings.R2_BUCKET
    
    def generate_key(self, user_id: int, original_filename: str) -> str:
        """Generate a unique storage key for a file"""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        extension = original_filename.split('.')[-1] if '.' in original_filename else ''
        return f"users/{user_id}/{timestamp}_{unique_id}.{extension}"
    
    async def upload_file(
        self,
        file_data: BinaryIO,
        user_id: int,
        original_filename: str,
        content_type: Optional[str] = None
    ) -> dict:
        """
        Upload a file to R2 storage
        
        Args:
            file_data: File-like object to upload
            user_id: User ID for organization
            original_filename: Original filename
            content_type: MIME type of the file
            
        Returns:
            dict with r2_key and r2_url
        """
        try:
            key = self.generate_key(user_id, original_filename)
            
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            # Upload file
            self.s3_client.upload_fileobj(
                file_data,
                self.bucket_name,
                key,
                ExtraArgs=extra_args
            )
            
            # Generate public URL
            r2_url = f"{settings.R2_ENDPOINT}/{self.bucket_name}/{key}"
            
            return {
                "r2_key": key,
                "r2_url": r2_url,
                "success": True
            }
            
        except Exception as e:
            print(f"R2 upload failed: {e}")
            return {
                "r2_key": None,
                "r2_url": None,
                "success": False,
                "error": str(e)
            }
    
    def delete_file(self, r2_key: str) -> bool:
        """
        Delete a file from R2 storage
        
        Args:
            r2_key: Storage key of the file to delete
            
        Returns:
            bool indicating success
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=r2_key
            )
            return True
        except Exception as e:
            print(f"R2 delete failed: {e}")
            return False
    
    def get_file_url(self, r2_key: str, expires_in: int = 3600) -> Optional[str]:
        """
        Get a presigned URL for a file (for private access)
        
        Args:
            r2_key: Storage key of the file
            expires_in: URL expiration time in seconds
            
        Returns:
            Presigned URL or None if failed
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': r2_key
                },
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            print(f"R2 presigned URL generation failed: {e}")
            return None
    
    def file_exists(self, r2_key: str) -> bool:
        """
        Check if a file exists in R2 storage
        
        Args:
            r2_key: Storage key of the file
            
        Returns:
            bool indicating if file exists
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=r2_key
            )
            return True
        except:
            return False

# Global R2 storage instance
r2_storage = R2Storage()
