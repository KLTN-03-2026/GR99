// ===== CHECK ADMIN LOGIN =====
(function checkAdmin() {
    const currentUser = localStorage.getItem('current_user');
    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'admin') {
            window.location.href = 'admin.html';
            return;
        }
    } catch (e) {
        window.location.href = 'admin.html';
    }
})();

// ===== GLOBAL VARIABLES =====
let allAppointments = [];
let filteredAppointments = [];
let currentFilter = 'all';

// ===== LOAD DATA =====
function loadAppointments() {
    const dentalAppointments = JSON.parse(localStorage.getItem('dental_appointments')) || [];
    allAppointments = dentalAppointments;
    filterByStatus('all');
    updateStats();
}

// ===== FORMAT DATE TIME =====
function formatDateTime(value) {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN');
}

// ===== UPDATE STATS =====
function updateStats() {
    const total = allAppointments.length;
    const confirmed = allAppointments.filter(a => a.status === 'Đã xác nhận').length;
    const pending = allAppointments.filter(a => a.status === 'Chưa xác nhận' || !a.status).length;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('confirmedCount').textContent = confirmed;
    document.getElementById('pendingCount').textContent = pending;
}

// ===== FILTER BY STATUS =====
function updateFilterButtons() {
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === currentFilter);
    });
}

function filterByStatus(status) {
    currentFilter = status;

    if (status === 'all') {
        filteredAppointments = [...allAppointments];
    } else if (status === 'confirmed') {
        filteredAppointments = allAppointments.filter(a => a.status === 'Đã xác nhận');
    } else if (status === 'pending') {
        filteredAppointments = allAppointments.filter(a => a.status === 'Chưa xác nhận' || !a.status);
    }

    updateFilterButtons();
    renderTable();
}

// ===== SEARCH =====
function handleSearch() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();

    if (searchTerm === '') {
        filterByStatus(currentFilter);
        return;
    }

    filteredAppointments = allAppointments.filter(a => {
        const name = (a.name || '').toLowerCase();
        const email = (a.email || '').toLowerCase();
        const id = String(a.id || '').toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm) || id.includes(searchTerm);
    });

    renderTable();
}

// ===== RENDER TABLE =====
function renderTable() {
    const tbody = document.getElementById('statusTableBody');

    if (filteredAppointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>Không có dữ liệu</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    filteredAppointments.forEach(app => {
        const status = app.status || 'Chưa xác nhận';
        const statusClass = status === 'Đã xác nhận' ? 'status-confirmed' : 'status-pending';
        const statusIcon = status === 'Đã xác nhận' ? 'fa-check-circle' : 'fa-hourglass-half';

        html += `
            <tr class="status-row ${status === 'Đã xác nhận' ? 'confirmed' : 'pending'}">
                <td class="code">${app.id || 'N/A'}</td>
                <td class="name"><strong>${app.name || 'N/A'}</strong></td>
                <td class="email">${app.email || 'N/A'}</td>
                <td class="time">${app.time || 'N/A'}</td>
                <td class="status">
                    <span class="status-badge ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${status}
                    </span>
                </td>
                <td class="sent-date">${formatDateTime(app.createdAt)}</td>
                <td class="confirm-date">${formatDateTime(app.confirmedAt)}</td>
                <td class="actions">
                    <button class="btn-detail" onclick="viewDetail('${app.id}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ===== VIEW DETAIL =====
function viewDetail(id) {
    const app = allAppointments.find(a => String(a.id) === String(id));
    if (!app) {
        alert('Không tìm thấy lịch khám');
        return;
    }

    const detailText = `
Mã lịch: ${app.id}
Tên: ${app.name || 'N/A'}
Email: ${app.email || 'N/A'}
Điện thoại: ${app.phone || 'N/A'}
Ngày khám: ${app.date || 'N/A'}
Giờ khám: ${app.time || 'N/A'}
Bác sĩ: ${app.doctor || 'N/A'}
Dịch vụ: ${app.service || 'N/A'}
Trạng thái: ${app.status || 'Chưa xác nhận'}
Gửi email lúc: ${formatDateTime(app.createdAt)}
Xác nhận lúc: ${formatDateTime(app.confirmedAt)}
    `;

    alert(detailText);
}

// ===== LOGOUT =====
function logoutAdmin() {
    const ok = confirm("Bạn có chắc chắn muốn thoát không?");
    if (!ok) return;

    try {
        localStorage.removeItem("current_user");
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 100);
    } catch (e) {
        console.error("Lỗi thoát:", e);
        window.location.href = "admin.html";
    }
}

// ===== INIT =====
window.onload = function() {
    loadAppointments();

    const logoutButton = document.getElementById("logoutBtn");
    if (logoutButton) {
        logoutButton.addEventListener("click", function(e) {
            e.preventDefault();
            logoutAdmin();
        });
    }
};