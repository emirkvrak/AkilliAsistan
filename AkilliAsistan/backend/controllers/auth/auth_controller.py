# file: backend/controllers/auth/auth_controller.py

from flask import g, redirect, request, current_app, make_response
from core.database.mongo import get_users_collection
from core.security.security import (
    check_password, decode_token, generate_access_token,
    generate_refresh_token, generate_token, hash_password
)
from core.utils.response import success_response, error_response
from services.auth.auth_service import (
    is_strong_password, register_user, verify_email_token,
    send_password_reset_email, reset_password, google_login_service
)
from config.config import Config
from core.security.auth_decorator import require_auth

users = get_users_collection()


def login():
    email = "unknown"  # 💡 email her durumda tanımlı olsun
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        current_app.logger.info(f"Login attempt from {email}")

        user = users.find_one({"email": email})
        if not user or not check_password(password, user["password"]):
            return error_response("invalid_credentials", 401)

        if not user.get("is_verified", False):
            return error_response("email_not_verified", 403)

        access_token = generate_token(email, Config.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_token = generate_refresh_token(email)

        response = make_response(success_response("login_successful", {"email": email}))
        secure_flag = Config.IS_PRODUCTION
        response.set_cookie('access_token', access_token, httponly=True, secure=secure_flag, samesite='Strict')
        response.set_cookie('refresh_token', refresh_token, httponly=True, secure=secure_flag, samesite='Strict', path='/auth/refresh')

        current_app.logger.info(f"Login successful for {email}")
        return response

    except Exception as e:
        current_app.logger.error(f"Login Error for {email}: {e}")
        return error_response("login_error", 500)



def register():
    try:
        first_name = request.json.get('firstName')
        last_name = request.json.get('lastName')
        email = request.json.get('email')
        password = request.json.get('password')

        lang = request.json.get('lang', 'tr')

        current_app.logger.info(f"Registration attempt for {email}")

        result = register_user(first_name, last_name, email, password, current_app, lang)

        if not result.get("success"):
            return error_response(result.get("message", "registration_failed"), result.get("status_code", 400))

        return success_response(result.get("message", "registration_successful"), 201)

    except Exception as e:
        current_app.logger.error(f"Register Error: {e}")
        return error_response("registration_error", 500)



def verify_email():
    try:
        token = request.args.get('token')
        result = verify_email_token(token)

        if not result.get("success"):
            if request.accept_mimetypes.accept_json:
                return error_response(result.get("message", "token_invalid"), result.get("status_code", 400))
            return redirect(f"{Config.FRONTEND_URL}/signin?error={result.get('message', 'token_invalid')}")

        email = result["email"]
        user = users.find_one({"email": email})
        if user:
            users.update_one({"email": email}, {"$set": {"is_verified": True}})

            if request.accept_mimetypes.accept_json:
                return success_response("email_verified_success")
            return redirect(f"{Config.FRONTEND_URL}/signin?success=email_verified_success")

        if request.accept_mimetypes.accept_json:
            return error_response("user_not_found", 404)
        return redirect(f"{Config.FRONTEND_URL}/signin?error=user_not_found")

    except Exception as e:
        current_app.logger.error(f"Verify Email Error: {e}")
        if request.accept_mimetypes.accept_json:
            return error_response("email_verification_failed", 500)
        return redirect(f"{Config.FRONTEND_URL}/signin?error=email_verification_failed")


def forgot_password():
    try:
        email = request.json.get('email')
        lang = request.json.get('lang', 'tr') 
        if send_password_reset_email(email, current_app, lang):
            return success_response("reset_link_sent")
        return error_response("email_not_found", 404)
    except Exception as e:
        current_app.logger.error(f"Forgot Password Error for {email}: {e}")
        return error_response("forgot_password_error", 500)


def reset_password_route():
    try:
        token = request.json.get('token')
        new_password = request.json.get('new_password')
        result = reset_password(token, new_password)

        if result.get("success"):
            return success_response("password_reset_success")
        return error_response(
            result.get("message", "password_reset_failed"),
            result.get("status_code", 400)
        )
    except Exception as e:
        current_app.logger.error(f"Reset Password Route Error: {e}")
        return error_response("password_reset_error", 500)


def google_login():
    try:
        token = request.json.get('token')
        user, access_token, refresh_token, result = google_login_service(token)

        if not result.get("success"):
            return error_response(result["message"], result.get("status_code", 400))

        if user:
            response = make_response(success_response(result["message"], {
                "email": user["email"]
            }))
            secure_flag = Config.IS_PRODUCTION
            response.set_cookie('access_token', access_token, httponly=True, secure=secure_flag, samesite='Strict')
            response.set_cookie('refresh_token', refresh_token, httponly=True, secure=secure_flag, samesite='Strict', path='/auth/refresh')
            return response

        return error_response("google_login_failed", 400)
    except Exception as e:
        current_app.logger.error(f"Google Login Error: {e}")
        return error_response("google_login_error", 500)

@require_auth
def get_current_user():
    try:
        email = g.user_email
        user = users.find_one({"email": email})
        if not user:
            return error_response("user_not_found", 404)

        return success_response("user_info_fetched", {"email": email})

    except Exception as e:
        current_app.logger.error(f"Get Current User Error: {e}")
        return error_response("user_info_error", 500)



def change_password():
    try:
        token = request.cookies.get('access_token')
        if not token:
            return error_response("token_missing", 403)

        decoded = decode_token(token)
        if not decoded or not isinstance(decoded, dict):
            return error_response("token_invalid", 403)

        email = decoded.get("email")
        old_password = request.json.get('old_password')
        new_password = request.json.get('new_password')

        if not is_strong_password(new_password):
            return error_response("password_weak", 400)

        user = users.find_one({"email": email})
        if not user:
            return error_response("user_not_found", 404)

        if not check_password(old_password, user["password"]):
            return error_response("old_password_incorrect", 400)

        if check_password(new_password, user["password"]):
            return error_response("new_password_same_as_old", 400)

        hashed_new_password = hash_password(new_password)
        users.update_one({"email": email}, {"$set": {"password": hashed_new_password}})

        new_access_token = generate_access_token(email)
        new_refresh_token = generate_refresh_token(email)

        response = make_response(success_response("password_change_success"))
        secure_flag = Config.IS_PRODUCTION
        response.set_cookie('access_token', new_access_token, httponly=True, secure=secure_flag, samesite='Strict')
        response.set_cookie('refresh_token', new_refresh_token, httponly=True, secure=secure_flag, samesite='Strict', path='/auth/refresh')
        return response

    except Exception as e:
        current_app.logger.error(f"Change Password Error: {e}")
        return error_response("change_password_error", 500)


def refresh():
    try:
        refresh_token = request.cookies.get('refresh_token')
        if not refresh_token:
            return error_response("token_missing", 403)

        decoded = decode_token(refresh_token)
        if not decoded or not isinstance(decoded, dict):
            return error_response("token_invalid", 403)

        email = decoded.get("email")
        new_access_token = generate_access_token(email)

        response = make_response(success_response("token_refreshed"))
        secure_flag = Config.IS_PRODUCTION
        response.set_cookie('access_token', new_access_token, httponly=True, secure=secure_flag, samesite='Strict')
        return response
    except Exception as e:
        current_app.logger.error(f"Refresh Token Error: {e}")
        return error_response("token_refresh_error", 500)


def logout():
    try:
        response = make_response(success_response("logout_successful"))
        secure_flag = Config.IS_PRODUCTION
        response.set_cookie('access_token', '', expires=0, httponly=True, secure=secure_flag, samesite='Strict')
        response.set_cookie('refresh_token', '', expires=0, httponly=True, secure=secure_flag, samesite='Strict', path='/auth/refresh')
        return response
    except Exception as e:
        current_app.logger.error(f"Logout Error: {e}")
        return error_response("logout_error", 500)
