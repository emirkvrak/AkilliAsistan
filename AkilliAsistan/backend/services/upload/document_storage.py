# file: backend/services/upload/document_storage.py

from flask import g, jsonify, current_app
from datetime import datetime
from bson import ObjectId
from core.database.mongo import (
    get_documents_collection,
    get_uploads_collection,
    get_chat_rooms_collection
)
from .context_log_handler import append_context_log


def save_document_to_db(filename, original_name, user_id, chatroom_id, text, summary, language):
    try:
        documents = get_documents_collection()
        document_doc = {
            "user_id": ObjectId(user_id),
            "chat_id": ObjectId(chatroom_id),
            "type": filename.split(".")[-1].lower() if "." in filename else "link",
            "source": filename,
            "title": original_name.rsplit(".", 1)[0] if "." in original_name else original_name,
            "language": language,
            "raw_text": text,
            "summary": summary,
            "created_at": datetime.utcnow(),
            "metadata": {}
        }
        inserted = documents.insert_one(document_doc)
        return inserted.inserted_id
    except Exception as e:
        current_app.logger.error(f"❌ save_document_to_db hatası: {e}")
        raise


def store_document_and_trigger_summary(file, chatroom_id, original_filename, unique_filename, text, language):
    try:
        document_id = save_document_to_db(
            filename=unique_filename,
            original_name=original_filename,
            user_id=g.user_id,
            chatroom_id=chatroom_id,
            text=text,
            summary="",
            language=language
        )

        get_uploads_collection().insert_one({
            "chatroom_id": chatroom_id,
            "filename": unique_filename,
            "original_name": original_filename,
            "upload_date": datetime.utcnow()
        })

        get_chat_rooms_collection().update_one(
            {"_id": ObjectId(chatroom_id)},
            {"$push": {
                "uploaded_files": {
                    "filename": unique_filename,
                    "original_name": original_filename,
                    "upload_date": datetime.utcnow(),
                    "raw_text": text
                }
            }}
        )

        append_context_log(
            user_id=g.user_id,
            chatroom_id=chatroom_id,
            document_id=document_id,
            raw_text=text,
            language=language
        )

        return jsonify({
            "message": "Belge başarıyla yüklendi.",
            "filename": unique_filename,
            "original_name": original_filename,
            "raw_text": text
        }), 200

    except Exception as e:
        current_app.logger.error(f"❌ store_document_and_trigger_summary hatası: {e}")
        return jsonify({"message": "document_save_failed"}), 500


def store_link_document_and_trigger_summary(url, chatroom_id, user_id, file_type, text, language):
    try:
        document_id = save_document_to_db(
            filename=url,
            original_name=url,
            user_id=user_id,
            chatroom_id=chatroom_id,
            text=text,
            summary="",
            language=language
        )

        get_uploads_collection().insert_one({
            "chatroom_id": chatroom_id,
            "filename": url,
            "original_name": url,
            "upload_date": datetime.utcnow()
        })

        get_chat_rooms_collection().update_one(
            {"_id": ObjectId(chatroom_id)},
            {"$push": {
                "uploaded_files": {
                    "filename": url,
                    "original_name": url,
                    "upload_date": datetime.utcnow(),
                    "raw_text": text
                }
            }}
        )

        append_context_log(
            user_id=user_id,
            chatroom_id=chatroom_id,
            document_id=document_id,
            raw_text=text,
            language=language
        )

        return jsonify({
            "message": "Link başarıyla işlendi",
            "filename": url,
            "original_name": url,
            "raw_text": text
        }), 200

    except Exception as e:
        current_app.logger.error(f"❌ store_link_document_and_trigger_summary hatası: {e}")
        return jsonify({"message": "link_save_failed"}), 500
