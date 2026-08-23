"""
db.py
Shared MongoDB Atlas connection.
Owner: Member A (Auth + Attendance) — created once, imported by everyone.
"""

import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError, ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError(
        "MONGO_URI not set. Copy backend/.env.example to backend/.env and fill in your "
        "MongoDB Atlas connection string."
    )

# serverSelectionTimeoutMS keeps a bad/unreachable URI from hanging for the pymongo
# default of 30s on every single query — it fails fast with a clear error instead.
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)

try:
    client.admin.command("ping")
except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    print(
        "[db.py] FATAL: could not reach MongoDB.\n"
        "  Check that:\n"
        "  1. MONGO_URI in backend/.env is correct (password is URL-encoded if it has special chars)\n"
        "  2. Your current IP is allow-listed in Atlas -> Network Access\n"
        "  3. The cluster is running (not paused)\n"
        f"  Underlying error: {e}",
        file=sys.stderr,
    )
    raise
except ConfigurationError as e:
    print(f"[db.py] FATAL: malformed MONGO_URI — {e}", file=sys.stderr)
    raise

db = client.get_database("dayflow")

# Collections (import these directly where convenient)
users_col = db["users"]
attendance_col = db["attendance"]
leave_col = db["leave"]
payroll_col = db["payroll"]

# Data-integrity guardrails: enforced at the DB level, not just app-level checks,
# so concurrent signups can never create duplicate accounts.
users_col.create_index("email", unique=True)
users_col.create_index("employeeId", unique=True)

print(f"[db.py] Connected to MongoDB Atlas, database='{db.name}'")
