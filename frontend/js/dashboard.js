/**
 * Dayflow HRMS - Dashboard Logic
 * Direct mapping to Reference Visuals: Neon Chart Gradients, Live Clock, Check-in/out, and Activity Feeds.
 */

const DayflowDashboard = {
  clockTimer: null,
  attendanceChart: null,
  leaveChart: null,
  adminAttendanceChart: null,
  adminDeptChart: null,

  initEmployeeDashboard() {
    this.startLiveClock();
    this.loadCheckinState();
    this.renderEmployeeCharts();
    this.loadActivities();
  },

  async initAdminDashboard() {
    await this.loadAdminStats();
    this.renderAdminCharts();
    await this.loadActivities();
  },

  async loadAdminStats() {
    try {
      const employees = await DayflowAPI.getEmployees();
      const leaves = await DayflowAPI.getLeaves({ status: 'Pending' });
      const payrolls = await DayflowAPI.getAllPayrolls();

      const totalEmpEl = document.getElementById('adm-total-emp');
      const presentTodayEl = document.getElementById('adm-present-today');
      const pendingLeavesEl = document.getElementById('adm-pending-leaves');
      const totalPayrollEl = document.getElementById('adm-total-payroll');

      if (totalEmpEl && employees) {
        totalEmpEl.textContent = employees.length;
      }
      if (pendingLeavesEl && leaves) {
        pendingLeavesEl.textContent = leaves.length;
      }
      if (totalPayrollEl && payrolls) {
        const totalGross = payrolls.reduce((sum, item) => sum + (item.payroll?.basicSalary || 0) + (item.payroll?.hra || 0) + (item.payroll?.specialAllowance || 0) + (item.payroll?.conveyance || 0), 0);
        totalPayrollEl.textContent = `₹${totalGross.toLocaleString('en-IN')}`;
      }
    } catch (e) {
      console.error('Error loading admin dashboard stats:', e);
    }
  },

  startLiveClock() {
    const timeEl = document.getElementById('live-time');
    const dateEl = document.getElementById('live-date');
    if (!timeEl) return;

    const updateClock = () => {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      }
    };

    updateClock();
    this.clockTimer = setInterval(updateClock, 1000);
  },

  async loadCheckinState() {
    const user = DayflowAuth.getCurrentUser();
    const empId = user ? user.id : 'EMP001';
    const records = await DayflowAPI.getAttendance({ employeeId: empId });
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = records.find(r => r.date === todayStr);

    const punchInVal = document.getElementById('punch-in-time');
    const punchOutVal = document.getElementById('punch-out-time');
    const btnIn = document.getElementById('btn-punch-in');
    const btnOut = document.getElementById('btn-punch-out');
    const punchBadge = document.getElementById('punch-status-text');

    if (todayRecord) {
      if (punchInVal) punchInVal.textContent = todayRecord.checkIn || '--:-- --';
      if (punchOutVal) punchOutVal.textContent = todayRecord.checkOut || '--:-- --';

      if (todayRecord.checkIn && todayRecord.checkIn !== '--:-- --' && (!todayRecord.checkOut || todayRecord.checkOut === '--:-- --')) {
        if (btnIn) btnIn.disabled = true;
        if (btnOut) btnOut.disabled = false;
        if (punchBadge) punchBadge.innerHTML = '<i class="bi bi-circle-fill text-success small"></i> Checked In';
      } else if (todayRecord.checkOut && todayRecord.checkOut !== '--:-- --') {
        if (btnIn) btnIn.disabled = true;
        if (btnOut) btnOut.disabled = true;
        if (punchBadge) punchBadge.innerHTML = '<i class="bi bi-check-circle-fill text-primary small"></i> Day Completed';
      }
    } else {
      if (btnIn) btnIn.disabled = false;
      if (btnOut) btnOut.disabled = true;
      if (punchBadge) punchBadge.innerHTML = '<i class="bi bi-clock small"></i> Not Punched In';
    }
  },

  async handleCheckIn() {
    const btnIn = document.getElementById('btn-punch-in');
    if (btnIn) {
      btnIn.disabled = true;
      btnIn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Punching...';
    }

    try {
      const user = DayflowAuth.getCurrentUser();
      const record = await DayflowAPI.checkIn(user?.id || 'EMP001');
      showToast(`Punched in at ${record.checkIn}. Have a great workday!`, 'success');
      await this.loadCheckinState();
      await this.loadActivities();
    } catch (e) {
      showToast('Failed to punch in. Please try again.', 'error');
    } finally {
      if (btnIn) {
        btnIn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Check In';
      }
    }
  },

  async handleCheckOut() {
    const btnOut = document.getElementById('btn-punch-out');
    if (btnOut) {
      btnOut.disabled = true;
      btnOut.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Punching...';
    }

    try {
      const user = DayflowAuth.getCurrentUser();
      const record = await DayflowAPI.checkOut(user?.id || 'EMP001');
      showToast(`Checked out at ${record.checkOut}. Total hours recorded!`, 'info');
      await this.loadCheckinState();
      await this.loadActivities();
    } catch (e) {
      showToast('Failed to check out. Please try again.', 'error');
    } finally {
      if (btnOut) {
        btnOut.innerHTML = '<i class="bi bi-box-arrow-right"></i> Check Out';
      }
    }
  },

  renderEmployeeCharts() {
    // 1. Weekly Attendance Bar Chart (Bright Orange Bars matching reference)
    const barCtx = document.getElementById('weeklyAttendanceChart');
    if (barCtx && window.Chart) {
      if (this.attendanceChart) this.attendanceChart.destroy();
      this.attendanceChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Hours Worked',
            data: [8.8, 8.0, 9.5, 8.8, 9.2, 0.1, 0],
            backgroundColor: '#FF8A00',
            hoverBackgroundColor: '#FF6B00',
            borderRadius: 4,
            borderSkipped: false,
            barThickness: 24,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E293B',
              titleColor: '#FFFFFF',
              bodyColor: '#CBD5E1',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 10,
              displayColors: false,
              callbacks: {
                label: (ctx) => `${ctx.raw} Hours`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 12,
              ticks: {
                stepSize: 2,
                color: '#64748B',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.05)',
                drawBorder: false
              }
            },
            x: {
              grid: { display: false },
              ticks: {
                color: '#64748B',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 }
              }
            }
          }
        }
      });
    }

    // 2. Leave Summary Doughnut Chart (Neon Purple, Orange, Pink matching reference)
    const doughnutCtx = document.getElementById('leaveSummaryChart');
    if (doughnutCtx && window.Chart) {
      if (this.leaveChart) this.leaveChart.destroy();
      this.leaveChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Casual / Paid', 'Sick Leave', 'Used / Other'],
          datasets: [{
            data: [12, 6, 4],
            backgroundColor: ['#8B5CF6', '#FF8A00', '#FF3D81'],
            hoverBackgroundColor: ['#A78BFA', '#FFA533', '#FF6B9E'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: {
              display: false // Using custom matching HTML legend on the right
            },
            tooltip: {
              backgroundColor: '#1E293B',
              titleColor: '#FFFFFF',
              bodyColor: '#CBD5E1',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              padding: 8,
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} Days`
              }
            }
          }
        }
      });
    }
  },

  renderAdminCharts() {
    // 1. Today's Attendance Split (Doughnut)
    const ctxAttendance = document.getElementById('adminAttendanceChart') || document.getElementById('adminAttendanceOverviewChart');
    if (ctxAttendance && window.Chart) {
      if (this.adminAttendanceChart) this.adminAttendanceChart.destroy();
      this.adminAttendanceChart = new Chart(ctxAttendance, {
        type: 'doughnut',
        data: {
          labels: ['Present (4)', 'On Leave (1)', 'Absent (1)'],
          datasets: [{
            data: [4, 1, 1],
            backgroundColor: ['#10B981', '#FF8A00', '#FF3D81'],
            borderWidth: 0,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 10,
                color: '#CBD5E1',
                font: { family: "'Poppins', sans-serif", size: 12 }
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} Employees`
              }
            }
          }
        }
      });
    }

    // 2. Monthly Leave Application Trends (Bar / Stacked Bar)
    const ctxLeaveTrends = document.getElementById('adminLeaveTrendChart') || document.getElementById('adminDeptDistChart');
    if (ctxLeaveTrends && window.Chart) {
      if (this.adminDeptChart) this.adminDeptChart.destroy();
      this.adminDeptChart = new Chart(ctxLeaveTrends, {
        type: 'bar',
        data: {
          labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug'],
          datasets: [
            { label: 'Sick Leave', data: [2, 1, 3, 2, 1], backgroundColor: '#FF8A00', borderRadius: 6 },
            { label: 'Casual / Paid', data: [3, 4, 2, 5, 2], backgroundColor: '#8B5CF6', borderRadius: 6 },
            { label: 'Other', data: [0, 1, 0, 1, 0], backgroundColor: '#3B82F6', borderRadius: 6 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 10,
                color: '#CBD5E1',
                font: { family: "'Poppins', sans-serif", size: 11 }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94A3B8', font: { family: "'Poppins', sans-serif" } }
            },
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: '#94A3B8', font: { family: "'Poppins', sans-serif" } },
              grid: { color: 'rgba(255, 255, 255, 0.06)' }
            }
          }
        }
      });
    }
  },

  async loadActivities() {
    const listEl = document.getElementById('activity-timeline-list');
    const adminListEl = document.getElementById('admin-activity-timeline');

    if (listEl) {
      // Employee Dashboard Timeline items matching reference UI:
      const items = [
        {
          iconClass: 'circle-green',
          icon: 'bi-check-lg',
          title: 'Check-out completed',
          desc: 'Punched out at 12:20 PM',
          time: 'Just now'
        },
        {
          iconClass: 'circle-blue',
          icon: 'bi-person-fill',
          title: 'Check-in completed',
          desc: 'Punched in at 11:15 AM for workday',
          time: 'Just now'
        },
        {
          iconClass: 'circle-purple',
          icon: 'bi-wifi',
          title: 'Check-in completed',
          desc: 'Punched in for workday from Office Wi-Fi',
          time: 'Today, 09:02 AM'
        },
        {
          iconClass: 'circle-amber',
          icon: 'bi-calendar-heart',
          title: 'Leave request approved',
          desc: 'Paid leave approved by People Operations',
          time: 'Yesterday, 06:15 PM'
        }
      ];

      let html = '';
      items.forEach(item => {
        html += `
          <li class="activity-row-item">
            <div class="activity-left">
              <div class="activity-circle-icon ${item.iconClass}">
                <i class="bi ${item.icon}"></i>
              </div>
              <div>
                <div class="activity-title-text">${item.title}</div>
                <div class="activity-desc-text">${item.desc}</div>
              </div>
            </div>
            <div class="activity-time-text">${item.time}</div>
          </li>
        `;
      });
      listEl.innerHTML = html;
    }

    if (adminListEl) {
      const activities = await DayflowAPI.getActivities();
      if (activities.length === 0) {
        adminListEl.innerHTML = '<li class="text-muted small py-4 text-center">No recent activities logged yet.</li>';
        return;
      }

      const iconConfig = {
        checkin: { icon: 'bi-box-arrow-in-right', circleClass: 'circle-blue' },
        leave: { icon: 'bi-calendar2-heart', circleClass: 'circle-amber' },
        payroll: { icon: 'bi-cash-coin', circleClass: 'circle-green' },
        profile: { icon: 'bi-person-check', circleClass: 'circle-purple' },
        update: { icon: 'bi-gear', circleClass: 'circle-blue' }
      };

      let html = '';
      activities.slice(0, 5).forEach(act => {
        const conf = iconConfig[act.type] || { icon: 'bi-activity', circleClass: 'circle-blue' };
        html += `
          <li class="activity-row-item">
            <div class="activity-left">
              <div class="activity-circle-icon ${conf.circleClass}">
                <i class="bi ${conf.icon}"></i>
              </div>
              <div>
                <div class="activity-title-text">${act.title}</div>
                <div class="activity-desc-text">${act.desc}</div>
              </div>
            </div>
            <div class="activity-time-text">${act.time}</div>
          </li>
        `;
      });
      adminListEl.innerHTML = html;
    }
  }
};

window.DayflowDashboard = DayflowDashboard;
