// ==================== AUTH ====================
function getCurrentUser() {
    return JSON.parse(
        localStorage.getItem('current_user') ||
        sessionStorage.getItem('current_user') ||
        'null'
    );
}

(function checkAdmin() {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'admin.html';
    }
})();

// ==================== DỮ LIỆU ====================
let appointments = [];
let patients = [];
let doctors = [];
let services = [];
let chartInstance = null;

function loadData() {
    appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    patients = JSON.parse(localStorage.getItem('clinic_patients') || '[]'); // FIX KEY
    doctors = JSON.parse(localStorage.getItem('dental_doctors') || '[]');
    services = JSON.parse(localStorage.getItem('dental_services') || '[]');

    populateFilters();
    applyFilter();
}

// ==================== FILTER ====================
function populateFilters() {
    const doctorSelect = document.getElementById('filterDoctor');
    const serviceSelect = document.getElementById('filterService');

    if (!doctorSelect || !serviceSelect) return;

    doctorSelect.innerHTML = '<option value="all">Tất cả bác sĩ</option>';
    doctors.forEach(doc => {
        doctorSelect.innerHTML += `<option value="${doc.fullName}">${doc.fullName}</option>`;
    });

    serviceSelect.innerHTML = '<option value="all">Tất cả dịch vụ</option>';
    services.forEach(s => {
        serviceSelect.innerHTML += `<option value="${s.name}">${s.name}</option>`;
    });
}

// ==================== HELPER ====================
function formatCurrency(amount) {
    return amount.toLocaleString('vi-VN') + ' ₫';
}

// ==================== FILTER LOGIC ====================
function getFilteredAppointments() {
    const periodType = document.getElementById('periodType') ? .value;
    if (!periodType) return [];

    let startDate, endDate;

    if (periodType === 'day') {
        startDate = new Date(document.getElementById('startDate').value);
        endDate = new Date(document.getElementById('endDate').value);
        if (isNaN(startDate) || isNaN(endDate)) return [];
        endDate.setHours(23, 59, 59, 999);
    }

    if (periodType === 'month') {
        const val = document.getElementById('monthPicker').value;
        if (!val) return [];
        const [y, m] = val.split('-');
        startDate = new Date(y, m - 1, 1);
        endDate = new Date(y, m, 0, 23, 59, 59, 999);
    }

    if (periodType === 'year') {
        const y = parseInt(document.getElementById('yearPicker').value);
        if (!y) return [];
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59, 999);
    }

    const doctor = document.getElementById('filterDoctor') ? .value;
    const service = document.getElementById('filterService') ? .value;

    return appointments.filter(app => {
        const d = new Date(app.date);

        if (d < startDate || d > endDate) return false;
        if (doctor !== 'all' && app.doctor !== doctor) return false;
        if (service !== 'all' && app.service !== service) return false;

        return true;
    });
}

// ==================== STATS ====================
function calculateStats(list) {
    const active = list.filter(a => a.status !== 'cancelled' && a.status !== 'Đã hủy');

    const totalPatients = new Set(active.map(a => a.phone)).size;
    const totalAppointments = active.length;

    let revenue = 0;
    active.forEach(a => {
        if (a.status === 'completed' || a.status === 'Đã hoàn thành') {
            const s = services.find(x => x.name === a.service);
            if (s) revenue += s.price;
        }
    });

    return { totalPatients, totalAppointments, revenue };
}

// ==================== CHART ====================
function renderChart(list) {
    const ctx = document.getElementById('revenueChart') ? .getContext('2d');
    if (!ctx) return;

    if (chartInstance) chartInstance.destroy();

    const map = {};

    list.forEach(a => {
        if (a.status === 'completed' || a.status === 'Đã hoàn thành') {
            const s = services.find(x => x.name === a.service);
            if (!s) return;
            map[a.date] = (map[a.date] || 0) + s.price;
        }
    });

    const labels = Object.keys(map).sort();
    const data = labels.map(d => map[d]);

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Doanh thu',
                data,
                borderWidth: 2,
                fill: true
            }]
        }
    });
}

// ==================== TABLE ====================
function renderDetailTable(list) {
    const tbody = document.getElementById('detailTableBody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Không có dữ liệu</td></tr>';
        return;
    }

    let html = '';
    list.forEach(a => {
        const patient = patients.find(p => p.phone === a.phone);
        const service = services.find(s => s.name === a.service);

        const revenue = (a.status === 'completed' || a.status === 'Đã hoàn thành') && service ?
            service.price :
            0;

        html += `
        <tr>
            <td>${a.id}</td>
            <td>${patient?.fullName || a.name || ''}</td>
            <td>${a.doctor}</td>
            <td>${service?.name || a.service}</td>
            <td>${a.date}</td>
            <td>${a.time}</td>
            <td>${a.status}</td>
            <td>${formatCurrency(revenue)}</td>
        </tr>`;
    });

    tbody.innerHTML = html;
}

// ==================== APPLY ====================
function applyFilter() {
    const list = getFilteredAppointments();
    const stats = calculateStats(list);

    document.getElementById('totalPatients').innerText = stats.totalPatients;
    document.getElementById('totalAppointments').innerText = stats.totalAppointments;
    document.getElementById('totalRevenue').innerText = formatCurrency(stats.revenue);

    renderChart(list);
    renderDetailTable(list);
}

// ==================== UI ====================
function togglePeriodInputs() {
    const type = document.getElementById('periodType').value;

    document.getElementById('dateRangeGroup').style.display = type === 'day' ? 'flex' : 'none';
    document.getElementById('monthGroup').style.display = type === 'month' ? 'flex' : 'none';
    document.getElementById('yearGroup').style.display = type === 'year' ? 'flex' : 'none';
}

// ==================== EXPORT ====================
function exportToPDF() {
    const element = document.querySelector('.container');
    if (!element) return;

    const opt = {
        margin: 10,
        filename: `thong-ke-bao-cao-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
}

function exportToExcel() {
    const table = document.getElementById('detailTable');
    if (!table) return;

    const ws = XLSX.utils.table_to_sheet(table);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');

    XLSX.writeFile(wb, `thong-ke-bao-cao-${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ==================== LOGOUT  ====================
document.getElementById('logoutBtn') ? .addEventListener('click', () => {
    if (confirm('Bạn chắc chắn muốn thoát không?')) {
        window.location.href = 'admin.html'; // chỉ chuyển trang
    }
});

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    togglePeriodInputs();

    // EVENT 
    document.getElementById('periodType') ? .addEventListener('change', togglePeriodInputs);
    document.getElementById('applyFilterBtn') ? .addEventListener('click', applyFilter);
    document.getElementById('exportPdfBtn') ? .addEventListener('click', exportToPDF);
    document.getElementById('exportExcelBtn') ? .addEventListener('click', exportToExcel);
});