// ================= CURRENT USER =================
const current = JSON.parse(localStorage.getItem("current_user"));

if (!current) {
    window.location.href = "login.html";
}

const currentUser = current.username;


// ================= HEADER =================
function loadHeaderName() {
    const patients = JSON.parse(localStorage.getItem("dental_patients")) || [];
    const patient = patients.find(p => p.username === currentUser);

    let name = currentUser;

    if (patient) {
        name = patient.fullName || patient.fullname || currentUser;
    }

    const el = document.getElementById("headerName");
    if (el) el.innerText = name;
}


// ================= PROFILE =================
function loadProfile() {
    const patients = JSON.parse(localStorage.getItem("dental_patients")) || [];
    const patient = patients.find(p => p.username === currentUser);

    const profiles = JSON.parse(localStorage.getItem("profiles")) || {};
    const profile = profiles[currentUser] || {};

    const userInfo = {
        name: patient ? (patient.fullName || patient.fullname || currentUser) : currentUser,
        role: "Bệnh nhân",
        email: patient ? patient.email : "Chưa cập nhật",
        phone: patient ? patient.phone : "Chưa cập nhật",
        address: patient ? (patient.address || "Chưa cập nhật") : "Chưa cập nhật",
        patientId: profile.patientId || ("BN" + Math.floor(1000 + Math.random() * 9000)),
        photo: profile.photo || "images/bs nu.jpg"
    };

    // ===== HIỂN THỊ =====
    setText("profileName", userInfo.name);
    setText("profileRole", userInfo.role);
    setText("profileEmail", userInfo.email);
    setText("profilePhone", userInfo.phone);
    setText("profileAddress", userInfo.address);
    setText("patientId", userInfo.patientId);

    const img = document.getElementById("profileImage");
    if (img) img.src = userInfo.photo;

    // lưu lại profile (ảnh + id)
    profiles[currentUser] = userInfo;
    localStorage.setItem("profiles", JSON.stringify(profiles));
}


// ================= HELPER =================
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}


// ================= LOGOUT =================
function logout() {
    localStorage.removeItem("current_user");
    window.location.href = "login.html";
}


// ================= UPDATE PROFILE (🔥 QUAN TRỌNG NHẤT) =================
function updateProfile(data) {

    // ===== 1. UPDATE dental_patients (ADMIN) =====
    let patients = JSON.parse(localStorage.getItem("dental_patients")) || [];

    const index = patients.findIndex(p => p.username === currentUser);

    if (index !== -1) {
        patients[index] = {
            ...patients[index],
            fullName: data.name || patients[index].fullName,
            email: data.email || patients[index].email,
            phone: data.phone || patients[index].phone,
            address: data.address || patients[index].address
        };

        localStorage.setItem("dental_patients", JSON.stringify(patients));
    }

    // ===== 2. UPDATE profile (ảnh, UI riêng) =====
    const profiles = JSON.parse(localStorage.getItem("profiles")) || {};
    const profile = profiles[currentUser] || {};

    Object.assign(profile, data);

    profiles[currentUser] = profile;
    localStorage.setItem("profiles", JSON.stringify(profiles));

    // ===== 3. UPDATE NGAY TRONG TAB =====
    loadProfile();
    loadHeaderName();

    // ===== 4. TRIGGER TAB KHÁC =====
    window.dispatchEvent(new Event("storage"));
}


// ================= UPDATE ALL (🔥 NÚT CHÍNH) =================
function updateAllProfile() {

    const name = document.getElementById("nameInput")?.value.trim();
    const email = document.getElementById("emailInput")?.value.trim();
    const phone = document.getElementById("phoneInput")?.value.trim();
    const address = document.getElementById("addressInput")?.value.trim();

    let data = {};

    if (name) data.name = name;
    if (email) data.email = email;
    if (phone) data.phone = phone;
    if (address) data.address = address;

    if (Object.keys(data).length === 0) {
        alert("Không có dữ liệu để cập nhật!");
        return;
    }

    updateProfile(data);

    alert("Cập nhật thành công!");

    // clear input
    ["nameInput", "emailInput", "phoneInput", "addressInput"].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.value = "";
    });
}


// ================= EDIT =================
function editName() {
    const val = document.getElementById("nameInput").value.trim();
    if (!val) return alert("Nhập tên");
    updateProfile({ name: val });
}

function editEmail() {
    const val = document.getElementById("emailInput").value.trim();
    if (!val) return alert("Nhập email");
    updateProfile({ email: val });
}

function editPhone() {
    const val = document.getElementById("phoneInput").value.trim();
    if (!val) return alert("Nhập số điện thoại");
    updateProfile({ phone: val });
}

function editAddress() {
    const val = document.getElementById("addressInput").value.trim();
    if (!val) return alert("Nhập địa chỉ");
    updateProfile({ address: val });
}


// ================= UPLOAD PHOTO =================
function uploadPhoto() {
    const file = document.getElementById("photoInput").files[0];

    if (!file) return alert("Chọn ảnh");

    const reader = new FileReader();

    reader.onload = function(e) {
        updateProfile({ photo: e.target.result });
        alert("Đã cập nhật ảnh");
    };

    reader.readAsDataURL(file);
}


// ================= CHANGE PASSWORD =================
function changePassword() {
    const currentPass = document.getElementById("currentPassword").value.trim();
    const newPass = document.getElementById("newPassword").value.trim();
    const confirm = document.getElementById("confirmPassword").value.trim();

    if (!currentPass || !newPass || !confirm) return alert("Nhập đủ");

    if (newPass !== confirm) return alert("Không khớp");

    let patients = JSON.parse(localStorage.getItem("dental_patients")) || [];

    const patient = patients.find(p => p.username === currentUser);

    if (!patient) return alert("Không tìm thấy");

    if (patient.password !== currentPass) return alert("Sai mật khẩu");

    patient.password = newPass;

    localStorage.setItem("dental_patients", JSON.stringify(patients));

    alert("Đổi mật khẩu thành công");
    location.reload();
}


// ================= INIT =================
window.onload = function () {
    loadHeaderName();
    loadProfile();
};