// =====================================================
// Expert Dashboard Logic - expert_dashboard.js
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkExpertAuth();
    initTheme();
    injectSidebar();
    initBackground();
    loadDashboardStats();
    loadSystemNotifications();
});

function loadDashboardStats() {
    fetch('/api/expert/stats')
        .then(function(res) { return res.json(); })
        .then(function(stats) {
            document.getElementById('kpi-pending').innerText = stats.pendingReports;
            document.getElementById('kpi-pending-trend').innerText = stats.totalReports + ' total reports';
            document.getElementById('kpi-advisories').innerText = stats.totalAdvisories;
            document.getElementById('kpi-advisories-trend').innerText = stats.unreadAdvisories + ' unread by farmers';
            document.getElementById('kpi-coverage').innerText = stats.coverageRate + '%';
            document.getElementById('kpi-farmers').innerText = stats.totalFarmers;
            document.getElementById('welcome-pending').innerText = stats.pendingReports;
            
            // Populate activity feed with dummy data for now
            var list = document.getElementById('activityList');
            if (list) {
                list.innerHTML = `
                    <li><span class="time">Just Now</span> System statistics refreshed.</li>
                    <li><span class="time">10 min ago</span> Expert session started.</li>
                    <li><span class="time">Today</span> Monitoring ${stats.totalFarmers} active farmers.</li>
                `;
            }
            
            loadRecentAlerts();
        })
        .catch(function(err) {
            console.error('Failed to load dashboard stats:', err);
        });
}

function loadRecentAlerts() {
    fetch('/api/expert/reports')
        .then(function(res) { return res.json(); })
        .then(function(reports) {
            var container = document.getElementById('dynamicAlertsContainer');
            var badge = document.getElementById('alertCountBadge');
            if (!container) return;
            
            var alerts = [];
            reports.forEach(function(r) {
                if (!r.hasAdvisory && r.healthStatus === 'critical') {
                    alerts.push(`Critical ${r.crop} issue for ${r.email}`);
                }
            });
            
            if (alerts.length === 0) {
                container.innerHTML = '<p style="color:#888; font-size:12px;">No critical soil issues detected.</p>';
                badge.innerText = '0';
            } else {
                container.innerHTML = alerts.map(function(msg) {
                    return `<li><span class="badge urgent">CRITICAL</span> ${msg}</li>`;
                }).join('');
                badge.innerText = alerts.length;
            }
        });
}


function loadSystemNotifications() {
    var expertEmail = localStorage.getItem('userEmail') || 'expert@soil.com';
    fetch('/api/expert/advisories')
        .then(res => res.json())
        .then(advisories => {
            var container = document.getElementById('notificationsContainer');
            if (!container) return;

            // Filter for broadcasts sent to this specific expert
            var notifications = advisories.filter(a => a.farmerEmail === expertEmail);

            if (notifications.length === 0) {
                container.innerHTML = '<p style="color:#888; font-size:12px;">No new notifications from administration.</p>';
            } else {
                container.innerHTML = notifications.map(n => `
                    <li class="${n.status === 'unread' ? 'unread' : ''}" style="border-left: 3px solid #ff3e3e; padding-left: 10px; margin-bottom: 10px; list-style: none;">
                        <div style="font-size: 10px; color: #888;">${new Date(n.date).toLocaleString()}</div>
                        <div style="color: #eee; font-size: 12px; margin-top: 5px;">${n.message}</div>
                    </li>
                `).join('');
            }
        });
}


function sendExpertBroadcast() {
    var msgEl = document.getElementById('broadcastMsg');
    var message = msgEl ? msgEl.value.trim() : '';
    var expertEmail = localStorage.getItem('userEmail') || 'expert@soil.com';

    if (!message) {
        showToast('Please enter a message to broadcast.');
        return;
    }

    if (!confirm('Are you sure you want to send this alert to ALL registered farmers?')) return;

    showToast('🚀 Sending broadcast alert...');

    fetch('/api/expert/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            expertEmail: expertEmail,
            message: message
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.success) {
            showToast('📢 ALERT SENT: Broadcasted to ' + data.count + ' farmers.');
            if (msgEl) msgEl.value = '';
            loadDashboardStats();
        } else {
            showToast('Error: ' + (data.error || 'Broadcast failed'));
        }
    })
    .catch(function(err) {
        showToast('Network error: Could not send broadcast.');
        console.error('Broadcast Error:', err);
    });
}
