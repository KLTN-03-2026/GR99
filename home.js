// ================= CURRENT USER =================
let currentUser = JSON.parse(localStorage.getItem("current_user")) || null;


// ================= INIT =================
window.onload = function() {
    updateUI();
    initBookButton();
    loadMainServices();
    loadProfile();
    initSearch();
    initTabs(); // Thêm khởi tạo tabs
};

// ================= INIT TABS =================
function initTabs() {
    // Populate sample data if not exists
    populateSampleData();

    // Ẩn tất cả tabs trước
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.style.display = 'none';
        tab.classList.remove('active');
    });

    // Bỏ active class từ tất cả tab links
    const allLinks = document.querySelectorAll('.tab-link');
    allLinks.forEach(link => link.classList.remove('active'));

    // Hiển thị tab đầu tiên (Trang chủ)
    const homeTab = document.getElementById('home-tab');
    const homeLink = document.querySelector('[data-tab="home-tab"]');

    if (homeTab) {
        homeTab.style.display = 'block';
        homeTab.classList.add('active');
    }

    if (homeLink) {
        homeLink.classList.add('active');
    }

    console.log('Tabs initialized');
}

// ================= POPULATE SAMPLE DATA =================
function populateSampleData() {
    // Force reload doctor data with images
    localStorage.removeItem('dental_doctors');

    // Only populate if data doesn't exist
    if (!localStorage.getItem('dental_services')) {
        const sampleServices = [
            { id: 1, name: "Khám tổng quát & Tư vấn", price: 200000, description: "Khám tổng quát răng miệng và tư vấn" },
            { id: 2, name: "Lấy cao răng", price: 300000, description: "Loại bỏ mảng bám và cao răng" },
            { id: 3, name: "Trám răng", price: 500000, description: "Trám răng bị sâu hoặc hỏng" },
            { id: 4, name: "Nhổ răng", price: 400000, description: "Nhổ răng sữa hoặc răng bệnh" },
            { id: 5, name: "Niềng răng", price: 50000000, description: "Dịch vụ chỉnh nha niềng răng" },
            { id: 6, name: "Trồng răng Implant", price: 15000000, description: "Trồng răng implant cao cấp" },
            { id: 7, name: "Tẩy trắng răng", price: 2000000, description: "Tẩy trắng răng chuyên nghiệp" },
            { id: 8, name: "Điều trị tủy răng", price: 1000000, description: "Điều trị tủy răng bị viêm" },
            { id: 9, name: "Phủ răng sứ", price: 3000000, description: "Phủ răng sứ thẩm mỹ" },
            { id: 10, name: "Chỉnh nha thẩm mỹ", price: 10000000, description: "Chỉnh nha không mắc cài" }
        ];
        localStorage.setItem('dental_services', JSON.stringify(sampleServices));
    }

    if (!localStorage.getItem('dental_doctors')) {
        const sampleDoctors = [
            { id: 1, fullName: "BS. Nguyễn Minh Hải", specialty: "Răng hàm mặt", phone: "0123456789", email: "hai@aura.com", image: "images/bs nam.jpg" },
            { id: 2, fullName: "BS. Trần Thị Lan", specialty: "Chỉnh nha", phone: "0987654321", email: "lan@aura.com", image: "images/bs nu.jpg" },
            { id: 3, fullName: "BS. Lê Văn Đức", specialty: "Nha khoa tổng quát", phone: "0912345678", email: "duc@aura.com", image: "images/bs nam.jpg" },
            { id: 4, fullName: "BS. Phạm Thị Mai", specialty: "Nha khoa trẻ em", phone: "0987123456", email: "mai@aura.com", image: "images/bs nu.jpg" },
            { id: 5, fullName: "BS. Hoàng Văn Tùng", specialty: "Phẫu thuật miệng", phone: "0934567890", email: "tung@aura.com", image: "images/bs nam.jpg" }
        ];
        localStorage.setItem('dental_doctors', JSON.stringify(sampleDoctors));
    }

    console.log('Sample data populated');
}


// ================= GET NAME (FIX UNDEFINED) =================
function getFullName() {
    if (!currentUser) return "Khách";

    const patients = JSON.parse(localStorage.getItem("dental_patients")) || [];
    const patient = patients.find(p => p.username === currentUser.username);

    if (patient) {
        return patient.fullName || patient.fullname || currentUser.username;
    }

    return currentUser.username;
}


// ================= UI =================
function updateUI() {
    let loginBtn = document.getElementById("loginBtn");
    let logoutBtn = document.getElementById("logoutBtn");
    let usernameEl = document.getElementById("username");

    // Ẩn tất cả button đặt lịch mặc định
    let bookBtns = document.querySelectorAll('.btn-book, .btn-main[onclick*="openBooking"], button[onclick*="openBooking"]');
    bookBtns.forEach(btn => {
        if (btn) btn.style.display = "none";
    });

    // default
    if (loginBtn) loginBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (usernameEl) usernameEl.innerText = "Khách";

    if (!currentUser) {
        // Hiển thị button đăng nhập để đặt lịch cho khách chưa đăng nhập
        let loginToBookBtn = document.getElementById("loginToBookBtn");
        let loginToBookBtnTop = document.getElementById("loginToBookBtnTop");
        if (loginToBookBtn) loginToBookBtn.style.display = "inline-block";
        if (loginToBookBtnTop) loginToBookBtnTop.style.display = "inline-block";
        return;
    }

    if (currentUser.role === "patient") {

        const name = getFullName();

        if (usernameEl) {
            usernameEl.innerText = "Xin chào, " + name;
        }

        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-block";

        // Hiển thị button đặt lịch cho bệnh nhân đã đăng nhập
        bookBtns.forEach(btn => {
            if (btn) btn.style.display = "inline-block";
        });

        // Ẩn button đăng nhập để đặt lịch
        let loginToBookBtn = document.getElementById("loginToBookBtn");
        let loginToBookBtnTop = document.getElementById("loginToBookBtnTop");
        if (loginToBookBtn) loginToBookBtn.style.display = "none";
        if (loginToBookBtnTop) loginToBookBtnTop.style.display = "none";

        updateBookingCount();
    }

    if (currentUser.role === "doctor") {
        alert("Bác sĩ không được vào trang bệnh nhân!");
        window.location.href = "dashboard.html";
    }
}


// ================= COUNT =================
function updateBookingCount() {
    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    let count = bookings.filter(b => b.user === (currentUser ? currentUser.username : null)).length;

    let el = document.getElementById("profileBookingCount");
    if (el) el.innerText = count;
}


// ================= LOGIN =================
function goToLogin() {
    window.location.href = "login.html";
}


// ================= LOGOUT =================
function logout() {
    localStorage.removeItem("current_user");
    window.location.href = "login.html";
}


// ================= MENU =================
function toggleMenu() {
    let sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("active");
}


// ================= OPEN BOOKING =================
function openBooking() {
    if (!currentUser || currentUser.role !== "patient") {
        alert("Bạn cần đăng nhập bệnh nhân!");
        return;
    }

    let modal = document.getElementById("bookingModal");
    if (modal) modal.style.display = "flex";
    loadDoctorsForBooking();
}


// ================= LOAD DOCTORS FOR BOOKING =================
async function loadDoctorsForBooking() {
    const select = document.getElementById("doctorSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Đang tải...</option>';

    try {
        const response = await fetch('http://localhost:3000/api/doctors');
        const data = await response.json();
        const doctors = data.doctors || [];

        select.innerHTML = '<option value="">Chọn bác sĩ</option>';
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor.id;
            option.textContent = `${doctor.fullName} - ${doctor.specialty}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi tải danh sách bác sĩ:', error);
        select.innerHTML = '<option value="">Không thể tải bác sĩ</option>';
    }
}

function closeBooking() {
    let modal = document.getElementById("bookingModal");
    if (modal) modal.style.display = "none";
}


// ================= BOOK =================
function book() {
    if (!currentUser || currentUser.role !== "patient") {
        alert("Vui lòng đăng nhập bệnh nhân!");
        return;
    }

    let nameInput = document.getElementById("name");
    let name = nameInput ? nameInput.value.trim() : "";
    let phoneInput = document.getElementById("phone");
    let phone = phoneInput ? phoneInput.value.trim() : "";
    let doctorSelect = document.getElementById("doctorSelect");
    let doctorId = doctorSelect ? doctorSelect.value : "";
    let dateInput = document.getElementById("date");
    let date = dateInput ? dateInput.value : "";

    if (!name || !phone || !doctorId || !date) {
        alert("Nhập đầy đủ thông tin và chọn bác sĩ!");
        return;
    }

    let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

    const fullname = getFullName();

    bookings.push({
        name: name,
        phone,
        doctorId,
        date,
        user: currentUser.username,
        fullname: fullname,
        status: "waiting",
        createdAt: Date.now()
    });

    localStorage.setItem("bookings", JSON.stringify(bookings));

    // 🔥 QUAN TRỌNG: trigger realtime cùng tab
    window.dispatchEvent(new Event("bookingUpdated"));

    alert("Đặt lịch thành công!");

    ["name", "phone", "date"].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.value = "";
    });
    if (doctorSelect) doctorSelect.value = "";

    closeBooking();
    updateBookingCount();
}



// ================= BUTTON BOOK =================
function initBookButton() {
    let bookBtn = document.querySelector(".btn-book");
    if (bookBtn) bookBtn.onclick = openBooking;
}


// ================= LOAD MAIN SERVICES ====\
// =============
function loadMainServices() {
    let services = JSON.parse(localStorage.getItem("dental_services")) || [];
    let serviceList = document.querySelector(".service-list");

    if (!serviceList) return;

    if (services.length === 0) {
        serviceList.innerHTML = '<div class="service"><h3>Chưa có dịch vụ</h3><p>Hãy liên hệ để biết thêm thông tin.</p></div>';
        return;
    }

    let html = '';
    services.forEach(service => {
        html += `
            <div class="service">
                <h3>${service.name || 'Dịch vụ'}</h3>
                <p>${service.description || 'Mô tả dịch vụ'}</p>
            </div>
        `;
    });
    serviceList.innerHTML = html;
}


// ================= OPEN SERVICES =================
function openServices() {
    let modal = document.getElementById("servicesModal");
    if (modal) {
        modal.style.display = "flex";
        renderServices();
    }
}

function closeServices() {
    let modal = document.getElementById("servicesModal");
    if (modal) modal.style.display = "none";
}

function renderServices() {
    let services = JSON.parse(localStorage.getItem("dental_services")) || [];
    let servicesContainer = document.getElementById("servicesList");

    if (!servicesContainer) return;

    if (services.length === 0) {
        servicesContainer.innerHTML = '<div class="no-services"><p>Không có dịch vụ nào</p></div>';
        return;
    }

    let html = '';
    services.forEach(service => {
        html += `
            <div class="service-card">
                <h4>${service.name || 'Không xác định'}</h4>
                <p class="description">${service.description || ''}</p>
                <div class="service-info">
                    <span class="price">💰 ${service.price ? service.price.toLocaleString('vi-VN') + ' VNĐ' : 'Liên hệ'}</span>
                    <span class="duration">⏱️ ${service.duration ? service.duration + ' phút' : 'Chưa xác định'}</span>
                </div>
            </div>
        `;
    });

    servicesContainer.innerHTML = html;
}

// ================= CLOSE MODAL ON CLICK OUTSIDE =================
window.addEventListener('click', (e) => {
    let modal = document.getElementById("servicesModal");
    if (modal && e.target === modal) {
        closeServices();
    }

    let doctorsModal = document.getElementById("doctorsModal");
    if (doctorsModal && e.target === doctorsModal) {
        closeDoctors();
    }

    let aboutModal = document.getElementById("aboutModal");
    if (aboutModal && e.target === aboutModal) {
        closeAbout();
    }

    let searchModal = document.getElementById("searchModal");
    if (searchModal && e.target === searchModal) {
        closeSearchModal();
    }
});


// ================= OPEN DOCTORS =================
function openDoctors() {
    let modal = document.getElementById("doctorsModal");
    if (modal) {
        modal.style.display = "flex";
        renderDoctors();
    }
}

function closeDoctors() {
    let modal = document.getElementById("doctorsModal");
    if (modal) modal.style.display = "none";
}

// ================= RENDER HOME TAB DOCTORS =================
function renderHomeTabDoctors() {
    let doctors = JSON.parse(localStorage.getItem("dental_doctors")) || [];
    let container = document.getElementById("homeTabDoctorList");

    if (!container) return;

    if (doctors.length === 0) {
        container.innerHTML = '<div class="no-items"><p>Đang tải dữ liệu bác sĩ...</p></div>';
        return;
    }

    let html = '';
    doctors.slice(0, 3).forEach(doctor => {
        const doctorImage = doctor.image || 'images/bs nam.jpg';
        const specialty = doctor.specialization || doctor.specialty || 'Bác sĩ nha khoa';
        const info = doctor.experience ? doctor.experience + ' kinh nghiệm' : 'Chuyên gia nha khoa';

        html += `
            <div class="doctor-item">
                <img class="doctor-avatar doctor-avatar-image" src="${doctorImage}" alt="${doctor.fullName || 'Bác sĩ'}">
                <h4>B.S. ${doctor.fullName || 'Không xác định'}</h4>
                <div class="doctor-specialty">${specialty}</div>
                <div class="doctor-info">${info}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Gọi renderHomeTabDoctors() khi trang tải
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHomeTabDoctors);
} else {
    renderHomeTabDoctors();
}


// ================= RENDER DOCTORS TAB =================
function renderDoctors() {
    let doctors = JSON.parse(localStorage.getItem("dental_doctors")) || [];
    let doctorsContainer = document.getElementById("doctorsList");

    if (!doctorsContainer) return;

    if (doctors.length === 0) {
        doctorsContainer.innerHTML = '<div class="no-items"><p>Không có bác sĩ nào</p></div>';
        return;
    }

    let html = '';
    doctors.forEach(doctor => {
        const doctorImage = doctor.image || 'images/bs nam.jpg';
        const avatarHtml = `<img src="${doctorImage}" alt="${doctor.fullName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 3px solid #1e88e5;">`;

        html += `
            <div class="doctor-card">
                <div class="doctor-avatar" style="width: 80px; height: 80px; background: transparent; border: none; margin: 0 auto 12px;">
                    ${avatarHtml}
                </div>
                <h4>${doctor.fullName || 'Không xác định'}</h4>
                <p class="specialization">${doctor.specialization || 'Bác sĩ nha khoa'}</p>
                <p class="experience">${doctor.experience ? 'Kinh nghiệm: ' + doctor.experience : 'Chuyên gia nha khoa'}</p>
                <p class="email">📧 ${doctor.email || 'Liên hệ phòng khám'}</p>
                <p class="phone">📱 ${doctor.phone || '1900 8040'}</p>
            </div>
        `;
    });

    doctorsContainer.innerHTML = html;
}


// ================= OPEN ABOUT =================
function openAbout() {
    let modal = document.getElementById("aboutModal");
    if (modal) {
        modal.style.display = "flex";
    }
}

function closeAbout() {
    let modal = document.getElementById("aboutModal");
    if (modal) modal.style.display = "none";
}


// ================= STORAGE EVENT LISTENER =================
window.addEventListener('storage', (event) => {

    if (event.key === 'dental_services') {
        loadMainServices();
    }

    if (event.key === 'dental_patients') {
        loadProfile();
        updateUI();
    }

    if (event.key === 'bookings') {
        updateBookingCount();
    }
});


// ================= LOAD PROFILE =================
function loadProfile() {
    if (!currentUser) return;

    const patients = JSON.parse(localStorage.getItem("dental_patients")) || [];

    const patient = patients.find(p => p.username === currentUser.username);

    if (!patient) return;

    // fix nhiều kiểu data
    const name = patient.fullName || patient.fullname || "--";
    const email = patient.email || "--";
    const phone = patient.phone || "--";

    let nameEl = document.getElementById("profileName");
    let emailEl = document.getElementById("profileEmail");
    let phoneEl = document.getElementById("profilePhone");

    if (nameEl) nameEl.innerText = name;
    if (emailEl) emailEl.innerText = email;
    if (phoneEl) phoneEl.innerText = phone;
}

// ================= UPDATE PROFILE (USER EDIT) =================

// update tên
function updateName() {
    let val = document.getElementById("nameInput");
    if (!val || !val.value.trim()) return alert("Nhập tên!");

    let patients = JSON.parse(localStorage.getItem("dental_patients")) || [];

    let index = patients.findIndex(p => p.username === currentUser.username);
    if (index === -1) return;

    patients[index].fullName = val;

    localStorage.setItem("dental_patients", JSON.stringify(patients));

    loadProfile();
    updateUI();
}

// update phone
function updatePhone() {
    let val = document.getElementById("phoneInput");
    if (!val || !val.value.trim()) return alert("Nhập SĐT!");

    let patients = JSON.parse(localStorage.getItem("dental_patients")) || [];

    let index = patients.findIndex(p => p.username === currentUser.username);
    if (index === -1) return;

    patients[index].phone = val;

    localStorage.setItem("dental_patients", JSON.stringify(patients));

    loadProfile();
}

// ================= SEARCH =================
function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
            if (query.length > 0) {
                performSearch(query);
                openSearchModal();
            } else {
                alert('Nhập từ khóa tìm kiếm');
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const query = this.value.trim().toLowerCase();
                if (query.length > 0) {
                    performSearch(query);
                    openSearchModal();
                } else {
                    alert('Nhập từ khóa tìm kiếm');
                }
            }
        });
    }
}

function performSearch(query) {
    const doctors = JSON.parse(localStorage.getItem('dental_doctors')) || [];
    const services = JSON.parse(localStorage.getItem('dental_services')) || [];

    const doctorResults = doctors.filter(doctor => {
        const doctorName = (doctor.fullName || doctor.name || '').toLowerCase();
        const doctorSpecialty = (doctor.specialization || doctor.specialty || '').toLowerCase();
        const doctorEmail = (doctor.email || '').toLowerCase();
        const doctorPhone = (doctor.phone || '').toLowerCase();
        const doctorExperience = (doctor.experience || '').toLowerCase();
        const doctorDescription = (doctor.description || doctor.bio || '').toLowerCase();
        const doctorDepartment = (doctor.department || '').toLowerCase();

        return doctorName.includes(query) ||
            doctorSpecialty.includes(query) ||
            doctorEmail.includes(query) ||
            doctorPhone.includes(query) ||
            doctorExperience.includes(query) ||
            doctorDescription.includes(query) ||
            doctorDepartment.includes(query) ||
            query.includes('bác sĩ') ||
            query.includes('bs') ||
            query.includes('nha khoa');
    });

    const serviceResults = services.filter(service => {
        const serviceName = (service.name || '').toLowerCase();
        const serviceDescription = (service.description || '').toLowerCase();
        const serviceCategory = (service.category || service.type || '').toLowerCase();
        return serviceName.includes(query) ||
            serviceDescription.includes(query) ||
            serviceCategory.includes(query) ||
            query.includes('dịch vụ');
    });

    displaySearchResults(doctorResults, serviceResults);
}

function displaySearchResults(doctors, services) {
    const resultsContent = document.getElementById('searchResultsContent');
    if (!resultsContent) return;

    const doctorCount = doctors.length;
    const serviceCount = services.length;

    let doctorHtml = '';
    if (doctorCount > 0) {
        doctors.forEach(doctor => {
            const doctorName = doctor.fullName || doctor.name || 'Không xác định';
            const doctorSpecialty = doctor.specialization || doctor.specialty || 'Nha khoa';
            const doctorStatus = doctor.status === 'inactive' ? 'Nghỉ việc' : 'Đang làm việc';
            doctorHtml += `
                <div class="search-result-card">
                    <strong>${doctorName}</strong>
                    <span>Chuyên khoa: ${doctorSpecialty}</span>
                    <small>${doctorStatus}</small>
                </div>
            `;
        });
    } else {
        doctorHtml = '<div class="search-empty">Không tìm thấy bác sĩ phù hợp.</div>';
    }

    let serviceHtml = '';
    if (serviceCount > 0) {
        services.forEach(service => {
            serviceHtml += `
                <div class="search-result-card">
                    <strong>${service.name || 'Không xác định'}</strong>
                    <span>${service.description || 'Mô tả chưa có'}</span>
                    <small>Giá: ${service.price ? service.price + ' VNĐ' : 'Liên hệ'}</small>
                </div>
            `;
        });
    } else {
        serviceHtml = '<div class="search-empty">Không tìm thấy dịch vụ phù hợp.</div>';
    }

    resultsContent.innerHTML = `
        <div class="search-tabs">
            <button class="search-tab active" data-tab="doctorTab">Bác sĩ (${doctorCount})</button>
            <button class="search-tab${serviceCount === 0 ? ' disabled' : ''}" data-tab="serviceTab">Dịch vụ (${serviceCount})</button>
        </div>
        <div class="tab-content active" id="doctorTab">
            ${doctorHtml}
        </div>
        <div class="tab-content" id="serviceTab">
            ${serviceHtml}
        </div>
    `;

    attachSearchTabEvents();
    openSearchModal();
}

function attachSearchTabEvents() {
    const tabs = document.querySelectorAll('.search-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            if (tab.classList.contains('disabled')) return;
            const selected = tab.getAttribute('data-tab');
            document.querySelectorAll('.search-tab').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            const activeContent = document.getElementById(selected);
            if (activeContent) activeContent.classList.add('active');
        });
    });
}

function openSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) modal.classList.add('active');
}

function closeSearchModal() {
    const modal = document.getElementById('searchModal');
    if (modal) modal.classList.remove('active');
}

function hideSearchResults() {
    closeSearchModal();
}

// ================= TAB MANAGEMENT =================
function showTab(tabId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log('Switching to tab:', tabId); // Debug log

    // Ẩn tất cả tabs
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none'; // Explicitly hide
    });

    // Bỏ active class từ tất cả tab links
    const tabLinks = document.querySelectorAll('.tab-link');
    tabLinks.forEach(link => link.classList.remove('active'));

    // Hiển thị tab được chọn
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.display = 'block'; // Explicitly show
        console.log('Tab shown:', tabId);

        // Tải dữ liệu bác sĩ cho tab được chọn
        if (tabId === 'home-tab') {
            renderHomeTabDoctors();
        } else if (tabId === 'doctors-tab') {
            renderDoctors();
            loadDoctorsTabData();
        }
    } else {
        console.error('Tab not found:', tabId);
    }

    // Thêm active class cho link được chọn
    const selectedLink = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedLink) {
        selectedLink.classList.add('active');
    }

    // Tải dữ liệu nếu cần
    if (tabId === 'services-tab') {
        loadServicesTabData();
    } else if (tabId === 'doctors-tab') {
        loadDoctorsTabData();
    }
}

function loadServicesTabData() {
    const services = JSON.parse(localStorage.getItem('dental_services')) || [];
    const servicesList = document.getElementById('servicesList');

    if (!servicesList) return;

    if (services.length === 0) {
        servicesList.innerHTML = '<div class="loading-message">Chưa có dịch vụ nào được thêm</div>';
        return;
    }

    let html = '<div class="service-list">';
    services.forEach(service => {
        html += `
            <div class="service-item">
                <h3>${escapeHtml(service.name || 'Dịch vụ')}</h3>
                <p>${escapeHtml(service.description || 'Mô tả chi tiết dịch vụ')}</p>
                <div class="service-price">${formatPrice(service.price || 0)} VNĐ</div>
                <div class="service-duration">⏱️ Thời gian: ${service.duration || 'Chưa xác định'}</div>
            </div>
        `;
    });
    html += '</div>';

    servicesList.innerHTML = html;
}

function loadDoctorsTabData() {
    const doctors = JSON.parse(localStorage.getItem('dental_doctors')) || [];
    const doctorsList = document.getElementById('doctorsList');

    if (!doctorsList) return;

    if (doctors.length === 0) {
        doctorsList.innerHTML = '<div class="loading-message">Chưa có bác sĩ nào được thêm</div>';
        return;
    }

    let html = '<div class="service-list">';
    doctors.forEach(doctor => {
        const statusText = doctor.status === 'active' ? '✅ Đang làm việc' : '⛔ Nghỉ việc';
        const avatarHtml = doctor.image ?
            `<img src="${doctor.image}" alt="${doctor.fullName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
            `<div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #1e88e5, #2bbbad); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 40px;">
                ${(doctor.fullName || 'BS').charAt(0).toUpperCase()}
              </div>`;
        html += `
            <div class="doctor-item">
                <div class="doctor-avatar">
                    ${avatarHtml}
                </div>
                <h4>${escapeHtml(doctor.fullName || 'Không xác định')}</h4>
                <div class="doctor-specialty">${escapeHtml(doctor.specialty || 'Bác sĩ nha khoa')}</div>
                <div class="doctor-info">📧 ${escapeHtml(doctor.email || 'Chưa cập nhật')}</div>
                <div class="doctor-info">📱 ${escapeHtml(doctor.phone || '1900 8040')}</div>
                <div class="doctor-info" style="color: ${doctor.status === 'active' ? '#4caf50' : '#f44336'}; margin-top: 10px; font-weight: 600;">
                    ${statusText}
                </div>
            </div>
        `;
    });
    html += '</div>';

    doctorsList.innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatPrice(price) {
    return parseInt(price || 0).toLocaleString('vi-VN');
}

// Lắng nghe thay đổi localStorage từ các tab khác
window.addEventListener('storage', (event) => {
    if (event.key === 'dental_services' && document.getElementById('services-tab').classList.contains('active')) {
        loadServicesTabData();
    }
    if (event.key === 'dental_doctors' && document.getElementById('doctors-tab').classList.contains('active')) {
        loadDoctorsTabData();
    }
});

// update address
function updateAddress() {
    let val = document.getElementById("addressInput");
    if (!val) return;
    val = val.value.trim();

    let patients = JSON.parse(localStorage.getItem("dental_patients")) || [];

    let index = patients.findIndex(p => p.username === currentUser.username);
    if (index === -1) return;

    patients[index].address = val;

    localStorage.setItem("dental_patients", JSON.stringify(patients));

    alert("Cập nhật thành công!");
}
const CLINIC_NAME = "Nha Khoa Aura Smile";
let isChatOpen = false;
let isAITyping = false;
let selectedImageData = null;

document.addEventListener('DOMContentLoaded', () => {
    initChat();
    setTimeout(() => document.getElementById('notif-badge').style.display = 'block', 2000);
});

function initChat() {
    const greet = `Chào bạn! 👋 Tôi là trợ lý AI từ **${CLINIC_NAME}**. Bạn có thể đặt câu hỏi hoặc **gửi hình ảnh răng miệng** để tôi phân tích nhé!`;
    addMessage('ai', greet);
}

function toggleChat(e) {
    if (e) e.stopPropagation(); // ❗ chặn lan sự kiện

    isChatOpen = !isChatOpen;

    const chat = document.getElementById('chat-window');
    if (isChatOpen) {
        chat.classList.add('open');
    } else {
        chat.classList.remove('open');
    }

    document.getElementById('notif-badge').style.display = 'none';

    if (isChatOpen) {
        setTimeout(() => document.getElementById('user-input').focus(), 300);
    }
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        const base64String = dataUrl.split(',')[1];
        selectedImageData = {
            base64: base64String,
            mimeType: file.type,
            dataUrl: dataUrl
        };
        document.getElementById('image-preview').src = dataUrl;
        document.getElementById('image-preview-container').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedImageData = null;
    document.getElementById('image-upload').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
}

async function sendMessageAI() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if ((!text && !selectedImageData) || isAITyping) return;

    input.value = '';
    input.style.height = 'auto';
    document.getElementById('send-btn').disabled = true;

    addMessage('user', text, selectedImageData ? selectedImageData.dataUrl : null);

    const payload = {
        message: text || "Hãy phân tích hình ảnh này giúp tôi.",
        image: selectedImageData ? {
            base64: selectedImageData.base64,
            mimeType: selectedImageData.mimeType
        } : null
    };

    removeImage();
    showTyping();
    isAITyping = true;

    try {
        const reply = await callBackend(payload);
        hideTyping();
        addMessage('ai', reply);
    } catch (err) {
        hideTyping();
        console.error(err);
        addMessage('ai', "⚠️ Xin lỗi, hệ thống AI gặp chút sự cố khi phân tích. Bạn thử lại nhé!");
    }

    isAITyping = false;
    document.getElementById('send-btn').disabled = false;
}

async function callBackend(payload) {
    const url = 'http://localhost:3000/api/chat';
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Lỗi kết nối đến server backend');
    const data = await res.json();
    return data.reply;
}

function sendQuick(text) {
    document.getElementById('user-input').value = text;
    sendMessageAI();
}

function addMessage(role, text, imageUrl = null) {
    const msgs = document.getElementById('messages');
    const time = new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar-sm ${role}`;
    avatar.textContent = role === 'ai' ? '🦷' : '👤';

    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}`;

    let bubbleContent = '';
    if (imageUrl) bubbleContent += `<img src="${imageUrl}" alt="Uploaded Image" />`;
    if (text) bubbleContent += formatText(text);
    bubbleContent += `<span class="time">${time}</span>`;

    bubble.innerHTML = bubbleContent;
    row.appendChild(avatar);
    row.appendChild(bubble);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
}

function formatText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
}

function showTyping() {
    const msgs = document.getElementById('messages');
    const row = document.createElement('div');
    row.className = 'msg-row ai';
    row.id = 'typing-row';
    row.innerHTML = `
                <div class="msg-avatar-sm ai">🦷</div>
                <div class="bubble ai"><div class="typing-dots"><span></span><span></span><span></span></div></div>
            `;
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
}

function hideTyping() {
    const row = document.getElementById('typing-row');
    if (row) row.remove();
}

function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessageAI();
    }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

// 🔥 realtime cùng tab
window.addEventListener("bookingUpdated", () => {
    updateBookingCount();
});