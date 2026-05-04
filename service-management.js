// ==================== KIỂM TRA ĐĂNG NHẬP ADMIN ====================
(function checkAdmin() {
    const currentUser = localStorage.getItem('current_user');
    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang quản trị. Vui lòng đăng nhập bằng tài khoản admin.');
            window.location.href = 'login.html';
            return;
        }
    } catch (e) {
        window.location.href = 'login.html';
    }
})();

// ==================== DỮ LIỆU & LOCALSTORAGE ====================
let services = [];
let nextId = 1;

function loadServices() {
    const stored = localStorage.getItem('dental_services');
    if (stored) {
        services = JSON.parse(stored);
        if (services.length > 0) {
            nextId = Math.max(...services.map(s => s.id)) + 1;
        } else {
            nextId = 1;
        }
    } else {
        services = [];
        nextId = 1;
    }
    renderTable();
}

function saveServices() {
    localStorage.setItem('dental_services', JSON.stringify(services));
}

// Lắng nghe thay đổi từ tab khác (đồng bộ)
window.addEventListener('storage', (event) => {
    if (event.key === 'dental_services') {
        loadServices();
        showAlert('Dữ liệu đã được cập nhật từ tab khác!');
    }
});

// ==================== HÀM PHỤ TRỢ ====================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}

function showAlert(msg) {
    alert(msg);
}

function formatPrice(price) {
    return parseInt(price).toLocaleString('vi-VN');
}

// ==================== RENDER DANH SÁCH ====================
function renderTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    let filtered = services.filter(s => s.name.toLowerCase().includes(searchTerm));

    document.getElementById('totalCount').innerText = filtered.length;
    const tbody = document.getElementById('serviceTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><i class="fas fa-box-open"></i> Không có dịch vụ nào<br><span style="font-size:0.8rem;">Nhấn "Thêm dịch vụ" để tạo mới</span></td></tr>`;
        return;
    }

    let html = '';
    filtered.forEach(srv => {
        html += `
            <tr data-id="${srv.id}">
                <td>${srv.id}</td>
                <td><strong>${escapeHtml(srv.name)}</strong></td>
                <td>${escapeHtml(srv.description) || '—'}</td>
                <td>${formatPrice(srv.price)} VNĐ</td>
                <td>${srv.duration}</td>
                <td class="action-icons">
                    <button class="edit-btn" data-id="${srv.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${srv.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;

    // Gắn sự kiện cho các nút
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editService(parseInt(btn.dataset.id)));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteService(parseInt(btn.dataset.id)));
    });
}

// ==================== CRUD ====================
function addService(serviceData) {
    const newService = { id: nextId++, ...serviceData };
    services.push(newService);
    saveServices();
    renderTable();
    showAlert('✅ Thêm dịch vụ thành công!');
}

function updateService(id, updatedData) {
    const index = services.findIndex(s => s.id === id);
    if (index !== -1) {
        services[index] = {...services[index], ...updatedData };
        saveServices();
        renderTable();
        showAlert('✅ Cập nhật dịch vụ thành công!');
    }
}

function deleteService(id) {
    if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
        services = services.filter(s => s.id !== id);
        saveServices();
        renderTable();
        if (services.length === 0) nextId = 1;
        else nextId = Math.max(...services.map(s => s.id)) + 1;
        closeModal();
        showAlert('✅ Xóa dịch vụ thành công!');
    }
}

// ==================== MODAL THÊM/SỬA ====================
const modal = document.getElementById('serviceModal');
const modalTitle = document.getElementById('modalTitle');
const editIdField = document.getElementById('editId');
const nameInput = document.getElementById('serviceName');
const descInput = document.getElementById('description');
const priceInput = document.getElementById('price');
const durationSelect = document.getElementById('duration');
const form = document.getElementById('serviceForm');

function openModal(isEdit = false, service = null) {
    modal.style.display = 'flex';
    if (isEdit && service) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Sửa dịch vụ';
        editIdField.value = service.id;
        nameInput.value = service.name;
        descInput.value = service.description || '';
        priceInput.value = service.price;
        durationSelect.value = service.duration;
    } else {
        modalTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Thêm dịch vụ mới';
        editIdField.value = '';
        form.reset();
    }
}

function closeModal() {
    modal.style.display = 'none';
    form.reset();
}

function editService(id) {
    const service = services.find(s => s.id === id);
    if (service) {
        openModal(true, service);
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    const price = priceInput.value.trim();
    const duration = durationSelect.value;

    if (!name || !price || !duration) {
        alert('Vui lòng điền đầy đủ tên dịch vụ, chi phí và thời gian thực hiện!');
        return;
    }

    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) {
        alert('Chi phí phải là số lớn hơn 0!');
        return;
    }

    const editId = editIdField.value;
    if (editId) {
        updateService(parseInt(editId), { name, description, price: priceNum, duration });
    } else {
        addService({ name, description, price: priceNum, duration });
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
});

// ==================== ĐĂNG XUẤT ====================
document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('current_user');
        window.location.href = 'admin.html';
    }
});

// ==================== KHỞI TẠO ====================
loadServices();