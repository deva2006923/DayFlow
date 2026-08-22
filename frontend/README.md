# Dayflow HRMS — Frontend Architecture

> **"Every workday, perfectly aligned."**

**Dayflow** is a modern, enterprise-grade Human Resource Management System (HRMS) frontend built with semantic HTML5, modern CSS3, Vanilla JavaScript (ES6+), Bootstrap 5, and Chart.js.

---

## 🌟 Key Highlights & Features

1. **Role-Based Workflows**:
   * **Employee Portal**: Live workday check-in/out widget, personal attendance calendar, leave application with instant validation, transparent salary breakdown, and printable payslip generator.
   * **Admin / HR Officer Portal**: Workforce directory with real-time search & filters, multi-step employee onboarding modal, organization-wide attendance tracker, leave approvals triage with mandatory rejection remarks, master payroll structure editor, and analytical reports.

2. **Django & DRF Backend Ready**:
   * All API calls and state transactions are isolated in `js/api.js` using asynchronous `async/await` patterns.
   * Easily connect to a live Django REST Framework backend by toggling `USE_MOCK: false` and updating `API_BASE_URL` in `js/config.js`.

3. **Production-Ready Design System**:
   * Built on a custom design system with mathematical spacing and accessible contrast ratios.
   * Responsive layout with collapsible sidebar, real-time toast notification system, and interactive Chart.js visualizations.

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@dayflow.com` | `Employee@123` | `/pages/employee/dashboard.html` |
| **HR Admin** | `admin@dayflow.com` | `Admin@123` | `/pages/admin/dashboard.html` |

*Verification Code for Sign Up:* `123456`

---

## 📁 Project Structure

```
dayflow-hrms/
├── index.html                   # Landing page with demo portal launchers
├── metadata.json                # Application metadata
├── css/
│   ├── style.css                # Design system, CSS variables & typography
│   ├── components.css           # Sidebar, topbar, tables, modals, toasts
│   ├── auth.css                 # Login, signup & verification styles
│   ├── dashboard.css            # Live punch widget, stats grid, timeline
│   ├── employee.css             # Profile banner, calendar, leave balance
│   ├── admin.css                # Action toolbar, approval cards, master tables
│   └── responsive.css           # Mobile & tablet media queries
├── js/
│   ├── config.js                # System constants & API endpoints
│   ├── api.js                   # Mock data store & DRF abstraction layer
│   ├── auth.js                  # Auth manager & shared layout injector
│   ├── notifications.js         # Toast engine & notification bell manager
│   ├── dashboard.js             # Live digital clock, punching & Chart.js
│   ├── profile.js               # Profile editor & document downloader
│   ├── attendance.js            # Daily punch logs & monthly calendar view
│   ├── leave.js                 # Leave request form & history
│   ├── payroll.js               # Salary breakdown chart & payslip generator
│   ├── employees.js             # Workforce CRUD controller
│   ├── approvals.js             # HR leave review & triage controller
│   └── reports.js               # HR analytics & report charts
└── pages/
    ├── auth/
    │   ├── login.html           # Authentication & role autofill
    │   ├── signup.html          # Registration with password strength meter
    │   ├── verify-email.html    # 6-digit code verification
    │   └── forgot-password.html # Password reset workflow
    ├── employee/
    │   ├── dashboard.html       # Employee command center
    │   ├── profile.html         # Personal, job, and document details
    │   ├── attendance.html      # Monthly calendar & daily punch logs
    │   ├── leave.html           # Leave balances & application
    │   └── payroll.html         # Compensation breakdown & salary slip
    └── admin/
        ├── dashboard.html       # HR overview & quick actions
        ├── employees.html       # Workforce directory & onboarding
        ├── attendance.html      # Organization attendance logs
        ├── leave-approvals.html # Leave triage queue
        ├── payroll.html         # Salary master & structure editor
        └── reports.html         # Analytics & export reports
```

---

## 🛠️ How to Connect to Django REST Framework (DRF)

1. Open `js/config.js`.
2. Change:
   ```javascript
   USE_MOCK: false,
   API_BASE_URL: 'http://127.0.0.1:8000/api/v1'
   ```
3. Ensure your DRF endpoints match the standard REST routes declared in `CONFIG.ENDPOINTS`:
   * `POST /auth/login/` -> `{ token, user }`
   * `GET/POST /employees/`
   * `GET/POST /attendance/`
   * `GET/POST /leaves/`
   * `POST /leaves/:id/approve/`
   * `POST /leaves/:id/reject/`
   * `GET/PUT /payroll/`

---

## 🚀 Running the Project

1. Run `npm run dev` to start the Vite development server on port 3000.
2. Open `http://localhost:3000` to view the landing page or test the demo portals.
3. Build for production using `npm run build`.
