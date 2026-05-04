// ===== KHỞI TẠO EMAILJS =====
(function() {
    emailjs.init("JXVQFkhTqnf_gLAfZ"); // 🔥 thay key
})();

// ===== GỬI EMAIL =====
function sendEmail(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const name = document.getElementById("name").value.trim();
    const id = document.getElementById("appointmentId").value.trim();

    if (!email || !name) {
        showNotification("Vui lòng nhập đầy đủ thông tin!", "error");
        return;
    }

    const confirmationLink = `confirm.html?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;
    const btn = event.target.querySelector('.btn-send');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
    btn.disabled = true;

    emailjs.send("service_0csnmpb", "template_tupcg17", {
            to_name: name,
            to_email: email,
            message: `Xác nhận Lịch Khám Nha Khoa\n\nBệnh nhân: ${name}\nMã lịch: ${id}\nEmail: ${email}\n\nVui lòng nhấn vào liên kết dưới đây để xác nhận lịch khám:\n${confirmationLink}`
        })
        .then(() => {
            showNotification("✓ Gửi email thành công!", "success");
            clearForm();
            btn.innerHTML = originalText;
            btn.disabled = false;
        })
        .catch((err) => {
            console.error(err);
            showNotification("✗ Gửi email thất bại! Vui lòng thử lại.", "error");
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== RESET FORM =====
function clearForm() {
    document.getElementById("email").value = "";
    document.getElementById("name").value = "";
    document.getElementById("appointmentId").value = "";
}

// ===== LẤY NGÀY MAI =====
function getTomorrowDate() {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ===== LOAD VÀ RENDER DANH SÁCH BỆNH NHÂN ĐÃ ĐĂNG KÝ =====
function getAllRegisteredAppointments() {
    const dentalAppointments = JSON.parse(localStorage.getItem('dental_appointments')) || [];
    const patientAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const merged = [...dentalAppointments];

    patientAppointments.forEach(app => {
        if (!merged.some(item => item.id === app.id)) {
            merged.push(app);
        }
    });

    return merged;
}

function loadRegisteredPatients() {
    const allAppointments = getAllRegisteredAppointments();
    const tomorrow = getTomorrowDate();
    const appointments = allAppointments.filter(app => app.date === tomorrow);

    const listDiv = document.getElementById('appointmentsList');

    if (appointments.length === 0) {
        listDiv.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>Không có lịch khám nào vào ngày mai (${tomorrow})</p></div>`;
        return;
    }

    let html = `
        <table class="appointments-table">
            <thead>
                <tr>
                    <th><i class="fas fa-user"></i> Tên bệnh nhân</th>
                    <th><i class="fas fa-envelope"></i> Email</th>
                    <th><i class="fas fa-phone"></i> Số điện thoại</th>
                    <th><i class="fas fa-calendar"></i> Ngày khám</th>
                    <th><i class="fas fa-cogs"></i> Hành động</th>
                </tr>
            </thead>
            <tbody>
    `;

    appointments.forEach((appointment) => {
        const name = appointment.name || 'N/A';
        const email = (appointment.email && appointment.email.trim() !== '') ? appointment.email : 'Chưa cập nhật';
        const phone = appointment.phone || 'N/A';
        const date = appointment.date || 'N/A';
        const appointmentId = appointment.id;

        html += `
            <tr>
                <td><strong>${name}</strong></td>
                <td>${email}</td>
                <td>${phone}</td>
                <td>${date}</td>
                <td>
                    <button class="btn-select" data-email="${encodeURIComponent(email)}" data-name="${encodeURIComponent(name)}" data-id="${encodeURIComponent(appointmentId)}" data-phone="${encodeURIComponent(phone)}" data-date="${encodeURIComponent(date)}" data-doctor="${encodeURIComponent(appointment.doctor || '')}" data-service="${encodeURIComponent(appointment.service || '')}" data-time="${encodeURIComponent(appointment.time || '')}" ${email === 'Chưa cập nhật' ? 'disabled' : ''}>
                        <i class="fas fa-arrow-right"></i> Chọn
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    listDiv.innerHTML = html;

    listDiv.querySelectorAll('.btn-select:not(:disabled)').forEach(button => {
        button.addEventListener('click', () => {
            const email = decodeURIComponent(button.dataset.email);
            const name = decodeURIComponent(button.dataset.name);
            const id = decodeURIComponent(button.dataset.id);
            const phone = decodeURIComponent(button.dataset.phone);
            const date = decodeURIComponent(button.dataset.date);
            const doctor = decodeURIComponent(button.dataset.doctor);
            const service = decodeURIComponent(button.dataset.service);
            const time = decodeURIComponent(button.dataset.time);
            fillForm(email, name, id, { phone, date, doctor, service, time });
        });
    });
}

// ===== LƯU & LOAD APPOINTMENT =====
function getStoredAppointments() {
    return JSON.parse(localStorage.getItem('dental_appointments')) || [];
}

function saveStoredAppointments(appointments) {
    localStorage.setItem('dental_appointments', JSON.stringify(appointments));
}

function ensureAppointmentStored(id, name, email, extra = {}) {
    if (!id || !name || !email) return;
    const appointments = getStoredAppointments();
    const existing = appointments.find(a => a.id === id);
    const now = new Date().toISOString();
    const record = {
        id,
        name,
        email,
        status: 'Chưa xác nhận',
        createdAt: now,
        ...extra
    };

    if (existing) {
        Object.assign(existing, {
            name,
            email,
            status: existing.status || record.status,
            createdAt: existing.createdAt || now,
            ...extra
        });
    } else {
        appointments.push(record);
    }
    saveStoredAppointments(appointments);
}

// ===== ĐIỀN FORM =====
function fillForm(email, name, id, extra = {}) {
    document.getElementById('email').value = email;
    document.getElementById('name').value = name;
    document.getElementById('appointmentId').value = id;
    ensureAppointmentStored(id, name, email, extra);
}

// ===== QUAY LẠI ADMIN =====
function goBackAdmin() {
    window.location.href = 'admin.html';
}

// ===== INIT =====
window.onload = function() {
    loadRegisteredPatients();
};