# file: backend/services/upload/text_extraction.py

from flask import current_app, jsonify
from core.utils.language_detector import detect_between_tr_en
from services.document.document_service import DocumentService

def extract_text_and_language(req, file, file_ext, filename):
    if not file_ext or not file_ext.startswith("."):
        current_app.logger.error(f"Dosya uzantısı algılanamadı: {filename}")
        return None, None, (jsonify({"message": "invalid_file_extension"}), 400)

    try:
        text = DocumentService.extract_text_from_file(
            file, file_ext.lstrip(".")
        )
        file.seek(0)
    except Exception as e:
        current_app.logger.error(f"Metin çıkarma hatası: {e}")
        return None, None, (jsonify({"message": "file_text_extraction_failed"}), 500)

    if not text or not text.strip():
        return None, None, (jsonify({"message": "file_text_extraction_failed"}), 400)

    # Dil algıla ama dönüşüm yapma
    language = detect_between_tr_en(text, fallback_lang="en")  # sadece bilgi amaçlı
    return text, language, None


def extract_text_from_link(url, file_type, fallback_lang="en"):
    extractor_class = DocumentService.SUPPORTED_TYPES.get(file_type)
    if not extractor_class:
        return None, None, (jsonify({"message": "invalid_link_type"}), 400)

    try:
        # Ses/video için dil tahmini kaldırıldı
        extractor = extractor_class(url)
        text = extractor.extract_text()
    except Exception as e:
        current_app.logger.error(f"Link metni çıkarılamadı: {e}")
        return None, None, (jsonify({"message": "link_text_extraction_failed"}), 500)

    if not text.strip():
        return None, None, (jsonify({"message": "link_text_extraction_failed"}), 400)

    language = detect_between_tr_en(text, fallback_lang="en")  # sadece algılama
    return text, language, None
