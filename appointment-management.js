// ==================== KIỂM TRA ĐĂNG NHẬP ADMIN ====================
(function checkAdmin() {
    const currentUser = localStorage.getItem('current_user');
    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang quản trị. Vui lòng đăng nhập bằng tài khoản admin.');
            window.location.href = 'admin.html';
            return;
        }
    } catch (e) {
        window.location.href = 'admin.html';
    }
})();

// ==================== DỮ LIỆU & LOCALSTORAGE ====================
let appointments = [];
let patients = [];
let doctors = [];
let nextId = 1;

function loadPatients() {
    const stored = localStorage.getItem('dental_patients');
    if (stored) {
        patients = JSON.parse(stored);
    } else {
        patients = [];
    }
}

function loadDoctors() {
    const stored = localStorage.getItem('dental_doctors');
    if (stored) {
        doctors = JSON.parse(stored);
    } else {
        doctors = [];
    }
}

function loadAppointments() {
    // Lấy từ key 'appointments' (từ bệnh nhân)
    const patientAppointments = localStorage.getItem('appointments');
    if (patientAppointments) {
        try {
            const patientList = JSON.parse(patientAppointments);
            appointments = patientList.map((app, index) => ({
                id: app.id || (index + 1),
                patientId: findPatientByName(app.name),
                doctorId: findDoctorByName(app.doctor),
                date: app.date || '',
                time: app.time || '',
                status: app.status === 'Hủy' ? 'cancelled' : app.status === 'Đã hủy' ? 'cancelled' : app.status === 'Chờ duyệt' ? 'pending' : 'confirmed',
                note: app.note || ''
            }));
        } catch (e) {
            appointments = [];
        }
    } else {
        // Nếu không có, lấy từ key 'dental_appointments' (lưu trữ nội bộ)
        const stored = localStorage.getItem('dental_appointments');
        if (stored) {
            appointments = JSON.parse(stored);
        } else {
            appointments = [];
        }
    }

    if (appointments.length > 0) {
        nextId = Math.max(...appointments.map(a => a.id || 0)) + 1;
    } else {
        nextId = 1;
    }
    renderTable();
}

// Tìm bệnh nhân theo tên
function findPatientByName(name) {
    if (!name) return null;
    const patient = patients.find(p =>
        p.fullname && p.fullname.toLowerCase() === name.toLowerCase() ||
        p.fullName && p.fullName.toLowerCase() === name.toLowerCase()
    );
    return patient ? patient.id : null;
}

// Tìm bác sĩ theo tên
function findDoctorByName(name) {
    if (!name) return null;
    const doctor = doctors.find(d =>
        d.fullName && d.fullName.toLowerCase() === name.toLowerCase()
    );
    return doctor ? doctor.id : null;
}

function saveAppointments() {
    // Lưu vào cả hai key để đồng bộ
    const appointmentsData = appointments.map(app => ({
        id: app.id,
        name: getPatientName(app.patientId),
        phone: getPatientPhone(app.patientId),
        doctor: getDoctorName(app.doctorId),
        date: app.date,
        time: app.time,
        service: app.serviceName || '',
        note: app.note || '',
        status: app.status === 'cancelled' ? 'Hủy' : app.status === 'confirmed' ? 'Đã xác nhận' : app.status === 'pending' ? 'Chờ duyệt' : app.status,
        bookDate: new Date().toISOString().split('T')[0]
    }));

    localStorage.setItem('appointments', JSON.stringify(appointmentsData));
    localStorage.setItem('dental_appointments', JSON.stringify(appointments));
}

function getPatientPhone(patientId) {
    const p = patients.find(p => p.id == patientId);
    return p ? (p.phone || '') : '';
}

function syncAppointmentToDoctorRecords(appointment) {
    if (!appointment) return;

    const doctorRecordAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
    const patient = patients.find(p => p.id == appointment.patientId);
    const doctor = doctors.find(d => d.id == appointment.doctorId);
    const recordApp = {
        id: appointment.id,
        name: patient ? (patient.fullName || patient.fullname || 'Không xác định') : 'Không xác định',
        phone: patient ? patient.phone || '' : '',
        doctor: doctor ? doctor.fullName || 'Không xác định' : 'Không xác định',
        date: appointment.date,
        time: appointment.time
    };

    const existingIndex = doctorRecordAppointments.findIndex(a => a.id === recordApp.id);
    if (existingIndex !== -1) {
        doctorRecordAppointments[existingIndex] = {...doctorRecordAppointments[existingIndex], ...recordApp };
    } else {
        doctorRecordAppointments.push(recordApp);
    }

    localStorage.setItem('appointments', JSON.stringify(doctorRecordAppointments));
}

function redirectToMedicalRecord(appointmentId) {
    localStorage.setItem('redirect_for_record', appointmentId.toString());
    window.location.href = 'patientrecords.html';
}

// Lắng nghe thay đổi từ tab khác
window.addEventListener('storage', (event) => {
    if (event.key === 'dental_appointments' || event.key === 'dental_patients' || event.key === 'dental_doctors' || event.key === 'appointments') {
        loadPatients();
        loadDoctors();
        loadAppointments();
        populateSelects();
        showAlert('Dữ liệu đã được cập nhật từ tab khác!');
    }
});

// ==================== HÀM PHỤ TRỢ ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function showAlert(msg) { alert(msg); }

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentMonthRange() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function isDateInCurrentMonth(dateStr) {
    return dateStr.startsWith(getCurrentMonthRange());
}

function getPatientName(patientId) {
    const p = patients.find(p => p.id == patientId);
    return p ? (p.fullname || p.fullName || 'Không xác định') : 'Không xác định';
}

function getDoctorName(doctorId) {
    const d = doctors.find(d => d.id == doctorId);
    return d ? d.fullName : 'Không xác định';
}

function getStatusText(status) {
    const map = {
        pending: 'Chờ duyệt',
        'Chờ duyệt': 'Chờ duyệt',
        confirmed: 'Đã xác nhận',
        completed: 'Đã hoàn thành',
        cancelled: 'Đã hủy'
    };
    return map[status] || status;
}

function isPendingStatus(status) {
    return status === 'pending' || status === 'Chờ duyệt' || status === 'cho duyet';
}

function getStatusClass(status) {
    const normalized = status === 'Chờ duyệt' ? 'pending' : status;
    return `status-${normalized}`;
}

// ==================== RENDER DANH SÁCH ====================
function renderTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let filtered = appointments.filter(a =>
        getPatientName(a.patientId).toLowerCase().includes(searchTerm) ||
        getDoctorName(a.doctorId).toLowerCase().includes(searchTerm) ||
        a.date.includes(searchTerm) ||
        a.time.includes(searchTerm)
    );

    // Hiển thị tất cả lịch khám trong tháng hiện tại
    filtered = filtered.filter(a => isDateInCurrentMonth(a.date));

    document.getElementById('totalCount').innerText = filtered.length;
    const monthYear = getCurrentMonthRange();
    const [year, month] = monthYear.split('-');
    const monthNames = ['', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    document.getElementById('pageSubtitle').innerText = `Hiển thị lịch khám ${monthNames[parseInt(month)]} năm ${year}`;

    const tbody = document.getElementById('appointmentTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><i class="fas fa-calendar-times"></i> Không có lịch khám nào trong tháng này<br><span style="font-size:0.8rem;">Nhấn "Thêm lịch khám" để tạo mới</span></td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach(app => {
                const patientName = escapeHtml(getPatientName(app.patientId));
                const doctorName = escapeHtml(getDoctorName(app.doctorId));
                const statusText = getStatusText(app.status);
                const statusClass = getStatusClass(app.status);
                const isPending = isPendingStatus(app.status);
                html += `
            <tr data-id="${app.id}">
                <td>${app.id}</td>
                <td><strong>${patientName}</strong></td>
                <td>${doctorName}</td>
                <td>${app.date}</td>
                <td>${app.time}</td>
                <td><span class="status-badge ${statusClass}"><i class="fas ${isPending ? 'fa-hourglass-half' : app.status === 'confirmed' ? 'fa-check-circle' : app.status === 'completed' ? 'fa-clinic-medical' : app.status === 'cancelled' ? 'fa-ban' : 'fa-hourglass-half'}"></i> ${statusText}</span></td>
                <td class="action-icons">
                    ${isPending ? `<button class="approve-btn" data-id="${app.id}" title="Duyệt và sang hồ sơ khám"><i class="fas fa-check"></i> Duyệt</button>` : ''}
                    <button class="view-btn" data-id="${app.id}" title="Xem chi tiết"><i class="fas fa-eye"></i></button>
                    <button class="edit-btn" data-id="${app.id}" title="Sửa"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${app.id}" title="Xóa"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;

    // Gắn sự kiện cho các nút
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', () => approveAppointment(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => viewAppointment(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editAppointment(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteAppointment(parseInt(btn.dataset.id)));
    });
}

// ==================== CRUD ====================
function addAppointment(appData) {
    const newApp = { id: nextId++, ...appData };
    appointments.push(newApp);
    saveAppointments();
    renderTable();
}

function updateAppointment(id, updatedData) {
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
        appointments[index] = {...appointments[index], ...updatedData };
        saveAppointments();
        renderTable();
    }
}

function deleteAppointment(id) {
    if (confirm('Bạn có chắc chắn muốn hủy lịch khám này? Tất cả dữ liệu hồ sơ và đơn thuốc liên quan sẽ bị xóa vĩnh viễn.')) {
        const appointment = appointments.find(a => a.id === id);
        if (appointment) {
            // Lưu lại service và price nếu có
            const service = JSON.parse(localStorage.getItem('dental_services') || '[]').find(
                s => s.name === appointment.serviceName
            );
            const price = service ? service.price : 0;

            // Đánh dấu là hủy
            appointment.status = 'cancelled';
            appointment.cancelledDate = new Date().toISOString().split('T')[0];
            appointment.cancelledPrice = price;  // Lưu giá để trừ doanh thu

            saveAppointments();

            // Cập nhật trong appointments (danh sách bệnh nhân)
            const patientAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
            const recordIndex = patientAppointments.findIndex(a => a.id === id);
            if (recordIndex !== -1) {
                patientAppointments[recordIndex].status = 'Hủy';
                localStorage.setItem('appointments', JSON.stringify(patientAppointments));
            }

            // XÓA TẤT CẢ DỮ LIỆU LIÊN QUAN TỪ BACKEND
            deleteRelatedData(id);

            // Trigger sự kiện để cập nhật dashboard
            window.dispatchEvent(new Event('appointmentCancelled'));

            renderTable();
            closeModal();
            showAlert('Đã hủy lịch khám và xóa tất cả dữ liệu liên quan. Số lượng lịch và doanh thu đã được cập nhật.');
        }
    }
}

function approveAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (!appointment) return;

    if (!confirm('Duyệt lịch khám này và chuyển sang hồ sơ khám?')) {
        return;
    }

    appointment.status = 'confirmed';
    saveAppointments();
    syncAppointmentToDoctorRecords(appointment);
    renderTable();
    showAlert('Đã duyệt lịch khám, chuyển sang hồ sơ khám...');
    setTimeout(() => redirectToMedicalRecord(id), 500);
}

// ==================== XEM CHI TIẾT ====================
const detailModal = document.getElementById('detailModal');
const detailContent = document.getElementById('detailContent');

function viewAppointment(id) {
    const app = appointments.find(a => a.id === id);
    if (!app) return;
    const patientName = getPatientName(app.patientId);
    const doctorName = getDoctorName(app.doctorId);
    detailContent.innerHTML = `
        <div style="display: grid; gap: 0.8rem;">
            <p><strong><i class="fas fa-hashtag"></i> Mã lịch khám:</strong> ${app.id}</p>
            <p><strong><i class="fas fa-user"></i> Tên bệnh nhân:</strong> ${escapeHtml(patientName)}</p>
            <p><strong><i class="fas fa-user-md"></i> Bác sĩ phụ trách:</strong> ${escapeHtml(doctorName)}</p>
            <p><strong><i class="fas fa-calendar-day"></i> Ngày khám:</strong> ${app.date}</p>
            <p><strong><i class="fas fa-clock"></i> Giờ khám:</strong> ${app.time}</p>
            <p><strong><i class="fas fa-tag"></i> Trạng thái:</strong> ${getStatusText(app.status)}</p>
            <p><strong><i class="fas fa-pen-alt"></i> Ghi chú:</strong> ${escapeHtml(app.note) || 'Không có'}</p>
        </div>
    `;
    detailModal.style.display = 'flex';
}

function closeDetailModal() {
    detailModal.style.display = 'none';
}

// ==================== MODAL THÊM/SỬA ====================
const modal = document.getElementById('appointmentModal');
const modalTitle = document.getElementById('modalTitle');
const editIdField = document.getElementById('editId');
const patientSelect = document.getElementById('patientId');
const doctorSelect = document.getElementById('doctorId');
const dateInput = document.getElementById('appointmentDate');
const timeSelect = document.getElementById('appointmentTime');
const statusSelect = document.getElementById('status');
const noteTextarea = document.getElementById('note');
const form = document.getElementById('appointmentForm');

function populateSelects() {
    // Đổ bệnh nhân
    patientSelect.innerHTML = '<option value="">-- Chọn bệnh nhân --</option>';
    patients.forEach(p => {
        patientSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.fullname)}</option>`;
    });
    // Đổ bác sĩ
    doctorSelect.innerHTML = '<option value="">-- Chọn bác sĩ --</option>';
    doctors.forEach(d => {
        doctorSelect.innerHTML += `<option value="${d.id}">${escapeHtml(d.fullName)} - ${escapeHtml(d.specialty)}</option>`;
    });
}

function openModal(isEdit = false, appointment = null) {
    populateSelects(); // Cập nhật danh sách mới nhất
    modal.style.display = 'flex';
    if (isEdit && appointment) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Sửa lịch khám';
        editIdField.value = appointment.id;
        patientSelect.value = appointment.patientId;
        doctorSelect.value = appointment.doctorId;
        dateInput.value = appointment.date;
        timeSelect.value = appointment.time;
        statusSelect.value = appointment.status;
        noteTextarea.value = appointment.note || '';
    } else {
        modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Thêm lịch khám mới';
        editIdField.value = '';
        form.reset();
        // Đặt ngày mặc định là hôm nay
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        statusSelect.value = 'pending';
    }
}

function closeModal() {
    modal.style.display = 'none';
    form.reset();
}

function editAppointment(id) {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
        openModal(true, appointment);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const patientId = parseInt(patientSelect.value);
    const doctorId = parseInt(doctorSelect.value);
    const date = dateInput.value;
    const time = timeSelect.value;
    const status = statusSelect.value;
    const note = noteTextarea.value.trim();

    if (!patientId || !doctorId || !date || !time) {
        alert('Vui lòng chọn đầy đủ bệnh nhân, bác sĩ, ngày khám và giờ khám!');
        return;
    }

    // Kiểm tra trùng lịch (cùng bác sĩ, cùng ngày, cùng giờ)
    const editId = editIdField.value;
    const isDuplicate = appointments.some(a =>
        a.doctorId === doctorId && a.date === date && a.time === time && (editId ? a.id != editId : true)
    );
    if (isDuplicate) {
        alert('Bác sĩ đã có lịch khám vào thời gian này. Vui lòng chọn giờ khác!');
        return;
    }

    if (editId) {
        updateAppointment(parseInt(editId), { patientId, doctorId, date, time, status, note });
        showAlert('Cập nhật lịch khám thành công!');
    } else {
        addAppointment({ patientId, doctorId, date, time, status, note });
        showAlert('Thêm lịch khám thành công!');
    }
    closeModal();
});

// ==================== TÌM KIẾM ====================
document.getElementById('searchInput').addEventListener('input', renderTable);

// ==================== SỰ KIỆN MODAL ====================
document.getElementById('openAddModalBtn').addEventListener('click', () => openModal(false));
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
    if (e.target === detailModal) closeDetailModal();
});
document.getElementById('closeDetailModalBtn').addEventListener('click', closeDetailModal);
document.getElementById('closeDetailBtn').addEventListener('click', closeDetailModal);

// ==================== THOÁT VỀ ADMIN ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn về trang admin?')) {
        window.location.href = 'admin.html';
    }
});

// ==================== KHỞI TẠO ====================
loadPatients();
loadDoctors();

// Theo dõi sự thay đổi từ bệnh nhân hủy lịch
let lastAppointmentsCheck = JSON.stringify(localStorage.getItem('appointments'));
setInterval(() => {
    const currentAppointments = JSON.stringify(localStorage.getItem('appointments'));
    if (currentAppointments !== lastAppointmentsCheck) {
        console.log('🔄 Phát hiện sự thay đổi lịch khám từ bệnh nhân');
        loadPatients();
        loadDoctors();
        loadAppointments();
        lastAppointmentsCheck = currentAppointments;
    }
}, 1000);

// XÓA TẤT CẢ DỮ LIỆU LIÊN QUAN KHI HỦY LỊCH KHÁM
async function deleteRelatedData(appointmentId) {
    try {
        console.log('Đang xóa dữ liệu liên quan cho appointment:', appointmentId);

        // 1. Xóa tất cả hồ sơ bệnh nhân liên quan đến appointment này
        const patientRecordsResponse = await fetch('http://localhost:3000/api/patient-records');
        if (patientRecordsResponse.ok) {
            const patientRecordsData = await patientRecordsResponse.json();
            const allRecords = patientRecordsData.records || [];

            // Tìm tất cả records có appointmentId trùng khớp
            const recordsToDelete = allRecords.filter(record => record.appointmentId == appointmentId);

            for (const record of recordsToDelete) {
                try {
                    await fetch(`http://localhost:3000/api/patient-records/${record.id}`, {
                        method: 'DELETE'
                    });
                    console.log('Đã xóa hồ sơ:', record.id);
                } catch (error) {
                    console.error('Lỗi xóa hồ sơ:', record.id, error);
                }
            }
        }

        // 2. Xóa tất cả đơn thuốc liên quan đến appointment này
        const prescriptionsResponse = await fetch('http://localhost:3000/api/prescriptions');
        if (prescriptionsResponse.ok) {
            const prescriptionsData = await prescriptionsResponse.json();
            const allPrescriptions = prescriptionsData.prescriptions || [];

            // Tìm tất cả prescriptions có appointmentId trùng khớp
            const prescriptionsToDelete = allPrescriptions.filter(prescription => prescription.appointmentId == appointmentId);

            for (const prescription of prescriptionsToDelete) {
                try {
                    await fetch(`http://localhost:3000/api/prescriptions/${prescription.id}`, {
                        method: 'DELETE'
                    });
                    console.log('Đã xóa đơn thuốc:', prescription.id);
                } catch (error) {
                    console.error('Lỗi xóa đơn thuốc:', prescription.id, error);
                }
            }
        }

        console.log('Hoàn thành xóa dữ liệu liên quan cho appointment:', appointmentId);

    } catch (error) {
        console.error('Lỗi khi xóa dữ liệu liên quan:', error);
        // Không throw error để không làm gián đoạn quá trình hủy lịch
    }
}

loadAppointments();