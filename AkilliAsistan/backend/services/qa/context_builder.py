# file: backend/services/qa/context_builder.py

from core.database.mongo import get_context_logs_collection
from bson import ObjectId
from core.database.mongo import get_documents_collection

documents = get_documents_collection()
context_logs = get_context_logs_collection()

def get_context_list_from_logs(chatroom_id, selected_filenames=None):
    log = context_logs.find_one({"chat_room_id": ObjectId(chatroom_id)})
    if not log or "contexts" not in log:
        return []

    context_list = []
    for ctx in log["contexts"]:
        doc_id = ctx.get("document_id")
        if not doc_id:
            continue

        document = documents.find_one({"_id": ObjectId(doc_id)})
        if not document or not document.get("raw_text"):
            continue

        # ✅ SADECE seçilen dosyalar varsa filtre uygula
        if selected_filenames and document["source"] not in selected_filenames:
            continue

        context_list.append({
            "raw_text": document["raw_text"].strip(),
            "language": ctx.get("language", "unknown"),
            "document_id": str(doc_id),
            "title": document.get("title", "belirsiz_dosya")
        })

    print("✅ QA Context List:", context_list)

    return context_list
