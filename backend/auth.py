import bcrypt
import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from db import users_col
from auth_utils import generate_token, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(force=True, silent=True) or {}
    print(f"[auth.signup] payload: {data}")

    required = ["name", "email", "password", "employeeId", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if data["role"] not in ("employee", "admin"):
        return jsonify({"error": "role must be 'employee' or 'admin'"}), 400

    if users_col.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already registered"}), 400

    if users_col.find_one({"employeeId": data["employeeId"]}):
        return jsonify({"error": "Employee ID already registered"}), 400

    password_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()

    user = {
        "name": data["name"],
        "email": data["email"],
        "password_hash": password_hash,
        "employeeId": data["employeeId"],
        "role": data["role"],
        "phone": data.get("phone", ""),
        "address": data.get("address", ""),
        "jobTitle": data.get("jobTitle", ""),
        "department": data.get("department", ""),
        "joinDate": data.get("joinDate", datetime.date.today().isoformat()),
    }

    result = users_col.insert_one(user)
    print(f"[auth.signup] created user _id={result.inserted_id}")

    return jsonify({"message": "Signup successful", "userId": str(result.inserted_id)}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(force=True, silent=True) or {}
    print(f"[auth.login] attempt: {data.get('email')}")

    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400

    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_token(user["_id"], user["role"])
    print(f"[auth.login] success for userId={user['_id']}")

    return jsonify({"token": token, "role": user["role"], "userId": str(user["_id"])}), 200


users_bp = Blueprint("users", __name__, url_prefix="/api/users")


@users_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    user_id = request.user["userId"]
    user = users_col.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"error": "User not found"}), 404

    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return jsonify(user), 200


@users_bp.route("/me", methods=["PUT"])
@token_required
def update_me():
    data = request.get_json(force=True, silent=True) or {}
    print(f"[users.update_me] payload: {data}")

    allowed_fields = {"phone", "address"}
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    if not updates:
        return jsonify({"error": "Only 'phone' and 'address' can be updated"}), 400

    user_id = request.user["userId"]
    users_col.update_one({"_id": ObjectId(user_id)}, {"$set": updates})

    return jsonify({"message": "Profile updated", "updated": updates}), 200
