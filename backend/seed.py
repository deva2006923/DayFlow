"""
seed.py
Run this once before your demo to populate realistic data.
Usage: python seed.py
"""

import bcrypt
from datetime import datetime, timedelta
from db import users_col, attendance_col, leave_col, payroll_col


def hash_pw(pw):
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt())


def seed():
    print("Clearing existing demo data...")
    users_col.delete_many({})
    attendance_col.delete_many({})
    leave_col.delete_many({})
    payroll_col.delete_many({})

    print("Creating users...")
    admin = users_col.insert_one({
        "name": "Priya Sharma", "email": "admin@dayflow.com", "password_hash": hash_pw("admin123"),
        "employeeId": "EMP001", "role": "admin", "phone": "9876543210", "address": "Chennai",
        "jobTitle": "HR Manager", "department": "Human Resources", "joinDate": "2022-01-10", "verified": True,
    })

    emp1 = users_col.insert_one({
        "name": "Arjun Kumar", "email": "arjun@dayflow.com", "password_hash": hash_pw("pass123"),
        "employeeId": "EMP002", "role": "employee", "phone": "9876500001", "address": "Bengaluru",
        "jobTitle": "Software Engineer", "department": "Engineering", "joinDate": "2023-06-15", "verified": True,
    })

    emp2 = users_col.insert_one({
        "name": "Sneha Reddy", "email": "sneha@dayflow.com", "password_hash": hash_pw("pass123"),
        "employeeId": "EMP003", "role": "employee", "phone": "9876500002", "address": "Hyderabad",
        "jobTitle": "UI/UX Designer", "department": "Design", "joinDate": "2023-09-01", "verified": True,
    })

    print("Creating attendance records...")
    today = datetime.utcnow()
    for i in range(5):
        date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
        attendance_col.insert_one({
            "userId": emp1.inserted_id, "date": date,
            "checkInTime": f"{date}T09:15:00", "checkOutTime": f"{date}T18:05:00", "status": "present",
        })
        if i != 2:  # emp2 has a gap = absent day
            attendance_col.insert_one({
                "userId": emp2.inserted_id, "date": date,
                "checkInTime": f"{date}T09:40:00", "checkOutTime": f"{date}T17:50:00", "status": "present",
            })
        else:
            attendance_col.insert_one({
                "userId": emp2.inserted_id, "date": date,
                "checkInTime": None, "checkOutTime": None, "status": "absent",
            })

    print("Creating leave requests...")
    leave_col.insert_one({
        "userId": emp1.inserted_id, "type": "sick", "startDate": "2026-08-25", "endDate": "2026-08-26",
        "remarks": "Fever", "status": "pending", "adminComment": "", "appliedAt": datetime.utcnow().isoformat(),
    })
    leave_col.insert_one({
        "userId": emp2.inserted_id, "type": "paid", "startDate": "2026-08-20", "endDate": "2026-08-21",
        "remarks": "Family function", "status": "approved", "adminComment": "Approved, enjoy!",
        "appliedAt": (datetime.utcnow() - timedelta(days=3)).isoformat(),
    })

    print("Creating payroll records...")
    payroll_col.insert_one({"userId": emp1.inserted_id, "baseSalary": 65000, "allowances": 8000, "deductions": 3000, "netSalary": 70000})
    payroll_col.insert_one({"userId": emp2.inserted_id, "baseSalary": 58000, "allowances": 6000, "deductions": 2500, "netSalary": 61500})

    print("\nSeed complete. Demo logins:")
    print("  Admin:    admin@dayflow.com / admin123")
    print("  Employee: arjun@dayflow.com / pass123")
    print("  Employee: sneha@dayflow.com / pass123")


if __name__ == "__main__":
    seed()
