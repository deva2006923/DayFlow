/**
 * Dayflow HRMS - Global Configuration
 * "Every workday, perfectly aligned."
 */

// The backend runs as its own Render web service (see render.yaml / dayflow-backend),
// separate from this static frontend site, so the frontend must call it by an
// explicit absolute URL rather than a relative path.
//
// Locally (served from 127.0.0.1/localhost) we keep talking to the local Flask
// dev server. In any other environment (Render, or any other host) we use the
// deployed backend's URL. window.DAYFLOW_API_BASE_URL can override this if the
// backend URL ever changes, without needing another code change.
function resolveApiBaseUrl() {
  if (window.DAYFLOW_API_BASE_URL) return window.DAYFLOW_API_BASE_URL;
  const host = window.location.hostname;
  if (host === "127.0.0.1" || host === "localhost") {
    return "http://127.0.0.1:5000/api";
  }
  return "https://dayflow-backend.onrender.com/api";
}

const CONFIG = {
  // Flask REST API base URL (backend/app.py)
  API_BASE_URL: resolveApiBaseUrl(),
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
