# file: backend/core/extractors/youtube_extractor.py

from core.extractors.base_extractor import BaseExtractor
import subprocess
import uuid
import os
import time
import tempfile
import requests

class YouTubeExtractor(BaseExtractor):
    def __init__(self, file_stream, language_code=None):
        super().__init__(file_stream)
        self.language_code = language_code

    def extract_text(self) -> str:
        temp_path = None
        try:
            API_KEY = os.getenv("ASSEMBLY_API_KEY")
            if not API_KEY:
                raise Exception("AssemblyAI API anahtarı tanımlı değil.")

            url = self.file_stream

            with tempfile.TemporaryDirectory() as tmpdir:
                temp_path = os.path.join(tmpdir, f"{uuid.uuid4()}.webm")

                command = [
                    "yt-dlp", "-f", "bestaudio", "-o", temp_path, url
                ]
                subprocess.run(command, check=True)

                with open(temp_path, "rb") as f:
                    upload_res = requests.post(
                        "https://api.assemblyai.com/v2/upload",
                        headers={"authorization": API_KEY},
                        data=f
                    )

                if upload_res.status_code != 200:
                    raise Exception(f"AssemblyAI upload hatası: {upload_res.status_code} - {upload_res.text}")

                upload_url = upload_res.json().get("upload_url")
                if not upload_url:
                    raise Exception(f"AssemblyAI upload yanıtı eksik: {upload_res.text}")

            transcript_payload = {"audio_url": upload_url}
            if self.language_code and self.language_code not in ["auto", ""]:
                transcript_payload["language_code"] = self.language_code

            transcript_res = requests.post(
                "https://api.assemblyai.com/v2/transcript",
                headers={"authorization": API_KEY, "content-type": "application/json"},
                json=transcript_payload
            )

            if transcript_res.status_code != 200 or "id" not in transcript_res.json():
                raise Exception(f"AssemblyAI transkripsiyon başlatılamadı: {transcript_res.status_code} - {transcript_res.text}")

            transcript_id = transcript_res.json()["id"]

            while True:
                poll_res = requests.get(
                    f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
                    headers={"authorization": API_KEY}
                ).json()

                if poll_res["status"] == "completed":
                    text = poll_res["text"].replace("\n", " ").strip()
                    return " ".join(text.split())
                elif poll_res["status"] == "error":
                    raise Exception("Transkripsiyon hatası: " + poll_res.get("error", "Bilinmeyen hata"))

                time.sleep(3)

        except Exception as e:
            print("❌ YouTubeExtractor HATA:", str(e))
            return ""

        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception:
                    pass
