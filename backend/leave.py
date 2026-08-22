"""
leave.py
Owner: MEMBER B
Routes: apply for leave, my leave history, admin view all, admin approve/reject.
"""

from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request, jsonify

from db import leave_col
from auth_utils import token_required, admin_required

leave_bp = Blueprint("leave", __name__)

VALID_TYPES = {"paid", "sick", "unpaid"}
VALID_STATUSES = {"pending", "approved", "rejected"}


def serialize_leave(l):
    return {
        "id": str(l["_id"]),
        "userId": str(l["userId"]),
        "type": l.get("type"),
        "startDate": l.get("startDate"),
        "endDate": l.get("endDate"),
        "remarks": l.get("remarks", ""),
        "status": l.get("status"),
        "adminComment": l.get("adminComment", ""),
        "appliedAt": l.get("appliedAt"),
    }


@leave_bp.route("/api/leave", methods=["POST"])
@token_required
def apply_leave():
    data = request.get_json(silent=True) or {}
    required = ["type", "startDate", "endDate"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    if data["type"] not in VALID_TYPES:
        return jsonify({"error": f"type must be one of {sorted(VALID_TYPES)}"}), 400

    if data["startDate"] > data["endDate"]:
        return jsonify({"error": "startDate cannot be after endDate"}), 400

    doc = {
        "userId": ObjectId(request.user["userId"]),
        "type": data["type"],
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "remarks": data.get("remarks", ""),
        "status": "pending",
        "adminComment": "",
        "appliedAt": datetime.utcnow().isoformat(),
    }
    result = leave_col.insert_one(doc)
    doc["_id"] = result.inserted_id

    print(f"[leave] User {request.user['userId']} applied for {data['type']} leave")
    return jsonify(serialize_leave(doc)), 201


@leave_bp.route("/api/leave/me", methods=["GET"])
@token_required
def my_leave():
    records = list(
        leave_col.find({"userId": ObjectId(request.user["userId"])}).sort("appliedAt", -1)
    )
    return jsonify([serialize_leave(l) for l in records]), 200


@leave_bp.route("/api/leave", methods=["GET"])
@token_required
@admin_required
def all_leave():
    query = {}
    status = request.args.get("status")
    if status:
        if status not in VALID_STATUSES:
            return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400
        query["status"] = status

    records = list(leave_col.find(query).sort("appliedAt", -1))
    return jsonify([serialize_leave(l) for l in records]), 200


@leave_bp.route("/api/leave/<leave_id>/decision", methods=["PUT"])
@token_required
@admin_required
def decide_leave(leave_id):
    try:
        oid = ObjectId(leave_id)
    except InvalidId:
        return jsonify({"error": "Invalid leave id"}), 400

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("approved", "rejected"):
        return jsonify({"error": "status must be 'approved' or 'rejected'"}), 400

    update = {"status": status, "adminComment": data.get("adminComment", "")}
    result = leave_col.update_one({"_id": oid}, {"$set": update})

    if result.matched_count == 0:
        return jsonify({"error": "Leave request not found"}), 404

    record = leave_col.find_one({"_id": oid})
    print(f"[leave] Leave {leave_id} marked {status} by admin {request.user['userId']}")
    return jsonify(serialize_leave(record)), 200
