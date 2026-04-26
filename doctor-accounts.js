// ==================== DỮ LIỆU ====================
let doctors = [];
let nextId = 1;

// ==================== LOAD ====================
function loadData() {
    const stored = localStorage.getItem('dental_doctors');

    if (stored) {
        doctors = JSON.parse(stored);

        doctors = doctors.map(d => ({
            id: d.id || 0,
            fullName: d.fullName || "",
            specialty: d.specialty || "",
            phone: d.phone || "",
            email: d.email || "",
            username: d.username || "",
            password: d.password || "",
            status: d.status || "active"
        }));
    } else {
        doctors = [{
            id: 1,
            fullName: "BS. Phạm Nguyễn Minh",
            specialty: "Răng hàm mặt",
            phone: "0901234567",
            email: "bs1@gmail.com",
            username: "bacsi1",
            password: "123456",
            status: "active"
        }];
        localStorage.setItem("dental_doctors", JSON.stringify(doctors));
    }

    nextId = doctors.length > 0 ?
        Math.max(...doctors.map(d => d.id || 0)) + 1 :
        1;

    renderTable();
}

// ==================== SAVE ====================
function saveData() {
    localStorage.setItem('dental_doctors', JSON.stringify(doctors));
}

// ==================== UTIL ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;'
    }[m]));
}

// XÓA DẤU TIẾNG VIỆT
function removeVietnameseTones(str) {
    return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// ==================== RENDER ====================
function renderTable() {
    const keyword = removeVietnameseTones(
        document.getElementById('searchInput').value.trim()
    );

    let filtered = doctors.filter(d =>
        removeVietnameseTones(d.fullName).includes(keyword) ||
        removeVietnameseTones(d.specialty).includes(keyword) ||
        removeVietnameseTones(d.email).includes(keyword) ||
        (d.phone || "").includes(keyword) ||
        removeVietnameseTones(d.username).includes(keyword)
    );

    document.getElementById('totalCount').innerText = filtered.length;

    const tbody = document.getElementById('doctorTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Không tìm thấy bác sĩ</td></tr>`;
        return;
    }

    let html = '';

    filtered.forEach(d => {
        const statusText = d.status === 'active' ? 'Đang làm việc' : 'Nghỉ việc';

        html += `
        <tr>
            <td>${d.id}</td>
            <td>${escapeHtml(d.fullName)}</td>
            <td>${escapeHtml(d.specialty)}</td>
            <td>${escapeHtml(d.phone)}</td>
            <td>${escapeHtml(d.email)}</td>
            <td>${statusText}</td>
            <td class="action-icons">
                <button class="edit-btn" onclick="editDoctor(${d.id})" title="Sửa thông tin">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="toggle-btn ${d.status === 'active' ? 'btn-lock' : 'btn-unlock'}" onclick="toggleStatus(${d.id})" title="${d.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}">
                    <i class="fas ${d.status === 'active' ? 'fa-lock' : 'fa-lock-open'}"></i>
                </button>
                <button class="delete-btn" onclick="deleteDoctor(${d.id})" title="Xóa bác sĩ">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ==================== ADD ====================
function addDoctor(data) {
    doctors.push({
        id: nextId++,
        ...data,
        status: data.status || "active"
    });

    saveData();
}

// ==================== EDIT ====================
function editDoctor(id) {
    const d = doctors.find(x => x.id === id);
    if (!d) return;

    document.getElementById("fullName").value = d.fullName;
    document.getElementById("specialty").value = d.specialty;
    document.getElementById("phone").value = d.phone;
    document.getElementById("email").value = d.email;
    document.getElementById("username").value = d.username;
    document.getElementById("password").value = d.password;
    document.getElementById("status").value = d.status;

    document.getElementById("editId").value = d.id;

    openModal();
}

// ==================== DELETE ====================
function deleteDoctor(id) {
    if (confirm("Xóa bác sĩ?")) {
        doctors = doctors.filter(d => d.id !== id);
        saveData();
        renderTable();
    }
}

// ==================== KHÓA / MỞ ====================
function toggleStatus(id) {
    const d = doctors.find(x => x.id === id);
    if (!d) return;

    d.status = d.status === 'active' ? 'inactive' : 'active';

    saveData();
    renderTable();
}

// ==================== MODAL ====================
function openModal() {
    document.getElementById("doctorModal").style.display = "flex";
}

function closeModal() {
    document.getElementById("doctorModal").style.display = "none";
}

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", function() {

    loadData();

    document.getElementById("openAddModalBtn").onclick = openModal;
    document.getElementById("closeModalBtn").onclick = closeModal;
    document.getElementById("cancelModalBtn").onclick = closeModal;

    window.onclick = function(e) {
        const modal = document.getElementById("doctorModal");
        if (e.target === modal) closeModal();
    };

    // ==================== NÚT THOÁT ====================
    const exitBtn = document.getElementById("exitBtn");

    if (exitBtn) {
        exitBtn.addEventListener("click", function() {

            const ok = confirm("Bạn có chắc muốn thoát khỏi trang quản lý bác sĩ?");
            if (!ok) return;

            exitBtn.disabled = true; // 🔥 chặn click lần 2

            window.location.href = "admin.html";
        });
    }

    // SUBMIT FORM (ADD + EDIT)
    document.getElementById("doctorForm").addEventListener("submit", function(e) {
        e.preventDefault();

        const id = document.getElementById("editId").value;

        const fullName = document.getElementById("fullName").value.trim();
        const specialty = document.getElementById("specialty").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const email = document.getElementById("email").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const status = document.getElementById("status").value;

        if (!fullName || !specialty || !phone || !email || !username || !password) {
            alert("Nhập đầy đủ!");
            return;
        }

        // check trùng username
        const isExist = doctors.some(d => d.username === username && d.id != id);
        if (isExist) {
            alert("Username đã tồn tại!");
            return;
        }

        if (id) {
            // UPDATE
            const index = doctors.findIndex(d => d.id == id);
            doctors[index] = {
                ...doctors[index],
                fullName,
                specialty,
                phone,
                email,
                username,
                password,
                status
            };
            alert("Cập nhật thành công!");
        } else {
            // ADD
            addDoctor({ fullName, specialty, phone, email, username, password, status });
            alert("Thêm bác sĩ thành công!");
        }

        saveData();
        renderTable();

        this.reset();
        document.getElementById("editId").value = "";
        closeModal();
    });

    // SEARCH
    document.getElementById("searchInput").addEventListener("input", renderTable);
});