// ==================== DỮ LIỆU & LOCALSTORAGE ====================
let customers = [];
let nextId = 1;

// Tải dữ liệu từ localStorage khi khởi động
function loadData() {
    const stored = localStorage.getItem('dental_patients');
    if (stored) {
        customers = JSON.parse(stored);

        //  đồng bộ dữ liệu cũ (fullname -> fullName)
        customers = customers.map(c => ({
            ...c,
            fullName: c.fullName || c.fullname || ""
        }));

        localStorage.setItem('dental_patients', JSON.stringify(customers));

        if (customers.length > 0) {
            nextId = Math.max(...customers.map(c => c.id || 0)) + 1;
        } else {
            nextId = 1;
        }
    } else {
        customers = [];
        nextId = 1; 
    }

    renderTable();
}

// Lưu dữ liệu vào localStorage
function saveData() {
    localStorage.setItem('dental_patients', JSON.stringify(customers));

    // 🔥 ép trigger realtime
    localStorage.setItem('dental_patients', JSON.stringify(customers));
}
// ==================== HÀM HIỂN THỊ ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function renderTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filtered = customers.filter(c =>
        c.fullName.toLowerCase().includes(searchTerm) ||
        c.email.toLowerCase().includes(searchTerm) ||
        c.phone.includes(searchTerm) ||
        (c.address && c.address.toLowerCase().includes(searchTerm))
    );

    document.getElementById('totalCount').innerText = filtered.length;
    const tbody = document.getElementById('customerTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7">Không có khách hàng</td>
            </tr>`;
        return;
    }

    let html = '';

    filtered.forEach(c => {
        const isActive = c.status === 'active';

        html += `
            <tr>
                <td>${c.id || "1"}</td>
                <td><strong>${escapeHtml(c.fullName)}</strong></td>
                <td>${escapeHtml(c.email)}</td>
                <td>${escapeHtml(c.phone)}</td>
                <td>${escapeHtml(c.address) || '—'}</td>

                <td>
                    <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                        <i class="fas ${isActive ? 'fa-check-circle' : 'fa-lock'}"></i>
                        ${isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                </td>

                <td class="action-icons">
                    <button class="edit-btn" onclick="editCustomer(${c.id})">
                        <i class="fas fa-edit"></i>
                    </button>

                    <button class="delete-btn" onclick="deleteCustomer(${c.id})">
                        <i class="fas fa-trash"></i>
                    </button>

                    <button class="toggle-btn ${isActive ? 'btn-lock' : 'btn-unlock'}"
                        onclick="toggleStatus(${c.id})">
                        <i class="fas ${isActive ? 'fa-lock' : 'fa-lock-open'}"></i>
                        ${isActive ? 'Khóa' : 'Mở'}
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ==================== CRUD ====================
function addCustomer(customerData) {
    const newCustomer = {
        id: nextId++,
        ...customerData
    };
    customers.push(newCustomer);
    saveData();
    renderTable();
}

function updateCustomer(id, updatedData) {
    const index = customers.findIndex(c => c.id === id);

    if (index !== -1) {
        customers[index] = {
            ...customers[index],
            ...updatedData
        };

        localStorage.setItem('dental_patients', JSON.stringify(customers));

        renderTable();
    }
}

function deleteCustomer(id) {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
        customers = customers.filter(c => c.id !== id);
        saveData();
        renderTable();
        // Nếu xóa xong mà không còn dữ liệu, reset nextId nếu cần (không bắt buộc)
        if (customers.length === 0) nextId = 1;
        else nextId = Math.max(...customers.map(c => c.id)) + 1;
        closeModal();
    }
}
// ==================== THÊM FUNCTION KHÓA / MỞ KHÓA ====================

function toggleStatus(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    customer.status = customer.status === 'active' ? 'inactive' : 'active';

    saveData();
    renderTable();
}

// ==================== MODAL HANDLING ====================
const modal = document.getElementById('customerModal');
const modalTitle = document.getElementById('modalTitle');
const editIdField = document.getElementById('editId');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const statusSelect = document.getElementById('status');
const form = document.getElementById('customerForm');

function openModal(isEdit = false, customer = null) {
    modal.style.display = 'flex';
    if (isEdit && customer) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Sửa thông tin khách hàng';
        editIdField.value = customer.id;
        fullNameInput.value = customer.fullName;
        emailInput.value = customer.email;
        phoneInput.value = customer.phone;
        addressInput.value = customer.address || '';
        statusSelect.value = customer.status;
    } else {
        modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Thêm khách hàng mới';
        editIdField.value = '';
        form.reset();
        statusSelect.value = 'active';
    }
}

function closeModal() {
    modal.style.display = 'none';
    form.reset();
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        openModal(true, customer);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const status = statusSelect.value;

    if (!fullName || !email || !phone) {
        alert('Vui lòng điền đầy đủ họ tên, email và số điện thoại');
        return;
    }

    // Kiểm tra email hợp lệ
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Email không hợp lệ');
        return;
    }

    const editId = editIdField.value;
    if (editId) {
        // Cập nhật
        updateCustomer(parseInt(editId), { fullName, email, phone, address, status });
        showAlert('Cập nhật thành công!');
    } else {
        // Thêm mới
        addCustomer({ fullName, email, phone, address, status });
        showAlert('Thêm khách hàng thành công!');
    }
    closeModal();
});

function showAlert(msg) {
    alert(msg); // Có thể thay bằng toast sau
}

// ==================== TÌM KIẾM ====================
document.getElementById('searchInput').addEventListener('input', renderTable);

// ==================== SỰ KIỆN MODAL ====================
document.getElementById('openAddModalBtn').addEventListener('click', () => openModal(false));
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// ==================== XỬ LÝ NÚT THOÁT ====================
document.getElementById('exitBtn').addEventListener('click', () => {
    const ok = confirm('Bạn có chắc chắn muốn thoát khỏi trang quản lý bệnh nhân?');
    
    if (!ok) return;

    window.location.href = 'admin.html';
});
// ==================== THÊM hàm KHÓA / MỞ ====================
function toggleStatus(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    if (customer.status === 'active') {
        if (!confirm("Bạn muốn KHÓA tài khoản này?")) return;
        customer.status = 'inactive';
    } else {
        if (!confirm("Bạn muốn MỞ lại tài khoản này?")) return;
        customer.status = 'active';
    }

    saveData();
    renderTable();
}

// ==================== KHỞI TẠO ====================
loadData();



window.addEventListener("storage", (e) => {
    if (e.key === "dental_patients") {
        loadData(); // reload bảng
    }
});
setInterval(() => {
    loadData();
}, 1000);