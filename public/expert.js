// =====================================================
// Expert Dashboard – expert.js (Real API Integration)
// =====================================================

// ---------- AUTH ----------
function checkExpertAuth() {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    var email = localStorage.getItem('userEmail') || '';
    if (!email.endsWith('@expert.com')) {
        window.location.href = 'index.html';
    } else {
        var el = document.getElementById('expertEmailDisplay');
        if (el) el.innerText = email;
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userEmail');
    window.location.href = 'login.html';
}

// ---------- THEME ----------
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    var isLight = document.body.classList.contains('light-theme');
    var lbl = document.getElementById('themeLabel');
    if (lbl) lbl.innerText = isLight ? 'LIGHT' : 'DARK';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    renderCharts();
}

function initTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light-theme');
        var toggle = document.getElementById('themeToggle');
        if (toggle) toggle.checked = true;
        var lbl = document.getElementById('themeLabel');
        if (lbl) lbl.innerText = 'LIGHT';
    }
}

// ---------- PARTICLES BACKGROUND ----------
function initBackground() {
    var pEl = document.getElementById('particles-js');
    if (!pEl || !window.particlesJS) return;
    pEl.innerHTML = '';
    var isLight = document.body.classList.contains('light-theme');
    var colorHex = isLight ? '#008a47' : '#00ff88';
    particlesJS('particles-js', {
        particles: {
            number: { value: 50, density: { enable: true, value_area: 800 } },
            color: { value: colorHex },
            shape: { type: 'circle' },
            opacity: { value: 0.3, random: false },
            size: { value: 2, random: true },
            line_linked: { enable: true, distance: 150, color: colorHex, opacity: 0.2, width: 1 },
            move: { enable: true, speed: 1, direction: 'none', out_mode: 'out' }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: true, mode: 'grab' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            }
        },
        retina_detect: true
    });
}

// ---------- GLOBAL STATE ----------
var allReports = [];
var currentReport = null;

// ---------- LOAD REAL REPORT QUEUE ----------
function loadReportQueue() {
    fetch('/api/expert/reports')
        .then(function(res) { return res.json(); })
        .then(function(reports) {
            allReports = reports;
            renderReportsList(allReports);
            populateAlerts();
        })
        .catch(function(err) {
            console.error('Failed to load reports:', err);
        });
}

function renderReportsList(reports) {
    var container = document.getElementById('reportQueue');
    if (!container) return;

    if (reports.length === 0) {
        container.innerHTML = '<p style="color:#888; font-size:12px;">No matching reports found.</p>';
        return;
    }

    var html = '';
    for (var i = 0; i < reports.length; i++) {
        var r = reports[i];
        var dateStr = new Date(r.date).toLocaleDateString();
        var cropName = r.crop ? r.crop.charAt(0).toUpperCase() + r.crop.slice(1) : 'General';
        
        var statusHtml = r.hasAdvisory 
            ? '<span class="badge active" style="background:rgba(0,255,136,0.1); border-color:rgba(0,255,136,0.3); color:var(--neon-green);">ADVISED</span>' 
            : '<span class="badge urgent" style="background:rgba(255,62,62,0.1); border-color:rgba(255,62,62,0.3); color:var(--error-red);">PENDING</span>';

        html += '<div class="queue-item' + (r.hasAdvisory ? '' : ' unread') + '">' +
            '<div class="queue-header">' +
                '<strong>' + r.email + ' - ' + cropName + '</strong>' +
                '<span class="date">' + dateStr + '</span>' +
            '</div>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-top: 15px; border-top: 1px solid rgba(0, 255, 136, 0.5); padding-top: 12px;">' +


                '<p style="margin:0; font-size:11px; opacity:0.8;">N: ' + r.n + ' | P: ' + r.p + ' | K: ' + r.k + ' | pH: ' + r.ph + '</p>' +
                statusHtml +
            '</div>' +
            '<button class="glow-button sm" style="margin-top:12px; width:100%;" onclick="loadAnalysisData(\'' + r._id + '\')">Analyze Report</button>' +
        '</div>';

    }

    container.innerHTML = html;
}

// ---------- FILTER REPORTS ----------
function filterReports() {
    var val = document.getElementById('statusFilter').value;
    if (!allReports) return;

    var filtered = allReports;

    if (val === 'pending') {
        filtered = allReports.filter(function(r) { return !r.hasAdvisory; });
    } else if (val === 'advised') {
        filtered = allReports.filter(function(r) { return r.hasAdvisory; });
    } else if (val === 'critical') {
        // Thresholds: N < 30, K < 40, or pH < 5.5
        filtered = allReports.filter(function(r) { 
            return r.n < 30 || r.k < 40 || r.ph < 5.5; 
        });
    } else if (val === 'optimal') {
        // Thresholds: N > 50, P > 40, K > 50, pH 6.0-7.5
        filtered = allReports.filter(function(r) {
            return r.n >= 50 && r.p >= 40 && r.k >= 50 && r.ph >= 6.0 && r.ph <= 7.5;
        });
    }

    renderReportsList(filtered);
}



// ---------- DYNAMIC ALERTS ----------
function populateAlerts() {
    var container = document.getElementById('dynamicAlertsContainer');
    var badge = document.getElementById('alertCountBadge');
    if (!container) return;

    var alerts = [];
    for (var i = 0; i < allReports.length; i++) {
        var r = allReports[i];
        var crop = r.crop ? r.crop.charAt(0).toUpperCase() + r.crop.slice(1) : 'Field';
        
        // Critical Logic
        if (r.n < 30) alerts.push({ type: 'critical', text: 'Nitrogen Critical: ' + r.email + ' (' + crop + ')', id: r._id });
        if (r.ph < 5.5) alerts.push({ type: 'warning', text: 'Low pH Warning: ' + r.email + ' (' + crop + ')', id: r._id });
        if (r.k < 40) alerts.push({ type: 'warning', text: 'Potassium Deficient: ' + r.email + ' (' + crop + ')', id: r._id });
    }

    if (alerts.length === 0) {
        container.innerHTML = '<p style="color:#888; font-size:12px;">No critical soil issues detected.</p>';
        badge.innerText = '0';
        badge.style.display = 'none';
        return;
    }

    badge.innerText = alerts.length;
    badge.style.display = 'inline-block';

    var html = '';
    for (var i = 0; i < alerts.length; i++) {
        var a = alerts[i];
        var cls = a.type === 'critical' ? 'alert-item critical' : 'alert-item warning';
        html += '<div class="' + cls + '" style="cursor:pointer; margin-bottom:8px;" onclick="loadAnalysisData(\'' + a.id + '\')">' +
                '⚠️ ' + a.text + '</div>';
    }
    container.innerHTML = html;
}

// ---------- LOAD ANALYSIS DATA ----------
function loadAnalysisData(id) {
    var data = null;
    for (var i = 0; i < allReports.length; i++) {
        if (allReports[i]._id === id) {
            data = allReports[i];
            break;
        }
    }
    if (!data) return;

    currentReport = data;

    var cropName = data.crop ? data.crop.charAt(0).toUpperCase() + data.crop.slice(1) : 'General';
    document.getElementById('currentReportId').innerText = '(' + data.email + ' - ' + cropName + ')';
    document.getElementById('exp-n').innerText = data.n;
    document.getElementById('exp-p').innerText = data.p;
    document.getElementById('exp-k').innerText = data.k;
    document.getElementById('exp-ph').innerText = data.ph;

    // Set hidden fields for advisory
    document.getElementById('currentReportFarmerEmail').value = data.email;
    document.getElementById('currentReportDbId').value = data._id;

    // Color code values
    document.getElementById('exp-n').style.color = data.n < 50 ? 'var(--error-red)' : 'var(--neon-green)';
    document.getElementById('exp-ph').style.color = data.ph < 6.0 ? '#ffd700' : 'var(--neon-green)';

    // AI Insight from recommendations
    var aiText = '';
    if (data.recommendations && data.recommendations.length > 0) {
        aiText = data.recommendations.join(' | ');
    } else {
        aiText = 'No AI recommendations available for this report.';
    }
    document.getElementById('aiInsightText').innerText = aiText;

    document.getElementById('advisoryText').value = '';

    // Always scroll to the analysis panel
    var panel = document.getElementById('analysisPanel');
    if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ---------- SEND ADVISORY ----------
function sendAdvisory() {
    var message = document.getElementById('advisoryText').value.trim();
    var farmerEmail = document.getElementById('currentReportFarmerEmail').value;
    var reportId = document.getElementById('currentReportDbId').value;
    var expertEmail = localStorage.getItem('userEmail') || '';

    if (!farmerEmail) {
        showToast('Please select and analyze a report first.');
        return;
    }
    if (!message) {
        showToast('Please write your advisory before sending.');
        return;
    }

    fetch('/api/expert/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            farmerEmail: farmerEmail,
            expertEmail: expertEmail,
            reportId: reportId || null,
            message: message
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.success) {
            showToast('Advisory sent to ' + farmerEmail + ' successfully!');
            document.getElementById('advisoryText').value = '';
            // Add to activity feed
            addActivityItem('Advisory sent to ' + farmerEmail);
            // Refresh stats
            loadStats();
        } else {
            showToast('Failed to send advisory: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(function(err) {
        showToast('Network error. Please try again.');
        console.error(err);
    });
}

// ---------- SAVE DRAFT ----------
function saveDraft() {
    var message = document.getElementById('advisoryText').value.trim();
    var farmerEmail = document.getElementById('currentReportFarmerEmail').value;
    if (!message) {
        showToast('Nothing to save.');
        return;
    }
    localStorage.setItem('expert_draft_' + farmerEmail, message);
    showToast('Draft saved locally for ' + (farmerEmail || 'current report') + '.');
}

// ---------- LOAD KPI STATS ----------
function loadStats() {
    fetch('/api/expert/stats')
        .then(function(res) { return res.json(); })
        .then(function(stats) {
            var kpiCards = document.querySelectorAll('.kpi-card');
            if (kpiCards.length >= 4) {
                // Pending Reports
                kpiCards[0].querySelector('.kpi-value').innerText = stats.pendingReports;
                kpiCards[0].querySelector('.kpi-trend').innerText = stats.totalReports + ' total reports';

                // Update Report Queue Header with Pending Count
                var pendingEl = document.getElementById('pendingReportsCount');
                if (pendingEl) {
                    pendingEl.innerText = stats.pendingReports + ' Pending';
                    pendingEl.className = 'badge urgent'; // Use urgent for better visibility
                    pendingEl.style.display = stats.pendingReports > 0 ? 'inline-block' : 'none';
                }


                // Advisories Sent
                kpiCards[1].querySelector('.kpi-value').innerText = stats.totalAdvisories;
                kpiCards[1].querySelector('.kpi-trend').innerText = stats.unreadAdvisories + ' unread by farmers';

                // Performance (Percentage of reports that have been addressed)
                var addressed = Math.max(0, stats.totalReports - stats.pendingReports);
                var rate = stats.totalReports > 0 ? Math.round((addressed / stats.totalReports) * 100) : 0;
                rate = Math.min(100, Math.max(0, rate)); // Ensure strictly 0-100%
                kpiCards[2].querySelector('.kpi-value').innerText = rate + '%';
                kpiCards[2].querySelector('.kpi-trend').innerText = 'Advisory Coverage Rate';


                // Active Farmers
                kpiCards[3].querySelector('.kpi-value').innerText = stats.totalFarmers;
                kpiCards[3].querySelector('.kpi-trend').innerText = 'Registered farmers';
            }
        })
        .catch(function(err) {
            console.error('Failed to load stats:', err);
        });
}

// ---------- LOAD FARMER DROPDOWN ----------
function loadFarmerDropdown() {
    fetch('/api/expert/farmers')
        .then(function(res) { return res.json(); })
        .then(function(farmers) {
            var sel = document.getElementById('farmerSelect');
            if (!sel) return;
            sel.innerHTML = '';
            for (var i = 0; i < farmers.length; i++) {
                var opt = document.createElement('option');
                opt.value = farmers[i].email;
                opt.innerText = farmers[i].email;
                sel.appendChild(opt);
            }
            
            if (farmers.length > 0) {
                sel.selectedIndex = 0;
                changeFarmer();
            }
        })
        .catch(function(err) {
            console.error('Failed to load farmers:', err);
        });
}


// ---------- FARMER DROPDOWN CHANGE ----------
function changeFarmer() {
    var sel = document.getElementById('farmerSelect');
    if (!sel) return;
    var email = sel.value;
    if (!email) return;

    var name = email.split('@')[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);

    var profileDiv = document.querySelector('.farmer-profile .profile-details');
    if (!profileDiv) return;

    profileDiv.innerHTML =
        '<img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random" alt="Avatar" class="avatar">' +
        '<div class="info">' +
            '<h4>' + name + '</h4>' +
            '<p>Email: ' + email + '</p>' +
            '<div class="status-tracker">' +
                '<span class="badge active">Registered Farmer</span>' +
            '</div>' +
        '</div>';
}

// ---------- ACTIVITY FEED ----------
function addActivityItem(text) {
    var list = document.getElementById('activityList');
    if (!list) return;
    var now = new Date();
    var timeStr = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    var li = document.createElement('li');
    li.innerHTML = '<span class="time">' + timeStr + '</span> ' + text;
    list.insertBefore(li, list.firstChild);
}

// ---------- CHARTS ----------
var trendsChart = null;
var distChart = null;

function renderCharts() {
    var isLight = document.body.classList.contains('light-theme');
    var colorGrid = isLight ? 'rgba(0,138,71,0.1)' : 'rgba(0,255,136,0.1)';
    var colorText = isLight ? '#444' : '#aaa';
    var mainColor = isLight ? '#008a47' : '#00ff88';

    var tCtx = document.getElementById('trendsChart');
    if (tCtx) {
        if (trendsChart) { trendsChart.destroy(); trendsChart = null; }
        trendsChart = new Chart(tCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Avg Soil Health Score',
                    data: [65, 68, 75, 72, 80, 85],
                    borderColor: mainColor,
                    backgroundColor: 'rgba(0,255,136,0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: colorGrid }, ticks: { color: colorText, font: { size: 10 } } },
                    y: { grid: { color: colorGrid }, ticks: { color: colorText, font: { size: 10 } } }
                }
            }
        });
    }

    var dCtx = document.getElementById('distributionChart');
    if (dCtx) {
        if (distChart) { distChart.destroy(); distChart = null; }
        distChart = new Chart(dCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Optimal', 'Deficient', 'Toxic'],
                datasets: [{
                    data: [60, 30, 10],
                    backgroundColor: [mainColor, '#ffd700', '#ff3e3e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: colorText, font: { size: 10 }, boxWidth: 10 }
                    }
                }
            }
        });
    }
}

// ---------- TOAST NOTIFICATION ----------
function showToast(msg) {
    var existing = document.getElementById('expert-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'expert-toast';
    toast.innerText = msg;
    toast.style.cssText = [
        'position:fixed', 'bottom:30px', 'left:50%', 'transform:translateX(-50%)',
        'background:#00ff88', 'color:#000', 'padding:12px 28px',
        'border-radius:5px', 'font-family:Roboto Mono,monospace', 'font-weight:bold',
        'font-size:13px', 'z-index:9999', 'box-shadow:0 0 20px rgba(0,255,136,0.5)',
        'transition:opacity 0.5s'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; }, 2500);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}

// ---------- QUICK ACTIONS ----------
function quickAction(type) {
    if (type === 'advisory') {
        var textarea = document.getElementById('advisoryText');
        if (textarea) textarea.focus();
        showToast('Write your advisory below and click Send to Farmer.');
    } else if (type === 'resample') {
        var farmer = document.getElementById('currentReportFarmerEmail').value;
        var reportId = document.getElementById('currentReportDbId').value;
        var expertEmail = localStorage.getItem('userEmail') || '';
        
        if (!farmer) { showToast('Select a report first.'); return; }
        
        var msg = '🚨 RESAMPLE REQUEST: I have reviewed your report and would like a fresh soil sample for more accurate results. Please re-test your field and submit a new analysis.';
        
        fetch('/api/expert/advisory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                farmerEmail: farmer,
                expertEmail: expertEmail,
                reportId: reportId || null,
                message: msg
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                showToast('Resample request sent to ' + farmer + '.');
                addActivityItem('Resample requested from ' + farmer);
            }
        })
        .catch(function(err) {
            showToast('Failed to send resample request.');
        });
    } else if (type === 'alert') {
        var expertEmail = localStorage.getItem('userEmail') || 'expert@soil.com';
        var msgEl = document.getElementById('broadcastMsg');
        var msg = msgEl ? msgEl.value : '';
        
        if (!msg || msg.trim() === "") {
            showToast('Please enter a message to broadcast.');
            if (msgEl) msgEl.focus();
            return;
        }


        showToast('Sending broadcast alert...');
        
        fetch('/api/expert/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                expertEmail: expertEmail,
                message: msg.trim()
            })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                showToast('📢 ALERT SENT: Broadcasted to ' + data.count + ' farmers.');
                addActivityItem('Broad alert: ' + msg.substring(0, 20) + '...');
                if (msgEl) msgEl.value = ''; // Clear the input
                loadStats();

            } else {
                showToast('Error: ' + (data.error || 'Broadcast failed'));
            }
        })
        .catch(function(err) {
            showToast('Network error: Could not send broadcast.');
            console.error('Broadcast Error:', err);
        });
    }

}

// ---------- FILTER ----------
function openFilters() {
    showToast('Filter panel coming soon!');
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', function() {
    checkExpertAuth();
    initTheme();
    initBackground();
    renderCharts();
    loadReportQueue();
    loadStats();
    loadFarmerDropdown();
});


