// ===== HELPER FUNCTIONS =====
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Kiểm tra email hợp lệ
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getStatusClass(status) {
    switch (status) {
        case "Đã xác nhận":
            return "status-confirmed";
        case "Chờ duyệt":
            return "status-pending";
        case "Đã hoàn thành":
            return "status-completed";
        case "Hủy":
            return "status-cancelled";
        default:
            return "";
    }
}

function getStatusIcon(status) {
    if (status === "Đã xác nhận") return '<i class="fas fa-check-circle"></i>';
    if (status === "Chờ duyệt") return '<i class="fas fa-hourglass-half"></i>';
    if (status === "Đã hoàn thành") return '<i class="fas fa-clinic-medical"></i>';
    if (status === "Hủy") return '<i class="fas fa-ban"></i>';
    return '<i class="fas fa-question-circle"></i>';
}

// ===== LOAD DATA =====
function loadServices() {
    return JSON.parse(localStorage.getItem('dental_services')) || [];
}

function loadDoctors() {
    return JSON.parse(localStorage.getItem('dental_doctors')) || [];
}

function loadPatients() {
    return JSON.parse(localStorage.getItem('dental_patients')) || [];
}

// ===== POPULATE DROPDOWNS =====
function populatePatientDropdown() {
    const patients = loadPatients();
    const el = document.getElementById("patientSelect");
    if (!el) return;

    el.innerHTML = `<option value="">-- Chọn bệnh nhân --</option>`;

    patients.forEach(p => {
        el.innerHTML += `<option value="${p.id}">${p.fullName} - ${p.phone}</option>`;
    });
}

function populateServiceDropdown() {
    const services = loadServices();
    const el = document.getElementById("service");
    if (!el) return;

    el.innerHTML = `<option value="">-- Chọn dịch vụ --</option>`;

    services.forEach(s => {
        el.innerHTML += `<option value="${s.name}">${s.name} - ${s.price || 0} VNĐ</option>`;
    });
}

function populateDoctorDropdown() {
    const doctors = loadDoctors();
    const el = document.getElementById("doctor");
    if (!el) return;

    el.innerHTML = `<option value="">-- Chọn bác sĩ --</option>`;

    doctors.forEach(d => {
        el.innerHTML += `<option value="${d.fullName}">${d.fullName}</option>`;
    });
}

// ===== AUTO FILL =====
function handlePatientSelect() {
    const select = document.getElementById("patientSelect");
    if (!select) return;

    select.addEventListener("change", function() {
        const patients = loadPatients();
        const p = patients.find(x => x.id == this.value);

        document.getElementById("name").value = p ? p.fullName || "" : "";
        document.getElementById("phone").value = p ? p.phone || "" : "";
        document.getElementById("age").value = p ? p.age || "" : "";
        document.getElementById("gender").value = p ? p.gender || "" : "";
        document.getElementById("address").value = p ? p.address || "" : "";
    });
}

// ===== UPDATE TIME SLOTS =====
function updateTimeSlotAvailability() {
    const dateInput = document.getElementById("date").value;
    const timeSelect = document.getElementById("time");

    if (!dateInput || !timeSelect) return;

    const list = JSON.parse(localStorage.getItem("appointments")) || [];

    // Đếm số bệnh nhân cho mỗi khung giờ trong ngày được chọn
    const timeCount = {};
    list.forEach(app => {
        if (app.date === dateInput && app.status !== 'Đã hủy' && app.status !== 'Hủy') {
            const time = app.time;
            timeCount[time] = (timeCount[time] || 0) + 1;
        }
    });

    // Get current date and time
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Update trạng thái các option
    Array.from(timeSelect.options).forEach(option => {
        const slotHour = parseInt(option.value.split(":")[0]);
        let disabled = false;
        let reason = "";

        // Check if past time for today
        if (dateInput === today) {
            if (slotHour < currentHour || (slotHour === currentHour && currentMinute > 0)) {
                disabled = true;
                reason = " (Quá giờ)";
            }
        }

        // Check if full
        const count = timeCount[option.value] || 0;
        if (count >= 3) {
            disabled = true;
            reason = " (Đầy)";
        }

        option.disabled = disabled;
        if (disabled) {
            option.textContent = option.value + " - " + (slotHour + 1) + ":00" + reason;
        } else {
            option.textContent = option.value + " - " + (slotHour + 1) + ":00";
        }
    });
}



// ===== SUBMIT =====
function submitForm() {
    let name = document.getElementById("name").value.trim();
    let age = document.getElementById("age").value.trim();
    let gender = document.getElementById("gender").value;
    let phone = document.getElementById("phone").value.trim();
    let address = document.getElementById("address").value.trim();
    let email = document.getElementById("email").value.trim();

    let date = document.getElementById("date").value;
    let service = document.getElementById("service").value;
    let doctor = document.getElementById("doctor").value;
    let time = document.getElementById("time").value;
    let note = document.getElementById("note").value;

    if (!name || !phone || !date || !service || !doctor || !time || !email) {
        alert("Nhập đầy đủ thông tin (bao gồm email)!");
        return;
    }

    if (!isValidEmail(email)) {
        alert("Vui lòng nhập địa chỉ email hợp lệ!");
        return;
    }

    // Check if selected time is disabled
    const timeOption = Array.from(document.getElementById("time").options).find(opt => opt.value === time);
    if (timeOption && timeOption.disabled) {
        alert("Khung giờ này không khả dụng!");
        return;
    }

    let list = JSON.parse(localStorage.getItem("appointments")) || [];

    // Kiểm tra xem khung giờ này đã đầy chưa
    const timeCount = list.filter(app =>
        app.date === date &&
        app.time === time &&
        app.status !== 'Đã hủy' &&
        app.status !== 'Hủy'
    ).length;

    if (timeCount >= 3) {
        alert("Khung giờ này đã đầy (đủ 3 bệnh nhân). Vui lòng chọn khung giờ khác!");
        return;
    }

    let appointment = {
        id: Date.now(),
        name,
        age: age ? parseInt(age) : null,
        gender,
        phone,
        address,
        email,
        date,
        time,
        service,
        doctor,
        note,
        status: "Đã đặt lịch khám"
    };

    list.push(appointment);
    localStorage.setItem("appointments", JSON.stringify(list));

    // Đồng bộ sang dental_appointments để trang quản lý/ gửi mail có thể xem lịch vừa đăng ký
    let dentalAppointments = JSON.parse(localStorage.getItem("dental_appointments")) || [];
    const existingIndex = dentalAppointments.findIndex(a => a.id === appointment.id);
    const dentalRecord = {
        id: appointment.id,
        name: appointment.name,
        phone: appointment.phone,
        email: appointment.email,
        date: appointment.date,
        time: appointment.time,
        doctor: appointment.doctor,
        service: appointment.service,
        status: appointment.status,
        note: appointment.note || '',
        createdAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
        dentalAppointments[existingIndex] = {...dentalAppointments[existingIndex], ...dentalRecord };
    } else {
        dentalAppointments.push(dentalRecord);
    }
    localStorage.setItem("dental_appointments", JSON.stringify(dentalAppointments));

    // 👉 LƯU current patient FULL
    const currentPatient = { name, phone, age, gender, address };
    localStorage.setItem("current_patient", JSON.stringify(currentPatient));
    sessionStorage.setItem("current_patient", JSON.stringify(currentPatient));

    alert("Đặt lịch thành công!");

    // Cập nhật lại trạng thái khung giờ
    updateTimeSlotAvailability();
}

// ===== NAV =====
function goHome() {
    window.location.href = "home.html";
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", function() {
    // Kiểm tra đăng nhập
    const currentUser = JSON.parse(localStorage.getItem("current_user")) || null;
    if (!currentUser || currentUser.role !== "patient") {
        alert("Bạn cần đăng nhập bệnh nhân để đặt lịch!");
        window.location.href = "login.html";
        return;
    }

    populatePatientDropdown();
    populateServiceDropdown();
    populateDoctorDropdown();
    handlePatientSelect();

    // Event listener cho date input để update khung giờ
    const dateInput = document.getElementById("date");
    if (dateInput) {
        dateInput.addEventListener("change", updateTimeSlotAvailability);
    }
});