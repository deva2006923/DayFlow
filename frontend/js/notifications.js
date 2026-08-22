/**
 * Dayflow HRMS - Notification & Toast System
 */

const DayflowNotifications = {
  container: null,

  initToastContainer() {
    if (!this.container) {
      let el = document.getElementById('df-toast-container');
      if (!el) {
        el = document.createElement('div');
        el.id = 'df-toast-container';
        el.className = 'toast-container-custom';
        document.body.appendChild(el);
      }
      this.container = el;
    }
  },

  showToast(message, type = 'success', title = '') {
    this.initToastContainer();

    const titles = {
      success: title || 'Success',
      error: title || 'Error',
      warning: title || 'Attention',
      info: title || 'Information'
    };

    const icons = {
      success: 'bi-check-circle-fill',
      error: 'bi-exclamation-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };

    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
      <div class="df-toast ${type}" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="df-toast-icon">
          <i class="bi ${icons[type] || icons.info}"></i>
        </div>
        <div class="df-toast-body">
          <div class="df-toast-title">${titles[type]}</div>
          <div class="df-toast-text">${message}</div>
        </div>
        <button class="df-toast-close" onclick="document.getElementById('${toastId}').remove()" aria-label="Close">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;

    this.container.insertAdjacentHTML('beforeend', toastHtml);

    // Auto remove after 4.5 seconds
    setTimeout(() => {
      const toastEl = document.getElementById(toastId);
      if (toastEl) {
        toastEl.style.opacity = '0';
        setTimeout(() => toastEl.remove(), 300);
      }
    }, 4500);
  },

  async renderDropdown() {
    const listEl = document.getElementById('notif-dropdown-list');
    const badgeEl = document.getElementById('notif-badge-count');
    if (!listEl) return;

    const notifs = await DayflowAPI.getNotifications();
    const unreadCount = notifs.filter(n => n.unread).length;

    if (badgeEl) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    if (notifs.length === 0) {
      listEl.innerHTML = `
        <div class="notif-header">
          <span class="fw-bold small text-dark">Notifications</span>
        </div>
        <div class="p-4 text-center">
          <i class="bi bi-bell text-muted fs-3 d-block mb-2"></i>
          <div class="fw-bold small text-dark">You're all caught up</div>
          <div class="smaller text-muted">No new notifications</div>
        </div>
      `;
      return;
    }

    let itemsHtml = '';
    notifs.forEach(n => {
      const iconMap = {
        leave: 'bi-calendar-event-fill text-info',
        payroll: 'bi-cash-stack text-success',
        attendance: 'bi-clock-history text-warning',
        profile: 'bi-person-check-fill text-primary'
      };

      itemsHtml += `
        <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="DayflowNotifications.handleItemClick('${n.id}')">
          <div class="notif-icon ${n.type}">
            <i class="bi ${iconMap[n.type] || 'bi-info-circle'}"></i>
          </div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="smaller text-muted mt-1">${n.desc}</div>
            <div class="notif-time">${n.time}</div>
          </div>
        </div>
      `;
    });

    listEl.innerHTML = `
      <div class="notif-header">
        <span class="fw-bold small text-dark">Notifications</span>
        ${unreadCount > 0 ? `
          <button class="btn btn-link p-0 text-primary small text-decoration-none fw-semibold" onclick="DayflowNotifications.markAllRead(event)">
            Mark all read
          </button>
        ` : ''}
      </div>
      <div class="notif-list">
        ${itemsHtml}
      </div>
    `;
  },

  async markAllRead(e) {
    if (e) e.stopPropagation();
    await DayflowAPI.markNotificationsRead();
    this.renderDropdown();
    this.showToast("All notifications marked as read", "info");
  },

  handleItemClick(id) {
    this.showToast("Notification acknowledged", "info");
  }
};

window.DayflowNotifications = DayflowNotifications;
window.showToast = (msg, type, title) => DayflowNotifications.showToast(msg, type, title);
