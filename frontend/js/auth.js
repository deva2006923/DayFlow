/**
 * Dayflow HRMS - Authentication & Global Navigation Component Manager
 * Ensures all pages render a unified header, sidebar, user state, and role protection.
 * Follows the 2026 SaaS Dashboard Reference (Orange, Pink, Purple, Dark Glass).
 */

const DayflowAuth = {
  getCurrentUser() {
    const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    window.location.href = '/pages/auth/login.html';
  },

  /**
   * Guards pages based on user authentication and role
   * @param {Array<string>} allowedRoles e.g. ['employee', 'hr']
   */
  requireAuth(allowedRoles = ['employee', 'hr']) {
    const user = this.getCurrentUser();
    
    // If not logged in, redirect to login page
    if (!user) {
      window.location.href = '/pages/auth/login.html';
      return null;
    }

    // Role check
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      if (user.role === 'employee') {
        window.location.href = '/pages/employee/dashboard.html';
      } else {
        window.location.href = '/pages/admin/dashboard.html';
      }
      return null;
    }

    return user;
  },

  /**
   * Injects and initializes the shared Topbar and Sidebar into #app-layout
   */
  renderGlobalLayout(activeKey = 'dashboard') {
    const user = this.getCurrentUser() || {
      id: "EMP001",
      name: "Hemnath KK",
      email: "employee@dayflow.com",
      role: "employee",
      designation: "Senior Frontend Engineer",
      avatar: "HK"
    };

    const isHR = user.role === 'hr';

    // Build Sidebar HTML matching reference design
    const sidebarHtml = `
      <aside class="app-sidebar" id="app-sidebar">
        <div class="sidebar-header">
          <a href="${isHR ? '/pages/admin/dashboard.html' : '/pages/employee/dashboard.html'}" class="dayflow-brand d-flex align-items-center">
            <img src="/assets/dayflow-logo.svg" alt="Dayflow HRMS" style="height: 38px; width: auto; max-width: 175px; object-fit: contain;">
          </a>
        </div>

        <div class="sidebar-role-wrapper px-3 pt-3 pb-1">
          <div class="role-pill-card ${isHR ? 'hr' : 'employee'}">
            <i class="bi ${isHR ? 'bi-shield-lock' : 'bi-person-badge'}"></i>
            <span>${isHR ? 'HR Admin Portal' : 'Employee Portal'}</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-title">Main Navigation</div>

          ${isHR ? `
            <a href="/pages/admin/dashboard.html" class="sidebar-link ${activeKey === 'admin-dashboard' || activeKey === 'adm-dashboard' ? 'active' : ''}">
              <i class="bi bi-grid-fill"></i>
              <span>Dashboard</span>
            </a>
            <a href="/pages/admin/employees.html" class="sidebar-link ${activeKey === 'admin-employees' || activeKey === 'adm-employees' ? 'active' : ''}">
              <i class="bi bi-people"></i>
              <span>Employees</span>
            </a>
            <a href="/pages/admin/attendance.html" class="sidebar-link ${activeKey === 'admin-attendance' || activeKey === 'adm-attendance' ? 'active' : ''}">
              <i class="bi bi-calendar-check"></i>
              <span>Attendance</span>
            </a>
            <a href="/pages/admin/leave-approvals.html" class="sidebar-link ${activeKey === 'admin-leaves' || activeKey === 'adm-leaves' || activeKey === 'adm-leave-approvals' ? 'active' : ''}">
              <i class="bi bi-calendar2-range"></i>
              <span>Leave Approvals</span>
            </a>
            <a href="/pages/admin/payroll.html" class="sidebar-link ${activeKey === 'admin-payroll' || activeKey === 'adm-payroll' ? 'active' : ''}">
              <i class="bi bi-credit-card-2-front"></i>
              <span>Payroll</span>
            </a>
            <a href="/pages/admin/reports.html" class="sidebar-link ${activeKey === 'admin-reports' || activeKey === 'adm-reports' ? 'active' : ''}">
              <i class="bi bi-bar-chart-line"></i>
              <span>Reports</span>
            </a>
            <a href="/pages/admin/settings.html" class="sidebar-link ${activeKey === 'admin-settings' || activeKey === 'adm-settings' ? 'active' : ''}">
              <i class="bi bi-gear"></i>
              <span>Settings</span>
            </a>
          ` : `
            <a href="/pages/employee/dashboard.html" class="sidebar-link ${activeKey === 'emp-dashboard' ? 'active' : ''}">
              <i class="bi bi-grid-fill"></i>
              <span>Dashboard</span>
            </a>
            <a href="/pages/employee/profile.html" class="sidebar-link ${activeKey === 'emp-profile' ? 'active' : ''}">
              <i class="bi bi-person"></i>
              <span>My Profile</span>
            </a>
            <a href="/pages/employee/attendance.html" class="sidebar-link ${activeKey === 'emp-attendance' ? 'active' : ''}">
              <i class="bi bi-calendar-check"></i>
              <span>Attendance</span>
            </a>
            <a href="/pages/employee/leave.html" class="sidebar-link ${activeKey === 'emp-leave' ? 'active' : ''}">
              <i class="bi bi-calendar2-week"></i>
              <span>Leave</span>
            </a>
            <a href="/pages/employee/payroll.html" class="sidebar-link ${activeKey === 'emp-payroll' ? 'active' : ''}">
              <i class="bi bi-credit-card-2-front"></i>
              <span>Payroll</span>
            </a>
            <a href="/pages/employee/reports.html" class="sidebar-link ${activeKey === 'emp-reports' ? 'active' : ''}">
              <i class="bi bi-bar-chart-line"></i>
              <span>Reports</span>
            </a>
            <a href="/pages/employee/settings.html" class="sidebar-link ${activeKey === 'emp-settings' ? 'active' : ''}">
              <i class="bi bi-gear"></i>
              <span>Settings</span>
            </a>
          `}

          <div class="my-2 border-top" style="border-color: rgba(255, 255, 255, 0.06) !important;"></div>
          
          <a href="javascript:void(0)" onclick="DayflowAuth.showHelpModal()" class="sidebar-link">
            <i class="bi bi-question-circle"></i>
            <span>Help & Docs</span>
          </a>
          <a href="javascript:void(0)" onclick="DayflowAuth.logout()" class="sidebar-link logout-link">
            <i class="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </a>

          <!-- Need Assistance Card at Bottom of Sidebar -->
          <div class="sidebar-support-card mt-auto mb-2">
            <div class="support-card-dots"></div>
            <div class="support-card-title">Need Assistance?</div>
            <div class="support-card-text">Our support team is here to help you 24/7</div>
            <button type="button" class="btn-support-contact" onclick="DayflowAuth.showHelpModal()">
              <i class="bi bi-headset me-1"></i> Contact Support
            </button>
          </div>
        </nav>
      </aside>
      <div class="sidebar-backdrop" id="sidebar-backdrop" onclick="DayflowAuth.toggleSidebar(false)"></div>
    `;

    // Build Topbar HTML matching reference design
    const topbarHtml = `
      <header class="app-topbar">
        <div class="topbar-left">
          <button class="btn-sidebar-toggle" onclick="DayflowAuth.toggleSidebar()" aria-label="Toggle Navigation Menu">
            <i class="bi bi-list"></i>
          </button>
          <div class="topbar-search-wrapper d-none d-md-block">
            <i class="bi bi-search topbar-search-icon"></i>
            <input type="text" class="topbar-search-input" placeholder="Search employees, leaves, payroll..." />
          </div>
        </div>

        <div class="topbar-right">
          <!-- Theme Toggle Switch -->
          <div class="theme-toggle-wrapper d-flex align-items-center">
            <button class="theme-toggle-btn" id="themeToggleBtn" type="button" onclick="window.DayflowTheme ? window.DayflowTheme.toggle() : null" aria-label="Toggle Light/Dark Theme" title="Toggle Light/Dark Theme">
              <span class="theme-toggle-track">
                <span class="theme-toggle-icon icon-sun"><i class="bi bi-sun-fill"></i></span>
                <span class="theme-toggle-icon icon-moon"><i class="bi bi-moon-stars-fill"></i></span>
                <span class="theme-toggle-thumb"></span>
              </span>
            </button>
          </div>

          <!-- Notification Dropdown -->
          <div class="dropdown">
            <button class="notif-btn" type="button" id="notifDropdownBtn" data-bs-toggle="dropdown" aria-expanded="false" title="View Notifications">
              <i class="bi bi-bell"></i>
              <span class="notif-badge-count" id="notif-badge-count">2</span>
            </button>
            <div class="dropdown-menu dropdown-menu-end notif-dropdown-menu" aria-labelledby="notifDropdownBtn" id="notif-dropdown-list">
              <!-- Populated by notifications.js -->
            </div>
          </div>

          <!-- User Menu Dropdown -->
          <div class="dropdown">
            <button class="user-menu-btn" type="button" id="userMenuBtn" data-bs-toggle="dropdown" aria-expanded="false">
              <div class="avatar-circle">${user.avatar || 'DF'}</div>
              <div class="user-meta">
                <div class="user-name">${user.name || 'User'}</div>
                <div class="user-role-text">${isHR ? 'HR Officer' : (user.designation || 'Employee')}</div>
              </div>
              <i class="bi bi-chevron-down text-muted small ms-1"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-lg" aria-labelledby="userMenuBtn" style="background: var(--surface); border: 1px solid var(--border);">
              <li class="px-3 py-2 border-bottom" style="border-color: var(--border) !important;">
                <div class="fw-bold small text-light">${user.name}</div>
                <div class="text-muted smaller">${user.email}</div>
              </li>
              ${!isHR ? `
                <li><a class="dropdown-item py-2 text-secondary" href="/pages/employee/profile.html"><i class="bi bi-person me-2"></i>My Profile</a></li>
                <li><a class="dropdown-item py-2 text-secondary" href="/pages/employee/attendance.html"><i class="bi bi-calendar-check me-2"></i>Attendance</a></li>
                <li><a class="dropdown-item py-2 text-secondary" href="/pages/employee/reports.html"><i class="bi bi-bar-chart-line me-2"></i>My Reports</a></li>
                <li><a class="dropdown-item py-2 text-secondary" href="/pages/employee/settings.html"><i class="bi bi-gear me-2"></i>Settings</a></li>
              ` : `
                <li><a class="dropdown-item py-2 text-secondary" href="/pages/admin/employees.html"><i class="bi bi-people me-2"></i>Manage Employees</a></li>
                <li><a class="dropdown-item py-2 text-secondary" href="/pages/admin/reports.html"><i class="bi bi-bar-chart me-2"></i>System Reports</a></li>
                <li><a class="dropdown-item py-2 text-secondary" href="/pages/admin/settings.html"><i class="bi bi-gear me-2"></i>System Settings</a></li>
              `}
              <li><hr class="dropdown-divider" style="border-color: var(--border) !important;"></li>
              <li>
                <a class="dropdown-item text-danger py-2" href="javascript:void(0)" onclick="DayflowAuth.logout()">
                  <i class="bi bi-box-arrow-right me-2"></i>Sign Out
                </a>
              </li>
            </ul>
          </div>
        </div>
      </header>
    `;

    // Render into layout elements if placeholders exist
    const sidebarContainer = document.getElementById('sidebar-container');
    const topbarContainer = document.getElementById('topbar-container');

    if (sidebarContainer) sidebarContainer.innerHTML = sidebarHtml;
    if (topbarContainer) topbarContainer.innerHTML = topbarHtml;

    // Initialize notification menu
    if (window.DayflowNotifications) {
      window.DayflowNotifications.renderDropdown();
    }

    // Refresh theme toggle state
    if (window.DayflowTheme) {
      window.DayflowTheme.init();
    }
  },

  toggleSidebar(forceState) {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (!sidebar) return;

    if (forceState !== undefined) {
      if (forceState) {
        sidebar.classList.add('show');
        backdrop?.classList.add('show');
      } else {
        sidebar.classList.remove('show');
        backdrop?.classList.remove('show');
      }
    } else {
      sidebar.classList.toggle('show');
      backdrop?.classList.toggle('show');
    }
  },

  async quickSwitchRole() {
    const user = this.getCurrentUser();
    if (user && user.role === 'hr') {
      // Switch to employee
      await DayflowAPI.login("arjun@dayflow.com", "pass123");
      window.location.href = '/pages/employee/dashboard.html';
    } else {
      // Switch to HR
      await DayflowAPI.login("admin@dayflow.com", "admin123");
      window.location.href = '/pages/admin/dashboard.html';
    }
  },

  showHelpModal() {
    const modalHtml = `
      <div class="modal fade" id="helpModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title fw-bold text-light"><i class="bi bi-info-circle-fill text-primary me-2"></i>Dayflow HRMS Guide</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="mb-3"><strong>Tagline:</strong> "Every workday, perfectly aligned."</p>
              <div class="p-3 bg-dark rounded mb-3 border" style="border-color: var(--border) !important;">
                <h6 class="fw-bold mb-2 text-light">Demo Roles (after running <code>python seed.py</code>):</h6>
                <div class="small mb-1 text-secondary"><strong>HR Admin:</strong> <code>admin@dayflow.com</code> / <code>admin123</code></div>
                <div class="small text-secondary"><strong>Employee:</strong> <code>arjun@dayflow.com</code> / <code>pass123</code></div>
              </div>
              <p class="small text-muted mb-0">This frontend is connected to a live Flask + MongoDB backend.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary-df" data-bs-dismiss="modal">Got it</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing help modal if any
    const existing = document.getElementById('helpModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('helpModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
};

window.DayflowAuth = DayflowAuth;
