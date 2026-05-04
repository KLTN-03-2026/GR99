// ======================== Khởi tạo dữ liệu mẫu ========================
let patients = [];
let doctors = [];
let editingId = null;
let currentSearchKeyword = "";
const currentUser = JSON.parse(localStorage.getItem('current_user')) || null;

// DOM Elements
const form = document.getElementById('patientForm');
const fullNameInput = document.getElementById('fullName');
const ageInput = document.getElementById('age');
const genderSelect = document.getElementById('gender');
const phoneInput = document.getElementById('phone');
const doctorSelect = document.getElementById('doctor');
const appointmentTimeInput = document.getElementById('appointmentTime');
const addressInput = document.getElementById('address');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');
const formTitle = document.getElementById('form-title');
const tableBody = document.getElementById('tableBody');
const patientCountSpan = document.getElementById('patientCount');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resetSearchBtn = document.getElementById('resetSearchBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Error message spans
const nameError = document.getElementById('nameError');
const ageError = document.getElementById('ageError');
const phoneError = document.getElementById('phoneError');

// ======================== Helper functions ========================
function showToast(message, isError = false) {
    const toast = document.getElementById('toastMsg');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = isError ? '#c62828' : '#00897b';
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

function clearErrors() {
    if (nameError) nameError.textContent = "";
    if (ageError) ageError.textContent = "";
    if (phoneError) phoneError.textContent = "";
}

function loadDoctorsFromStorage() {
    const stored = localStorage.getItem('dental_doctors');
    if (!stored) {
        doctors = [];
        return;
    }

    try {
        doctors = JSON.parse(stored).map(d => ({
            id: d.id || 0,
            fullName: d.fullName || '',
            specialty: d.specialty || '',
            status: d.status || 'active'
        }));
    } catch (error) {
        console.warn('Không thể nạp dữ liệu bác sĩ từ storage:', error);
        doctors = [];
    }
}

function populateDoctorDropdown() {
    if (!doctorSelect) return;

    let activeDoctors = doctors.filter(doc => doc.status === 'active');

    if (currentUser && currentUser.role === 'doctor') {
        const currentDoctorName = (currentUser.fullName || currentUser.fullname || "").trim().toLowerCase();
        activeDoctors = activeDoctors.filter(doc =>
            (doc.fullName || doc.fullname || "").trim().toLowerCase() === currentDoctorName
        );
    }

    const defaultOption = '<option value="">Chọn bác sĩ</option>';
    doctorSelect.innerHTML = defaultOption + activeDoctors.map(doc =>
        `<option value="${escapeHtml(doc.fullName)}">${escapeHtml(doc.fullName)}</option>`
    ).join('');
}

function ensureDoctorOption(value) {
    if (!doctorSelect || !value) return;
    const exists = Array.from(doctorSelect.options).some(opt => opt.value === value);
    if (!exists) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        doctorSelect.appendChild(option);
    }
}

// Validate dữ liệu đầu vào
function validateForm() {
    let isValid = true;
    const name = fullNameInput.value.trim();
    const age = ageInput.value.trim();
    const phone = phoneInput.value.trim();

    // Họ tên
    if (name === "") {
        if (nameError) nameError.textContent = "Vui lòng nhập họ tên bệnh nhân";
        isValid = false;
    } else if (name.length < 2) {
        if (nameError) nameError.textContent = "Họ tên phải có ít nhất 2 ký tự";
        isValid = false;
    } else {
        if (nameError) nameError.textContent = "";
    }

    // Tuổi (không bắt buộc)
    if (age !== "") {
        const ageNum = Number(age);
        if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
            if (ageError) ageError.textContent = "Tuổi từ 0 - 120";
            isValid = false;
        } else {
            if (ageError) ageError.textContent = "";
        }
    } else {
        if (ageError) ageError.textContent = "";
    }

    // Số điện thoại (không bắt buộc)
    if (phone !== "") {
        const phoneRegex = /^[0-9]{9,11}$/;
        if (!phoneRegex.test(phone)) {
            if (phoneError) phoneError.textContent = "SĐT gồm 9-11 chữ số";
            isValid = false;
        } else {
            if (phoneError) phoneError.textContent = "";
        }
    } else {
        if (phoneError) phoneError.textContent = "";
    }

    return isValid;
}

// Lấy dữ liệu từ form -> object patient
function getPatientFromForm() {
    const selectedDoctor = doctorSelect ? doctorSelect.value : "";
    const doctorName = currentUser && currentUser.role === 'doctor' ?
        (currentUser.fullName || currentUser.fullname || selectedDoctor) :
        selectedDoctor;

    return {
        id: editingId ? editingId : Date.now(),
        fullName: fullNameInput.value.trim(),
        age: ageInput.value.trim() === "" ? null : parseInt(ageInput.value.trim()),
        gender: genderSelect.value,
        phone: phoneInput.value.trim(),
        doctor: doctorName,
        appointmentTime: appointmentTimeInput ? appointmentTimeInput.value : "",
        status: currentStatus,
        address: addressInput.value.trim(),
    };
}

// Reset form về trạng thái thêm mới
function resetFormToAddMode() {
    form.reset();
    editingId = null;
    if (formTitle) formTitle.innerHTML = '<i class="fas fa-user-plus"></i> Thêm bệnh nhân mới';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> <span>Thêm bệnh nhân</span>';
    clearErrors();
    if (fullNameInput) fullNameInput.focus();
}

// Điền dữ liệu bệnh nhân vào form (khi sửa)
function populateFormForEdit(patient) {
    fullNameInput.value = patient.fullName;
    ageInput.value = patient.age !== null ? patient.age : "";
    genderSelect.value = patient.gender;
    phoneInput.value = patient.phone || "";
    ensureDoctorOption(patient.doctor || "");
    doctorSelect.value = patient.doctor || "";
    appointmentTimeInput.value = patient.appointmentTime || "";
    addressInput.value = patient.address || "";
    editingId = patient.id;
    if (formTitle) formTitle.innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa bệnh nhân';
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-pen"></i> <span>Cập nhật</span>';
    clearErrors();
}

// Lưu danh sách patients vào localStorage
function saveToLocalStorage() {
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
}

function getDoctorNameById(doctorId) {
    if (!doctorId) return '';
    const id = Number(doctorId);
    const found = doctors.find(d => Number(d.id) === id || String(d.id) === String(doctorId));
    return found ? (found.fullName || found.fullname || '') : '';
}

function loadRegisteredPatientsFromAppointments() {
    const storedAppointments = localStorage.getItem('appointments') || '[]';
    const storedBookings = localStorage.getItem('bookings') || '[]';

    let appointments = [];
    try {
        appointments = JSON.parse(storedAppointments);
    } catch (error) {
        console.warn('Không thể nạp appointments:', error);
    }

    let bookings = [];
    try {
        bookings = JSON.parse(storedBookings);
    } catch (error) {
        console.warn('Không thể nạp bookings:', error);
    }

    const records = [];
    if (Array.isArray(appointments)) records.push(...appointments);
    if (Array.isArray(bookings)) records.push(...bookings);

    records.forEach(app => {
        if (!app) return;

        // Bỏ qua các lịch bị hủy
        if (app.status === 'Hủy' || app.status === 'Đã hủy' || app.status === 'cancelled') {
            return;
        }

        const patientName = app.name ? app.name.trim() : '';
        const patientPhone = app.phone ? app.phone.trim() : '';
        if (!patientName) return;

        const doctorNameFromBooking = app.doctor || getDoctorNameById(app.doctorId) || '';

        const alreadyExists = patients.some(p =>
            p.fullName.trim().toLowerCase() === patientName.toLowerCase() &&
            (p.phone || '').trim() === patientPhone &&
            ((p.doctor || '').trim().toLowerCase() === doctorNameFromBooking.trim().toLowerCase())
        );

        if (!alreadyExists) {
            patients.push({
                id: Date.now() + Math.floor(Math.random() * 1000),
                fullName: patientName,
                age: app.age || null,
                gender: app.gender || 'Khác',
                phone: patientPhone,
                doctor: doctorNameFromBooking,
                appointmentTime: app.time || app.date || '',
                status: app.status === 'waiting' ? 'pending' : app.status === 'confirmed' || app.status === 'Đã xác nhận' || app.status === 'approved' || app.status === 'Đã đặt lịch khám' ? 'approved' : app.status === 'Hủy' || app.status === 'Đã hủy' ? 'cancelled' : app.status || 'approved',
                address: app.address || ''
            });
        }
    });
}

// Tải dữ liệu từ localStorage hoặc khởi tạo mẫu
function loadPatientsFromStorage() {
    const stored = localStorage.getItem('clinic_patients');
    if (stored) {
        patients = JSON.parse(stored);
    } else {
        patients = [
            { id: 1001, fullName: "Trần Thị Bích Ngọc", age: 28, gender: "Nữ", phone: "0987654321", status: 'approved', address: "12 Nguyễn Du, Hà Nội" },
            { id: 1002, fullName: "Lê Văn An", age: 45, gender: "Nam", phone: "0912345678", status: 'approved', address: "45 Lê Lợi, TP.HCM" },
            { id: 1003, fullName: "Phạm Thanh Hương", age: 32, gender: "Nữ", phone: "0977555333", doctor: "BS. Trần Thị C", appointmentTime: "09:30", status: 'approved', address: "78 Trần Phú, Đà Nẵng" },
            { id: 1004, fullName: "Đỗ Minh Tuấn", age: 19, gender: "Nam", phone: "0903111222", doctor: "BS. Lê Văn D", appointmentTime: "14:15", status: 'approved', address: "23 Ngô Quyền, Hải Phòng" },
        ];
        saveToLocalStorage();
    }

    loadRegisteredPatientsFromAppointments();
}

// Escape HTML để tránh XSS
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getVisiblePatients() {
    if (!currentUser || currentUser.role !== 'doctor') {
        return patients;
    }

    const currentDoctorName = (currentUser.fullName || currentUser.fullname || "").trim().toLowerCase();
    if (!currentDoctorName) return patients;

    return patients.filter(p => {
        const patientDoctor = (p.doctor || "").trim().toLowerCase();
        return patientDoctor === currentDoctorName;
    });
}

// Render danh sách bệnh nhân theo từ khóa tìm kiếm
function renderPatientList() {
    if (!tableBody) {
        console.error('tableBody element not found');
        return;
    }

    let filteredPatients = getVisiblePatients();
    if (currentSearchKeyword.trim() !== "") {
        const keyword = currentSearchKeyword.trim().toLowerCase();
        filteredPatients = filteredPatients.filter(p =>
            p.fullName.toLowerCase().includes(keyword) ||
            (p.phone && p.phone.includes(keyword))
        );
    }

    if (patientCountSpan) patientCountSpan.textContent = filteredPatients.length;

    if (filteredPatients.length === 0) {
        const emptyMessage = currentUser && currentUser.role === 'doctor' ?
            'Hiện chưa có bệnh nhân đăng ký với bác sĩ này.' :
            'Không tìm thấy bệnh nhân nào';
        tableBody.innerHTML = `<tr class="empty-row"><td colspan="10"><i class="fas fa-notes-medical"></i> ${emptyMessage}</td></tr>`;
        return;
    }

    let html = "";
    filteredPatients.forEach((patient, idx) => {
        const stt = idx + 1;
        const ageDisplay = (patient.age !== null && patient.age !== "") ? patient.age : "—";
        const phoneDisplay = patient.phone ? escapeHtml(patient.phone) : "—";
        const doctorDisplay = patient.doctor ? escapeHtml(patient.doctor) : "—";
        const appointmentTimeDisplay = patient.appointmentTime ? escapeHtml(patient.appointmentTime) : "—";
        const addressDisplay = patient.address ? escapeHtml(patient.address) : "—";
        const statusDisplay = patient.status === 'done' ?
            '<span class="status-pill done">Đã xong</span>' :
            patient.status === 'approved' ?
            '<span class="status-pill approved">Đã duyệt</span>' :
            '<span class="status-pill pending">Chờ duyệt</span>';
        const approveButton = patient.status === 'pending' ? `<button class="approve-btn" data-id="${patient.id}" title="Duyệt"> <i class="fas fa-check-circle"></i></button>` : '';

        html += `
            <tr>
                <td>${stt}</td>
                <td><strong>${escapeHtml(patient.fullName)}</strong></td>
                <td>${ageDisplay}</td>
                <td>${escapeHtml(patient.gender)}</td>
                <td>${phoneDisplay}</td>
                <td>${doctorDisplay}</td>
                <td>${appointmentTimeDisplay}</td>
                <td>${statusDisplay}</td>
                <td>${addressDisplay}</td>
                <td class="action-btns">
                    ${approveButton}
                    <button class="edit-btn" data-id="${patient.id}" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${patient.id}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
                    <button class="prescription-btn" data-id="${patient.id}" title="Kê đơn thuốc"><i class="fas fa-prescription-bottle"></i></button>
                </td>
            </tr>
        `;
    });
    tableBody.innerHTML = html;

    // Gắn sự kiện cho nút sửa/xóa
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.removeEventListener('click', handleEditClick);
        btn.addEventListener('click', handleEditClick);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
    document.querySelectorAll('.prescription-btn').forEach(btn => {
        btn.removeEventListener('click', handlePrescriptionClick);
        btn.addEventListener('click', handlePrescriptionClick);
    });
}

function handleEditClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    handleEditPatient(id);
}

function handleDeleteClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    handleDeletePatient(id);
}

function handleApproveClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    approvePatient(id);
}

function handleRecordClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    viewPatientRecord(id);
}

function handlePrescriptionClick(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    createPrescriptionForPatient(id);
}

// Thêm hoặc cập nhật bệnh nhân
function savePatient(event) {
    event.preventDefault();
    if (!validateForm()) {
        showToast("Vui lòng kiểm tra lại thông tin (họ tên không được để trống)", true);
        return;
    }

    const patientData = getPatientFromForm();

    if (editingId !== null) {
        // Cập nhật
        const index = patients.findIndex(p => p.id === editingId);
        if (index !== -1) {
            patients[index] = {...patientData, id: editingId };
            saveToLocalStorage();
            showToast(`Cập nhật bệnh nhân "${patientData.fullName}" thành công!`);
            resetFormToAddMode();
            renderPatientList();
        } else {
            showToast("Không tìm thấy bệnh nhân cần cập nhật", true);
        }
    } else {
        // Thêm mới
        patients.push(patientData);
        saveToLocalStorage();
        showToast(`Thêm bệnh nhân "${patientData.fullName}" thành công!`);
        resetFormToAddMode();
        // Nếu đang có tìm kiếm, reset tìm kiếm để hiển thị đầy đủ
        if (currentSearchKeyword !== "") {
            currentSearchKeyword = "";
            if (searchInput) searchInput.value = "";
        }
        renderPatientList();
    }
}

// Xử lý sửa bệnh nhân
function handleEditPatient(id) {
    const patient = patients.find(p => p.id === id);
    if (patient) {
        populateFormForEdit(patient);
        // Cuộn đến form
        document.querySelector('.form-card') && document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        showToast("Không thể sửa, dữ liệu không tồn tại", true);
    }
}

// Xóa bệnh nhân
function handleDeletePatient(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    if (confirm(`Bạn có chắc muốn xóa bệnh nhân "${patient.fullName}"?`)) {
        patients = patients.filter(p => p.id !== id);
        saveToLocalStorage();
        showToast(`Đã xóa bệnh nhân "${patient.fullName}"`);
        if (editingId === id) {
            resetFormToAddMode();
        }
        renderPatientList();
    }
}

function approvePatient(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) {
        showToast('Không tìm thấy bệnh nhân để duyệt', true);
        return;
    }
    if (patient.status === 'approved') {
        showToast('Bệnh nhân đã được duyệt trước đó', true);
        return;
    }

    patient.status = 'approved';
    saveToLocalStorage();

    // Tạo entry trong patient_records nếu chưa có
    const records = JSON.parse(localStorage.getItem('patient_records')) || {};
    if (!records[patient.id]) {
        records[patient.id] = { symptom: '', diagnosis: '', treatment: '' };
        localStorage.setItem('patient_records', JSON.stringify(records));
    }

    // Set redirect để patientrecords.html tự động mở hồ sơ
    localStorage.setItem('redirect_for_record', patient.id);

    renderPatientList();
    showToast(`Đã duyệt và chuyển sang hồ sơ cho ${patient.fullName}...`);
    setTimeout(() => {
        window.location.href = 'patientrecords.html';
    }, 500);
}

function viewPatientRecord(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) {
        showToast('Không tìm thấy bệnh nhân', true);
        return;
    }

    // Tạo entry trong patient_records nếu chưa có
    const records = JSON.parse(localStorage.getItem('patient_records')) || {};
    if (!records[patient.id]) {
        records[patient.id] = { symptom: '', diagnosis: '', treatment: '' };
        localStorage.setItem('patient_records', JSON.stringify(records));
    }

    // Set redirect để patientrecords.html tự động mở hồ sơ
    localStorage.setItem('redirect_for_record', patient.id);

    showToast(`Chuyển sang hồ sơ của ${patient.fullName}...`);
    setTimeout(() => {
        window.location.href = 'patientrecords.html';
    }, 500);
}

// Tìm kiếm
function performSearch() {
    if (!searchInput) return;
    currentSearchKeyword = searchInput.value;
    renderPatientList();
}

function resetSearch() {
    if (searchInput) searchInput.value = "";
    currentSearchKeyword = "";
    renderPatientList();
    showToast("Đã hiển thị toàn bộ danh sách bệnh nhân");
}

// Hủy chỉnh sửa / làm mới form
function cancelEditing() {
    if (editingId !== null) {
        if (confirm("Hủy chỉnh sửa? Mọi thay đổi chưa lưu sẽ bị mất.")) {
            resetFormToAddMode();
            showToast("Đã hủy chỉnh sửa");
        }
    } else {
        form.reset();
        clearErrors();
        if (fullNameInput) fullNameInput.focus();
    }
}

// Đăng xuất
function handleLogout() {
    const confirmExit = confirm("Bạn có chắc chắn muốn thoát về dashboard?");
    if (!confirmExit) return;

    showToast("Đang chuyển về dashboard...");

    // Redirect after a short delay to allow toast to show
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 800);
}

// ======================== Khởi tạo sự kiện & load ========================
function init() {
    // Load data first
    loadDoctorsFromStorage();
    populateDoctorDropdown();
    loadPatientsFromStorage();

    // Render patient list
    renderPatientList();

    // Setup form events
    if (form) form.addEventListener('submit', savePatient);
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEditing);
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    if (resetSearchBtn) resetSearchBtn.addEventListener('click', resetSearch);

    // Search input event
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    }

    // Setup logout button with proper event handling
    // if (logoutBtn) {
    //     logoutBtn.addEventListener('click', function(e) {
    //         e.preventDefault();
    //         handleLogout();
    //     });
    // } else {
    //     console.warn('Logout button not found');
    // }

    // Focus on name input
    if (fullNameInput) fullNameInput.focus();
}

// Bắt đầu khi DOM sẵn sàng
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/* Thoát ra trang dashboard */

document.getElementById("logoutBtn").onclick = function() {
    if (!confirm("Bạn có chắc muốn thoát?")) return;

    window.location.href = "dashboard.html";
};
// ========================  TÌM KIẾM Bệnh Nhân  ========================

// 1. Ghi đè lại hàm render để hỗ trợ tìm theo tên + SĐT
const oldRenderPatientList = renderPatientList;

function renderPatientList() {
    if (!tableBody) return;

    let filteredPatients = getVisiblePatients();

    if (currentSearchKeyword.trim() !== "") {
        const keyword = currentSearchKeyword.trim().toLowerCase();

        filteredPatients = filteredPatients.filter(p =>
            p.fullName.toLowerCase().includes(keyword) ||
            (p.phone && p.phone.includes(keyword))
        );
    }

    if (patientCountSpan) patientCountSpan.textContent = filteredPatients.length;

    if (filteredPatients.length === 0) {
        const emptyMessage = currentUser && currentUser.role === 'doctor' ?
            'Hiện chưa có bệnh nhân đăng ký với bác sĩ này.' :
            'Không tìm thấy bệnh nhân nào';
        tableBody.innerHTML = `<tr class="empty-row"><td colspan="10"><i class="fas fa-notes-medical"></i> ${emptyMessage}</td></tr>`;
        return;
    }

    let html = "";
    filteredPatients.forEach((patient, idx) => {
        const stt = idx + 1;
        const ageDisplay = (patient.age !== null && patient.age !== "") ? patient.age : "—";
        const phoneDisplay = patient.phone ? escapeHtml(patient.phone) : "—";
        const doctorDisplay = patient.doctor ? escapeHtml(patient.doctor) : "—";
        const appointmentTimeDisplay = patient.appointmentTime ? escapeHtml(patient.appointmentTime) : "—";
        const addressDisplay = patient.address ? escapeHtml(patient.address) : "—";
        const statusDisplay =
            patient.status === 'cancelled' ?
            '<span class="status-pill cancelled">Đã hủy</span>' :
            '<span class="status-pill approved">Đã đặt lịch khám</span>';
        const approveButton = patient.status === 'pending' ? `<button class="approve-btn" data-id="${patient.id}" title="Duyệt"> <i class="fas fa-check-circle"></i></button>` : '';

        html += `
            <tr>
                <td>${stt}</td>
                <td><strong>${escapeHtml(patient.fullName)}</strong></td>
                <td>${ageDisplay}</td>
                <td>${escapeHtml(patient.gender)}</td>
                <td>${phoneDisplay}</td>
                <td>${doctorDisplay}</td>
                <td>${appointmentTimeDisplay}</td>
                <td>${statusDisplay}</td>
                <td>${addressDisplay}</td>
                <td class="action-btns">
                    ${approveButton}
                    <button class="edit-btn" data-id="${patient.id}" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${patient.id}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEditClick);
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteClick);
    });
};


// 2. Thêm tìm kiếm realtime (gõ là tìm luôn)
if (searchInput) {
    searchInput.addEventListener('input', function() {
        currentSearchKeyword = searchInput.value;
        renderPatientList();
    });
}