/**
 * Dayflow HRMS - API Service Layer
 * Talks to the real Flask backend (backend/app.py). Method names/signatures
 * are kept identical to the original mock layer so page controllers
 * (dashboard.js, employees.js, leave.js, payroll.js, etc.) work unchanged.
 *
 * Notifications, activity feed, and settings have no backend endpoints
 * (out of the HRMS spec's core scope) and remain local to the browser.
 */

const AVATAR_COLORS = ["#4F46E5", "#9D174D", "#059669", "#D97706", "#0284C7", "#7C3AED", "#DB2777"];

function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "DF";
}

function colorFor(seed = "") {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getToken() {
  return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || "null"); }
  catch (e) { return null; }
}

async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    console.error(`[api] Network error calling ${path}:`, networkErr);
    throw new Error("Cannot reach the Dayflow server. Is the backend running on port 5000?");
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    if (res.status === 401 && auth) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}

/** Adds UI-only presentational fields the original design expects but the
 *  backend schema doesn't store (avatar initials/color, status, designation alias). */
function decorateUser(u) {
  return {
    ...u,
    // Backend stores "admin"; the existing frontend UI/routing is built around "hr".
    role: u.role === "admin" ? "hr" : u.role,
    designation: u.jobTitle || "",
    joiningDate: u.joinDate || "",
    status: "Active",
    avatar: initials(u.name),
    avatarBg: colorFor(u.email || u.name || u.id),
  };
}

function mapAttendanceRecord(r, employeesById = {}, currentUser = null) {
  // Prefer the employee-list lookup (admin view). If unavailable (employee view,
  // where GET /api/users is admin-only), fall back to the authenticated user's
  // own stored profile when the record belongs to them.
  const emp = employeesById[r.userId] || (currentUser && currentUser.id === r.userId ? currentUser : {});
  const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:-- --";
  let hours = "0h 00m";
  if (r.checkInTime && r.checkOutTime) {
    const mins = Math.max(0, Math.round((new Date(r.checkOutTime) - new Date(r.checkInTime)) / 60000));
    hours = `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
  } else if (r.checkInTime && !r.checkOutTime) {
    hours = "Ongoing";
  }
  return {
    id: r.id,
    employeeId: r.userId,
    employeeName: emp.name || "",
    department: emp.department || "",
    date: r.date,
    day: new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' }),
    checkIn: fmtTime(r.checkInTime),
    checkOut: fmtTime(r.checkOutTime),
    hours,
    status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : "Absent",
  };
}

function mapLeaveRecord(l, employeesById = {}) {
  const emp = employeesById[l.userId] || {};
  const days = Math.max(1, Math.round((new Date(l.endDate) - new Date(l.startDate)) / 86400000) + 1);
  return {
    id: l.id,
    employeeId: l.userId,
    employeeName: emp.name || "",
    department: emp.department || "",
    leaveType: l.type ? l.type.charAt(0).toUpperCase() + l.type.slice(1) : "",
    startDate: l.startDate,
    endDate: l.endDate,
    duration: `${days} Day${days > 1 ? "s" : ""}`,
    reason: l.remarks || "",
    status: l.status ? l.status.charAt(0).toUpperCase() + l.status.slice(1) : "Pending",
    appliedOn: (l.appliedAt || "").split("T")[0],
    comments: l.adminComment || "",
  };
}

function mapPayroll(p) {
  return {
    id: p.id,
    userId: p.userId,
    basicSalary: p.baseSalary,
    hra: 0,
    specialAllowance: p.allowances,
    conveyance: 0,
    grossSalary: p.baseSalary + p.allowances,
    pfDeduction: p.deductions,
    professionalTax: 0,
    healthInsurance: 0,
    totalDeductions: p.deductions,
    netSalary: p.netSalary,
    paymentStatus: "Paid",
    bankName: "—",
    accountNumber: "—",
    history: [],
  };
}

const DayflowAPI = {
  // ==================== AUTHENTICATION ====================
  async login(email, password) {
    try {
      const data = await apiRequest("/auth/login", { method: "POST", auth: false, body: { email, password } });
      const user = decorateUser(data.user);
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
      return { success: true, user };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  async signup(data) {
    try {
      const employeeId = data.employeeId || `EMP${Date.now().toString().slice(-6)}`;
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role === "hr" ? "admin" : (data.role || "employee"),
        employeeId,
      };
      const res = await apiRequest("/auth/signup", { method: "POST", auth: false, body: payload });
      return { success: true, employeeId: res.user.employeeId, email: res.user.email, token: res.token };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },

  async verifyEmailCode(code) {
    // Backend auto-verifies accounts on signup (no email service for this build).
    return { success: true, message: "Email successfully verified!" };
  },

  async forgotPassword(email) {
    // No password-reset endpoint in the backend yet.
    return { success: true, message: "Password reset is not available yet in this build. Contact your admin." };
  },

  // ==================== EMPLOYEES ====================
  async getEmployees() {
    const list = await apiRequest("/users");
    return list.map(decorateUser);
  },

  async getEmployee(id) {
    const me = getStoredUser();
    if (!id || (me && me.id === id)) {
      const u = await apiRequest("/users/me");
      return decorateUser(u);
    }
    const employees = await this.getEmployees();
    return employees.find(e => e.id === id) || null;
  },

  async createEmployee(employeeData) {
    const employeeId = employeeData.id || employeeData.employeeId || `EMP${Date.now().toString().slice(-6)}`;
    const res = await this.signup({
      name: employeeData.name,
      email: employeeData.email,
      password: "Dayflow@123",
      role: employeeData.role || "employee",
      employeeId,
    });
    if (!res.success) throw new Error(res.message);
    const employees = await this.getEmployees();
    return employees.find(e => e.employeeId === employeeId);
  },

  async updateEmployee(id, updatedFields) {
    const me = getStoredUser();
    // Backend fields: phone/address (self) or name/phone/address/jobTitle/department/role (admin).
    // Translate the UI's "designation" to the backend's "jobTitle"; "status"/"email" aren't editable server-side.
    const { designation, status, email, ...rest } = updatedFields;
    const body = { ...rest };
    if (designation !== undefined) body.jobTitle = designation;

    let updated;
    if (me && me.id === id) {
      updated = await apiRequest("/users/me", { method: "PUT", body });
    } else {
      updated = await apiRequest(`/users/${id}`, { method: "PUT", body });
    }
    const decorated = decorateUser(updated);
    if (me && me.id === id) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(decorated));
    }
    return decorated;
  },

  async deleteEmployee(id) {
    await apiRequest(`/users/${id}`, { method: "DELETE" });
    return { success: true };
  },

  async _employeesById() {
    const employees = await this.getEmployees();
    const map = {};
    employees.forEach(e => { map[e.id] = e; });
    return map;
  },

  // ==================== ATTENDANCE ====================
  async getAttendance(filters = {}) {
    const me = getStoredUser();
    let records;
    let employeesById = {};
    if (me && me.role === "hr") {
      // Admins are authorized to decorate records with names/departments from the full employee list.
      employeesById = await this._employeesById();
      const params = new URLSearchParams();
      if (filters.employeeId) params.set("userId", filters.employeeId);
      if (filters.date) params.set("date", filters.date);
      const qs = params.toString();
      records = await apiRequest(`/attendance${qs ? `?${qs}` : ""}`);
    } else {
      // Employees only see their own records and must not call the admin-only /api/users.
      records = await apiRequest(`/attendance/me?range=weekly`);
    }
    let mapped = records.map(r => mapAttendanceRecord(r, employeesById, me));
    if (filters.status && filters.status !== "All") {
      mapped = mapped.filter(r => r.status.toLowerCase() === filters.status.toLowerCase());
    }
    return mapped;
  },

  async checkIn(empId) {
    // The punch is considered successful as soon as the attendance endpoint returns 200.
    // No admin-only employee list lookup is needed to decorate the response.
    const record = await apiRequest("/attendance/checkin", { method: "POST" });
    this.addActivity("Check-in completed", "Punched in for workday", "checkin");
    return mapAttendanceRecord(record, {}, getStoredUser());
  },

  async checkOut(empId) {
    const record = await apiRequest("/attendance/checkout", { method: "POST" });
    this.addActivity("Check-out completed", "Punched out for the day", "checkin");
    return mapAttendanceRecord(record, {}, getStoredUser());
  },

  // ==================== LEAVE MANAGEMENT ====================
  async getLeaves(filters = {}) {
    const me = getStoredUser();
    const employeesById = await this._employeesById();
    let records;
    if (me && me.role === "hr") {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "All") params.set("status", filters.status.toLowerCase());
      const qs = params.toString();
      records = await apiRequest(`/leave${qs ? `?${qs}` : ""}`);
    } else {
      records = await apiRequest("/leave/me");
    }
    let mapped = records.map(l => mapLeaveRecord(l, employeesById));
    if (filters.employeeId) {
      mapped = mapped.filter(l => l.employeeId === filters.employeeId);
    }
    return mapped;
  },

  async applyLeave(data) {
    const payload = {
      type: (data.leaveType || "").toLowerCase(),
      startDate: data.startDate,
      endDate: data.endDate,
      remarks: data.reason || "",
    };
    const record = await apiRequest("/leave", { method: "POST", body: payload });
    this.addActivity("Leave request submitted", `${data.leaveType} leave for ${data.startDate}`, "leave");
    this.addNotification("Leave request submitted", `Your request for ${data.leaveType} leave is awaiting HR approval.`, "leave");
    const employeesById = await this._employeesById();
    return mapLeaveRecord(record, employeesById);
  },

  async approveLeave(id, comments = "Approved.") {
    const record = await apiRequest(`/leave/${id}/decision`, { method: "PUT", body: { status: "approved", adminComment: comments } });
    this.addNotification("Leave request approved", `Your ${record.type} leave has been approved by HR.`, "leave");
    const employeesById = await this._employeesById();
    return mapLeaveRecord(record, employeesById);
  },

  async rejectLeave(id, reason) {
    const record = await apiRequest(`/leave/${id}/decision`, { method: "PUT", body: { status: "rejected", adminComment: reason || "Declined due to operational constraints." } });
    this.addNotification("Leave request rejected", `Your ${record.type} leave was rejected: "${reason || ""}"`, "leave");
    const employeesById = await this._employeesById();
    return mapLeaveRecord(record, employeesById);
  },

  // ==================== PAYROLL ====================
  async getPayroll(empId) {
    const me = getStoredUser();
    if (!empId || (me && me.id === empId)) {
      const p = await apiRequest("/payroll/me");
      return mapPayroll(p);
    }
    const all = await apiRequest("/payroll");
    const found = all.find(p => p.userId === empId);
    return found ? mapPayroll(found) : null;
  },

  async getAllPayrolls() {
    const [employees, payrolls] = await Promise.all([this.getEmployees(), apiRequest("/payroll")]);
    const byUser = {};
    payrolls.forEach(p => { byUser[p.userId] = p; });
    return employees.map(emp => ({
      employee: emp,
      payroll: byUser[emp.id] ? mapPayroll(byUser[emp.id]) : null,
    }));
  },

  async updatePayroll(empId, data) {
    const fields = {
      baseSalary: Number(data.basicSalary ?? 0),
      allowances: Number(data.hra ?? 0) + Number(data.specialAllowance ?? 0) + Number(data.conveyance ?? 0),
      deductions: Number(data.pfDeduction ?? 0) + Number(data.professionalTax ?? 0) + Number(data.healthInsurance ?? 0),
    };
    const all = await apiRequest("/payroll");
    const existing = all.find(p => p.userId === empId);
    let record;
    if (existing) {
      record = await apiRequest(`/payroll/${existing.id}`, { method: "PUT", body: fields });
    } else {
      record = await apiRequest("/payroll", { method: "POST", body: { userId: empId, ...fields } });
    }
    return mapPayroll(record);
  },

  // ==================== NOTIFICATIONS & ACTIVITIES (local, no backend endpoint) ====================
  async getNotifications() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || "[]");
  },

  async markNotificationsRead() {
    const list = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || "[]");
    list.forEach(n => n.unread = false);
    localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    return list;
  },

  addNotification(title, desc, type = "leave") {
    const list = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || "[]");
    list.unshift({ id: `N-${Date.now()}`, title, desc, time: "Just now", type, unread: true });
    localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list.slice(0, 15)));
  },

  async getActivities() {
    return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVITIES) || "[]");
  },

  addActivity(title, desc, type = "checkin") {
    const list = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVITIES) || "[]");
    list.unshift({ id: `ACT-${Date.now()}`, title, desc, time: "Just now", type });
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVITIES, JSON.stringify(list.slice(0, 10)));
  },

  // ==================== ADMIN REPORTS & ANALYTICS ====================
  async getReportsData(filters = {}) {
    const [summary, employees] = await Promise.all([
      apiRequest("/analytics/summary"),
      this.getEmployees(),
    ]);
    const departmentStats = {};
    employees.forEach(e => {
      const key = (e.department || "Unassigned").replace(/\s+/g, "");
      departmentStats[key] = (departmentStats[key] || 0) + 1;
    });
    return {
      totalEmployees: summary.totalEmployees,
      presentToday: summary.presentToday,
      onLeaveToday: 0,
      absentToday: Math.max(0, summary.totalEmployees - summary.presentToday),
      pendingLeaves: summary.pendingLeaves,
      approvedLeaves: summary.approvedLeaves,
      rejectedLeaves: 0,
      totalPayrollMonthly: summary.totalMonthlyPayroll,
      avgSalary: summary.totalEmployees ? Math.round(summary.totalMonthlyPayroll / summary.totalEmployees) : 0,
      attendanceRate: summary.attendancePercentToday,
      departmentStats,
    };
  },

  // ==================== EMPLOYEE REPORTS & ANALYTICS ====================
  async getEmployeeReportsData(employeeId) {
    const [attendance, leaves] = await Promise.all([
      apiRequest("/attendance/me?range=weekly"),
      apiRequest("/leave/me"),
    ]);
    const presentDays = attendance.filter(a => a.status === "present").length;
    const totalDays = attendance.length || 1;
    return {
      attendanceRate: Math.round((presentDays / totalDays) * 1000) / 10,
      totalHoursWorked: 0,
      avgDailyHours: 0,
      overtimeHours: 0,
      presentDays,
      absentDays: attendance.filter(a => a.status === "absent").length,
      halfDays: attendance.filter(a => a.status === "half-day").length,
      leaveDays: leaves.filter(l => l.status === "approved").length,
      workingDaysCount: totalDays,
      leaveBalance: 18 - leaves.filter(l => l.status === "approved").length,
      leaveUsed: leaves.filter(l => l.status === "approved").length,
      monthlyTrends: [],
      weeklyHours: [],
    };
  },

  // ==================== SETTINGS (local, no backend endpoint) ====================
  async getAdminSettings() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
    if (stored) { try { return JSON.parse(stored); } catch (e) {} }
    const defaults = {
      general: { companyName: "Dayflow Technologies Inc.", portalTitle: "Dayflow HRMS", supportEmail: "support@dayflow.com", timezone: "Asia/Kolkata (GMT +5:30)", fiscalYearStart: "April", currency: "INR (₹)" },
      attendance: { workdayStartTime: "09:00", workdayEndTime: "18:00", gracePeriodMinutes: 15, halfDayThresholdHours: 4.5, autoCheckoutEnabled: true, geoFencingEnabled: false, ipRestrictedPunch: false },
      leaves: { annualPaidLeaveQuota: 18, sickLeaveQuota: 12, casualLeaveQuota: 6, allowCarryOver: true, maxCarryOverDays: 10, requireDocForSickLeaveDays: 2, multiLevelApproval: true },
      payroll: { payCycleDay: 28, pfDeductionRate: 12, esiApplicable: true, tdsAutoDeduct: true, directDepositEnabled: true },
      security: { twoFactorAuthRequired: false, sessionTimeoutMinutes: 60, passwordExpiryDays: 90, minPasswordLength: 8, preventConcurrentSessions: true },
      notifications: { emailPunchAlerts: true, emailLeaveRequests: true, emailPayrollDisbursed: true, smsCriticalAlerts: false, slackWebhookEnabled: true },
    };
    localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(defaults));
    return defaults;
  },

  async saveAdminSettings(settings) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.addActivity("System Settings Updated", "HR Admin modified global organization policies & rules", "update");
    return { success: true, settings };
  },

  async getEmployeeSettings(employeeId) {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.EMP_SETTINGS);
    if (stored) {
      try { const all = JSON.parse(stored); if (all[employeeId]) return all[employeeId]; } catch (e) {}
    }
    return {
      notifications: { emailDailyPunchReminder: true, emailLeaveStatusUpdate: true, emailSalarySlipAvailable: true, pushWorkAnnouncements: true, smsUrgentAlerts: false },
      preferences: { timeFormat: "12h", dateFormat: "YYYY-MM-DD", defaultLanding: "/pages/employee/dashboard.html", compactView: false, soundEffects: true },
      security: { twoFactorAuth: false, loginAlerts: true },
    };
  },

  async saveEmployeeSettings(employeeId, settings) {
    let all = {};
    try { all = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.EMP_SETTINGS) || "{}"); } catch (e) {}
    all[employeeId] = settings;
    localStorage.setItem(CONFIG.STORAGE_KEYS.EMP_SETTINGS, JSON.stringify(all));
    return { success: true, settings };
  },
};

window.DayflowAPI = DayflowAPI;
