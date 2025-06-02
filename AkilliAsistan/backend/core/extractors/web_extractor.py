# file: backend/core/extractors/web_extractor.py

from core.extractors.base_extractor import BaseExtractor
import requests
from bs4 import BeautifulSoup

class WebExtractor(BaseExtractor):
    def extract_text(self) -> str:
        try:
            url = self.file_stream
            response = requests.get(url, timeout=10)
            if response.status_code != 200:
                raise Exception(f"HTTP hata: {response.status_code}")

            soup = BeautifulSoup(response.text, "html.parser")
            paragraphs = soup.find_all("p")
            text = " ".join(p.get_text(strip=True) for p in paragraphs if p.get_text(strip=True))
            return " ".join(text.split())

        except Exception as e:
            print(f"❌ WebExtractor HATA: {e}")
            return ""
