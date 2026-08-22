/**
 * Dayflow HRMS - Admin Leave Approvals Controller
 */

const DayflowApprovals = {
  async init() {
    await this.loadPendingRequests();
    this.setupListeners();
  },

  setupListeners() {
    const filter = document.getElementById('approval-status-filter');
    if (filter) filter.addEventListener('change', () => this.loadPendingRequests());
  },

  async loadPendingRequests() {
    const container = document.getElementById('approvals-list-container');
    if (!container) return;

    const filterVal = document.getElementById('approval-status-filter')?.value || 'Pending';
    const leaves = await DayflowAPI.getLeaves(filterVal === 'All' ? {} : { status: filterVal });

    const countPending = (await DayflowAPI.getLeaves()).filter(l => l.status === 'Pending').length;
    const badgePending = document.getElementById('pending-approval-count');
    if (badgePending) badgePending.textContent = `${countPending} Pending Requests`;

    if (leaves.length === 0) {
      container.innerHTML = `
        <div class="empty-state bg-white rounded-3 border p-5">
          <div class="empty-state-icon mb-2"><i class="bi bi-check2-all text-success"></i></div>
          <div class="empty-state-title">No pending requests</div>
          <div class="empty-state-text">All employee leave applications have been reviewed.</div>
        </div>
      `;
      return;
    }

    let html = '';
    leaves.forEach(l => {
      const isPending = l.status === 'Pending';
      const statusClass = l.status === 'Approved' ? 'badge-approved' : l.status === 'Rejected' ? 'badge-rejected' : 'badge-pending';

      html += `
        <div class="approval-card" id="leave-card-${l.id}">
          <div class="approval-user-info">
            <div class="avatar-circle" style="width: 44px; height: 44px;">${l.employeeName.split(' ').map(n=>n[0]).join('')}</div>
            <div>
              <h6 class="fw-bold text-dark mb-0">${l.employeeName}</h6>
              <div class="text-muted smaller">${l.employeeId} • ${l.department}</div>
            </div>
          </div>

          <div class="approval-details">
            <div class="approval-detail-col">
              <span class="approval-detail-label">Type & Duration</span>
              <span class="approval-detail-val">${l.leaveType} (${l.duration})</span>
            </div>
            <div class="approval-detail-col">
              <span class="approval-detail-label">Dates</span>
              <span class="approval-detail-val">${l.startDate} → ${l.endDate}</span>
            </div>
            <div class="approval-detail-col flex-grow-1">
              <span class="approval-detail-label">Reason</span>
              <span class="approval-detail-val text-truncate" style="max-width: 260px;" title="${l.reason}">${l.reason}</span>
            </div>
            <div class="approval-detail-col">
              <span class="approval-detail-label">Status</span>
              <span class="badge-status ${statusClass} mt-1">${l.status}</span>
            </div>
          </div>

          <div class="approval-actions">
            ${isPending ? `
              <button class="btn btn-outline-df text-danger btn-sm" onclick="DayflowApprovals.openRejectModal('${l.id}', '${l.employeeName}')">
                <i class="bi bi-x-circle"></i> Reject
              </button>
              <button class="btn btn-primary-df btn-sm" onclick="DayflowApprovals.openApproveModal('${l.id}', '${l.employeeName}')">
                <i class="bi bi-check-circle"></i> Approve
              </button>
            ` : `
              <button class="btn btn-outline-df btn-sm" onclick="DayflowLeave.viewDetails('${l.id}')">
                <i class="bi bi-eye"></i> Details
              </button>
            `}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  },

  openApproveModal(id, name) {
    const modalHtml = `
      <div class="modal fade" id="approveModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content modal-content-df">
            <div class="modal-header modal-header-df">
              <h5 class="modal-title fw-bold text-success"><i class="bi bi-check-circle-fill me-2"></i>Approve Leave Request</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body modal-body-df">
              <p>Are you sure you want to approve the leave request submitted by <strong>${name}</strong>?</p>
              <div class="mb-3">
                <label class="form-label-df">Optional Remarks for Employee:</label>
                <input type="text" class="form-control-df" id="approve-comment" value="Approved. Have a great time!" placeholder="Add optional comments...">
              </div>
            </div>
            <div class="modal-footer modal-footer-df">
              <button type="button" class="btn btn-outline-df" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary-df" onclick="DayflowApprovals.confirmApprove('${id}')">Confirm Approval</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('approveModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('approveModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  },

  async confirmApprove(id) {
    const comment = document.getElementById('approve-comment')?.value;
    try {
      await DayflowAPI.approveLeave(id, comment);
      showToast('Leave request approved successfully!', 'success');
      
      const modalEl = document.getElementById('approveModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      bsModal?.hide();

      await this.loadPendingRequests();
    } catch (e) {
      showToast('Failed to approve leave.', 'error');
    }
  },

  openRejectModal(id, name) {
    const modalHtml = `
      <div class="modal fade" id="rejectModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content modal-content-df">
            <div class="modal-header modal-header-df">
              <h5 class="modal-title fw-bold text-danger"><i class="bi bi-x-circle-fill me-2"></i>Reject Leave Request</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body modal-body-df">
              <p>You are declining the leave application from <strong>${name}</strong>.</p>
              <div class="mb-3">
                <label class="form-label-df text-danger">Rejection Reason (Required):</label>
                <textarea class="form-control-df" id="reject-reason-input" rows="3" placeholder="Please provide a clear justification for rejecting this request..."></textarea>
                <div class="invalid-feedback-df d-none" id="reject-reason-error">Rejection reason is mandatory.</div>
              </div>
            </div>
            <div class="modal-footer modal-footer-df">
              <button type="button" class="btn btn-outline-df" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger-df" onclick="DayflowApprovals.confirmReject('${id}')">Reject Request</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('rejectModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('rejectModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  },

  async confirmReject(id) {
    const reason = document.getElementById('reject-reason-input')?.value.trim();
    const errorEl = document.getElementById('reject-reason-error');

    if (!reason) {
      if (errorEl) errorEl.classList.remove('d-none');
      document.getElementById('reject-reason-input')?.classList.add('is-invalid');
      return;
    }

    try {
      await DayflowAPI.rejectLeave(id, reason);
      showToast('Leave request rejected with remarks.', 'info');
      
      const modalEl = document.getElementById('rejectModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      bsModal?.hide();

      await this.loadPendingRequests();
    } catch (e) {
      showToast('Failed to reject leave.', 'error');
    }
  }
};

window.DayflowApprovals = DayflowApprovals;
