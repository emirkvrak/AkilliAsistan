# file: backend/utils/response.py

from flask import jsonify

def success_response(message, data=None):
    response = {
        "success": True,
        "message": message
    }
    if data is not None:
        response["data"] = data
    return jsonify(response), 200

def error_response(message, status_code=400):
    return jsonify({
        "success": False,
        "message": message
    }), status_code
