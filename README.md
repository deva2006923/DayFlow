# DayFlow — HR Management System

Every workday, perfectly aligned.

Flask + PyMongo (MongoDB Atlas) backend, static HTML/CSS/JS frontend.

## Prerequisites
- Python 3.10+
- A MongoDB Atlas cluster (free tier is fine) — get a connection string
- Node is NOT required to run the app (the real frontend is plain HTML/CSS/JS
  in `frontend/`; the `frontend/src`, `frontend/package.json`, and
  `frontend/public` files are an unused leftover scaffold and can be ignored)

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env`:
```
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/dayflow?retryWrites=true&w=majority
JWT_SECRET=<any random string>
```

Seed demo data (creates 1 admin + 2 employees with attendance/leave/payroll history):
```bash
python seed.py
```

Start the API:
```bash
flask --app app run --port 5000
```
Verify: `curl http://127.0.0.1:5000/api/health` → `{"status":"ok"}`

## 2. Frontend setup

The frontend is static files served from `frontend/`. From a second terminal:
```bash
cd frontend
python -m http.server 8080
```
Open `http://127.0.0.1:8080` in a browser.

The API base URL is set in `frontend/js/config.js` (`API_BASE_URL`) —
defaults to `http://127.0.0.1:5000/api`, matching the command above.

## 3. Demo logins (after `python seed.py`)
| Role     | Email              | Password |
|----------|--------------------|----------|
| HR Admin | admin@dayflow.com  | admin123 |
| Employee | arjun@dayflow.com  | pass123  |
| Employee | sneha@dayflow.com  | pass123  |

## What's wired up
- Signup / login (JWT) — real accounts in MongoDB
- Employee profile view/edit (self: phone/address; admin: full record)
- Check-in / check-out, daily & weekly attendance views
- Leave apply / admin approve-reject
- Payroll view (employee, read-only) and edit (admin)
- Admin analytics summary (headcount, attendance %, pending leaves, payroll total)

## Known limitations
- Notifications, the activity feed, and Settings pages are **local to the
  browser** (localStorage) — the backend has no endpoints for these; they
  were outside the PDF's core spec.
- Payroll is a flat base/allowances/deductions model — no HRA/PF/bank-detail
  breakdown or payslip history (backend schema doesn't have these fields).
- `frontend/src`, `frontend/package.json`, `frontend/public` are an unused
  scaffold from an earlier prototype and are not part of the running app.
