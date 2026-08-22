/**
 * Dayflow HRMS - Admin Employee Management Controller
 */

const DayflowEmployees = {
  employees: [],

  async init() {
    await this.loadEmployees();
    this.setupListeners();
  },

  setupListeners() {
    const searchInput = document.getElementById('emp-search-input');
    const deptFilter = document.getElementById('emp-dept-filter');
    const statusFilter = document.getElementById('emp-status-filter');

    if (searchInput) searchInput.addEventListener('input', () => this.filterAndRender());
    if (deptFilter) deptFilter.addEventListener('change', () => this.filterAndRender());
    if (statusFilter) statusFilter.addEventListener('change', () => this.filterAndRender());
  },

  async loadEmployees() {
    this.employees = await DayflowAPI.getEmployees();
    this.filterAndRender();
  },

  filterAndRender() {
    const tbody = document.getElementById('employees-table-tbody');
    if (!tbody) return;

    const searchVal = (document.getElementById('emp-search-input')?.value || '').toLowerCase();
    const deptVal = document.getElementById('emp-dept-filter')?.value || 'All';
    const statusVal = document.getElementById('emp-status-filter')?.value || 'All';

    let filtered = this.employees;

    if (deptVal !== 'All') {
      filtered = filtered.filter(e => e.department.toLowerCase() === deptVal.toLowerCase());
    }

    if (statusVal !== 'All') {
      filtered = filtered.filter(e => e.status.toLowerCase() === statusVal.toLowerCase());
    }

    if (searchVal) {
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(searchVal) ||
        e.id.toLowerCase().includes(searchVal) ||
        e.email.toLowerCase().includes(searchVal) ||
        e.designation.toLowerCase().includes(searchVal)
      );
    }

    const countEl = document.getElementById('emp-total-count');
    if (countEl) countEl.textContent = `Showing ${filtered.length} of ${this.employees.length} employees`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5">
            <div class="empty-state p-0">
              <div class="empty-state-icon mb-2"><i class="bi bi-people"></i></div>
              <div class="empty-state-title">No employees found</div>
              <div class="empty-state-text">No employee matching the search or filter criteria was found.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    let rows = '';
    filtered.forEach(emp => {
      rows += `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="avatar-circle" style="width: 34px; height: 34px; font-size: 0.8rem; background: ${emp.avatarBg || '#4F46E5'}">
                ${emp.avatar || 'DF'}
              </div>
              <div>
                <span class="fw-bold text-dark">${emp.name}</span>
                <div class="text-muted smaller">${emp.email}</div>
              </div>
            </div>
          </td>
          <td><span class="badge bg-light text-dark border">${emp.id}</span></td>
          <td>${emp.department}</td>
          <td>${emp.designation}</td>
          <td><span class="badge-status ${emp.status === 'Active' ? 'badge-present' : 'badge-absent'}"><i class="bi bi-circle-fill" style="font-size: 6px;"></i> ${emp.status}</span></td>
          <td>${emp.joiningDate}</td>
          <td>
            <div class="btn-group">
              <button class="btn btn-outline-df btn-sm" onclick="DayflowEmployees.viewEmployee('${emp.id}')" title="View Profile">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-df btn-sm text-primary" onclick="DayflowEmployees.editEmployee('${emp.id}')" title="Edit Employee">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-outline-df btn-sm text-danger" onclick="DayflowEmployees.confirmDelete('${emp.id}', '${emp.name}')" title="Delete Employee">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;
  },

  async handleAddEmployee(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-add-emp');
    
    const name = document.getElementById('add-emp-name').value.trim();
    const email = document.getElementById('add-emp-email').value.trim();
    const department = document.getElementById('add-emp-dept').value;
    const designation = document.getElementById('add-emp-desig').value.trim();
    const phone = document.getElementById('add-emp-phone').value.trim();
    const joiningDate = document.getElementById('add-emp-date').value;

    if (!name || !email || !department || !designation) {
      showToast('Please fill all mandatory fields.', 'warning');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Adding...';
    }

    try {
      await DayflowAPI.createEmployee({
        name, email, department, designation, phone, joiningDate
      });

      showToast(`Employee "${name}" created successfully!`, 'success');
      document.getElementById('addEmployeeForm').reset();
      
      const modalEl = document.getElementById('addEmployeeModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();

      await this.loadEmployees();
    } catch (err) {
      showToast('Failed to add employee.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Add Employee';
      }
    }
  },

  async viewEmployee(id) {
    const emp = await DayflowAPI.getEmployee(id);
    if (!emp) return;

    const modalHtml = `
      <div class="modal fade" id="viewEmpModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content modal-content-df">
            <div class="modal-header modal-header-df">
              <h5 class="modal-title fw-bold text-dark">Employee Information</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body modal-body-df text-center">
              <div class="avatar-circle mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.5rem; background: ${emp.avatarBg || '#4F46E5'}">${emp.avatar}</div>
              <h5 class="fw-bold text-dark mb-1">${emp.name}</h5>
              <p class="text-muted small mb-3">${emp.designation} • ${emp.department}</p>
              
              <div class="text-start bg-light p-3 rounded-3 small">
                <div class="row g-2">
                  <div class="col-6"><strong>Employee ID:</strong> ${emp.id}</div>
                  <div class="col-6"><strong>Status:</strong> <span class="badge bg-success">${emp.status}</span></div>
                  <div class="col-12"><strong>Email:</strong> ${emp.email}</div>
                  <div class="col-12"><strong>Phone:</strong> ${emp.phone || '-'}</div>
                  <div class="col-12"><strong>Address:</strong> ${emp.address || '-'}</div>
                  <div class="col-12"><strong>Joining Date:</strong> ${emp.joiningDate}</div>
                </div>
              </div>
            </div>
            <div class="modal-footer modal-footer-df">
              <button type="button" class="btn btn-outline-df" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('viewEmpModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('viewEmpModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  },

  async editEmployee(id) {
    const emp = await DayflowAPI.getEmployee(id);
    if (!emp) return;

    document.getElementById('edit-emp-id-val').value = emp.id;
    document.getElementById('edit-emp-name').value = emp.name;
    document.getElementById('edit-emp-email').value = emp.email;
    document.getElementById('edit-emp-dept').value = emp.department;
    document.getElementById('edit-emp-desig').value = emp.designation;
    document.getElementById('edit-emp-status').value = emp.status;
    document.getElementById('edit-emp-phone').value = emp.phone || '';

    const modalEl = document.getElementById('editEmployeeModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  },

  async handleSaveEditEmployee(e) {
    e.preventDefault();
    const id = document.getElementById('edit-emp-id-val').value;
    const btn = document.getElementById('btn-save-edit-emp');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
    }

    try {
      const data = {
        name: document.getElementById('edit-emp-name').value.trim(),
        email: document.getElementById('edit-emp-email').value.trim(),
        department: document.getElementById('edit-emp-dept').value,
        designation: document.getElementById('edit-emp-desig').value.trim(),
        status: document.getElementById('edit-emp-status').value,
        phone: document.getElementById('edit-emp-phone').value.trim()
      };

      await DayflowAPI.updateEmployee(id, data);
      showToast(`Employee "${data.name}" updated successfully!`, 'success');

      const modalEl = document.getElementById('editEmployeeModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();

      await this.loadEmployees();
    } catch (err) {
      showToast('Failed to update employee details.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
      }
    }
  },

  confirmDelete(id, name) {
    const modalHtml = `
      <div class="modal fade" id="deleteEmpModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content modal-content-df">
            <div class="modal-header modal-header-df">
              <h5 class="modal-title fw-bold text-danger"><i class="bi bi-trash3-fill me-2"></i>Delete Employee Record</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body modal-body-df">
              <p class="mb-2">Are you sure you want to delete <strong>${name} (${id})</strong> from Dayflow?</p>
              <p class="small text-muted mb-0">This action cannot be undone and will remove associated attendance and profile history.</p>
            </div>
            <div class="modal-footer modal-footer-df">
              <button type="button" class="btn btn-outline-df" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger-df" onclick="DayflowEmployees.performDelete('${id}')">Delete Record</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('deleteEmpModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('deleteEmpModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  },

  async performDelete(id) {
    try {
      await DayflowAPI.deleteEmployee(id);
      showToast('Employee successfully removed.', 'info');
      
      const modalEl = document.getElementById('deleteEmpModal');
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      bsModal?.hide();

      await this.loadEmployees();
    } catch (err) {
      showToast('Unable to delete employee.', 'error');
    }
  }
};

window.DayflowEmployees = DayflowEmployees;
