"""
payroll.py
Owner: MEMBER B
Routes: my payroll (read-only), admin view all, admin edit salary structure.
"""

from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from db import payroll_col
from auth_utils import token_required, admin_required

payroll_bp = Blueprint("payroll", __name__)


def serialize_payroll(p):
    return {
        "id": str(p["_id"]),
        "userId": str(p["userId"]),
        "baseSalary": p.get("baseSalary", 0),
        "allowances": p.get("allowances", 0),
        "deductions": p.get("deductions", 0),
        "netSalary": p.get("netSalary", 0),
    }


def compute_net(base, allowances, deductions):
    return round(base + allowances - deductions, 2)


@payroll_bp.route("/api/payroll/me", methods=["GET"])
@token_required
def my_payroll():
    record = payroll_col.find_one({"userId": ObjectId(request.user["userId"])})
    if not record:
        return jsonify({"error": "No payroll record found for this user"}), 404
    return jsonify(serialize_payroll(record)), 200


@payroll_bp.route("/api/payroll", methods=["GET"])
@token_required
@admin_required
def all_payroll():
    records = list(payroll_col.find({}))
    return jsonify([serialize_payroll(p) for p in records]), 200


@payroll_bp.route("/api/payroll", methods=["POST"])
@token_required
@admin_required
def create_payroll():
    data = request.get_json(silent=True) or {}
    user_id = data.get("userId")
    if not user_id:
        return jsonify({"error": "userId is required"}), 400
    try:
        uid = ObjectId(user_id)
    except InvalidId:
        return jsonify({"error": "Invalid userId"}), 400

    if payroll_col.find_one({"userId": uid}):
        return jsonify({"error": "Payroll record already exists for this user"}), 409

    base = data.get("baseSalary", 0)
    allowances = data.get("allowances", 0)
    deductions = data.get("deductions", 0)
    for label, val in [("baseSalary", base), ("allowances", allowances), ("deductions", deductions)]:
        if not isinstance(val, (int, float)):
            return jsonify({"error": f"{label} must be a number"}), 400

    doc = {
        "userId": uid,
        "baseSalary": base,
        "allowances": allowances,
        "deductions": deductions,
        "netSalary": compute_net(base, allowances, deductions),
    }
    result = payroll_col.insert_one(doc)
    doc["_id"] = result.inserted_id
    print(f"[payroll] Payroll created for user {user_id} by admin {request.user['userId']}")
    return jsonify(serialize_payroll(doc)), 201


@payroll_bp.route("/api/payroll/<payroll_id>", methods=["PUT"])
@token_required
@admin_required
def update_payroll(payroll_id):
    try:
        oid = ObjectId(payroll_id)
    except InvalidId:
        return jsonify({"error": "Invalid payroll id"}), 400

    data = request.get_json(silent=True) or {}
    record = payroll_col.find_one({"_id": oid})
    if not record:
        return jsonify({"error": "Payroll record not found"}), 404

    base = data.get("baseSalary", record.get("baseSalary", 0))
    allowances = data.get("allowances", record.get("allowances", 0))
    deductions = data.get("deductions", record.get("deductions", 0))

    for label, val in [("baseSalary", base), ("allowances", allowances), ("deductions", deductions)]:
        if not isinstance(val, (int, float)):
            return jsonify({"error": f"{label} must be a number"}), 400

    net = compute_net(base, allowances, deductions)

    payroll_col.update_one(
        {"_id": oid},
        {"$set": {"baseSalary": base, "allowances": allowances, "deductions": deductions, "netSalary": net}},
    )

    print(f"[payroll] Payroll {payroll_id} updated by admin {request.user['userId']}, net={net}")
    updated = payroll_col.find_one({"_id": oid})
    return jsonify(serialize_payroll(updated)), 200
