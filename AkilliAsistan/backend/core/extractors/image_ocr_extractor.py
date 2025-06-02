# file: backend/core/extractors/image_ocr_extractor.py

from core.extractors.base_extractor import BaseExtractor
from google.cloud import vision
import io
from PIL import Image
import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path

# ✅ Ortam değişkenlerini yükle
load_dotenv()

raw_credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if not raw_credential_path:
    raise EnvironmentError("❌ GOOGLE_APPLICATION_CREDENTIALS env değişkeni tanımlı değil.")

credential_path = Path(raw_credential_path).resolve()
if not credential_path.exists():
    raise FileNotFoundError(f"❌ OCR credential dosyası bulunamadı: {credential_path}")

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(credential_path)
print(f"✅ OCR anahtar dosyası bulundu: {credential_path}")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
USAGE_FILE = BASE_DIR / "keys" / "ocr_usage.json"
OCR_LIMIT = 950

def check_and_increment_ocr_usage():
    try:
        # 🔒 Klasör yoksa oluştur
        os.makedirs(USAGE_FILE.parent, exist_ok=True)

        if not USAGE_FILE.exists():
            raise FileNotFoundError

        with open(USAGE_FILE, "r+", encoding="utf-8") as f:
            usage = json.load(f)
            now = datetime.now()
            reset_time = datetime.fromisoformat(usage.get("reset"))

            if now >= reset_time:
                usage["count"] = 0
                next_month = (now.replace(day=1) + timedelta(days=31)).replace(day=1)
                usage["reset"] = next_month.isoformat()

            if usage["count"] >= OCR_LIMIT:
                raise RuntimeError("🔒 Aylık OCR kullanım hakkınız doldu (limit: 950).")

            usage["count"] += 1
            f.seek(0)
            json.dump(usage, f, indent=2)
            f.truncate()

    except FileNotFoundError:
        with open(USAGE_FILE, "w", encoding="utf-8") as f:
            reset = (datetime.now().replace(day=1) + timedelta(days=31)).replace(day=1).isoformat()
            json.dump({"count": 1, "reset": reset}, f, indent=2)


class ImageOCRExtractor(BaseExtractor):
    def extract_text(self) -> str:
        try:
            image = Image.open(self.file_stream).convert("RGB")
            byte_stream = io.BytesIO()
            image.save(byte_stream, format="PNG")
            content = byte_stream.getvalue()

            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=content)
            response = client.document_text_detection(image=image)

            if response.error.message:
                raise RuntimeError(f"Google OCR hatası: {response.error.message}")

            text = response.full_text_annotation.text
            cleaned_text = " ".join(text.replace("\n", " ").strip().split())

            if not cleaned_text:
                raise RuntimeError("❌ Metin çıkarılamadı.")

            check_and_increment_ocr_usage()
            return cleaned_text

        except Exception as e:
            print(f"❌ ImageOCRExtractor HATA: {e}")
            return ""
