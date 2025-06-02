# file: backend/core/utils/language_detector.py

from langdetect import detect_langs
from flask import current_app

def detect_between_tr_en(text: str, fallback_lang="tr") -> str:
    """
    Türkçe ve İngilizce algılar, fallback dil parametreli.
    Eğer dil algılanamazsa fallback dil döner.
    """
    try:
        lang_probs = detect_langs(text)
        scores = {lang.lang: lang.prob for lang in lang_probs if lang.lang in ["tr", "en"]}

        if not scores:
            return fallback_lang

        return max(scores, key=scores.get)

    except Exception as e:
        current_app.logger.warning(f"🌐 Dil algılama hatası, fallback '{fallback_lang}' kullanılacak: {e}")
        return fallback_lang
