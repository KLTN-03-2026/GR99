let appointments = [];
let currentPatient = null;

// ===== LOAD CURRENT USER =====
function loadCurrentPatient() {
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    if (!currentUser || currentUser.role !== 'patient') return null;

    return {
        name: currentUser.fullName,
        phone: currentUser.phone
    };
}

// ===== LOAD APPOINTMENTS =====
function loadAppointmentsFromStorage() {
    const stored = localStorage.getItem('appointments');

    if (!stored) {
        appointments = [];
        return;
    }

    try {
        const list = JSON.parse(stored);

        currentPatient = loadCurrentPatient();

        if (currentPatient && currentPatient.name && currentPatient.phone) {
            appointments = list.filter(app =>
                app.name === currentPatient.name &&
                app.phone === currentPatient.phone &&
                app.status !== 'Hủy' && app.status !== 'Đã hủy'
            );
        } else {
            appointments = list.filter(app =>
                app.status !== 'Hủy' && app.status !== 'Đã hủy'
            );
        }

        // 🔥 XÓA "CHỜ DUYỆT" → CHUYỂN THÀNH "ĐÃ XÁC NHẬN"
        appointments = appointments.map(app => {
            if (app.status === "Chờ duyệt") {
                app.status = "Đã xác nhận";
            }
            return app;
        });

    } catch {
        appointments = [];
    }

    console.log("Current Patient:", currentPatient);
    console.log("Appointments:", appointments);
}

// ===== FORMAT DATE =====
function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ===== STATUS =====
function getStatusClass(status) {
    switch (status) {
        case "Đã xác nhận":
            return "status-confirmed";
        case "Đã hoàn thành":
            return "status-completed";
        case "Hủy":
            return "status-cancelled";
        default:
            return "";
    }
}

function getStatusIcon(status) {
    if (status === "Đã xác nhận") return '<i class="fas fa-check-circle"></i>';
    if (status === "Đã hoàn thành") return '<i class="fas fa-clinic-medical"></i>';
    if (status === "Hủy") return '<i class="fas fa-ban"></i>';
    return '<i class="fas fa-question-circle"></i>';
}

// ===== RENDER =====
function renderTable() {
    const tbody = document.getElementById('tableData');

    if (!tbody) return;

    if (appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    Không có lịch khám
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    appointments.forEach(app => {

        let cleanNote = app.note || "";
        if (cleanNote === "Đã xác nhận") {
            cleanNote = "";
        }

        html += `
            <tr>
                <td>${app.doctor}</td>
                <td>${formatDate(app.date)} ${app.time}</td>
                <td>${app.service}</td>
                <td>${cleanNote}</td>

                <td>
                    <button 
                        onclick="cancelAppointment(${app.id})"
                        style="
                            background:#e74c3c;
                            color:white;
                            border:none;
                            padding:5px 10px;
                            border-radius:6px;
                            cursor:pointer;
                        "
                    >
                        Hủy
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ===== CANCEL =====
function cancelAppointment(id) {
    const confirmCancel = confirm("Bạn có chắc chắn muốn hủy lịch này không?");
    if (!confirmCancel) return;

    let list = JSON.parse(localStorage.getItem("appointments")) || [];

    list = list.map(app => {
        if (app.id == id) {
            if (app.status === "Hủy") return app;
            app.status = "Hủy";
        }
        return app;
    });

    localStorage.setItem("appointments", JSON.stringify(list));

    loadAppointmentsFromStorage();
    renderTable();

    alert("Đã hủy lịch thành công!");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", function() {
    loadAppointmentsFromStorage();
    renderTable();
});

// ===== HOME BUTTON =====
document.addEventListener("DOMContentLoaded", function() {
    const homeBtn = document.getElementById("homeBtn");

    if (homeBtn) {
        homeBtn.addEventListener("click", function(e) {
            e.preventDefault();
            window.location.href = "home.html";
        });
    }
});