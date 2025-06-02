# file: backend/controllers/chat/chat_message_controller.py

from flask import request, g, current_app
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from core.database.mongo import get_chat_rooms_collection, get_messages_collection
from core.utils.response import success_response, error_response
from core.security.auth_decorator import require_auth
from threading import Thread
from core.security.security import decode_token
from services.chat.chat_service import get_user_messages
from controllers.chat.chat_ai_controller import process_ai_response

chat_rooms = get_chat_rooms_collection()
messages = get_messages_collection()


@require_auth
def fetch_messages():
    try:
        token = request.cookies.get('access_token')
        if not token:
            return error_response("token_missing", 403)

        decoded = decode_token(token)
        if not decoded:
            return error_response("invalid_token", 403)

        email = decoded.get("email")
        room_id = request.args.get("room_id")
        if not room_id:
            return error_response("room_id_missing", 400)

        messages_list = get_user_messages(email, room_id)

        safe_messages = []
        for msg in messages_list:
            if isinstance(msg, dict):
                msg_copy = msg.copy()
                msg_copy['_id'] = str(msg_copy['_id'])
                if 'sender' in msg_copy and 'role' not in msg_copy:
                    msg_copy['role'] = msg_copy['sender']
                safe_messages.append(msg_copy)

        return success_response("messages_fetched", {"messages": safe_messages})

    except Exception as e:
        current_app.logger.error(f"Fetch Messages Error: {e}")
        return error_response("messages_fetch_failed", 500)


@require_auth
def send_message():
    try:
        user_id = g.user_id
        data = request.get_json()
        room_id = data.get('room_id')
        content = data.get('content', '').strip()
        selected_files = data.get('selected_files', [])  # ✅ Yeni parametre alındı

        if not room_id or not content:
            return error_response("missing_room_data", 400)

        if not isinstance(selected_files, list) or not all(isinstance(f, str) for f in selected_files):
            return error_response("invalid_selected_files", 400)

        try:
            room_obj_id = ObjectId(room_id)
        except InvalidId:
            return error_response("invalid_room_id", 400)

        room = chat_rooms.find_one({"_id": room_obj_id, "user_id": user_id})
        if not room:
            return error_response("chat_room_not_found", 404)

        user_msg = {
            "chat_room_id": room_obj_id,
            "sender": "user",
            "content": content,
            "created_at": datetime.utcnow()
        }
        inserted_user_msg = messages.insert_one(user_msg)
        chat_rooms.update_one(
            {"_id": room_obj_id},
            {"$push": {"messages": inserted_user_msg.inserted_id}}
        )

        # ✅ Flask context + selected_files aktarılıyor
        Thread(
            target=run_ai_with_context,
            args=(content, room_obj_id, selected_files, current_app._get_current_object())
        ).start()

        return success_response("message_sent", {
            "user_message_id": str(inserted_user_msg.inserted_id),
            "ai_response": None
        })

    except Exception as e:
        current_app.logger.error(f"Send Message Error: {e}")
        return error_response("message_send_failed", 500)



def run_ai_with_context(user_text, chatroom_obj_id, selected_files, flask_app):
    with flask_app.app_context():
        process_ai_response(user_text, chatroom_obj_id, selected_files)
