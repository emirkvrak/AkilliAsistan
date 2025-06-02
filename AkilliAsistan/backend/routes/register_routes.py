# file: backend/routes/register_routes.py

from flask import Blueprint
from controllers.chat import (
    chat_room_controller,
    chat_message_controller,
    chat_file_controller
)
from controllers.auth import auth_controller
from controllers.upload.upload_controller import upload_bp
from controllers.document.document_controller import document_bp

def register_routes(app):
    auth_bp = Blueprint("auth_bp", __name__)
    chat_bp = Blueprint("chat_bp", __name__)

    # 🔵 Authentication Routes (auth_bp)
    auth_bp.route("/login", methods=["POST"])(auth_controller.login)
    auth_bp.route("/register", methods=["POST"])(auth_controller.register)
    auth_bp.route("/me", methods=["GET"])(auth_controller.get_current_user)
    auth_bp.route("/verify-email", methods=["GET"])(auth_controller.verify_email)
    auth_bp.route("/forgot-password", methods=["POST"])(auth_controller.forgot_password)
    auth_bp.route("/reset-password", methods=["POST"])(auth_controller.reset_password_route)
    auth_bp.route("/google-login", methods=["POST"])(auth_controller.google_login)
    auth_bp.route("/change-password", methods=["POST"])(auth_controller.change_password)
    auth_bp.route("/refresh", methods=["POST"])(auth_controller.refresh)
    auth_bp.route("/logout", methods=["POST"])(auth_controller.logout)

    # 🟢 Chat Routes (chat_bp)
    chat_bp.route("/fetch-messages", methods=["GET"])(chat_message_controller.fetch_messages)
    chat_bp.route("/send-message", methods=["POST"])(chat_message_controller.send_message)

    chat_bp.route("/fetch-chat-rooms", methods=["GET"])(chat_room_controller.fetch_chat_rooms)
    chat_bp.route("/new-chat", methods=["POST"])(chat_room_controller.create_new_chat)
    chat_bp.route("/delete-room", methods=["POST"])(chat_room_controller.delete_chat_room)
    chat_bp.route("/rename-room", methods=["POST"])(chat_room_controller.rename_chat_room)

    chat_bp.route("/delete-file", methods=["POST"])(chat_file_controller.delete_file)
    chat_bp.route("/rename-file", methods=["POST"])(chat_file_controller.rename_file)

    # ✅ Blueprint'leri Uygulamaya Kaydet
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(chat_bp, url_prefix="/chat")
    app.register_blueprint(upload_bp, url_prefix="/chat")      # örnek: /chat/upload-and-chat
    app.register_blueprint(document_bp, url_prefix="/documents")
