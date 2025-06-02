# file: backend/controllers/document/document_controller.py

from flask import Blueprint, g, current_app
from core.security.auth_decorator import require_auth
from core.database.mongo import get_documents_collection
from core.utils.response import success_response, error_response
from bson import ObjectId

document_bp = Blueprint("document_bp", __name__)


@document_bp.route("/documents", methods=["GET"])
@require_auth
def list_documents():
    try:
        documents = get_documents_collection().find({"user_id": ObjectId(g.user_id)})
        result = []

        for doc in documents:
            result.append({
                "_id": str(doc["_id"]),
                "title": doc.get("title"),
                "type": doc.get("type"),
                "language": doc.get("language"),
                "created_at": doc.get("created_at"),
            })

        return success_response("documents_fetched", {"documents": result})

    except Exception as e:
        current_app.logger.error(f"❌ Belge listeleme hatası: {e}")
        return error_response("documents_fetch_failed", 500)


@document_bp.route("/documents/user", methods=["GET"])
@require_auth
def get_user_documents():
    try:
        documents = get_documents_collection()
        user_documents = list(documents.find({"user_id": g.user_id}))
        for doc in user_documents:
            doc["_id"] = str(doc["_id"])
            doc["user_id"] = str(doc["user_id"])
            doc["chat_id"] = str(doc["chat_id"])

        return success_response("documents_fetched", {"documents": user_documents})

    except Exception as e:
        current_app.logger.error(f"❌ Kullanıcı belgeleri alınamadı: {e}")
        return error_response("documents_fetch_failed", 500)
