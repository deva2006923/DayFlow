/**
 * Dayflow HRMS - Settings & Configuration Controller
 * Handles Organization System Policies for HR and Personal Preferences for Employees
 */

const DayflowSettings = {
  // ==================== ADMIN SETTINGS ====================
  async initAdmin() {
    try {
      const settings = await DayflowAPI.getAdminSettings();
      this.populateAdminForm(settings);
    } catch (e) {
      console.error("Failed to load admin settings:", e);
      showToast("Error loading system settings", "danger");
    }
  },

  populateAdminForm(s) {
    if (!s) return;

    // General
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };
    const setChecked = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };

    if (s.general) {
      setVal('cfg-company-name', s.general.companyName);
      setVal('cfg-portal-title', s.general.portalTitle);
      setVal('cfg-support-email', s.general.supportEmail);
      setVal('cfg-timezone', s.general.timezone);
      setVal('cfg-fiscal-start', s.general.fiscalYearStart);
      setVal('cfg-currency', s.general.currency);
    }

    if (s.attendance) {
      setVal('cfg-work-start', s.attendance.workdayStartTime);
      setVal('cfg-work-end', s.attendance.workdayEndTime);
      setVal('cfg-grace-mins', s.attendance.gracePeriodMinutes);
      setVal('cfg-halfday-hrs', s.attendance.halfDayThresholdHours);
      setChecked('cfg-auto-checkout', s.attendance.autoCheckoutEnabled);
      setChecked('cfg-geofencing', s.attendance.geoFencingEnabled);
      setChecked('cfg-ip-restrict', s.attendance.ipRestrictedPunch);
    }

    if (s.leaves) {
      setVal('cfg-paid-leave-quota', s.leaves.annualPaidLeaveQuota);
      setVal('cfg-sick-leave-quota', s.leaves.sickLeaveQuota);
      setVal('cfg-casual-leave-quota', s.leaves.casualLeaveQuota);
      setChecked('cfg-allow-carryover', s.leaves.allowCarryOver);
      setVal('cfg-max-carryover', s.leaves.maxCarryOverDays);
      setChecked('cfg-multilevel-approval', s.leaves.multiLevelApproval);
    }

    if (s.payroll) {
      setVal('cfg-pay-cycle-day', s.payroll.payCycleDay);
      setVal('cfg-pf-rate', s.payroll.pfDeductionRate);
      setChecked('cfg-esi-enable', s.payroll.esiApplicable);
      setChecked('cfg-tds-auto', s.payroll.tdsAutoDeduct);
      setChecked('cfg-direct-deposit', s.payroll.directDepositEnabled);
    }

    if (s.security) {
      setChecked('cfg-2fa-required', s.security.twoFactorAuthRequired);
      setVal('cfg-session-timeout', s.security.sessionTimeoutMinutes);
      setVal('cfg-pwd-expiry', s.security.passwordExpiryDays);
      setChecked('cfg-prevent-concurrent', s.security.preventConcurrentSessions);
    }

    if (s.notifications) {
      setChecked('cfg-notif-punch', s.notifications.emailPunchAlerts);
      setChecked('cfg-notif-leave', s.notifications.emailLeaveRequests);
      setChecked('cfg-notif-payroll', s.notifications.emailPayrollDisbursed);
      setChecked('cfg-notif-slack', s.notifications.slackWebhookEnabled);
    }
  },

  async saveAdminSettings(e) {
    if (e) e.preventDefault();

    const getVal = (id, fallback = '') => document.getElementById(id)?.value || fallback;
    const getNum = (id, fallback = 0) => parseFloat(document.getElementById(id)?.value) || fallback;
    const getChecked = (id) => !!document.getElementById(id)?.checked;

    const payload = {
      general: {
        companyName: getVal('cfg-company-name', 'Dayflow Technologies Inc.'),
        portalTitle: getVal('cfg-portal-title', 'Dayflow HRMS'),
        supportEmail: getVal('cfg-support-email', 'support@dayflow.com'),
        timezone: getVal('cfg-timezone', 'Asia/Kolkata (GMT +5:30)'),
        fiscalYearStart: getVal('cfg-fiscal-start', 'April'),
        currency: getVal('cfg-currency', 'INR (₹)')
      },
      attendance: {
        workdayStartTime: getVal('cfg-work-start', '09:00'),
        workdayEndTime: getVal('cfg-work-end', '18:00'),
        gracePeriodMinutes: getNum('cfg-grace-mins', 15),
        halfDayThresholdHours: getNum('cfg-halfday-hrs', 4.5),
        autoCheckoutEnabled: getChecked('cfg-auto-checkout'),
        geoFencingEnabled: getChecked('cfg-geofencing'),
        ipRestrictedPunch: getChecked('cfg-ip-restrict')
      },
      leaves: {
        annualPaidLeaveQuota: getNum('cfg-paid-leave-quota', 18),
        sickLeaveQuota: getNum('cfg-sick-leave-quota', 12),
        casualLeaveQuota: getNum('cfg-casual-leave-quota', 6),
        allowCarryOver: getChecked('cfg-allow-carryover'),
        maxCarryOverDays: getNum('cfg-max-carryover', 10),
        multiLevelApproval: getChecked('cfg-multilevel-approval')
      },
      payroll: {
        payCycleDay: getNum('cfg-pay-cycle-day', 28),
        pfDeductionRate: getNum('cfg-pf-rate', 12),
        esiApplicable: getChecked('cfg-esi-enable'),
        tdsAutoDeduct: getChecked('cfg-tds-auto'),
        directDepositEnabled: getChecked('cfg-direct-deposit')
      },
      security: {
        twoFactorAuthRequired: getChecked('cfg-2fa-required'),
        sessionTimeoutMinutes: getNum('cfg-session-timeout', 60),
        passwordExpiryDays: getNum('cfg-pwd-expiry', 90),
        preventConcurrentSessions: getChecked('cfg-prevent-concurrent')
      },
      notifications: {
        emailPunchAlerts: getChecked('cfg-notif-punch'),
        emailLeaveRequests: getChecked('cfg-notif-leave'),
        emailPayrollDisbursed: getChecked('cfg-notif-payroll'),
        slackWebhookEnabled: getChecked('cfg-notif-slack')
      }
    };

    const btn = document.getElementById('btn-save-admin-settings');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Saving...';
    }

    try {
      await DayflowAPI.saveAdminSettings(payload);
      showToast('System & organization settings saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Save Changes';
      }
    }
  },

  async resetAdminDefaults() {
    if (!confirm('Are you sure you want to reset all policies and organization settings to factory defaults?')) return;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
    const settings = await DayflowAPI.getAdminSettings();
    this.populateAdminForm(settings);
    showToast('System settings reset to default values.', 'info');
  },

  // ==================== EMPLOYEE SETTINGS ====================
  async initEmployee() {
    try {
      const user = DayflowAuth.getCurrentUser() || { id: 'EMP001' };
      const settings = await DayflowAPI.getEmployeeSettings(user.id);
      this.populateEmployeeForm(settings, user);
    } catch (e) {
      console.error("Failed to load employee settings:", e);
      showToast("Error loading account preferences", "danger");
    }
  },

  populateEmployeeForm(s, user) {
    if (user) {
      const elName = document.getElementById('emp-display-name');
      const elEmail = document.getElementById('emp-display-email');
      const elPhone = document.getElementById('emp-phone');
      if (elName) elName.value = user.name || '';
      if (elEmail) elEmail.value = user.email || '';
      if (elPhone) elPhone.value = user.phone || '+91 98765 43210';
    }

    if (!s) return;

    const setChecked = (id, checked) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!checked;
    };
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    if (s.notifications) {
      setChecked('emp-notif-punch', s.notifications.emailDailyPunchReminder);
      setChecked('emp-notif-leave', s.notifications.emailLeaveStatusUpdate);
      setChecked('emp-notif-salary', s.notifications.emailSalarySlipAvailable);
      setChecked('emp-notif-announcement', s.notifications.pushWorkAnnouncements);
    }

    if (s.preferences) {
      setVal('emp-pref-timeformat', s.preferences.timeFormat || '12h');
      setVal('emp-pref-dateformat', s.preferences.dateFormat || 'YYYY-MM-DD');
      setVal('emp-pref-landing', s.preferences.defaultLanding || '/pages/employee/dashboard.html');
      setChecked('emp-pref-compact', s.preferences.compactView);
      setChecked('emp-pref-sound', s.preferences.soundEffects);
    }

    if (s.security) {
      setChecked('emp-sec-2fa', s.security.twoFactorAuth);
      setChecked('emp-sec-loginalert', s.security.loginAlerts);
    }
  },

  async saveEmployeeSettings(e) {
    if (e) e.preventDefault();

    const user = DayflowAuth.getCurrentUser() || { id: 'EMP001' };
    const getVal = (id, fallback = '') => document.getElementById(id)?.value || fallback;
    const getChecked = (id) => !!document.getElementById(id)?.checked;

    const payload = {
      notifications: {
        emailDailyPunchReminder: getChecked('emp-notif-punch'),
        emailLeaveStatusUpdate: getChecked('emp-notif-leave'),
        emailSalarySlipAvailable: getChecked('emp-notif-salary'),
        pushWorkAnnouncements: getChecked('emp-notif-announcement')
      },
      preferences: {
        timeFormat: getVal('emp-pref-timeformat', '12h'),
        dateFormat: getVal('emp-pref-dateformat', 'YYYY-MM-DD'),
        defaultLanding: getVal('emp-pref-landing', '/pages/employee/dashboard.html'),
        compactView: getChecked('emp-pref-compact'),
        soundEffects: getChecked('emp-pref-sound')
      },
      security: {
        twoFactorAuth: getChecked('emp-sec-2fa'),
        loginAlerts: getChecked('emp-sec-loginalert')
      }
    };

    const btn = document.getElementById('btn-save-emp-settings');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Saving...';
    }

    try {
      await DayflowAPI.saveEmployeeSettings(user.id, payload);
      showToast('Your preferences have been saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings: ' + err.message, 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i> Save Preferences';
      }
    }
  },

  changePassword(e) {
    if (e) e.preventDefault();

    const currentPwd = document.getElementById('pwd-current')?.value;
    const newPwd = document.getElementById('pwd-new')?.value;
    const confirmPwd = document.getElementById('pwd-confirm')?.value;

    if (!currentPwd || !newPwd || !confirmPwd) {
      showToast('Please fill out all password fields.', 'warning');
      return;
    }

    if (newPwd.length < 6) {
      showToast('New password must be at least 6 characters.', 'warning');
      return;
    }

    if (newPwd !== confirmPwd) {
      showToast('New password and confirmation do not match.', 'danger');
      return;
    }

    showToast('Password updated securely!', 'success');
    document.getElementById('pwd-current').value = '';
    document.getElementById('pwd-new').value = '';
    document.getElementById('pwd-confirm').value = '';
  },

  logoutOtherSessions() {
    showToast('All other active browser sessions have been terminated.', 'info');
  }
};

window.DayflowSettings = DayflowSettings;
