# file: backend/core/extractors/news_extractor.py

from core.extractors.base_extractor import BaseExtractor
from newspaper import Article
import nltk

# İlk kez çalıştıranlar için punkt indir
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt")

class NewsExtractor(BaseExtractor):
    def extract_text(self) -> str:
        try:
            url = self.file_stream
            article = Article(url, language="tr")
            article.download()
            article.parse()
            text = article.text
            return " ".join(text.replace("\n", " ").strip().split())
        except Exception as e:
            print(f"❌ NewsExtractor HATA: {e}")
            return ""
