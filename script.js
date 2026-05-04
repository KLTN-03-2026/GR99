// ==================== DATA ====================

// Bác sĩ mặc định
const DEFAULT_DOCTORS = [{
        id: 1,
        username: "bacsi1",
        password: "123456",
        fullName: "BS. Phạm Nguyễn Minh",
        email: "bacsi1@aura.com",
        specialty: "Răng hàm mặt",
        status: "active"
    },
    {
        id: 2,
        username: "bacsi2",
        password: "abc123",
        fullName: "BS. Trần Thị Lan",
        email: "bacsi2@aura.com",
        specialty: "Chỉnh nha",
        status: "active"
    }
];

// Admin mặc định
const DEFAULT_ADMIN = {
    id: 1,
    username: "admin",
    password: "admin123",
    fullName: "Quản trị viên",
    email: "admin@aura.com",
    role: "admin",
    status: "active"
};

// ==================== BIẾN ====================
let patients = [];
let accounts = [];
let doctors = [];
let resetCodeData = null;

// ==================== LOAD ====================

// PATIENT
function loadPatients() {
    patients = JSON.parse(localStorage.getItem("dental_patients")) || [];

    patients = patients.map(p => ({
        ...p,
        fullName: p.fullName || p.fullname || "",
        status: p.status || "active"
    }));

    localStorage.setItem("dental_patients", JSON.stringify(patients));
}

// ADMIN
function loadAccounts() {
    accounts = JSON.parse(localStorage.getItem("dental_accounts")) || [];

    const hasAdmin = accounts.some(a => a.role === "admin");
    if (!hasAdmin) {
        accounts.push(DEFAULT_ADMIN);
        saveAccounts();
    }
}

// DOCTOR (🔥 FIX QUAN TRỌNG)
function loadDoctors() {
    let stored = JSON.parse(localStorage.getItem("dental_doctors")) || [];

    // nếu chưa có -> tạo mặc định
    if (stored.length === 0) {
        stored = DEFAULT_DOCTORS;
    }

    // FIX dữ liệu thiếu field
    doctors = stored.map(d => ({
        id: d.id || Date.now(),
        username: d.username || "",
        password: d.password || "",
        fullName: d.fullName || "",
        email: d.email || "",
        specialty: d.specialty || "",
        status: d.status || "active"
    }));

    localStorage.setItem("dental_doctors", JSON.stringify(doctors));
}

// ==================== SAVE ====================
function savePatients() {
    localStorage.setItem("dental_patients", JSON.stringify(patients));
}

function saveAccounts() {
    localStorage.setItem("dental_accounts", JSON.stringify(accounts));
}

function saveDoctors() {
    localStorage.setItem("dental_doctors", JSON.stringify(doctors));
}

// ==================== CLEAR PATIENT SESSION ====================
function clearPatientSessionData() {
    // Clear patient-specific cache
    localStorage.removeItem('current_patient');
    sessionStorage.removeItem('current_patient');

    // Option: Clear profiles cache (safer but heavier)
    // localStorage.removeItem('profiles');

    // Don't clear appointments/bookings - they're global data
    // but pages should filter by current_user.username
}

// ==================== LOGIN ====================
function login() {
    const username = document.getElementById("loginUser").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    if (!username || !password) {
        alert("Vui lòng nhập đầy đủ!");
        return;
    }

    // load mới nhất
    loadAccounts();
    loadPatients();
    loadDoctors();

    // ===== ADMIN =====
    const admin = accounts.find(a =>
        a.username === username &&
        a.password === password &&
        a.role === "admin"
    );

    if (admin) {
        if (admin.status === "inactive") {
            alert("Tài khoản admin đã bị khóa!");
            return;
        }

        localStorage.setItem("current_user", JSON.stringify(admin));
        window.location.href = "admin.html";
        return;
    }

    // ===== DOCTOR =====
    const doctor = doctors.find(d =>
        d.username === username &&
        d.password === password
    );

    if (doctor) {
        if (doctor.status === "inactive") {
            alert("Tài khoản bác sĩ đã bị khóa!");
            return;
        }

        localStorage.setItem("current_user", JSON.stringify({
            ...doctor,
            role: "doctor"
        }));

        window.location.href = "dashboard.html";
        return;
    }

    // ===== PATIENT =====
    const patient = patients.find(p =>
        p.username === username &&
        p.password === password
    );

    if (patient) {
        if (patient.status === "inactive") {
            alert("Tài khoản đã bị khóa!");
            return;
        }

        localStorage.setItem("current_user", JSON.stringify({
            ...patient,
            role: "patient"
        }));

        clearPatientSessionData();

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
        alert("Vui lòng nhập đầy đủ!");
        return;
    }

    if (password !== rePass) {
        alert("Mật khẩu không khớp!");
        return;
    }

    if (password.length < 4) {
        alert("Mật khẩu tối thiểu 4 ký tự!");
        return;
    }

    loadPatients();
    loadAccounts();
    loadDoctors();

    // CHECK TRÙNG
    if (
        doctors.some(d => d.username === username) ||
        patients.some(p => p.username === username) ||
        accounts.some(a => a.username === username)
    ) {
        alert("Username đã tồn tại!");
        return;
    }

    let nextPatientId = patients.length > 0 ?
        Math.max(...patients.map(p => p.id || 0)) + 1 :
        1;

    const newPatient = {
        id: nextPatientId,
        fullName: fullname,
        email,
        phone,
        address,
        username,
        password,
        status: "active"
    };

    patients.push(newPatient);
    savePatients();

    alert("Đăng ký thành công!");
    window.location.href = "login.html";
}

// ==================== INIT ====================
loadPatients();
loadAccounts();
loadDoctors();

// ==================== FORGOT PASSWORD ====================
function openForgotPassword() {
    resetForgotModal();
    document.getElementById('forgotPasswordModal').style.display = 'block';
}

function closeForgotPassword() {
    document.getElementById('forgotPasswordModal').style.display = 'none';
}

function resetForgotModal() {
    document.getElementById('forgotStep1').classList.remove('hidden');
    document.getElementById('forgotStep2').classList.add('hidden');
    document.getElementById('forgotInput').value = '';
    document.getElementById('resetCode').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('forgotNote').innerText = '';
    resetCodeData = null;
}

function findUserByIdentifier(input) {
    let found = patients.find(p => p.username === input || p.email === input);
    if (found) return { user: found, type: 'patient' };

    found = doctors.find(d => d.username === input || d.email === input);
    if (found) return { user: found, type: 'doctor' };

    found = accounts.find(a => a.username === input || a.email === input);
    if (found) return { user: found, type: 'admin' };

    return null;
}

function sendResetCode() {
    const input = document.getElementById('forgotInput').value.trim();
    if (!input) {
        alert('Vui lòng nhập tên đăng nhập hoặc email!');
        return;
    }

    loadPatients();
    loadAccounts();
    loadDoctors();

    const found = findUserByIdentifier(input);
    if (!found) {
        alert('Không tìm thấy tài khoản với thông tin đã nhập!');
        return;
    }

    if (found.type !== 'patient') {
        alert('Chức năng quên mật khẩu chỉ dành cho khách hàng bệnh nhân. Nếu bạn là bác sĩ hoặc quản trị viên, vui lòng liên hệ bộ phận hỗ trợ.');
        return;
    }

    if (!found.user.email) {
        alert('Tài khoản này chưa có email. Vui lòng liên hệ bộ phận hỗ trợ.');
        return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    resetCodeData = {
        type: found.type,
        username: found.user.username,
        code,
        expiresAt: Date.now() + 10 * 60 * 1000,
        email: found.user.email
    };

    document.getElementById('forgotStep1').classList.add('hidden');
    document.getElementById('forgotStep2').classList.remove('hidden');
    document.getElementById('forgotNote').innerText = `Mã xác thực đã được gửi tới email ${found.user.email}. Mã có hiệu lực 10 phút.`;

    alert(`Mã xác thực đã gửi tới email ${found.user.email}.\n\n(Mã demo: ${code})`);
}

function confirmResetPassword() {
    const enteredCode = document.getElementById('resetCode').value.trim();
    const newPassword = document.getElementById('newPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();

    if (!resetCodeData) {
        alert('Vui lòng gửi mã xác thực trước khi tạo lại mật khẩu.');
        return;
    }

    if (Date.now() > resetCodeData.expiresAt) {
        alert('Mã xác thực đã hết hạn. Vui lòng gửi lại mã.');
        resetForgotModal();
        return;
    }

    if (!enteredCode || !newPassword || !confirmPassword) {
        alert('Vui lòng điền đầy đủ thông tin ở bước này.');
        return;
    }

    if (enteredCode !== resetCodeData.code) {
        alert('Mã xác thực không đúng. Vui lòng kiểm tra lại.');
        return;
    }

    if (newPassword.length < 4) {
        alert('Mật khẩu mới phải có ít nhất 4 ký tự.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp.');
        return;
    }

    loadPatients();
    loadAccounts();
    loadDoctors();

    if (resetCodeData.type === 'patient') {
        const user = patients.find(p => p.username === resetCodeData.username);
        if (user) {
            user.password = newPassword;
            savePatients();
        }
    }

    if (resetCodeData.type === 'doctor') {
        const user = doctors.find(d => d.username === resetCodeData.username);
        if (user) {
            user.password = newPassword;
            saveDoctors();
        }
    }

    if (resetCodeData.type === 'admin') {
        const user = accounts.find(a => a.username === resetCodeData.username);
        if (user) {
            user.password = newPassword;
            saveAccounts();
        }
    }

    alert('Mật khẩu đã được cập nhật thành công. Vui lòng đăng nhập lại.');
    closeForgotPassword();
}