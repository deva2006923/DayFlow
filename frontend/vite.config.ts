import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          login: path.resolve(__dirname, 'pages/auth/login.html'),
          signup: path.resolve(__dirname, 'pages/auth/signup.html'),
          verifyEmail: path.resolve(__dirname, 'pages/auth/verify-email.html'),
          forgotPassword: path.resolve(__dirname, 'pages/auth/forgot-password.html'),
          empDashboard: path.resolve(__dirname, 'pages/employee/dashboard.html'),
          empProfile: path.resolve(__dirname, 'pages/employee/profile.html'),
          empAttendance: path.resolve(__dirname, 'pages/employee/attendance.html'),
          empLeave: path.resolve(__dirname, 'pages/employee/leave.html'),
          empPayroll: path.resolve(__dirname, 'pages/employee/payroll.html'),
          adminDashboard: path.resolve(__dirname, 'pages/admin/dashboard.html'),
          adminEmployees: path.resolve(__dirname, 'pages/admin/employees.html'),
          adminAttendance: path.resolve(__dirname, 'pages/admin/attendance.html'),
          adminLeaveApprovals: path.resolve(__dirname, 'pages/admin/leave-approvals.html'),
          adminPayroll: path.resolve(__dirname, 'pages/admin/payroll.html'),
          adminReports: path.resolve(__dirname, 'pages/admin/reports.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
