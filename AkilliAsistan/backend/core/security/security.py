# file: backend/security/security.py

import os
import bcrypt
from flask import current_app
import jwt
from datetime import datetime, timedelta
from config.config import Config
from bson.binary import Binary

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(password, hashed):
    if isinstance(hashed, str):
        hashed = hashed.encode('utf-8')
    return bcrypt.checkpw(password.encode('utf-8'), hashed)



def decode_token(token):
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return {"error": "expired_token"}
    except jwt.InvalidTokenError:
        return {"error": "invalid_token"}
    except Exception as e:
        current_app.logger.error(f"Unexpected token decode error: {e}")
        return {"error": "token_decode_error"}
    

def generate_token(email, expires_in_minutes):
    payload = {
        "email": email,
        "exp": datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def generate_access_token(email):
    return generate_token(email, expires_in_minutes=Config.ACCESS_TOKEN_EXPIRE_MINUTES)

def generate_refresh_token(email):
    return generate_token(email, expires_in_minutes=Config.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60)  # gün → dakika
