/**
 * Dayflow HRMS - Employee Profile Controller
 */

const DayflowProfile = {
  async init() {
    const user = DayflowAuth.getCurrentUser();
    const empId = user ? user.id : null;
    await this.loadProfileData(empId);
  },

  async loadProfileData(empId) {
    // Always resolve the authenticated user from /api/users/me — never fall
    // back to a hardcoded/demo employee for a logged-in session.
    let emp;
    try {
      emp = await DayflowAPI.getEmployee(empId);
    } catch (e) {
      console.error('[profile] Failed to load authenticated user:', e);
      showToast('Unable to load your profile. Please try again.', 'error');
      return;
    }
    if (!emp) return;

    this.renderProfile(emp);

    // Payroll is fetched separately so a missing payroll record (404) never
    // blocks the profile itself from rendering.
    try {
      const payroll = await DayflowAPI.getPayroll(empId);
      this.renderPayroll(payroll);
    } catch (e) {
      console.error('[profile] Failed to load payroll:', e);
      this.renderPayroll(null);
    }

    // Documents + edit-modal prefill also depend only on emp, not payroll.
    this.renderDocuments(emp);
  },

  renderProfile(emp) {
    // Header Info
    const avatarEl = document.getElementById('prof-avatar');
    const nameEl = document.getElementById('prof-name');
    const roleEl = document.getElementById('prof-role');
    const idEl = document.getElementById('prof-emp-id');
    const deptEl = document.getElementById('prof-dept');

    if (avatarEl) avatarEl.textContent = emp.avatar || 'DF';
    if (nameEl) nameEl.textContent = emp.name;
    if (roleEl) roleEl.textContent = emp.designation;
    // Show the HR-facing employeeId (e.g. "EMP004"), not the internal MongoDB id.
    if (idEl) idEl.textContent = emp.employeeId || emp.id;
    if (deptEl) deptEl.textContent = emp.department;

    // Personal Details
    this.setText('p-fullname', emp.name);
    this.setText('p-email', emp.email);
    this.setText('p-phone', emp.phone);
    this.setText('p-address', emp.address);

    // Job Details
    this.setText('j-empid', emp.employeeId || emp.id);
    this.setText('j-dept', emp.department);
    this.setText('j-desig', emp.designation);
    this.setText('j-joining', emp.joiningDate);
    this.setText('j-status', emp.status);

    // Pre-populate edit modal
    const editPhone = document.getElementById('edit-profile-phone');
    const editAddress = document.getElementById('edit-profile-address');
    if (editPhone) editPhone.value = emp.phone || '';
    if (editAddress) editAddress.value = emp.address || '';
  },

  renderPayroll(payroll) {
    if (payroll) {
      this.setText('s-basic', `₹${payroll.basicSalary.toLocaleString()}`);
      this.setText('s-allowances', `₹${(payroll.hra + payroll.specialAllowance + payroll.conveyance).toLocaleString()}`);
      this.setText('s-deductions', `₹${payroll.totalDeductions.toLocaleString()}`);
      this.setText('s-net', `₹${payroll.netSalary.toLocaleString()}`);
    } else {
      // Safe empty state instead of leaving stale/hardcoded placeholder values.
      this.setText('s-basic', 'Payroll information unavailable');
      this.setText('s-allowances', '-');
      this.setText('s-deductions', '-');
      this.setText('s-net', '-');
    }
  },

  renderDocuments(emp) {
    const docsContainer = document.getElementById('documents-container');
    if (docsContainer && emp.documents) {
      let docHtml = '';
      emp.documents.forEach(doc => {
        docHtml += `
          <div class="col-md-6 mb-3">
            <div class="doc-item-card">
              <div class="doc-meta">
                <div class="doc-icon-badge"><i class="bi bi-file-earmark-pdf"></i></div>
                <div>
                  <div class="doc-name">${doc.name}</div>
                  <div class="doc-size">${doc.size} • Uploaded ${doc.date}</div>
                </div>
              </div>
              <button class="btn btn-outline-df btn-sm" onclick="DayflowProfile.downloadDoc('${doc.name}')" title="Download Document">
                <i class="bi bi-download"></i>
              </button>
            </div>
          </div>
        `;
      });
      docsContainer.innerHTML = docHtml;
    }
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '-';
  },

  async handleSaveProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving...';
    }

    const phone = document.getElementById('edit-profile-phone').value.trim();
    const address = document.getElementById('edit-profile-address').value.trim();

    if (!phone || !address) {
      showToast('Please fill in all editable profile fields.', 'warning');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
      }
      return;
    }

    try {
      const user = DayflowAuth.getCurrentUser();
      const updated = await DayflowAPI.updateEmployee(user.id, { phone, address });
      showToast('Profile information successfully updated!', 'success');
      
      // Close modal
      const modalEl = document.getElementById('editProfileModal');
      if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        bsModal?.hide();
      }

      await this.loadProfileData(user.id);
    } catch (err) {
      showToast('Unable to update profile. Please try again.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Save Changes';
      }
    }
  },

  downloadDoc(name) {
    showToast(`Downloading "${name}"...`, 'info');
    setTimeout(() => {
      showToast(`Document "${name}" downloaded successfully!`, 'success');
    }, 1000);
  }
};

window.DayflowProfile = DayflowProfile;
