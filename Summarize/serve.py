# file: serve.py

from model_api import app
from waitress import serve

serve(app, host="0.0.0.0", port=5005, threads=5)
