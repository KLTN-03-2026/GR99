// ==================== DATA ====================

// Admin mặc định
const DEFAULT_ADMIN = {
    id: 1,
    username: "admin",
    password: "admin123",
    fullName: "Quản trị viên",
    role: "admin",
    status: "active"
};

// Bác sĩ cố định
const DOCTORS = [
    { username: "bacsi1", password: "123456", fullname: "BS. Phạm Nguyễn Minh", specialty: "Răng hàm mặt" },
    { username: "bacsi2", password: "abc123", fullname: "BS. Trần Thị Lan", specialty: "Chỉnh nha" }
];

// ==================== GLOBAL ====================
let accounts = [];
let patients = [];
let doctors = [];
let services = [];
let appointments = [];
let chatbotQnA = [];
let dentalImages = [];
let customers = [];

let nextAccountId = 2;
let nextDoctorId = 1;
let nextServiceId = 1;
let nextAppointmentId = 1;
let nextQnaId = 1;
let nextImageId = 1;

// ==================== KIỂM TRA ĐĂNG NHẬP ADMIN ====================
(function checkAdmin() {
    const currentUser = localStorage.getItem('current_user');
    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang quản trị. Vui lòng đăng nhập bằng tài khoản admin.');
            window.location.href = 'login.html';
            return;
        }
    } catch (e) {
        window.location.href = 'login.html';
    }
})();

// ==================== LOAD DATA ====================
function loadAllData() {
    accounts = JSON.parse(localStorage.getItem("dental_accounts")) || [];
    patients = JSON.parse(localStorage.getItem("dental_patients")) || [];
    doctors = JSON.parse(localStorage.getItem("dental_doctors")) || [];
    services = JSON.parse(localStorage.getItem("dental_services")) || [];
    appointments = JSON.parse(localStorage.getItem("dental_appointments")) || [];
    chatbotQnA = JSON.parse(localStorage.getItem("dental_chatbot")) || [];
    dentalImages = JSON.parse(localStorage.getItem("dental_images")) || [];

    // luôn có admin
    const hasAdmin = accounts.some(a => a.role === "admin");
    if (!hasAdmin) {
        accounts.push(DEFAULT_ADMIN);
        saveAllData();
    }

    customers = patients;
}

// ==================== SAVE ====================
function saveAllData() {
    localStorage.setItem("dental_accounts", JSON.stringify(accounts));
    localStorage.setItem("dental_patients", JSON.stringify(patients));
    localStorage.setItem("dental_doctors", JSON.stringify(doctors));
    localStorage.setItem("dental_services", JSON.stringify(services));
    localStorage.setItem("dental_appointments", JSON.stringify(appointments));
    localStorage.setItem("dental_chatbot", JSON.stringify(chatbotQnA));
    localStorage.setItem("dental_images", JSON.stringify(dentalImages));
}

// ==================== LOGIN ====================
function login() {
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    if (!username || !password) {
        alert("Vui lòng nhập đầy đủ!");
        return;
    }

    loadAllData();

    // ADMIN
    const admin = accounts.find(a => a.username === username && a.password === password && a.role === "admin");
    if (admin) {
        localStorage.setItem("current_user", JSON.stringify(admin));
        alert("Đăng nhập admin thành công");
        window.location.href = "admin.html";
        return;
    }

    // DOCTOR
    const doctor = DOCTORS.find(d => d.username === username && d.password === password);
    if (doctor) {
        localStorage.setItem("current_user", JSON.stringify({
            ...doctor,
            role: "doctor"
        }));
        alert("Đăng nhập bác sĩ thành công");
        window.location.href = "dashboard.html";
        return;
    }

    // PATIENT
    const patient = patients.find(p => p.username === username && p.password === password);
    if (patient) {
        localStorage.setItem("current_user", JSON.stringify({
            ...patient,
            role: "patient"
        }));
        alert("Đăng nhập thành công");
        window.location.href = "home.html";
        return;
    }

    alert("Sai tài khoản hoặc mật khẩu");
}

// ==================== REGISTER ====================
function register() {
    const fullname = document.getElementById("regFullname").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const phone = document.getElementById("regPhone").value.trim();
    const address = document.getElementById("regAddress").value.trim();
    const username = document.getElementById("regUser").value.trim();
    const password = document.getElementById("regPass").value.trim();
    const rePass = document.getElementById("regRePass").value.trim();

    if (!fullname || !email || !phone || !address || !username || !password) {
        alert("Nhập đầy đủ thông tin!");
        return;
    }

    if (password !== rePass) {
        alert("Mật khẩu không khớp!");
        return;
    }

    loadAllData();

    if (
        accounts.some(a => a.username === username) ||
        patients.some(p => p.username === username) ||
        DOCTORS.some(d => d.username === username)
    ) {
        alert("Username đã tồn tại!");
        return;
    }

    const newUser = {
        id: Date.now(),
        fullname,
        email,
        phone,
        address,
        username,
        password,
        status: "active"
    };

    patients.push(newUser);
    saveAllData();

    alert("Đăng ký thành công!");
    window.location.href = "login.html";
}

// ==================== RENDER DASHBOARD ====================
function renderDashboard() {
    return `
        <section class="admin-card admin-dashboard-card">
            <div class="dashboard-header">
                <div>
                    <p class="dashboard-label">Tổng quan</p>
                    <h2 class="dashboard-title">Quản trị phòng khám</h2>
                    <p class="dashboard-subtitle">Xem nhanh số liệu quan trọng về lịch khám, bác sĩ và khách hàng.</p>
                </div>
                <div class="dashboard-badge">Cập nhật hôm nay</div>
            </div>
            <div class="admin-stats">
                <div class="stat-card">
                    <div class="stat-icon bg-blue"><i class="fas fa-calendar-check"></i></div>
                    <div>
                        <p class="stat-value">${appointments.length}</p>
                        <p class="stat-label">Lịch khám</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-green"><i class="fas fa-user-md"></i></div>
                    <div>
                        <p class="stat-value">${doctors.length}</p>
                        <p class="stat-label">Bác sĩ</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon bg-teal"><i class="fas fa-user-friends"></i></div>
                    <div>
                        <p class="stat-value">${customers.length}</p>
                        <p class="stat-label">Khách hàng</p>
                    </div>
                </div>
            </div>
        </section>
    `;
}

function formatDateTime(value) {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('vi-VN');
}

function renderConfirmations() {
    const confirmed = JSON.parse(localStorage.getItem('dental_appointments')) || [];
    if (!confirmed.length) {
        return `
            <div class="admin-card">
                <h2>Danh sách xác nhận</h2>
                <p>Chưa có bệnh nhân nào xác nhận lịch.</p>
            </div>
        `;
    }

    let html = `
        <div class="admin-card">
            <h2>Danh sách xác nhận</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Mã lịch</th>
                        <th>Tên bệnh nhân</th>
                        <th>Email</th>
                        <th>Giờ khám</th>
                        <th>Trạng thái</th>
                        <th>Gửi email</th>
                        <th>Xác nhận</th>
                    </tr>
                </thead>
                <tbody>
    `;

    confirmed.forEach(item => {
        const status = item.status || 'Chưa xác nhận';
        const statusClass = status === 'Đã xác nhận' ? 'status-confirmed' : 'status-pending';
        html += `
            <tr>
                <td>${item.id}</td>
                <td>${item.name || 'N/A'}</td>
                <td>${item.email || 'N/A'}</td>
                <td>${item.time || 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${formatDateTime(item.createdAt)}</td>
                <td>${formatDateTime(item.confirmedAt)}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    return html;
}

function renderAppointments() {
    // Load data
    loadAllData();

    let html = `
        <div class="admin-card">
            <h2>Quản lý lịch khám</h2>
            <div class="toolbar">
                <button class="btn-primary" onclick="openAddAppointmentModal()">Thêm lịch khám</button>
                <input type="text" id="searchAppointment" placeholder="Tìm kiếm..." onkeyup="filterAppointments()">
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Bệnh nhân</th>
                        <th>Bác sĩ</th>
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody id="appointmentsTableBody">
    `;

    appointments.forEach(app => {
        const patient = patients.find(p => p.id == app.patientId);
        const doctor = doctors.find(d => d.id == app.doctorId);
        html += `
            <tr>
                <td>${app.id}</td>
                <td>${patient ? (patient.fullname || patient.fullName || 'N/A') : 'N/A'}</td>
                <td>${doctor ? (doctor.fullname || doctor.fullName || 'N/A') : 'N/A'}</td>
                <td>${app.date}</td>
                <td>${app.time}</td>
                <td>${app.status || 'Chưa xác nhận'}</td>
                <td>
                    <button onclick="editAppointment(${app.id})">Sửa</button>
                    <button onclick="deleteAppointment(${app.id})">Xóa</button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <!-- Modals can be added here -->
    `;

    return html;
}

// ==================== LOAD MODULE ====================
let currentModule = "dashboard";

function initSidebarNavigation() {
    const menuItems = document.querySelectorAll('.sidebar-nav li[data-module]');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadModule(item.dataset.module);
        });
    });
}

function loadModule(module) {
    currentModule = module;

    let content = "";

    if (module === "dashboard") content = renderDashboard();
    if (module === "confirmations") content = renderConfirmations();
    if (module === "appointments") content = renderAppointments();
    if (module === "customers") content = JSON.stringify(customers, null, 2);
    if (module === "accounts") content = JSON.stringify(accounts, null, 2);
    if (module === "doctors") content = JSON.stringify(doctors, null, 2);

    document.getElementById("moduleContainer").innerHTML = content;
}

function openAddAppointmentModal() {
    alert('Chức năng thêm lịch khám đang được cập nhật.');
}

function editAppointment(id) {
    alert('Chức năng sửa lịch khám đang cập nhật.');
}

function deleteAppointment(id) {
    const confirmed = confirm('Bạn có chắc chắn muốn xóa lịch khám #' + id + '?');
    if (!confirmed) return;
    appointments = appointments.filter(app => app.id !== id);
    saveAllData();
    loadModule(currentModule);
}

// ====================Đăng Xuất ====================
function logoutAdmin() {
    const ok = confirm("Bạn có chắc chắn muốn đăng xuất không?");
    if (!ok) return;

    // Xoá user đang đăng nhập
    localStorage.removeItem("current_user");

    // quay về trang đăng nhập
    window.location.href = "login.html";
}
document.getElementById("logoutBtn").addEventListener("click", logoutAdmin);

window.onload = function() {
    loadAllData();
    if (document.getElementById("moduleContainer")) {
        initSidebarNavigation();
        loadModule("dashboard");
    }
};