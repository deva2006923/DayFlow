"""
db.py
Shared MongoDB Atlas connection.
Owner: Member A (Auth + Attendance) — created once, imported by everyone.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI not set. Copy .env.example to .env and fill it in.")

client = MongoClient(MONGO_URI)
db = client.get_database("dayflow")

# Collections (import these directly where convenient)
users_col = db["users"]
attendance_col = db["attendance"]
leave_col = db["leave"]
payroll_col = db["payroll"]

print(f"[db.py] Connected to MongoDB Atlas, database='{db.name}'")
