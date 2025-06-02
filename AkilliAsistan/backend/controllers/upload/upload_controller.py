# file: backend/controllers/upload/upload_controller.py

from flask import Blueprint, request, jsonify
from core.security.auth_decorator import require_auth
from services.upload.upload_service import handle_upload_pipeline

upload_bp = Blueprint("upload_bp", __name__)

@upload_bp.route("/upload-and-chat", methods=["POST"])
@require_auth
def upload_and_chat():
    try:
        return handle_upload_pipeline(request)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "İşlem sırasında bir hata oluştu."}), 500

@upload_bp.route("/upload-link-and-chat", methods=["POST"])
@require_auth
def upload_link_and_chat():
    try:
        from services.upload.upload_service import handle_link_pipeline
        return handle_link_pipeline(request)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Link işlenemedi."}), 500
