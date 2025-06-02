# file: backend/core/extractors/base_extractor.py

from abc import ABC, abstractmethod

class BaseExtractor(ABC):
    def __init__(self, file_stream):
        self.file_stream = file_stream
        try:
            if hasattr(self.file_stream, "seek") and self.file_stream.seekable():
                self.file_stream.seek(0)
        except Exception:
            pass  # Örneğin string URL'ler seek desteklemez

    @abstractmethod
    def extract_text(self) -> str:
        """Dosyadan metin çıkarımı yapılır."""
        pass
