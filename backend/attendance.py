import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
from db import attendance_col
from auth_utils import token_required, admin_required

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


def today_str():
    return datetime.date.today().isoformat()


def now_str():
    return datetime.datetime.utcnow().isoformat()


@attendance_bp.route("/checkin", methods=["POST"])
@token_required
def checkin():
    user_id = request.user["userId"]
    date = today_str()
    print(f"[attendance.checkin] userId={user_id} date={date}")

    existing = attendance_col.find_one({"userId": user_id, "date": date})
    if existing and existing.get("checkInTime"):
        return jsonify({"error": "Already checked in today"}), 400

    if existing:
        attendance_col.update_one(
            {"_id": existing["_id"]},
            {"$set": {"checkInTime": now_str(), "status": "present"}},
        )
    else:
        attendance_col.insert_one({
            "userId": user_id,
            "date": date,
            "checkInTime": now_str(),
            "checkOutTime": None,
            "status": "present",
        })

    return jsonify({"message": "Checked in", "date": date}), 200


@attendance_bp.route("/checkout", methods=["POST"])
@token_required
def checkout():
    user_id = request.user["userId"]
    date = today_str()
    print(f"[attendance.checkout] userId={user_id} date={date}")

    existing = attendance_col.find_one({"userId": user_id, "date": date})
    if not existing or not existing.get("checkInTime"):
        return jsonify({"error": "Must check in before checking out"}), 400

    if existing.get("checkOutTime"):
        return jsonify({"error": "Already checked out today"}), 400

    attendance_col.update_one(
        {"_id": existing["_id"]},
        {"$set": {"checkOutTime": now_str()}},
    )

    return jsonify({"message": "Checked out", "date": date}), 200


@attendance_bp.route("/me", methods=["GET"])
@token_required
def my_attendance():
    user_id = request.user["userId"]
    range_type = request.args.get("range", "daily")
    print(f"[attendance.my_attendance] userId={user_id} range={range_type}")

    query = {"userId": user_id}

    if range_type == "weekly":
        start = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
        query["date"] = {"$gte": start}
    elif range_type == "daily":
        query["date"] = today_str()
    else:
        return jsonify({"error": "range must be 'daily' or 'weekly'"}), 400

    records = list(attendance_col.find(query))
    for r in records:
        r["_id"] = str(r["_id"])

    return jsonify(records), 200


@attendance_bp.route("", methods=["GET"])
@token_required
@admin_required
def all_attendance():
    user_id_filter = request.args.get("userId")
    date_filter = request.args.get("date")
    print(f"[attendance.all_attendance] userId={user_id_filter} date={date_filter}")

    query = {}
    if user_id_filter:
        query["userId"] = user_id_filter
    if date_filter:
        query["date"] = date_filter

    records = list(attendance_col.find(query))
    for r in records:
        r["_id"] = str(r["_id"])

    return jsonify(records), 200
