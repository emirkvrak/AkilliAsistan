# file: backend/config/config.py

import os
from dotenv import load_dotenv

# ✅ .env dosyasını config içinden doğrudan yükle
load_dotenv()

class Config:
    # 🔐 SECRET_KEY zorunlu hale getirildi
    SECRET_KEY = os.getenv("SECRET_KEY")
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY .env dosyasında belirtilmelidir!")

    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "chatbot")

    # 📧 Mail server ayarları
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME')

    # 🔐 Token süresi ayarları
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
    VERIFY_EMAIL_TOKEN_EXPIRE_MINUTES = int(os.getenv("VERIFY_EMAIL_TOKEN_EXPIRE_MINUTES", 60))
    RESET_PASSWORD_TOKEN_EXPIRE_MINUTES = int(os.getenv("RESET_PASSWORD_TOKEN_EXPIRE_MINUTES", 60))

    # 🔧 Diğer ayarlar
    IS_PRODUCTION = os.getenv("IS_PRODUCTION", "false").lower() == "true"
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
  
    # 🧠 Model API
    MODEL_API_URL = os.getenv("MODEL_API_URL", "http://localhost:5005")
    # MODEL_API_URL = os.getenv("MODEL_API_URL", "http://172.20.10.10:5005")
