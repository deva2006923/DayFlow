# Dayflow Backend — Auth + Attendance

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # fill in MONGO_URI and JWT_SECRET
flask --app app run --debug
```

Server runs at `http://127.0.0.1:5000`

## Test flow (curl)

```bash
# 1. Signup
curl -X POST http://127.0.0.1:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Deva","email":"deva@test.com","password":"Pass123!","employeeId":"E001","role":"employee"}'

# 2. Login (copy the "token" from response)
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"deva@test.com","password":"Pass123!"}'

TOKEN="paste_token_here"

# 3. Get my profile
curl http://127.0.0.1:5000/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Edit profile
curl -X PUT http://127.0.0.1:5000/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999999999","address":"Chennai"}'

# 5. Check in
curl -X POST http://127.0.0.1:5000/api/attendance/checkin \
  -H "Authorization: Bearer $TOKEN"

# 6. Check out
curl -X POST http://127.0.0.1:5000/api/attendance/checkout \
  -H "Authorization: Bearer $TOKEN"

# 7. My attendance (daily/weekly)
curl "http://127.0.0.1:5000/api/attendance/me?range=weekly" \
  -H "Authorization: Bearer $TOKEN"

# 8. Admin: all attendance (needs a user with role "admin")
curl "http://127.0.0.1:5000/api/attendance?userId=<some_user_id>&date=2026-08-22" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Notes
- `users` and `attendance` collections are shared with your partner — field names must not change.
- JWT payload: `{userId, role}`.
- All protected routes need header: `Authorization: Bearer <token>`.
