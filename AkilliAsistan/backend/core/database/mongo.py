#backend/core/database/mongo.py

from pymongo import MongoClient
from config.config import Config

client = MongoClient(Config.MONGO_URI)
db = client[Config.DB_NAME]

def get_users_collection():
    return db['users']

def get_messages_collection():
    return db['messages']

def get_chat_rooms_collection():
    return db['chat_rooms']

def get_uploads_collection():
    return db["uploads"]

def get_documents_collection():
    return db["documents"]

def get_context_logs_collection():
    return db["context_logs"]


