# file: backend/services/qa/qa_service.py

import requests
from config.config import Config

def ask_question(question, contexts: list):
    try:
        response = requests.post(
            f"{Config.MODEL_API_URL}/qa",
            json={"question": question, "contexts": contexts},
            headers={"Content-Type": "application/json"}  # ✅ açıkça belirtildi
        )
        return response.json().get("answer", "")
    except Exception as e:
        print("❌ QA service error:", e)
        return ""
