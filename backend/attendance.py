"""
attendance.py
Owner: MEMBER A
Routes: check-in, check-out, my attendance (daily/weekly), admin attendance view.
"""

from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, request, jsonify

from db import attendance_col
from auth_utils import token_required, admin_required

attendance_bp = Blueprint("attendance", __name__)


def serialize_record(r):
    return {
        "id": str(r["_id"]),
        "userId": str(r["userId"]),
        "date": r["date"],
        "checkInTime": r.get("checkInTime"),
        "checkOutTime": r.get("checkOutTime"),
        "status": r.get("status"),
    }


def today_str():
    return datetime.utcnow().strftime("%Y-%m-%d")


@attendance_bp.route("/api/attendance/checkin", methods=["POST"])
@token_required
def check_in():
    uid = request.user["userId"]
    date = today_str()

    existing = attendance_col.find_one({"userId": ObjectId(uid), "date": date})
    if existing and existing.get("checkInTime"):
        return jsonify({"error": "Already checked in today"}), 409

    now_iso = datetime.utcnow().isoformat()

    if existing:
        attendance_col.update_one(
            {"_id": existing["_id"]},
            {"$set": {"checkInTime": now_iso, "status": "present"}},
        )
        record = attendance_col.find_one({"_id": existing["_id"]})
    else:
        doc = {
            "userId": ObjectId(uid),
            "date": date,
            "checkInTime": now_iso,
            "checkOutTime": None,
            "status": "present",
        }
        result = attendance_col.insert_one(doc)
        doc["_id"] = result.inserted_id
        record = doc

    print(f"[attendance] User {uid} checked in at {now_iso}")
    return jsonify(serialize_record(record)), 200


@attendance_bp.route("/api/attendance/checkout", methods=["POST"])
@token_required
def check_out():
    uid = request.user["userId"]
    date = today_str()

    existing = attendance_col.find_one({"userId": ObjectId(uid), "date": date})
    if not existing or not existing.get("checkInTime"):
        return jsonify({"error": "You must check in before checking out"}), 400
    if existing.get("checkOutTime"):
        return jsonify({"error": "Already checked out today"}), 409

    now_iso = datetime.utcnow().isoformat()
    attendance_col.update_one({"_id": existing["_id"]}, {"$set": {"checkOutTime": now_iso}})
    record = attendance_col.find_one({"_id": existing["_id"]})

    print(f"[attendance] User {uid} checked out at {now_iso}")
    return jsonify(serialize_record(record)), 200


@attendance_bp.route("/api/attendance/me", methods=["GET"])
@token_required
def my_attendance():
    uid = request.user["userId"]
    range_type = request.args.get("range", "daily")  # daily | weekly

    query = {"userId": ObjectId(uid)}
    if range_type == "weekly":
        week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        query["date"] = {"$gte": week_ago}
    else:
        query["date"] = today_str()

    records = list(attendance_col.find(query).sort("date", -1))
    return jsonify([serialize_record(r) for r in records]), 200


@attendance_bp.route("/api/attendance", methods=["GET"])
@token_required
@admin_required
def all_attendance():
    query = {}
    user_id = request.args.get("userId")
    date = request.args.get("date")

    if user_id:
        query["userId"] = ObjectId(user_id)
    if date:
        query["date"] = date

    records = list(attendance_col.find(query).sort("date", -1))
    return jsonify([serialize_record(r) for r in records]), 200
