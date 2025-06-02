# file: backend/services/auth/auth_service.py

import re
import jwt
import requests
from flask import current_app
from datetime import datetime, timedelta

from config.config import Config
from core.database.mongo import get_users_collection
from core.security.security import generate_refresh_token, hash_password, check_password, generate_token
from core.mail.mail import send_email
from core.security.security import decode_token

from core.mail.templates import email_texts

users = get_users_collection()

def is_strong_password(password):
    if len(password) < 8:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    return True


def register_user(first_name, last_name, email, password, app, lang="tr"):
    if users.find_one({"email": email}):
        return {"success": False, "message": "email_exists", "status_code": 400}

    if not is_strong_password(password):
        return {"success": False, "message": "weak_password", "status_code": 400}

    hashed_pw = hash_password(password)

    try:
        users.insert_one({
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": hashed_pw,
            "is_verified": False
        })
        send_verification_email(email, app, lang)

    except Exception as e:
        current_app.logger.error(f"❌ Registration rollback: {e}")
        users.delete_one({"email": email})
        return {"success": False, "message": "email_send_failed", "status_code": 500}

    return {"success": True, "message": "registration_successful"}


def send_verification_email(email, app, lang="tr"):
    texts = email_texts.get(lang, email_texts["tr"])

    token = jwt.encode(
        {"email": email, "exp": datetime.utcnow() + timedelta(minutes=Config.VERIFY_EMAIL_TOKEN_EXPIRE_MINUTES)},
        Config.SECRET_KEY,
        algorithm="HS256"
    )

    link = f"{Config.FRONTEND_URL}/verify-email?token={token}&lang={lang}"
    subject = texts["verify_subject"]
    body = f"{texts['verify_info']} {link}"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
        <h2>{texts['verify_heading']}</h2>
        <p>{texts['verify_info']}</p>
        <a href="{link}" style="display: inline-block; padding: 10px 20px; margin-top: 10px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">{texts['verify_button']}</a>
        <p style="margin-top: 20px; color: #999;">{texts['verify_expire']}</p>
        </div>
    </body>
    </html>
    """

    send_email(subject, body, email, app, html_body=html_body)


def verify_email_token(token):
    if not token:
        return {"success": False, "message": "token_missing", "status_code": 400}

    decoded = decode_token(token)

    if isinstance(decoded, dict) and decoded.get("error"):
        return {"success": False, "message": decoded["error"], "status_code": 400}

    return {"success": True, "email": decoded["email"]}


def send_password_reset_email(email, app, lang="tr"):
    texts = email_texts.get(lang, email_texts["tr"])

    user = users.find_one({"email": email})
    if not user:
        return {"success": False, "message": "user_not_found", "status_code": 404}

    token = jwt.encode(
        {"email": email, "exp": datetime.utcnow() + timedelta(minutes=Config.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES)},
        Config.SECRET_KEY,
        algorithm="HS256"
    )

    link = f"{Config.FRONTEND_URL}/reset-password?token={token}&lang={lang}"
    subject = texts["reset_subject"]
    body = f"{texts['reset_info']} {link}"

    html_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
            <h2>{texts['reset_heading']}</h2>
            <p>{texts['reset_info']}</p>
            <a href="{link}" style="display: inline-block; padding: 10px 20px; margin-top: 10px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">{texts['reset_button']}</a>
            <p style="margin-top: 20px; color: #999;">{texts['reset_expire']}</p>
        </div>
    </body>
    </html>
    """

    send_email(subject, body, email, app, html_body=html_body)
    return {"success": True, "message": "reset_link_sent"}


def reset_password(token, new_password):
    decoded = decode_token(token)

    if not decoded or not isinstance(decoded, dict):
        return {"success": False, "message": "token_invalid", "status_code": 400}

    if decoded.get("error"):
        return {"success": False, "message": decoded["error"], "status_code": 400}

    email = decoded["email"]

    if not is_strong_password(new_password):
        return {"success": False, "message": "weak_password", "status_code": 400}

    user = users.find_one({"email": email})
    if not user:
        return {"success": False, "message": "user_not_found", "status_code": 404}

    if user.get("password") is None:
        return {
            "success": False,
            "message": "local_password_not_set",
            "status_code": 400
        }

    if not user.get("password") or check_password(new_password, user["password"]):
        return {"success": False, "message": "no_change", "status_code": 400}

    try:
        hashed_pw = hash_password(new_password)
        users.update_one({"email": email}, {"$set": {"password": hashed_pw}})
        current_app.logger.info(f"Password reset successful for user: {email}")
        return {"success": True, "message": "password_reset_success"}
    except Exception as e:
        current_app.logger.error(f"❌ Password update error: {e}")
        return {"success": False, "message": "password_update_failed", "status_code": 500}


def google_login_service(google_token):
    error_response = {
        "success": False,
        "message": "invalid_google_token",
        "status_code": 400
    }

    try:
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={google_token}",
            headers={"Content-Type": "application/json"}
        )

        if response.status_code != 200:
            return None, None, None, error_response

        user_info = response.json()
        email = user_info.get("email")

        if not email:
            return None, None, None, error_response

        user = users.find_one({"email": email})

        if not user:
            try:
                new_user = {
                    "first_name": user_info.get("given_name"),
                    "last_name": user_info.get("family_name"),
                    "email": email,
                    "password": None,
                    "is_verified": True
                }
                users.insert_one(new_user)
                user = users.find_one({"email": email})
            except Exception as e:
                current_app.logger.error(f"❌ Google user insert error: {e}")
                return None, None, None, {
                    "success": False,
                    "message": "google_register_failed",
                    "status_code": 500
                }

        access_token = generate_token(email, Config.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token = generate_refresh_token(email)

        return {"email": user["email"], "id": str(user["_id"])}, access_token, refresh_token, {
            "success": True,
            "message": "login_successful"
        }

    except Exception as e:
        current_app.logger.error(f"Google Login Error: {e}")
        return None, None, None, {
            "success": False,
            "message": "google_login_error",
            "status_code": 500
        }
