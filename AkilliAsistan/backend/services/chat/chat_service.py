# file: backend/services/chat/chat_service.py

from datetime import datetime
from bson import ObjectId
from flask import current_app  # ✅ loglama için eklendi
from core.database.mongo import (
    get_chat_rooms_collection,
    get_messages_collection,
    get_users_collection
)
from bson.errors import InvalidId


def get_user_id(email):
    users = get_users_collection()
    user = users.find_one({"email": email})
    if user:
        return user["_id"]
    
    # ❗ Kullanıcı bulunamadıysa logla
    current_app.logger.warning(f"⚠️ Kullanıcı bulunamadı: {email}")
    return None


def get_user_messages(email, room_id):
    chat_rooms = get_chat_rooms_collection()
    messages_collection = get_messages_collection()

    user_id = get_user_id(email)
    if not user_id:
        return []

    try:
        chat_room = chat_rooms.find_one({
            "_id": ObjectId(room_id),
            "user_id": ObjectId(user_id)
        })
    except InvalidId:
        return []

    if not chat_room:
        return []

    message_ids = chat_room.get("messages", [])
    if not message_ids:
        return []

    message_ids = [ObjectId(m) if isinstance(m, str) else m for m in message_ids]
    
    messages_cursor = messages_collection.find({"_id": {"$in": message_ids}})
    messages = list(messages_cursor)

    # ✅ Mesajları tarih sırasına göre sırala
    messages.sort(key=lambda x: x["created_at"])

    # ✅ ObjectId ve tarihleri string formatına çevir
    for message in messages:
        message["_id"] = str(message["_id"])
        message["chat_room_id"] = str(message["chat_room_id"])
        message["created_at"] = message["created_at"].isoformat()

        if "related_document_id" in message and message["related_document_id"]:
            message["related_document_id"] = str(message["related_document_id"])

    return messages


def get_user_chat_rooms(email):
    chat_rooms = get_chat_rooms_collection()
    user_id = get_user_id(email)

    if not user_id:
        return []

    rooms = chat_rooms.find({"user_id": ObjectId(user_id)}).sort("created_at", -1)
    return list(rooms)


def get_chat_response(message):
    return f"You said: {message}"

def save_message_to_db(chatroom_id, content, sender="user", related_document_id=None):
    try:
        messages = get_messages_collection()
        chat_rooms = get_chat_rooms_collection()

        message_doc = {
            "chat_room_id": ObjectId(chatroom_id),
            "sender": sender,
            "content": content,
            "created_at": datetime.utcnow(),
            "related_document_id": ObjectId(related_document_id) if related_document_id else None
        }

        inserted = messages.insert_one(message_doc)
        chat_rooms.update_one(
            {"_id": ObjectId(chatroom_id)},
            {"$push": {"messages": inserted.inserted_id}}
        )

        return inserted.inserted_id

    except Exception as e:
        current_app.logger.error(f"save_message_to_db hatası: {e}")
        return None

