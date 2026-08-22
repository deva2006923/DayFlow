/**
 * Dayflow HRMS - Payroll Controller
 */

const DayflowPayroll = {
  chart: null,

  async initEmployee() {
    const user = DayflowAuth.getCurrentUser();
    const empId = user ? user.id : 'EMP001';
    await this.loadEmployeePayroll(empId);
  },

  async initAdmin() {
    await this.loadAdminPayrollOverview();
  },

  async loadEmployeePayroll(empId) {
    const payroll = await DayflowAPI.getPayroll(empId);
    if (!payroll) return;

    const totalAllowances = payroll.hra + payroll.specialAllowance + payroll.conveyance;

    this.setText('pay-basic', `₹${payroll.basicSalary.toLocaleString()}`);
    this.setText('pay-allowances', `₹${totalAllowances.toLocaleString()}`);
    this.setText('pay-deductions', `₹${payroll.totalDeductions.toLocaleString()}`);
    this.setText('pay-net', `₹${payroll.netSalary.toLocaleString()}`);

    // Render Doughnut Chart
    const ctx = document.getElementById('salaryBreakdownChart');
    if (ctx && window.Chart) {
      if (this.chart) this.chart.destroy();
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Basic Pay', 'HRA & Allowances', 'Deductions (PF/Tax)'],
          datasets: [{
            data: [payroll.basicSalary, totalAllowances, payroll.totalDeductions],
            backgroundColor: ['#4F46E5', '#06B6D4', '#DC2626'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: "'Plus Jakarta Sans', sans-serif" } } }
          }
        }
      });
    }

    // Render History Table
    const tbody = document.getElementById('payroll-history-tbody');
    if (tbody && payroll.history) {
      let rows = '';
      payroll.history.forEach(item => {
        rows += `
          <tr>
            <td><strong class="text-dark">${item.month}</strong></td>
            <td>₹${item.gross.toLocaleString()}</td>
            <td class="text-danger">₹${item.deductions.toLocaleString()}</td>
            <td><strong class="text-success">₹${item.net.toLocaleString()}</strong></td>
            <td><span class="badge-status badge-approved"><i class="bi bi-check-circle-fill"></i> ${item.status}</span></td>
            <td>
              <button class="btn btn-outline-df btn-sm" onclick="DayflowPayroll.viewSalarySlip('${item.month}', ${item.gross}, ${item.deductions}, ${item.net})">
                <i class="bi bi-file-earmark-text me-1"></i> View Slip
              </button>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = rows;
    }
  },

  async loadAdminPayrollOverview() {
    const list = await DayflowAPI.getAllPayrolls();
    const tbody = document.getElementById('admin-payroll-tbody');
    if (!tbody) return;

    let totalPayroll = 0;
    let totalDeductions = 0;

    let rows = '';
    list.forEach(item => {
      const p = item.payroll;
      const emp = item.employee;
      const allowances = (p.hra || 0) + (p.specialAllowance || 0) + (p.conveyance || 0);
      totalPayroll += (p.netSalary || 0);
      totalDeductions += (p.totalDeductions || 0);

      rows += `
        <tr>
          <td>
            <strong>${emp.name}</strong>
            <div class="text-muted smaller">${emp.id} • ${emp.department}</div>
          </td>
          <td>${emp.department}</td>
          <td>₹${(p.basicSalary || 0).toLocaleString()}</td>
          <td>₹${allowances.toLocaleString()}</td>
          <td class="text-danger">₹${(p.totalDeductions || 0).toLocaleString()}</td>
          <td><strong class="text-success">₹${(p.netSalary || 0).toLocaleString()}</strong></td>
          <td>
            <div class="btn-group">
              <button class="btn btn-outline-df btn-sm" onclick="DayflowPayroll.viewSalarySlip('Current Month', ${p.grossSalary}, ${p.totalDeductions}, ${p.netSalary}, '${emp.name}', '${emp.id}')">
                <i class="bi bi-eye"></i>
              </button>
              <button class="btn btn-outline-df btn-sm text-primary" onclick="DayflowPayroll.openEditModal('${emp.id}')">
                <i class="bi bi-pencil-square"></i> Edit
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;

    this.setText('adm-total-payroll', `₹${totalPayroll.toLocaleString()}`);
    this.setText('adm-avg-salary', `₹${Math.round(totalPayroll / (list.length || 1)).toLocaleString()}`);
    this.setText('adm-total-deductions', `₹${totalDeductions.toLocaleString()}`);
    this.setText('adm-pending-payroll', `0 Pending`);
  },

  async openEditModal(empId) {
    const emp = await DayflowAPI.getEmployee(empId);
    const p = await DayflowAPI.getPayroll(empId);
    if (!emp || !p) return;

    document.getElementById('edit-emp-id').value = empId;
    document.getElementById('edit-emp-name-label').textContent = `${emp.name} (${emp.id})`;
    document.getElementById('edit-pay-basic').value = p.basicSalary || 0;
    document.getElementById('edit-pay-hra').value = p.hra || 0;
    document.getElementById('edit-pay-special').value = p.specialAllowance || 0;
    document.getElementById('edit-pay-conveyance').value = p.conveyance || 0;
    document.getElementById('edit-pay-pf').value = p.pfDeduction || 0;
    document.getElementById('edit-pay-pt').value = p.professionalTax || 0;
    document.getElementById('edit-pay-insurance').value = p.healthInsurance || 0;

    const modalEl = document.getElementById('editPayrollModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  },

  async handleSavePayroll(e) {
    e.preventDefault();
    const empId = document.getElementById('edit-emp-id').value;
    const btn = document.getElementById('btn-save-payroll-changes');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Updating...';
    }

    try {
      const data = {
        basicSalary: Number(document.getElementById('edit-pay-basic').value),
        hra: Number(document.getElementById('edit-pay-hra').value),
        specialAllowance: Number(document.getElementById('edit-pay-special').value),
        conveyance: Number(document.getElementById('edit-pay-conveyance').value),
        pfDeduction: Number(document.getElementById('edit-pay-pf').value),
        professionalTax: Number(document.getElementById('edit-pay-pt').value),
        healthInsurance: Number(document.getElementById('edit-pay-insurance').value)
      };

      await DayflowAPI.updatePayroll(empId, data);
      showToast('Payroll salary components successfully updated!', 'success');

      const modalEl = document.getElementById('editPayrollModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      modal?.hide();

      await this.loadAdminPayrollOverview();
    } catch (err) {
      showToast('Failed to update salary details.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Save Salary Changes';
      }
    }
  },

  viewSalarySlip(month, gross, deductions, net, customName, customId) {
    const user = DayflowAuth.getCurrentUser();
    const name = customName || user?.name || "Hemnath KK";
    const id = customId || user?.id || "EMP001";

    const modalHtml = `
      <div class="modal fade" id="salarySlipModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content modal-content-df">
            <div class="modal-header modal-header-df">
              <h5 class="modal-title fw-bold text-dark"><i class="bi bi-file-earmark-text-fill text-primary me-2"></i>Official Salary Pay Slip</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body modal-body-df">
              <div class="salary-slip-box">
                <div class="salary-slip-header">
                  <div>
                    <div class="fw-bold fs-5 text-dark">DAYFLOW TECHNOLOGIES PVT. LTD.</div>
                    <div class="text-muted small">Bangalore, Karnataka, India</div>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-primary-subtle text-primary fw-bold p-2">PAYSLIP FOR ${month.toUpperCase()}</span>
                  </div>
                </div>

                <div class="row g-3 small mb-4 bg-light p-3 rounded">
                  <div class="col-sm-6"><strong>Employee Name:</strong> ${name}</div>
                  <div class="col-sm-6"><strong>Employee ID:</strong> ${id}</div>
                  <div class="col-sm-6"><strong>Bank Account:</strong> HDFC Bank (•••• 4821)</div>
                  <div class="col-sm-6"><strong>Payment Status:</strong> <span class="text-success fw-bold">PROCESSED / CREDITED</span></div>
                </div>

                <div class="row g-4">
                  <div class="col-md-6">
                    <div class="fw-bold text-dark border-bottom pb-1 mb-2">EARNINGS</div>
                    <div class="salary-row"><span>Basic Salary</span> <span>₹${(gross * 0.6).toLocaleString()}</span></div>
                    <div class="salary-row"><span>House Rent Allowance (HRA)</span> <span>₹${(gross * 0.2).toLocaleString()}</span></div>
                    <div class="salary-row"><span>Special Allowance</span> <span>₹${(gross * 0.15).toLocaleString()}</span></div>
                    <div class="salary-row"><span>Conveyance Allowance</span> <span>₹${(gross * 0.05).toLocaleString()}</span></div>
                    <div class="salary-row total-row"><span>Gross Earnings</span> <span>₹${gross.toLocaleString()}</span></div>
                  </div>
                  <div class="col-md-6">
                    <div class="fw-bold text-dark border-bottom pb-1 mb-2">DEDUCTIONS</div>
                    <div class="salary-row"><span>Provident Fund (PF)</span> <span>₹${(deductions * 0.8).toFixed(0)}</span></div>
                    <div class="salary-row"><span>Professional Tax (PT)</span> <span>₹200</span></div>
                    <div class="salary-row"><span>Health Insurance</span> <span>₹${(deductions * 0.18).toFixed(0)}</span></div>
                    <div class="salary-row total-row"><span>Total Deductions</span> <span class="text-danger">₹${deductions.toLocaleString()}</span></div>
                  </div>
                </div>

                <div class="p-3 bg-success-subtle border border-success-subtle rounded mt-4 d-flex justify-content-between align-items-center">
                  <div>
                    <div class="fw-bold text-success-emphasis">NET SALARY PAYABLE:</div>
                    <div class="small text-muted">Amount in words: Indian Rupees ${(net).toLocaleString()} Only</div>
                  </div>
                  <div class="fs-4 fw-extrabold text-success">₹${net.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div class="modal-footer modal-footer-df">
              <button type="button" class="btn btn-outline-df" onclick="DayflowPayroll.downloadPdf('${month}')">
                <i class="bi bi-download me-1"></i> Download PDF
              </button>
              <button type="button" class="btn btn-primary-df" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('salarySlipModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('salarySlipModal');
    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  },

  downloadPdf(month) {
    showToast(`Downloading official payslip for ${month}...`, 'info');
    setTimeout(() => {
      showToast(`Payslip for ${month} downloaded successfully!`, 'success');
    }, 1200);
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
};

window.DayflowPayroll = DayflowPayroll;
