# file: backend/services/upload/context_log_handler.py

from datetime import datetime
from bson import ObjectId
from flask import current_app
from pymongo.errors import DuplicateKeyError
from core.database.mongo import get_context_logs_collection

context_logs = get_context_logs_collection()

def append_context_log(user_id, chatroom_id, document_id, raw_text, language):
    try:
        context_logs.update_one(
            {"chat_room_id": ObjectId(chatroom_id)},
            {
                "$push": {
                    "contexts": {
                        "document_id": ObjectId(document_id),
                        "language": language,
                        "updated_at": datetime.utcnow()
                    }
                },
                "$set": {
                    "user_id": ObjectId(user_id),
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
    except DuplicateKeyError:
        current_app.logger.error(f"Duplicate context_log kaydı oluştu: {chatroom_id}")
