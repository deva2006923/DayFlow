import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)
db = client.get_default_database()

users_col = db["users"]
attendance_col = db["attendance"]

print(f"[db.py] Connected to MongoDB: {db.name}")
