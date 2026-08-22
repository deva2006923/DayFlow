"""
analytics.py
Owner: JOINT (build together in last hour if core is done early)
Satisfies the PDF's "Analytics & reports dashboard" requirement — this is
what most teams will skip under time pressure, so it's a good differentiator.

Route: GET /api/analytics/summary (admin only)
Returns: headcount, today's attendance %, pending leave count, payroll total.
"""

from datetime import datetime
from flask import Blueprint, request, jsonify

from db import users_col, attendance_col, leave_col, payroll_col
from auth_utils import token_required, admin_required

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/api/analytics/summary", methods=["GET"])
@token_required
@admin_required
def summary():
    total_employees = users_col.count_documents({"role": "employee"})

    today = datetime.utcnow().strftime("%Y-%m-%d")
    present_today = attendance_col.count_documents({"date": today, "status": "present"})
    attendance_pct = round((present_today / total_employees) * 100, 1) if total_employees else 0

    pending_leaves = leave_col.count_documents({"status": "pending"})
    approved_leaves = leave_col.count_documents({"status": "approved"})

    payroll_records = list(payroll_col.find({}, {"netSalary": 1}))
    total_payroll = round(sum(p.get("netSalary", 0) for p in payroll_records), 2)

    return jsonify({
        "totalEmployees": total_employees,
        "presentToday": present_today,
        "attendancePercentToday": attendance_pct,
        "pendingLeaves": pending_leaves,
        "approvedLeaves": approved_leaves,
        "totalMonthlyPayroll": total_payroll,
    }), 200
