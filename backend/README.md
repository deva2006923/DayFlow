# Dayflow Backend (Flask + MongoDB Atlas)

## File ownership
| File | Owner | Pushes from |
|---|---|---|
| `db.py`, `auth_utils.py`, `app.py` | Member A (shared infra, built first) | Member A's GitHub account |
| `auth.py`, `attendance.py` | Member A | Member A's GitHub account |
| `leave.py`, `payroll.py` | Member B | Member B's GitHub account |
| `analytics.py` | Joint (bonus, do last) | Either, or split the commit |
| `seed.py`, `requirements.txt`, `.env.example`, `README.md` | Shared | Whoever sets up first |

## Setup
```bash
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # fill in your real MONGO_URI and JWT_SECRET
python seed.py                 # populate demo data (run once)
python app.py                  # starts on http://localhost:5000
```

## How to get individual contribution credit on GitHub (pan-India hackathon judging often checks commit graphs)

Since you're both hitting the same repo, the contribution graph is based on the **git author email**, not who clicks push. Do this:

**One person creates the repo and pushes the initial skeleton** (db.py, auth_utils.py, app.py, requirements.txt, .env.example, README.md) — this is "shared infra," first commit.

**From then on, each of you commits your own files under your own identity:**

```bash
# Member A, on their own machine/account, working on auth.py + attendance.py
git config user.name "Member A Name"
git config user.email "memberA@github-noreply-or-real-email.com"

git add auth.py attendance.py
git commit -m "feat: implement auth signup/login and attendance check-in/out routes"
git push origin main
```

```bash
# Member B, on their own machine/account, working on leave.py + payroll.py
git config user.name "Member B Name"
git config user.email "memberB@github-noreply-or-real-email.com"

git add leave.py payroll.py
git commit -m "feat: implement leave application/approval and payroll routes"
git push origin main
```

**Important:** `git config user.email` must match the email registered on each person's GitHub account (or their GitHub noreply email, found in GitHub → Settings → Emails) for the commit to count as that person's contribution on the graph. If you `git config` with the wrong email, GitHub won't attribute it to your profile even if you pushed it.

**Recommended flow to avoid conflicts:**
1. Both clone the repo after Member A pushes the skeleton.
2. Each of you works only inside your own files — you're never editing the same file, so there's nothing to merge-conflict.
3. Commit and push every 60–90 min in small chunks (not one giant commit at the end) — this also shows steady contribution over the day, not a single 11pm dump, which looks better to judges reviewing commit history.
4. Use clear commit messages per route group, e.g.:
   - `feat: add JWT auth + signup/login`
   - `feat: add check-in/check-out endpoints`
   - `feat: add leave apply + admin approval flow`
   - `feat: add payroll view and admin edit`
   - `feat: add analytics summary endpoint`

## Route list

### Member A — Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users` (admin)
- `PUT /api/users/<id>` (admin)

### Member A — Attendance
- `POST /api/attendance/checkin`
- `POST /api/attendance/checkout`
- `GET /api/attendance/me?range=daily|weekly`
- `GET /api/attendance?userId=&date=` (admin)

### Member B — Leave
- `POST /api/leave`
- `GET /api/leave/me`
- `GET /api/leave?status=` (admin)
- `PUT /api/leave/<id>/decision` (admin)

### Member B — Payroll
- `GET /api/payroll/me`
- `GET /api/payroll` (admin)
- `PUT /api/payroll/<id>` (admin)

### Joint — Analytics (differentiator for judging)
- `GET /api/analytics/summary` (admin) — headcount, today's attendance %, pending leaves, total payroll

## Quick test flow (curl)
```bash
# 1. Signup
curl -X POST http://localhost:5000/api/auth/signup -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@x.com","password":"pass123","employeeId":"EMP999","role":"employee"}'

# 2. Login (copy the token from the response)
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"test@x.com","password":"pass123"}'

# 3. Use the token
curl http://localhost:5000/api/users/me -H "Authorization: Bearer <TOKEN>"

# 4. Check in
curl -X POST http://localhost:5000/api/attendance/checkin -H "Authorization: Bearer <TOKEN>"

# 5. Apply for leave
curl -X POST http://localhost:5000/api/leave -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"type":"sick","startDate":"2026-09-01","endDate":"2026-09-02","remarks":"Fever"}'
```

Demo accounts after running `seed.py`:
- Admin: `admin@dayflow.com` / `admin123`
- Employee: `arjun@dayflow.com` / `pass123`
- Employee: `sneha@dayflow.com` / `pass123`
