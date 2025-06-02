# file: backend/core/security/auth_decorator.py

from functools import wraps
from flask import request, g
from core.security.security import decode_token
from core.utils.response import error_response
from services.chat.chat_service import get_user_id

def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = request.cookies.get('access_token')
        if not token:
            return error_response("token_missing", 403)

        decoded = decode_token(token)

        # ✅ Hata varsa direkt döndür
        if not decoded or not isinstance(decoded, dict) or decoded.get("error"):
            return error_response(decoded.get("error", "token_invalid"), 403)

        g.user_email = decoded["email"]
        g.user_id = get_user_id(decoded["email"])
        
        return func(*args, **kwargs)
    return wrapper
