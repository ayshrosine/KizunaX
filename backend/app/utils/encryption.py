import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

def get_fernet() -> Fernet:
    # Derive a 32-byte key from settings.SECRET_KEY
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key)
    return Fernet(fernet_key)

def encrypt_data(data: str) -> str:
    if not data:
        return ""
    f = get_fernet()
    return f.encrypt(data.encode()).decode()

def decrypt_data(token: str) -> str:
    if not token:
        return ""
    f = get_fernet()
    return f.decrypt(token.encode()).decode()
