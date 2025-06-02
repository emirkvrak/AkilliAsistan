# file: backend/controllers/chat/chat_room_controller.py

from flask import request, g, current_app
from datetime import datetime
from bson import ObjectId, errors as bson_errors
from bson.errors import InvalidId
from core.database.mongo import get_users_collection, get_chat_rooms_collection, get_messages_collection, get_uploads_collection, get_documents_collection
from core.utils.response import success_response, error_response
from core.security.auth_decorator import require_auth
from controllers.chat.chat_ai_controller import delete_context_log

import os

users = get_users_collection()
chat_rooms = get_chat_rooms_collection()
messages = get_messages_collection()
uploads = get_uploads_collection()
documents = get_documents_collection()
UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploads")

@require_auth
def fetch_chat_rooms():
    try:
        email = g.user_email
        rooms = chat_rooms.find({"user_id": g.user_id}).sort("created_at", -1)

        safe_rooms = []
        for room in rooms:
            safe_room = {
                key: (
                    [str(v) if isinstance(v, ObjectId) else v for v in value]
                    if isinstance(value, list) else str(value) if isinstance(value, ObjectId) else value
                )
                for key, value in room.items()
            }

            for file in safe_room.get("uploaded_files", []):
                doc = documents.find_one({
                    "chat_id": room["_id"],
                    "source": file.get("filename")
                })
                if doc:
                    file["raw_text"] = doc.get("raw_text", "")

            safe_room.setdefault("created_at", datetime.utcnow().isoformat())
            safe_room.setdefault("messages", [])
            safe_rooms.append(safe_room)

        return success_response("chat_rooms_fetched", {"chat_rooms": safe_rooms})

    except Exception as e:
        current_app.logger.error(f"Fetch Chat Rooms Error: {e}")
        return error_response("chat_rooms_fetch_failed", 500)

@require_auth
def create_new_chat():
    try:
        email = g.user_email
        user = users.find_one({"email": email})
        if not user:
            return error_response("user_not_found", 404)

        room_name = request.json.get("room_name")
        if not room_name or not room_name.strip():
            return error_response("room_name_required", 400)

        new_room = {
            "user_id": user["_id"],
            "room_name": room_name.strip(),
            "created_at": datetime.utcnow(),
            "messages": [],
            "uploaded_files": []
        }

        try:
            inserted = chat_rooms.insert_one(new_room)
            room_id = inserted.inserted_id

            users.update_one({"_id": user["_id"]}, {"$push": {"chat_rooms": room_id}})
        except Exception as db_error:
            current_app.logger.error(f"Mongo Error on create_new_chat: {db_error}")
            return error_response("chat_room_create_failed", 500)

        return success_response("chat_room_created", {
            "room_id": str(room_id),
            "room_name": new_room["room_name"],
            "created_at": new_room["created_at"].isoformat()
        })

    except Exception as e:
        current_app.logger.error(f"Create New Chat Error: {e}")
        return error_response("chat_room_create_failed", 500)

@require_auth
def delete_chat_room():
    try:
        email = g.user_email
        room_id_str = request.json.get("room_id")
        if not room_id_str:
            return error_response("room_id_missing", 400)

        user_id = g.user_id

        try:
            room_obj_id = ObjectId(room_id_str)
        except InvalidId:
            return error_response("invalid_room_id", 400)

        room = chat_rooms.find_one({"_id": room_obj_id, "user_id": user_id})
        if not room:
            return error_response("chat_room_not_found", 404)

        try:
            # 1. fiziksel dosyaları sil
            to_delete = uploads.find({"chatroom_id": room_id_str})
            for file in to_delete:
                filename = file.get("filename")
                if filename:
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    if os.path.exists(file_path):
                        os.remove(file_path)

            uploads.delete_many({"chatroom_id": room_id_str})
            messages.delete_many({"chat_room_id": room_obj_id})
            documents.delete_many({"chat_id": room_obj_id})
            chat_rooms.delete_one({"_id": room_obj_id})
            users.update_one({"_id": user_id}, {"$pull": {"chat_rooms": room_obj_id}})
            delete_context_log(room_obj_id)

        except Exception as db_error:
            current_app.logger.error(f"Mongo Error on delete_chat_room: {db_error}")
            return error_response("chat_room_delete_failed", 500)

        return success_response("chat_room_deleted")

    except Exception as e:
        current_app.logger.error(f"Delete Chat Room Error: {e}")
        return error_response("chat_room_delete_failed", 500)

@require_auth
def rename_chat_room():
    try:
        room_id = request.json.get("room_id")
        new_name = request.json.get("new_name")

        if not room_id or not new_name:
            return error_response("room_rename_missing_fields", 400)

        user_id = g.user_id

        try:
            room = chat_rooms.find_one({"_id": ObjectId(room_id), "user_id": user_id})
        except InvalidId:
            return error_response("invalid_room_id", 400)

        if not room:
            return error_response("chat_room_not_found", 404)

        try:
            chat_rooms.update_one({"_id": ObjectId(room_id)}, {"$set": {"room_name": new_name}})
        except Exception as db_error:
            current_app.logger.error(f"Mongo Error on rename_chat_room: {db_error}")
            return error_response("chat_room_rename_failed", 500)

        return success_response("chat_room_renamed")

    except Exception as e:
        current_app.logger.error(f"Rename Chat Room Error: {e}")
        return error_response("chat_room_rename_failed", 500)
