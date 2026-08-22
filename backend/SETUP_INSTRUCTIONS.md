# Your files — Skeleton + Auth + Attendance

You have everything needed to get the repo running end to end, plus your
own modules (Auth + Attendance). Push this FIRST since your friend's
leave.py/payroll.py depend on db.py and auth_utils.py existing.

## How to push (as two commits, ~1hr apart, for a real-looking history)
```
git config user.name "Your Name"
git config user.email "your-actual-github-account-email@x.com"

# Commit 1 - skeleton
git add db.py auth_utils.py app.py requirements.txt .env.example seed.py README.md
git commit -m "chore: project skeleton, db connection, auth utils, seed data"
git push origin main

# wait ~1hr, then Commit 2 - your modules
git add auth.py attendance.py
git commit -m "feat: implement auth signup/login and attendance check-in/out routes"
git push origin main

# optional bonus, push last (or hand analytics.py to your friend to commit instead)
git add analytics.py
git commit -m "feat: add admin analytics summary endpoint"
git push origin main
```

## Setup to actually run it
```
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill in real MONGO_URI + JWT_SECRET
python seed.py             # demo data
python app.py               # localhost:5000
```

## Routes these files add
- POST /api/auth/signup
- POST /api/auth/login
- GET  /api/users/me
- PUT  /api/users/me
- GET  /api/users (admin)
- PUT  /api/users/<id> (admin)
- POST /api/attendance/checkin
- POST /api/attendance/checkout
- GET  /api/attendance/me
- GET  /api/attendance (admin)
- GET  /api/analytics/summary (admin, bonus)

Send your friend the `leave.py` + `payroll.py` files (already prepared)
once this is pushed.
