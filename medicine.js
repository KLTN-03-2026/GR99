// ---------- DANH MỤC THUỐC PHÒNG KHÁM ----------
const pharmacyCatalog = [
    { id: 1, name: "Paracetamol 500mg", activeSubstance: "Paracetamol" },
    { id: 2, name: "Amoxicillin 500mg", activeSubstance: "Amoxicillin" },
    { id: 3, name: "Vitamin C 1000mg", activeSubstance: "Acid ascorbic" },
    { id: 4, name: "Ibuprofen 400mg", activeSubstance: "Ibuprofen" },
    { id: 5, name: "Omeprazol 20mg", activeSubstance: "Omeprazol" },
    { id: 6, name: "Loratadine 10mg", activeSubstance: "Loratadine" },
    { id: 7, name: "Salbutamol 100mcg", activeSubstance: "Salbutamol" },
    { id: 8, name: "Cefixime 200mg", activeSubstance: "Cefixime" },
    { id: 9, name: "Biseptol 480mg", activeSubstance: "Sulfamethoxazole + Trimethoprim" },
    { id: 10, name: "Diclofenac 50mg", activeSubstance: "Diclofenac" }
];

const usageOptions = [
    "Uống sau ăn", "Uống trước ăn", "Ngậm dưới lưỡi", "Bôi ngoài da", "Tiêm bắp", "Nhỏ mắt", "Xịt mũi"
];

let medications = [];
let nextMedId = 1;
let currentPrescriptionData = null;

// EmailJS init
if (window.emailjs && typeof window.emailjs.init === 'function') {
    window.emailjs.init("JXVQFkhTqnf_gLAfZ");
}

// DOM elements
const tbody = document.getElementById("drugTableBody");
const drugSearchInput = document.getElementById("drugSearchInput");
const suggestionsBox = document.getElementById("suggestionsBox");
const saveBtn = document.getElementById("savePrescriptionBtn");
const exportBtn = document.getElementById("exportPdfBtn");
const sendEmailBtn = document.getElementById("sendEmailBtn");
const exitBtn = document.getElementById("exitBtn");
const messageArea = document.getElementById("messageArea");
const specialNoteInput = document.getElementById("specialNote");
const reExamDateInput = document.getElementById("reExaminationDate");

// Load patient data from sessionStorage
function loadPatientData() {
    const data = sessionStorage.getItem('currentPrescriptionData');
    if (!data) {
        showMessage("❌ Không tìm thấy dữ liệu bệnh nhân. Vui lòng quay lại trang quản lý bệnh nhân.", "error");
        return false;
    }
    currentPrescriptionData = JSON.parse(data);

    // Populate patient info
    document.getElementById('patientName').textContent = currentPrescriptionData.patientName;
    document.getElementById('patientId').textContent = `BN-${currentPrescriptionData.patientId || currentPrescriptionData.appointmentId}`;
    document.getElementById('patientAge').textContent = currentPrescriptionData.patientAge ? `${currentPrescriptionData.patientAge} tuổi` : 'Chưa cập nhật';
    document.getElementById('patientGender').textContent = currentPrescriptionData.patientGender || 'Chưa cập nhật';
    document.getElementById('examDate').textContent = currentPrescriptionData.date || new Date().toLocaleDateString('vi-VN');
    document.getElementById('diagnosis').textContent = currentPrescriptionData.diagnosis;

    // Set default re-exam date to 7 days later
    const examDate = new Date();
}

// Helper: escape HTML
function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

// Hiển thị thông báo
function showMessage(msg, type) {
    messageArea.innerHTML = `<div class="${type === 'success' ? 'success-message' : 'error-message'}">${msg}</div>`;
    setTimeout(() => {
        if (messageArea.innerHTML.includes(msg)) {
            setTimeout(() => {
                if (messageArea.innerHTML.includes(msg)) clearMessage();
            }, 4000);
        }
    }, 3000);
}

function clearMessage() {
    if (messageArea) messageArea.innerHTML = "";
}

function buildEmailBody() {
    const note = specialNoteInput.value.trim() || '(Không có ghi chú)';
    const reExamDate = reExamDateInput.value ? new Date(reExamDateInput.value).toLocaleDateString('vi-VN') : 'Chưa đặt lịch';
    const medList = medications.map((med, index) => {
        const doses = [med.doseMorning, med.doseNoon, med.doseAfternoon, med.doseNight]
            .filter(Boolean)
            .join(' | ');
        return `${index + 1}. ${med.drugName} (${med.activeSub})\n   - Số lượng: ${med.quantity}\n   - Liều: ${doses || 'Chưa rõ'}\n   - Cách dùng: ${med.howToUse}\n   - Số ngày: ${med.days}`;
    }).join('\n\n');

    return `Đơn thuốc cho bệnh nhân: ${currentPrescriptionData.patientName}\nMã BN: ${currentPrescriptionData.patientId || currentPrescriptionData.appointmentId}\nNgày khám: ${currentPrescriptionData.date || new Date().toLocaleDateString('vi-VN')}\nChẩn đoán: ${currentPrescriptionData.diagnosis}\n\nDanh sách thuốc:\n${medList}\n\nGhi chú: ${note}\nLịch tái khám: ${reExamDate}\n\nTrân trọng,\nPhòng khám Aura Smile`;
}

async function sendPrescriptionEmail() {
    if (!currentPrescriptionData) {
        showMessage('❌ Không có dữ liệu bệnh nhân để gửi email.', 'error');
        return;
    }

    if (!currentPrescriptionData.patientEmail || currentPrescriptionData.patientEmail.trim() === '') {
        showMessage('❌ Không tìm thấy email bệnh nhân. Vui lòng cập nhật email trước khi gửi.', 'error');
        return;
    }

    const errors = validatePrescription();
    if (errors.length > 0) {
        showMessage('❌ Vui lòng nhập đầy đủ đơn thuốc trước khi gửi email.', 'error');
        return;
    }

    const email = currentPrescriptionData.patientEmail.trim();
    const name = currentPrescriptionData.patientName || 'Bệnh nhân';
    const message = buildEmailBody();
    const subject = `Đơn thuốc từ DentalCare - ${name}`;

    if (!window.emailjs || typeof window.emailjs.send !== 'function') {
        showMessage('❌ EmailJS chưa sẵn sàng. Vui lòng thử lại sau.', 'error');
        return;
    }

    const button = sendEmailBtn;
    const oldText = button ? button.innerHTML : 'Đang gửi...';
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang gửi...';
        button.disabled = true;
    }

    try {
        await window.emailjs.send('service_0csnmpb', 'template_kywmfeo', {
            to_name: name,
            to_email: email,
            subject,
            message
        });
        showMessage(`✅ Đã gửi đơn thuốc đến ${email}`, 'success');
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        showMessage('❌ Gửi email thất bại. Vui lòng thử lại.', 'error');
    } finally {
        if (button) {
            button.innerHTML = oldText;
            button.disabled = false;
        }
    }
}

// Render bảng thuốc
function renderDrugTable() {
    if (!tbody) return;
    if (medications.length === 0) {
        tbody.innerHTML = `<tr class="empty-row-msg"><td colspan="6">Chưa có thuốc nào. Vui lòng thêm thuốc từ danh mục bên dưới ➕</td></tr>`;
        return;
    }

    let html = "";
    medications.forEach((med) => {
                html += `<tr data-med-id="${med.id}">
                    <td class="drug-name-cell">
                        <div class="drug-name">${escapeHtml(med.drugName)}</div>
                        <div class="active-sub">${escapeHtml(med.activeSub)}</div>
                      </td>
                      <td>
                        <input type="number" min="0.5" step="0.5" class="quantity-input" value="${med.quantity}" data-field="quantity" style="width:90px; text-align:center;">
                      </td>
                      <td>
                        <div class="time-dose-group">
                            <div><input type="text" placeholder="Sáng" class="dose-input" data-dose="morning" value="${escapeHtml(med.doseMorning)}" style="width:65px;"><span class="time-label">Sáng</span></div>
                            <div><input type="text" placeholder="Trưa" class="dose-input" data-dose="noon" value="${escapeHtml(med.doseNoon)}" style="width:65px;"><span class="time-label">Trưa</span></div>
                            <div><input type="text" placeholder="Chiều" class="dose-input" data-dose="afternoon" value="${escapeHtml(med.doseAfternoon)}" style="width:65px;"><span class="time-label">Chiều</span></div>
                            <div><input type="text" placeholder="Tối" class="dose-input" data-dose="night" value="${escapeHtml(med.doseNight)}" style="width:65px;"><span class="time-label">Tối</span></div>
                        </div>
                      </td>
                      <td>
                        <select class="usage-select" data-field="howToUse">
                            ${usageOptions.map(opt => `<option value="${opt}" ${med.howToUse === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                      </td>
                      <td>
                        <input type="number" min="1" class="days-input" value="${med.days}" data-field="days" style="width:75px;">
                      </td>
                      <td>
                        <button class="delete-btn" data-id="${med.id}">🗑️</button>
                      </td>
                  </tr>`;
    });
    tbody.innerHTML = html;
    attachRowEvents();
}

// Gắn sự kiện realtime cho các input trong bảng
function attachRowEvents() {
    // Số lượng
    document.querySelectorAll('.quantity-input').forEach(input => {
        const row = input.closest('tr');
        const medId = parseInt(row.dataset.medId);
        input.addEventListener('change', function() {
            const med = medications.find(m => m.id === medId);
            if (med) med.quantity = parseFloat(this.value) || 0;
        });
    });
    // Liều dùng các buổi
    document.querySelectorAll('.dose-input').forEach(inp => {
        const row = inp.closest('tr');
        const medId = parseInt(row.dataset.medId);
        inp.addEventListener('change', function() {
            const med = medications.find(m => m.id === medId);
            if (!med) return;
            const doseType = this.getAttribute('data-dose');
            const val = this.value.trim();
            if (doseType === 'morning') med.doseMorning = val;
            else if (doseType === 'noon') med.doseNoon = val;
            else if (doseType === 'afternoon') med.doseAfternoon = val;
            else if (doseType === 'night') med.doseNight = val;
        });
    });
    // Cách dùng
    document.querySelectorAll('.usage-select').forEach(select => {
        const row = select.closest('tr');
        const medId = parseInt(row.dataset.medId);
        select.addEventListener('change', function() {
            const med = medications.find(m => m.id === medId);
            if (med) med.howToUse = this.value;
        });
    });
    // Số ngày
    document.querySelectorAll('.days-input').forEach(inp => {
        const row = inp.closest('tr');
        const medId = parseInt(row.dataset.medId);
        inp.addEventListener('change', function() {
            const med = medications.find(m => m.id === medId);
            if (med) med.days = parseInt(this.value) || 1;
        });
    });
    // Xóa thuốc
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const id = parseInt(this.dataset.id);
            medications = medications.filter(m => m.id !== id);
            renderDrugTable();
            clearMessage();
            showMessage("Đã xóa thuốc khỏi đơn.", "success");
        });
    });
}

// Thêm thuốc từ catalog
function addMedicationFromCatalog(drug) {
    const newMed = {
        id: nextMedId++,
        drugId: drug.id,
        drugName: drug.name,
        activeSub: drug.activeSubstance,
        quantity: 1.0,
        doseMorning: "",
        doseNoon: "",
        doseAfternoon: "",
        doseNight: "",
        howToUse: "Uống sau ăn",
        days: 5,
    };
    medications.push(newMed);
    renderDrugTable();
    clearMessage();
    showMessage(`✅ Đã thêm: ${drug.name} vào đơn thuốc. Vui lòng nhập đủ liều dùng & số lượng.`, "success");
    drugSearchInput.value = "";
    hideSuggestions();
}

// Validate đơn thuốc
function validatePrescription() {
    let errors = [];
    for (let med of medications) {
        const hasQuantity = med.quantity && med.quantity > 0;
        const hasDose = (med.doseMorning && med.doseMorning.trim() !== "") ||
                        (med.doseNoon && med.doseNoon.trim() !== "") ||
                        (med.doseAfternoon && med.doseAfternoon.trim() !== "") ||
                        (med.doseNight && med.doseNight.trim() !== "");
        if (!hasQuantity) {
            errors.push(`Thuốc "${med.drugName}": chưa nhập Số lượng hoặc số lượng không hợp lệ.`);
        }
        if (!hasDose) {
            errors.push(`Thuốc "${med.drugName}": chưa nhập Liều dùng (ít nhất một buổi Sáng/Trưa/Chiều/Tối).`);
        }
    }
    if (medications.length === 0) {
        errors.push("Chưa có thuốc nào trong đơn. Hãy thêm ít nhất một loại thuốc.");
    }
    return errors;
}

function updatePatientStatusToDone() {
    const patients = JSON.parse(localStorage.getItem('clinic_patients')) || [];
    if (patients.length === 0) return;

    const targetStatus = 'done';
    let updated = false;

    if (currentPrescriptionData.patientId) {
        const existingIndex = patients.findIndex(p => p.id === currentPrescriptionData.patientId);
        if (existingIndex !== -1) {
            patients[existingIndex] = { ...patients[existingIndex], status: targetStatus };
            updated = true;
        }
    }

    if (!updated && currentPrescriptionData.patientName) {
        const normalizedName = currentPrescriptionData.patientName.trim().toLowerCase();
        const normalizedPhone = (currentPrescriptionData.patientPhone || '').trim();
        const existingIndex = patients.findIndex(p =>
            p.fullName && p.fullName.trim().toLowerCase() === normalizedName &&
            (normalizedPhone === '' || (p.phone || '').trim() === normalizedPhone)
        );
        if (existingIndex !== -1) {
            patients[existingIndex] = { ...patients[existingIndex], status: targetStatus };
            updated = true;
        }
    }

    if (updated) {
        localStorage.setItem('clinic_patients', JSON.stringify(patients));
    }
}

// Lưu đơn thuốc
function savePrescription() {
    if (!currentPrescriptionData) {
        showMessage("❌ Dữ liệu bệnh nhân không hợp lệ.", "error");
        return false;
    }

    const validationErrors = validatePrescription();
    if (validationErrors.length > 0) {
        let errorHtml = `<div class="error-message">❌ <strong>Vui lòng sửa các lỗi sau:</strong><ul>`;
        validationErrors.forEach(err => {
            errorHtml += `<li>⚠️ ${err}</li>`;
        });
        errorHtml += `</ul></div>`;
        messageArea.innerHTML = errorHtml;
        return false;
    }

    const specialNote = specialNoteInput.value.trim() || "(Không có ghi chú)";
    const reExamDate = reExamDateInput.value ? new Date(reExamDateInput.value).toLocaleDateString('vi-VN') : "Chưa đặt lịch";
    
    const prescriptionData = {
        id: Date.now(),
        patientId: currentPrescriptionData.patientId || currentPrescriptionData.appointmentId,
        appointmentId: currentPrescriptionData.appointmentId,
        patientName: currentPrescriptionData.patientName,
        patientPhone: currentPrescriptionData.patientPhone,
        patientEmail: currentPrescriptionData.patientEmail,
        patientAge: currentPrescriptionData.patientAge,
        patientGender: currentPrescriptionData.patientGender,
        patientAddress: currentPrescriptionData.patientAddress,
        doctor: currentPrescriptionData.doctor || 'Bác sĩ',
        date: currentPrescriptionData.date || new Date().toLocaleDateString('vi-VN'),
        diagnosis: currentPrescriptionData.diagnosis,
        medications: medications.map(m => ({ ...m })),
        specialNote,
        reExamDate,
        createdAt: new Date().toLocaleDateString('vi-VN')
    };

    // Cập nhật trạng thái và lịch tái khám trong appointment
    if (currentPrescriptionData.appointmentId) {
        const appointments = JSON.parse(localStorage.getItem('appointments')) || [];
        const appointmentIndex = appointments.findIndex(a => a.id === currentPrescriptionData.appointmentId);
        if (appointmentIndex !== -1) {
            appointments[appointmentIndex] = {
                ...appointments[appointmentIndex],
                status: 'Đã hoàn thành',
                reExamDate: reExamDateInput.value || appointments[appointmentIndex].reExamDate || ''
            };
            localStorage.setItem('appointments', JSON.stringify(appointments));
        }
    }

    // Cập nhật trạng thái bệnh nhân sang đã xong
    updatePatientStatusToDone();

    // Lưu đơn thuốc
    let prescriptions = JSON.parse(localStorage.getItem('prescriptions')) || [];
    prescriptions.push(prescriptionData);
    localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
    
    // Lưu vào sessionStorage để có thể truy cập sau
    sessionStorage.setItem("lastPrescription", JSON.stringify(prescriptionData));
    
    showMessage(`💾 Đã lưu đơn thuốc vào hồ sơ bệnh nhân ${currentPrescriptionData.patientName} thành công! Ngày tái khám: ${reExamDate}`, "success");
    return true;
}

// Xuất PDF (in)
function exportToPDF() {
    if (medications.length === 0) {
        showMessage("⚠️ Chưa có thuốc nào trong đơn, vui lòng thêm thuốc trước khi in.", "error");
        return;
    }
    const patientName = currentPrescriptionData ? currentPrescriptionData.patientName.replace(/\s+/g, '_') : 'Benh_nhan';
    const originalTitle = document.title;
    document.title = `Don_thuoc_${patientName}`;
    window.print();
    document.title = originalTitle;
    showMessage("🖨️ Đã gửi yêu cầu in/Xuất PDF. Bạn có thể lưu dưới dạng PDF từ cửa sổ in.", "success");
}

function handleLogout() {
    const confirmExit = confirm("Bạn có chắc chắn muốn thoát về dashboard?");
    if (!confirmExit) return;

    showToast("Đang chuyển về dashboard...");

    // Redirect after a short delay to allow toast to show
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 800);
}

// Xử lý gợi ý tìm kiếm thuốc
let searchTimeout = null;
function renderSuggestions(drugs) {
    if (!suggestionsBox) return;
    if (drugs.length === 0) {
        suggestionsBox.style.display = "none";
        return;
    }
    suggestionsBox.innerHTML = drugs.map(drug => `
        <div class="suggestion-item" data-id="${drug.id}" data-name="${escapeHtml(drug.name)}" data-active="${escapeHtml(drug.activeSubstance)}">
            <div class="suggestion-name">${escapeHtml(drug.name)}</div>
            <div class="suggestion-active">Hoạt chất: ${escapeHtml(drug.activeSubstance)}</div>
        </div>
    `).join('');
    suggestionsBox.style.display = "block";
    document.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const id = parseInt(item.dataset.id);
            const selectedDrug = pharmacyCatalog.find(d => d.id === id);
            if (selectedDrug) addMedicationFromCatalog(selectedDrug);
            hideSuggestions();
        });
    });
}

function hideSuggestions() {
    if (suggestionsBox) suggestionsBox.style.display = "none";
}

drugSearchInput.addEventListener("input", function(e) {
    const keyword = e.target.value.trim().toLowerCase();
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (keyword === "") {
            hideSuggestions();
            return;
        }
        const filtered = pharmacyCatalog.filter(drug => 
            drug.name.toLowerCase().includes(keyword) || 
            drug.activeSubstance.toLowerCase().includes(keyword)
        );
        renderSuggestions(filtered);
    }, 200);
});

document.addEventListener("click", function(e) {
    if (!drugSearchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        hideSuggestions();
    }
});

// Sự kiện nút bấm
saveBtn.addEventListener("click", savePrescription);
exportBtn.addEventListener("click", exportToPDF);
sendEmailBtn.addEventListener("click", sendPrescriptionEmail);
exitBtn.addEventListener("click", exitApplication);

// ===== NÚT THOÁT (ĐÃ FIX) =====
function exitApplication() {
    const ok = confirm("Bạn có chắc chắn muốn thoát không?");

    if (!ok) return;

    // xoá dữ liệu tạm
    sessionStorage.removeItem("currentPrescriptionData");

    // thông báo nhẹ (không bắt buộc)
    showMessage("⏳ Đang quay về dashboard...", "success");

    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 700);
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    if (!loadPatientData()) return;
    renderDrugTable();
});