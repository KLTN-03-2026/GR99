// Khởi tạo mảng rỗng – không có dữ liệu mẫu
let historyRecords = [];

// ===== FORMAT DATE =====
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ===== STATUS =====
function getStatusInfo(status) {
    switch (status) {
        case "Đã đặt lịch khám":
            return { class: "status-pending", icon: "fas fa-calendar-check" };
        case "Đã hoàn thành":
            return { class: "status-completed", icon: "fas fa-check-circle" };
        case "Đã hủy":
            return { class: "status-cancelled", icon: "fas fa-ban" };
        case "Vắng mặt":
            return { class: "status-missed", icon: "fas fa-user-slash" };
        default:
            return { class: "status-pending", icon: "fas fa-calendar-check" };
    }
}

// ===== ESCAPE HTML =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ===== GET CURRENT PATIENT =====
function getCurrentPatient() {
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    if (!currentUser || currentUser.role !== 'patient') return null;

    return {
        name: currentUser.fullName,
        phone: currentUser.phone
    };
}

// ===== LOAD DATA =====
function loadHistoryRecordsFromStorage() {
    const stored = localStorage.getItem('appointments');
    const currentPatient = getCurrentPatient();

    if (!stored) {
        historyRecords = [];
        return;
    }

    try {
        const list = JSON.parse(stored);

        // Lọc chỉ lấy lịch khám của bệnh nhân hiện tại
        historyRecords = list
            .filter(app => {
                // Nếu không có current_patient, không hiển thị gì
                if (!currentPatient) return false;
                // Chỉ hiển thị lịch của bệnh nhân hiện tại
                return app.name === currentPatient.name && app.phone === currentPatient.phone;
            })
            .map(app => {
                let status = app.status;

                // 🔥 XÓA "CHỜ DUYỆT"
                if (status === "Chờ duyệt" || !status) {
                    status = "Đã đặt lịch khám";
                }

                // Chuẩn hóa trạng thái hủy
                if (status === "Hủy" || status === "cancelled") {
                    status = "Đã hủy";
                }

                return {
                    id: app.id,
                    fullName: app.name || '',
                    phone: app.phone || '',
                    examDate: app.date || '',
                    bookDate: app.bookDate || app.createdAt || app.date || '',
                    reExamDate: app.reExamDate || '',
                    status: status,
                    note: app.note || ''
                };
            });

    } catch {
        historyRecords = [];
    }
}

// ===== RENDER =====
function renderHistory() {
    const tbody = document.getElementById('data');
    const totalSpan = document.getElementById('totalCount');

    if (!historyRecords.length) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">
                    <i class="fas fa-calendar-times"></i> Bạn chưa có lịch sử khám nào
                    <br>
                    <span style="font-size:0.8rem;">Các lần khám sẽ hiển thị tại đây</span>
                </td>
            </tr>
        `;
        totalSpan.innerText = '0';
        return;
    }

    totalSpan.innerText = historyRecords.length;

    let htmlRows = '';

    historyRecords.forEach(record => {
        const formattedExamDate = formatDate(record.examDate);
        const formattedBookDate = formatDate(record.bookDate);
        const statusInfo = getStatusInfo(record.status);

        htmlRows += `
            <tr data-id="${record.id}">
                <td><strong>${escapeHtml(record.fullName)}</strong></td>
                <td>${escapeHtml(record.phone)}</td>
                <td><i class="far fa-calendar-alt"></i> ${formattedExamDate}</td>
                <td><i class="fas fa-calendar-plus"></i> ${formattedBookDate}</td>
                <td><i class="fas fa-calendar-check"></i> ${formatDate(record.reExamDate) || '—'}</td>
                <td>
                    <span class="status-badge ${statusInfo.class}">
                        <i class="${statusInfo.icon}"></i> ${escapeHtml(record.status)}
                    </span>
                </td>
                <td>
                    <button class="detail-btn" data-id="${record.id}">
                        <i class="fas fa-info-circle"></i> Xem chi tiết
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = htmlRows;

    // ===== EVENT DETAIL =====
    document.querySelectorAll('.detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.getAttribute('data-id'));
            const record = historyRecords.find(r => r.id === id);
            if (record) {
                showDetailModal(record);
            }
        });
    });
}

// ===== DETAIL =====
function showDetailModal(record) {
    const message = `🦷 THÔNG TIN CHI TIẾT

👤 Họ tên: ${record.fullName}
📞 SĐT: ${record.phone}
📅 Ngày khám: ${formatDate(record.examDate)}
📆 Ngày đặt: ${formatDate(record.bookDate)}
📅 Ngày tái khám: ${formatDate(record.reExamDate) || 'Chưa đặt'}
🩺 Trạng thái: ${record.status}
📝 Ghi chú: ${record.note || 'Không có'}`;

    alert(message);
}

// ===== BACK HOME =====
document.getElementById('backHomeBtn').addEventListener('click', function() {
    const ok = confirm("Bạn có muốn quay về trang chủ không ?");

    if (!ok) return;

    window.location.href = "home.html";
});

// ===== INIT =====
loadHistoryRecordsFromStorage();
renderHistory();