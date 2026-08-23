"""
auth_utils.py
JWT creation/verification + route decorators.
Owner: Member A (Auth + Attendance) — created once, imported by everyone.
"""

import os
import jwt
import datetime
from functools import wraps
from flask import request, jsonify

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_me")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

if JWT_SECRET == "dev_secret_change_me":
    print(
        "[auth_utils] WARNING: JWT_SECRET is not set — using an insecure default. "
        "Tokens signed with this secret are forgeable. Set JWT_SECRET in your "
        "environment before deploying anywhere real users can reach this server."
    )


def generate_token(user_id, role):
    payload = {
        "userId": str(user_id),
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def token_required(f):
    """Verifies JWT from 'Authorization: Bearer <token>' header, attaches request.user."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or malformed Authorization header"}), 401

        token = auth_header.replace("Bearer ", "", 1)
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.user = {"userId": data["userId"], "role": data["role"]}
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired, please log in again"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, **kwargs)
    return wrapper


def admin_required(f):
    """Use AFTER token_required. Blocks non-admins."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if getattr(request, "user", {}).get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return wrapper
