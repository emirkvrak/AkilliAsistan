# file: backend/services/document/document_service.py

from core.extractors.pdf_extractor import PDFExtractor
from core.extractors.word_extractor import WordExtractor
from core.extractors.pptx_extractor import PPTXExtractor
from core.extractors.audio_extractor import AudioExtractor
from core.extractors.news_extractor import NewsExtractor
from core.extractors.web_extractor import WebExtractor
from core.extractors.youtube_extractor import YouTubeExtractor
from core.extractors.image_ocr_extractor import ImageOCRExtractor

class DocumentService:
    SUPPORTED_TYPES = {
        "pdf": PDFExtractor,
        "docx": WordExtractor,
        "pptx": PPTXExtractor,
        "mp3": AudioExtractor,
        "wav": AudioExtractor,
        "m4a": AudioExtractor,
        "ogg": AudioExtractor,
        "web": WebExtractor,
        "news": NewsExtractor,
        "youtube": YouTubeExtractor,
        "jpg": ImageOCRExtractor,
        "jpeg": ImageOCRExtractor,
        "png": ImageOCRExtractor,
    }

    @staticmethod
    def extract_text_from_file(file_storage, file_type=None, preferred_lang="auto") -> str:
        if file_type is None:
            filename = file_storage.filename
            file_ext = filename.split('.')[-1].lower()
        else:
            file_ext = file_type

        extractor_class = DocumentService.SUPPORTED_TYPES.get(file_ext)

        if not extractor_class:
            raise ValueError(f"Desteklenmeyen dosya türü: .{file_ext}")

        # Sadece dil parametresi destekleyen türler için ilet
        if file_ext in ["mp3", "wav", "m4a", "ogg", "youtube"]:
            extractor = extractor_class(file_storage)
        else:
            extractor = extractor_class(file_storage)

        return extractor.extract_text()
