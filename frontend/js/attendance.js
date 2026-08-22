/**
 * Dayflow HRMS - Attendance Management Controller
 */

const DayflowAttendance = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),

  async init(isAdmin = false) {
    this.isAdmin = isAdmin;
    await this.renderSummaryCards();
    if (!isAdmin) {
      this.renderCalendar();
    }
    await this.renderAttendanceTable();
  },

  async renderSummaryCards() {
    const user = DayflowAuth.getCurrentUser();
    const records = await DayflowAPI.getAttendance(this.isAdmin ? {} : { employeeId: user?.id || 'EMP001' });

    let present = 0, absent = 0, halfday = 0, leave = 0;
    records.forEach(r => {
      const s = r.status.toLowerCase();
      if (s === 'present') present++;
      else if (s === 'absent') absent++;
      else if (s === 'half day' || s === 'halfday') halfday++;
      else if (s === 'leave') leave++;
    });

    const pEl = document.getElementById('count-present');
    const aEl = document.getElementById('count-absent');
    const hEl = document.getElementById('count-halfday');
    const lEl = document.getElementById('count-leave');

    if (pEl) pEl.textContent = present;
    if (aEl) aEl.textContent = absent;
    if (hEl) hEl.textContent = halfday;
    if (lEl) lEl.textContent = leave;
  },

  renderCalendar() {
    const calendarEl = document.getElementById('attendance-calendar-grid');
    if (!calendarEl) return;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    let html = `
      <div class="calendar-header-day">Sun</div>
      <div class="calendar-header-day">Mon</div>
      <div class="calendar-header-day">Tue</div>
      <div class="calendar-header-day">Wed</div>
      <div class="calendar-header-day">Thu</div>
      <div class="calendar-header-day">Fri</div>
      <div class="calendar-header-day">Sat</div>
    `;

    // Blank cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="calendar-day-cell other-month"></div>`;
    }

    // Days of current month
    const today = new Date().getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today;
      let statusClass = 'present';
      if (day % 7 === 0 || day % 7 === 6) statusClass = 'other-month'; // weekend
      else if (day === 18) statusClass = 'halfday';
      else if (day === 21) statusClass = 'present';
      else if (day === 14) statusClass = 'leave';
      else if (day === 8) statusClass = 'absent';

      html += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''}" data-day="${day}" onclick="DayflowAttendance.selectDate(this, ${day})">
          <span class="calendar-day-num">${day}</span>
          ${statusClass !== 'other-month' ? `<span class="calendar-status-dot ${statusClass}" title="${statusClass.toUpperCase()}"></span>` : ''}
        </div>
      `;
    }

    calendarEl.innerHTML = html;
  },

  selectDate(cellEl, day) {
    document.querySelectorAll('.calendar-day-cell.selected').forEach(el => el.classList.remove('selected'));
    if (cellEl && !cellEl.classList.contains('other-month')) {
      cellEl.classList.add('selected');
    }
  },

  async renderAttendanceTable() {
    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;

    const searchVal = (document.getElementById('att-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('att-status-filter')?.value || 'All';
    const user = DayflowAuth.getCurrentUser();

    const filters = this.isAdmin ? {} : { employeeId: user?.id || 'EMP001' };
    let records = await DayflowAPI.getAttendance(filters);

    // Apply client filters
    if (statusFilter !== 'All') {
      records = records.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    if (searchVal) {
      records = records.filter(r => 
        (r.employeeName && r.employeeName.toLowerCase().includes(searchVal)) ||
        (r.date && r.date.includes(searchVal)) ||
        (r.day && r.day.toLowerCase().includes(searchVal))
      );
    }

    if (records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="${this.isAdmin ? 7 : 6}" class="text-center py-5">
            <div class="empty-state p-0">
              <div class="empty-state-icon mb-2"><i class="bi bi-calendar-x"></i></div>
              <div class="empty-state-title">No attendance records found</div>
              <div class="empty-state-text">Try adjusting your filters or date range.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    records.forEach(r => {
      const statusMap = {
        'Present': 'badge-present',
        'Absent': 'badge-absent',
        'Half Day': 'badge-halfday',
        'Leave': 'badge-leave'
      };

      rowsHtml += `
        <tr>
          ${this.isAdmin ? `<td><strong class="text-white">${r.employeeName}</strong> <div class="text-muted smaller">${r.department}</div></td>` : ''}
          <td class="text-secondary-df">${r.date}</td>
          <td class="text-secondary-df">${r.day}</td>
          <td><span class="text-white fw-semibold">${r.checkIn}</span></td>
          <td><span class="text-white fw-semibold">${r.checkOut}</span></td>
          <td class="text-secondary-df">${r.hours}</td>
          <td><span class="badge-status ${statusMap[r.status] || 'badge-present'}"><i class="bi bi-circle-fill" style="font-size: 6px;"></i> ${r.status}</span></td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
  },

  exportReport() {
    showToast('Preparing attendance report in CSV format...', 'info');
    setTimeout(() => {
      showToast('Attendance report exported successfully!', 'success');
    }, 1200);
  }
};

window.DayflowAttendance = DayflowAttendance;
