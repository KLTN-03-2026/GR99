// ===== LẤY ID TỪ URL =====
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const urlName = params.get("name") ? decodeURIComponent(params.get("name")) : null;
const urlEmail = params.get("email") ? decodeURIComponent(params.get("email")) : null;

// ===== LOAD DATA =====
let confirmedList = []; // Will be loaded from backend

function getLocalAppointments() {
    const dentalAppointments = JSON.parse(localStorage.getItem("dental_appointments")) || [];
    const patientAppointments = JSON.parse(localStorage.getItem("appointments")) || [];
    const merged = new Map();

    dentalAppointments.forEach(app => {
        merged.set(String(app.id), {...app });
    });

    patientAppointments.forEach(app => {
        const key = String(app.id);
        if (merged.has(key)) {
            merged.set(key, {
                ...merged.get(key),
                ...app
            });
        } else {
            merged.set(key, {...app });
        }
    });

    return Array.from(merged.values());
}

function findLocalAppointmentById(appointmentId) {
    if (!appointmentId) return null;
    const localAppointments = getLocalAppointments();
    return localAppointments.find(a => String(a.id) === String(appointmentId));
}

function saveLocalAppointment(updatedAppointment) {
    if (!updatedAppointment || !updatedAppointment.id) return;

    const dentalAppointments = JSON.parse(localStorage.getItem("dental_appointments")) || [];
    const patientAppointments = JSON.parse(localStorage.getItem("appointments")) || [];
    const appointmentId = String(updatedAppointment.id);

    const dentalIndex = dentalAppointments.findIndex(a => String(a.id) === appointmentId);
    if (dentalIndex > -1) {
        const existing = dentalAppointments[dentalIndex];
        dentalAppointments[dentalIndex] = {
            ...existing,
            ...updatedAppointment,
            createdAt: existing.createdAt || updatedAppointment.createdAt || new Date().toISOString(),
            status: updatedAppointment.status || existing.status || 'Chưa xác nhận'
        };
    } else {
        dentalAppointments.push({
            ...updatedAppointment,
            createdAt: updatedAppointment.createdAt || new Date().toISOString(),
            status: updatedAppointment.status || 'Chưa xác nhận'
        });
    }
    localStorage.setItem("dental_appointments", JSON.stringify(dentalAppointments));

    const patientIndex = patientAppointments.findIndex(a => String(a.id) === appointmentId);
    if (patientIndex > -1) {
        patientAppointments[patientIndex] = {
            ...patientAppointments[patientIndex],
            ...updatedAppointment
        };
        localStorage.setItem("appointments", JSON.stringify(patientAppointments));
    }
}

function isWithin12Hours(createdAt, confirmedAt) {
    if (!createdAt || !confirmedAt) return false;
    return new Date(confirmedAt).getTime() - new Date(createdAt).getTime() <= 12 * 60 * 60 * 1000;
}

// ===== LOAD CONFIRMATIONS FROM BACKEND =====
function loadConfirmations() {
    confirmedList = getLocalAppointments().filter(app => app.confirmedAt);
    renderTable();
}

// ===== HIỂN THỊ THÔNG TIN =====
function displayAppointmentInfo() {
    const app = findLocalAppointmentById(id);
    const infoDiv = document.getElementById("info");

    // Nếu không tìm thấy trong localStorage, tạo từ URL parameters
    let displayApp = app;
    if (!app && urlName && urlEmail) {
        displayApp = {
            id,
            name: urlName,
            email: urlEmail,
            status: 'Chưa xác nhận'
        };
    }

    if (displayApp) {
        const status = displayApp.status || 'Chưa xác nhận';
        const confirmNote = displayApp.confirmedAt ? ` <small>(Xác nhận ${displayApp.confirmedAt ? 'vào ' + new Date(displayApp.confirmedAt).toLocaleString('vi-VN') : ''})</small>` : '';
        infoDiv.innerHTML = `
            <div class="confirmation-info">
                <strong>${displayApp.name || 'Không xác định'}</strong> (${displayApp.email || 'Không có email'})<br>
                <small>Mã lịch: ${displayApp.id}</small><br>
                ${displayApp.date ? `<small>Ngày: ${displayApp.date}</small><br>` : ''}
                ${displayApp.time ? `<small>Giờ: ${displayApp.time}</small><br>` : ''}
                ${displayApp.doctor ? `<small>Bác sĩ: ${displayApp.doctor}</small><br>` : ''}
                ${displayApp.service ? `<small>Dịch vụ: ${displayApp.service}</small><br>` : ''}
                ${displayApp.phone ? `<small>Điện thoại: ${displayApp.phone}</small><br>` : ''}
                <small>Trạng thái: ${status}</small>${confirmNote}
            </div>
        `;

        if (status === 'Đã xác nhận') {
            const button = document.getElementById("confirmBtn");
            button.disabled = true;
            button.textContent = "Đã xác nhận";
        }
    } else {
        infoDiv.innerHTML = `
            <div class="confirmation-info" style="background: #fef2f2; border-left-color: #ef4444;">
                Không tìm thấy lịch khám với mã: ${id}
            </div>
        `;
        document.getElementById("confirmBtn").disabled = true;
    }
}

// ===== XÁC NHẬN =====
async function confirmAppointment() {
    let app = findLocalAppointmentById(id);

    // Nếu không tìm thấy, tạo từ URL parameters
    if (!app && urlName && urlEmail) {
        app = {
            id,
            name: urlName,
            email: urlEmail,
            status: 'Chưa xác nhận',
            createdAt: new Date().toISOString()
        };
        saveLocalAppointment(app);
    }

    if (!app) {
        showNotification("Không tìm thấy lịch khám!", "error");
        return;
    }

    const confirmedAt = new Date().toISOString();
    const confirmedWithin12h = isWithin12Hours(app.createdAt, confirmedAt);
    const updatedApp = {
        ...app,
        confirmedAt,
        status: confirmedWithin12h ? 'Đã xác nhận' : 'Chưa xác nhận'
    };

    // Lưu trữ trạng thái ngay lập tức
    saveLocalAppointment(updatedApp);

    // Tạo hồ sơ bệnh nhân cho bác sĩ
    await createPatientRecord(updatedApp);

    showNotification("✓ Xác nhận thành công!", "success");

    const button = document.getElementById("confirmBtn");
    button.disabled = true;
    button.textContent = updatedApp.status === 'Đã xác nhận' ? "Đã xác nhận" : "Xác nhận muộn";
    displayAppointmentInfo();
    loadConfirmations();
    
    // Cố gắng gửi dữ liệu đến server nếu có
    try {
        const response = await fetch(`http://localhost:3000/confirm?appointmentId=${encodeURIComponent(id)}`);
        if (response.ok) {
            console.log('Server đã cập nhật xác nhận');
        }
    } catch (error) {
        console.log('Server không kết nối, nhưng dữ liệu đã lưu locally');
    }
}

// ===== TẠO HỒ SƠ BỆNH NHÂN =====
async function createPatientRecord(appointment) {
    try {
        const patientData = {
            patientId: appointment.user || 'unknown',
            record: {
                appointmentId: appointment.id,
                patientName: appointment.name,
                patientPhone: appointment.phone,
                patientEmail: appointment.user || '',
                doctorId: appointment.doctorId,
                appointmentDate: appointment.date,
                status: 'confirmed',
                notes: 'Lịch khám đã được xác nhận',
                createdAt: Date.now()
            }
        };

        const response = await fetch('http://localhost:3000/api/patient-records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            console.log('Hồ sơ bệnh nhân đã được tạo cho bác sĩ');
        } else {
            console.error('Lỗi tạo hồ sơ bệnh nhân');
        }
    } catch (error) {
        console.error('Lỗi kết nối khi tạo hồ sơ:', error);
    }
}

// ===== HIỂN THỊ BẢNG =====
function renderTable() {
    const tbody = document.getElementById("confirmTable");
    if (!tbody) return;

    if (confirmedList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <p>Chưa có ai xác nhận</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = "";

    confirmedList.forEach(item => {
        html += `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>${item.email}</td>
                <td><span class="status-badge status-confirmed">${item.status}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ===== NOTIFICATION =====
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

// ===== INIT =====
window.onload = function() {
    displayAppointmentInfo();
    loadConfirmations();
};