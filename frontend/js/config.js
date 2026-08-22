/**
 * Dayflow HRMS - Global Configuration
 * "Every workday, perfectly aligned."
 */

const CONFIG = {
  // Flask REST API base URL (backend/app.py)
  API_BASE_URL: "http://127.0.0.1:5000/api",
  APP_NAME: "Dayflow",
  TAGLINE: "Every workday, perfectly aligned.",
  DEMO_MODE: false, // Live backend is connected; set true to fall back to localStorage mock data
  STORAGE_KEYS: {
    TOKEN: "dayflowToken",
    USER: "dayflowUser",
    NOTIFICATIONS: "dayflow_notifications_db",
    ACTIVITIES: "dayflow_activities_db",
    SETTINGS: "dayflow_settings_db",
    EMP_SETTINGS: "dayflow_emp_settings_db",
    THEME: "dayflow-theme"
  },
  DEMO_CREDENTIALS_HINT: {
    ADMIN: { email: "admin@dayflow.com", password: "admin123" },
    EMPLOYEE: { email: "arjun@dayflow.com", password: "pass123" }
  }
};

// Expose globally
window.CONFIG = CONFIG;
