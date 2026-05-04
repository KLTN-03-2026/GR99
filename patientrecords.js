// patientrecords.js - Hồ sơ khám bệnh | AURA SMILE

const API_BASE = 'http://localhost:3000/api';

// ===== TOAST =====
function showToast(message, isError = false) {
    let toast = document.getElementById('toastMsg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastMsg';
        toast.className = 'toast-message';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = isError ? '#c62828' : '#00897b';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===== UTILS =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m =>
        m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;'
    );
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

async function fetchJson(url, defaultValue = {}) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        return await res.json();
    } catch {
        return defaultValue;
    }
}

// ===== AUTH =====
async function checkDoctorAuth() {
    const user = JSON.parse(localStorage.getItem('current_user'));

    if (!user || user.role !== 'doctor') {
        showToast('❌ Không có quyền truy cập!', true);
        setTimeout(() => location.href = 'dashboard.html', 1500);
        return false;
    }

    return true;
}

// ===== LOAD DATA =====
async function loadAppointments() {
    const data = await fetchJson(`${API_BASE}/appointments`, {});
    let appointments = data.appointments || [];

    if (!Array.isArray(appointments) || !appointments.length) {
        appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    }

    window.allAppointments = appointments;
}

async function loadPatients() {
    const data = await fetchJson(`${API_BASE}/patients`, {});
    let patients = data.patients || [];

    if (!Array.isArray(patients) || !patients.length) {
        patients = JSON.parse(localStorage.getItem('dental_patients') || '[]');
    }

    window.allPatients = patients.map(p => ({
        ...p,
        fullName: p.fullName || p.fullname || ''
    }));
}

async function loadPatientRecords() {
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    window.patientRecords = {};

    if (!currentUser || currentUser.role !== 'doctor') return;

    const data = await fetchJson(`${API_BASE}/patient-records`, {});
    const records = data.records || [];

    records.forEach(r => {
        if (r.doctorId === currentUser.id) {
            if (!window.patientRecords[r.patientId]) {
                window.patientRecords[r.patientId] = [];
            }
            window.patientRecords[r.patientId].push(r);
        }
    });
}

async function initData() {
    await Promise.all([
        loadAppointments(),
        loadPatients(),
        loadPatientRecords()
    ]);
}

// ===== HIỂN THỊ LỊCH =====
function renderAppointmentList() {
    const tbody = document.getElementById('tableData');
    if (!tbody) return;

    const currentUser = JSON.parse(localStorage.getItem('current_user')) || {};
    const doctorId = String(currentUser.id || '');
    const doctorName = (currentUser.fullName || '').trim();

    const today = getTodayDate();

    const appointments = (window.allAppointments || [])
        .filter(app => {
            const appDoctorId = String(app.doctorId || '');
            const appDoctorName = String(app.doctor || app.doctorName || '').trim();

            const matchDoctor =
                appDoctorId === doctorId ||
                (appDoctorId === '' && appDoctorName === doctorName);

            const validDate = app.date >= today; // 🔥 CHỈ LẤY HÔM NAY + TƯƠNG LAI

            return matchDoctor && validDate;
        })
        .sort((a, b) => {
            const d1 = new Date(a.date + ' ' + (a.time || '00:00'));
            const d2 = new Date(b.date + ' ' + (b.time || '00:00'));
            return d1 - d2; // gần nhất trước
        });

    const patients = window.allPatients || [];

    if (!appointments.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">📭 Không có lịch hôm nay hoặc sắp tới</td></tr>`;
        return;
    }

    tbody.innerHTML = appointments.map(app => {
        const patient = patients.find(p =>
            Number(p.id) === Number(app.user) ||
            ((p.fullName || '').trim() === (app.name || '').trim() && p.phone === app.phone)
        );

        const email = patient ? patient.email : (app.email || '—');

        return `
        <tr>
            <td>${escapeHtml(app.name)}</td>
            <td>${escapeHtml(app.phone)}</td>
            <td>${escapeHtml(email)}</td>
            <td>${escapeHtml(app.doctor)}</td>
            <td>${escapeHtml(app.date)}</td>
            <td>${escapeHtml(app.time)}</td>
            <td>
                <button class="btn-view" data-id="${app.id}">Hồ sơ</button>
                <button class="btn-prescription" data-id="${app.id}">Kê đơn</button>
            </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.btn-view')
        .forEach(btn => btn.onclick = e => viewRecord(e.target.dataset.id));

    tbody.querySelectorAll('.btn-prescription')
        .forEach(btn => btn.onclick = e => createPrescription(e.target.dataset.id));
}

// ===== VIEW =====
function viewRecord(id) {
    const app = (window.allAppointments || []).find(a => Number(a.id) === Number(id));
    if (!app) return showToast('❌ Không tìm thấy!', true);

    document.getElementById('infoCard').style.display = 'block';
    document.getElementById('patientName').innerText = app.name;
    document.getElementById('date').innerText = app.date;

    localStorage.setItem('current_appointment_id', id);
}

// ===== SAVE =====
async function saveMedicalRecord() {
    const id = localStorage.getItem('current_appointment_id');
    if (!id) return showToast('Chọn bệnh nhân trước!', true);

    const symptom = document.getElementById('symptom').value;
    const diagnosis = document.getElementById('diagnosis').value;
    const treatment = document.getElementById('treatment').value;

    const user = JSON.parse(localStorage.getItem('current_user'));

    const data = {
        appointmentId: Number(id),
        symptom,
        diagnosis,
        treatment,
        doctorId: user.id,
        doctorName: user.fullName,
        createdAt: Date.now()
    };

    try {
        const res = await fetch(`${API_BASE}/patient-records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) throw new Error();

        showToast('✅ Lưu thành công');
        createPrescription(Number(id));

    } catch {
        showToast('❌ Lỗi server', true);
    }
}

// ===== PRESCRIPTION =====
function createPrescription(id) {
    localStorage.setItem('current_appointment_id', id);
    location.href = 'medicine.html';
}

// ===== CLEAR =====
function clearForm() {
    document.getElementById('symptom').value = '';
    document.getElementById('diagnosis').value = '';
    document.getElementById('treatment').value = '';
    localStorage.removeItem('current_appointment_id');
    document.getElementById('infoCard').style.display = 'none';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkDoctorAuth()) return;

    await initData();
    renderAppointmentList();

    document.getElementById('saveBtn')?.addEventListener('click', saveMedicalRecord);
    document.getElementById('clearBtn')?.addEventListener('click', clearForm);
});