# file: backend/core/extractors/word_extractor.py

from core.extractors.base_extractor import BaseExtractor
from docx import Document

class WordExtractor(BaseExtractor):
    def extract_text(self) -> str:
        try:
            doc = Document(self.file_stream)
            text_parts = [para.text.strip() for para in doc.paragraphs if para.text.strip()]
            return " ".join(" ".join(text_parts).split())
        except Exception as e:
            print(f"❌ WordExtractor HATA: {e}")
            return ""
