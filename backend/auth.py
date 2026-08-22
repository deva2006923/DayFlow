"""
auth.py
Owner: MEMBER A
Routes: signup, login, get/edit own profile, admin list/edit employees.
"""

import bcrypt
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from db import users_col
from auth_utils import generate_token, token_required, admin_required

auth_bp = Blueprint("auth", __name__)


def serialize_user(u):
    """Strip password hash and convert ObjectId to string before sending to frontend."""
    return {
        "id": str(u["_id"]),
        "name": u.get("name"),
        "email": u.get("email"),
        "employeeId": u.get("employeeId"),
        "role": u.get("role"),
        "phone": u.get("phone", ""),
        "address": u.get("address", ""),
        "jobTitle": u.get("jobTitle", ""),
        "department": u.get("department", ""),
        "joinDate": u.get("joinDate", ""),
    }


@auth_bp.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    required = ["name", "email", "password", "employeeId", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if data["role"] not in ("employee", "admin"):
        return jsonify({"error": "role must be 'employee' or 'admin'"}), 400

    if users_col.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already registered"}), 409

    if users_col.find_one({"employeeId": data["employeeId"]}):
        return jsonify({"error": "Employee ID already in use"}), 409

    password_hash = bcrypt.hashpw(data["password"].encode("utf-8"), bcrypt.gensalt())

    user_doc = {
        "name": data["name"],
        "email": data["email"],
        "password_hash": password_hash,
        "employeeId": data["employeeId"],
        "role": data["role"],
        "phone": data.get("phone", ""),
        "address": data.get("address", ""),
        "jobTitle": data.get("jobTitle", ""),
        "department": data.get("department", ""),
        "joinDate": datetime.utcnow().strftime("%Y-%m-%d"),
        "verified": True,  # auto-verified, no email service for hackathon scope
    }

    result = users_col.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = generate_token(result.inserted_id, data["role"])
    print(f"[auth] New user signed up: {data['email']} ({data['role']})")

    return jsonify({"token": token, "user": serialize_user(user_doc)}), 201


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_token(user["_id"], user["role"])
    print(f"[auth] User logged in: {email}")

    return jsonify({"token": token, "user": serialize_user(user)}), 200


@auth_bp.route("/api/users/me", methods=["GET"])
@token_required
def get_me():
    user = users_col.find_one({"_id": ObjectId(request.user["userId"])})
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(serialize_user(user)), 200


@auth_bp.route("/api/users/me", methods=["PUT"])
@token_required
def update_me():
    """Employees can only edit phone/address (per HRMS spec, sec 3.3.2)."""
    data = request.get_json(silent=True) or {}
    allowed = {"phone", "address"}
    update = {k: v for k, v in data.items() if k in allowed}

    if not update:
        return jsonify({"error": "No editable fields provided (allowed: phone, address)"}), 400

    users_col.update_one({"_id": ObjectId(request.user["userId"])}, {"$set": update})
    user = users_col.find_one({"_id": ObjectId(request.user["userId"])})
    return jsonify(serialize_user(user)), 200


@auth_bp.route("/api/users", methods=["GET"])
@token_required
@admin_required
def list_users():
    users = list(users_col.find({}))
    return jsonify([serialize_user(u) for u in users]), 200


@auth_bp.route("/api/users/<user_id>", methods=["PUT"])
@token_required
@admin_required
def admin_update_user(user_id):
    """Admin can edit all employee details (per HRMS spec, sec 3.3.2)."""
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        return jsonify({"error": "Invalid user id"}), 400

    data = request.get_json(silent=True) or {}
    allowed = {"name", "phone", "address", "jobTitle", "department", "role"}
    update = {k: v for k, v in data.items() if k in allowed}

    if not update:
        return jsonify({"error": "No valid fields to update"}), 400

    result = users_col.update_one({"_id": oid}, {"$set": update})
    if result.matched_count == 0:
        return jsonify({"error": "User not found"}), 404

    user = users_col.find_one({"_id": oid})
    return jsonify(serialize_user(user)), 200


@auth_bp.route("/api/users/<user_id>", methods=["DELETE"])
@token_required
@admin_required
def admin_delete_user(user_id):
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        return jsonify({"error": "Invalid user id"}), 400

    result = users_col.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"success": True}), 200
