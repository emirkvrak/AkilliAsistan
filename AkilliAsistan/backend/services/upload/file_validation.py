# file: backend/services/upload/file_validation.py

import os
import uuid
from datetime import datetime
from flask import g, jsonify, current_app
from werkzeug.utils import secure_filename
from core.database.mongo import get_uploads_collection, get_chat_rooms_collection

def validate_and_save_file(req):
    file = req.files.get("file")
    chatroom_id = req.form.get("chatroom_id")
    MAX_FILE_SIZE_MB = 10

    if not file:
        return (jsonify({"message": "file_missing"}), 400)

    if not chatroom_id:
        chat_rooms = get_chat_rooms_collection()
        new_room = {
            "user_id": g.user_id,
            "room_name": f"Oda {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            "created_at": datetime.utcnow(),
            "messages": [],
            "uploaded_files": []
        }
        result = chat_rooms.insert_one(new_room)
        chatroom_id = str(result.inserted_id)

    file.seek(0, os.SEEK_END)
    file_size = file.tell() / (1024 * 1024)
    file.seek(0)
    if file_size > MAX_FILE_SIZE_MB:
        return (jsonify({"message": "file_too_large", "max_size": MAX_FILE_SIZE_MB}), 400)

    original_filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{original_filename}"
    save_path = os.path.join(os.getcwd(), "uploads", unique_filename)
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    uploads = get_uploads_collection()
    existing = uploads.find_one({
        "chatroom_id": chatroom_id,
        "original_name": original_filename
    })
    if existing:
        return (jsonify({"message": "file_already_uploaded"}), 400)

    file.stream.seek(0)
    file.save(save_path)
    current_app.logger.info(f"Dosya kaydedildi: {save_path}")

    return file, chatroom_id, original_filename, unique_filename
