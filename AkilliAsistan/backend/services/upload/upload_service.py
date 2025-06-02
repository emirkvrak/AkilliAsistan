# file: backend/services/upload/upload_service.py

from .file_validation import validate_and_save_file
from .text_extraction import extract_text_and_language, extract_text_from_link
from .document_storage import (
    save_document_to_db,
    store_document_and_trigger_summary,
    store_link_document_and_trigger_summary
)
from .context_log_handler import append_context_log
from flask import g, request, jsonify, current_app


def handle_upload_pipeline(req):
    file, chatroom_id, original_filename, unique_filename = validate_and_save_file(req)
    if isinstance(file, tuple):
        return file

    file_ext = original_filename.split('.')[-1] if '.' in original_filename else ''
    text, language, error_response = extract_text_and_language(req, file, f".{file_ext}", original_filename)
    if error_response:
        return error_response

    return store_document_and_trigger_summary(file, chatroom_id, original_filename, unique_filename, text, language)


def handle_link_pipeline(req):
    current_app.logger.info("🔗 Linkten metin çıkarma başladı")

    json_data = req.get_json()
    url = json_data.get("url")
    file_type = json_data.get("type")
    chatroom_id = json_data.get("chatroom_id")
    user_id = g.user_id

    if not url or not file_type or not chatroom_id:
        return jsonify({"message": "link_params_missing"}), 400

    from core.database.mongo import get_uploads_collection
    uploads = get_uploads_collection()
    existing = uploads.find_one({
        "chatroom_id": chatroom_id,
        "filename": url
    })
    if existing:
        return jsonify({"message": "link_already_uploaded"}), 400

    preferred_lang = json_data.get("preferred_lang", "auto")
    text, language, error_response = extract_text_from_link(url, file_type, fallback_lang="auto")
    if error_response:
        return error_response

    return store_link_document_and_trigger_summary(url, chatroom_id, user_id, file_type, text, language)
