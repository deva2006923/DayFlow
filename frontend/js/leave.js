/**
 * Dayflow HRMS - Leave Management Controller
 */

const DayflowLeave = {
  async init() {
    this.setupDatePickers();
    await this.renderLeaveRequests();
  },

  setupDatePickers() {
    const startInput = document.getElementById('leave-start-date');
    const endInput = document.getElementById('leave-end-date');
    if (!startInput || !endInput) return;

    const todayStr = new Date().toISOString().split('T')[0];
    startInput.min = todayStr;
    endInput.min = todayStr;

    startInput.addEventListener('change', () => {
      endInput.min = startInput.value;
      if (endInput.value && endInput.value < startInput.value) {
        endInput.value = startInput.value;
      }
      this.calculateDuration();
    });

    endInput.addEventListener('change', () => {
      this.calculateDuration();
    });
  },

  calculateDuration() {
    const startVal = document.getElementById('leave-start-date')?.value;
    const endVal = document.getElementById('leave-end-date')?.value;
    const durationEl = document.getElementById('leave-calculated-duration');

    if (startVal && endVal && durationEl) {
      const d1 = new Date(startVal);
      const d2 = new Date(endVal);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      durationEl.textContent = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    }
  },

  async handleApplyLeave(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-leave');
    const form = document.getElementById('applyLeaveForm');
    
    const leaveType = document.getElementById('leave-type').value;
    const startDate = document.getElementById('leave-start-date').value;
    const endDate = document.getElementById('leave-end-date').value;
    const reason = document.getElementById('leave-reason').value.trim();

    // Validation
    let isValid = true;

    if (!leaveType) {
      document.getElementById('leave-type').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('leave-type').classList.remove('is-invalid');
    }

    if (!startDate) {
      document.getElementById('leave-start-date').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('leave-start-date').classList.remove('is-invalid');
    }

    if (!endDate || endDate < startDate) {
      document.getElementById('leave-end-date').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('leave-end-date').classList.remove('is-invalid');
    }

    if (!reason || reason.length < 5) {
      document.getElementById('leave-reason').classList.add('is-invalid');
      isValid = false;
    } else {
      document.getElementById('leave-reason').classList.remove('is-invalid');
    }

    if (!isValid) {
      showToast('Please complete all required fields with valid dates.', 'warning');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Submitting...';
    }

    try {
      const user = DayflowAuth.getCurrentUser() || { id: 'EMP001', name: 'Hemnath KK', department: 'Engineering' };
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diffDays = Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      const duration = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;

      await DayflowAPI.applyLeave({
        employeeId: user.id,
        employeeName: user.name,
        department: user.department,
        leaveType,
        startDate,
        endDate,
        duration,
        reason
      });

      showToast('Leave request submitted successfully for approval!', 'success');
      form.reset();
      this.calculateDuration();
      await this.renderLeaveRequests();
    } catch (err) {
      showToast('Unable to submit leave request. Please try again.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send-fill me-1"></i> Submit Request';
      }
    }
  },

  async renderLeaveRequests() {
    const tbody = document.getElementById('leave-requests-tbody');
    if (!tbody) return;

    const user = DayflowAuth.getCurrentUser();
    const leaves = await DayflowAPI.getLeaves({ employeeId: user?.id || 'EMP001' });

    if (leaves.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-5">
            <div class="empty-state p-0">
              <div class="empty-state-icon mb-2"><i class="bi bi-calendar2-range"></i></div>
              <div class="empty-state-title">No leave requests yet</div>
              <div class="empty-state-text">Your submitted leave applications will appear here.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let rows = '';
    leaves.forEach(l => {
      const statusClass = l.status === 'Approved' ? 'badge-approved' : l.status === 'Rejected' ? 'badge-rejected' : 'badge-pending';
      const icon = l.status === 'Approved' ? 'bi-check-circle-fill' : l.status === 'Rejected' ? 'bi-x-circle-fill' : 'bi-hourglass-split';

      rows += `
        <tr>
          <td><span class="fw-bold text-dark">${l.leaveType}</span></td>
          <td>${l.startDate}</td>
          <td>${l.endDate}</td>
          <td>${l.duration}</td>
          <td><div class="text-truncate" style="max-width: 220px;" title="${l.reason}">${l.reason}</div></td>
          <td><span class="badge-status ${statusClass}"><i class="bi ${icon}"></i> ${l.status}</span></td>
          <td>
            <button class="btn btn-outline-df btn-sm" onclick="DayflowLeave.viewDetails('${l.id}')">
              <i class="bi bi-eye"></i> Details
            </button>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;
  },

  async viewDetails(id) {
    const leaves = await DayflowAPI.getLeaves();
    const leave = leaves.find(l => l.id === id);
    if (!leave) return;

    const statusBadge = leave.status === 'Approved' ? 'badge-approved' : leave.status === 'Rejected' ? 'badge-rejected' : 'badge-pending';

    const modalHtml = `
      <div class="modal fade" id="leaveDetailModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content modal-content-df">
            <div class="modal-header modal-header-df">
              <h5 class="modal-title fw-bold text-dark">Leave Application Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body modal-body-df">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted small">Application ID: <strong>${leave.id}</strong></span>
                <span class="badge-status ${statusBadge}">${leave.status}</span>
              </div>
              <div class="p-3 bg-light rounded-3 mb-3">
                <div class="row g-2 small">
                  <div class="col-6"><strong>Leave Type:</strong> ${leave.leaveType}</div>
                  <div class="col-6"><strong>Duration:</strong> ${leave.duration}</div>
                  <div class="col-6"><strong>Start Date:</strong> ${leave.startDate}</div>
                  <div class="col-6"><strong>End Date:</strong> ${leave.endDate}</div>
                  <div class="col-12 mt-2"><strong>Applied On:</strong> ${leave.appliedOn || 'Recent'}</div>
                </div>
              </div>
              <div class="mb-3">
                <label class="fw-bold small text-muted text-uppercase">Reason for Leave:</label>
                <p class="text-dark bg-white border p-2 rounded mb-0 mt-1 small">${leave.reason}</p>
              </div>
              ${leave.comments ? `
                <div class="mb-0">
                  <label class="fw-bold small text-muted text-uppercase">HR Officer Remarks:</label>
                  <p class="text-dark bg-light border p-2 rounded mb-0 mt-1 small">${leave.comments}</p>
                </div>
              ` : ''}
            </div>
            <div class="modal-footer modal-footer-df">
              <button type="button" class="btn btn-outline-df" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('leaveDetailModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('leaveDetailModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }
};

window.DayflowLeave = DayflowLeave;
