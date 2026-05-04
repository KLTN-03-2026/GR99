// ===== CHECK LOGIN =====
const user = JSON.parse(localStorage.getItem("current_user"));

if (!user || user.role !== "doctor") {
    window.location.href = "login.html";
}

// ===== FIX DATA (QUAN TRỌNG) =====
const fullName = user.fullName || user.fullname || "Bác sĩ";
const nameParts = fullName.split(" ");

// ===== HIỂN THỊ THÔNG TIN =====
document.getElementById("doctorName").innerText =
    nameParts[nameParts.length - 1]; // tên cuối

document.getElementById("docFullName").innerText = fullName;

document.getElementById("docSpecialty").innerText =
    user.specialty || "Răng hàm mặt";

// Avatar (2 chữ cái)
document.getElementById("doctorAvatar").innerText =
    nameParts[0].charAt(0) +
    (nameParts[1] ? nameParts[1].charAt(0) : "");

// ===== NGÀY HIỆN TẠI =====
const today = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

document.getElementById("currentDate").innerText =
    today.toLocaleDateString('vi-VN', options);

// ===== DATA =====
let bookings = JSON.parse(localStorage.getItem("appointments")) || [];

// ===== LỊCH HÔM NAY =====
const todayStr = today.toISOString().split('T')[0];

// Chỉ tính những lịch chưa hủy
const todayBookings = bookings.filter(b =>
    b.date === todayStr && b.status !== 'Đã hủy' && b.status !== 'cancelled'
);

document.getElementById("todayAppointments").innerText = todayBookings.length;

document.getElementById("todayRemaining").innerText =
    `còn ${todayBookings.length} ca chưa khám`;

// Lắng nghe sự kiện hủy lịch để cập nhật
window.addEventListener('appointmentCancelled', () => {
    location.reload(); // Tải lại trang để lấy dữ liệu mới
});

// ===== THỐNG KÊ THÁNG =====
const currentMonth = today.getMonth();
const currentYear = today.getFullYear();

const monthlyBookings = bookings.filter(b => {
    const d = new Date(b.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
});

const uniquePatients = new Set(
    monthlyBookings.map(b => `${b.name}-${b.phone}`)
).size;

document.getElementById("monthlyPatients").innerText = uniquePatients;

// ===== DOANH THU =====
// Chỉ tính doanh thu từ những lịch chưa hủy
const revenuePerVisit = 500000;
const todayRevenue = todayBookings.length * revenuePerVisit;

document.getElementById("todayRevenue").innerText =
    todayRevenue.toLocaleString('vi-VN');

// ===== HIỂN THỊ DANH SÁCH =====
const appointmentContainer = document.getElementById("appointmentList");

if (todayBookings.length === 0) {
    appointmentContainer.innerHTML =
        '<div class="appointment-item">Không có lịch hẹn hôm nay</div>';
} else {
    appointmentContainer.innerHTML = '';

    todayBookings.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'appointment-item';

        const serviceLabel = booking.service || 'Khám tổng quát';
        const doctorLabel = booking.doctor || 'Chưa chọn bác sĩ';
        const statusClass = booking.status === 'done' ? 'done' : 'waiting';
        const statusLabel = booking.status === 'done' ? 'Đã khám' : 'Chờ khám';

        item.innerHTML = `
            <div><span class="time-badge">${booking.time || 'Chưa chọn giờ'}</span></div>
            <div class="patient-name">${booking.name}</div>
            <div class="service-tag">${serviceLabel}</div>
            <div class="status ${statusClass}">${statusLabel}</div>
            <div class="patient-name" style="font-size:0.9rem; color:#64748b; margin-top:8px;">
                ${doctorLabel}
            </div>
        `;

        appointmentContainer.appendChild(item);
    });
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem("current_user");
    window.location.href = "home.html";
}