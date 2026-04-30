// =====================================================
// Admin Dashboard Logic - admin_dashboard.js
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadAdminStats();
    loadAuditLogs();
});

function loadAdminStats() {
    fetch('/api/admin/stats')
        .then(res => res.json())
        .then(data => {
            document.getElementById('stat-farmers').innerText = data.totalFarmers;
            document.getElementById('stat-experts').innerText = data.totalExperts;
            document.getElementById('stat-reports').innerText = data.totalReports;
            document.getElementById('stat-advisories').innerText = data.totalAdvisories;
            
            renderHealthChart(data.statusCounts);
        })
        .catch(err => {
            console.error('Failed to load admin stats:', err);
            showToast('Failed to load system stats', 'error');
        });
}

function renderHealthChart(counts) {
    var ctx = document.getElementById('healthStatusChart');
    if (!ctx) return;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Critical', 'Warning', 'Optimal'],
            datasets: [{
                data: [counts.critical, counts.warning, counts.optimal],
                backgroundColor: ['#ff4444', '#ffd700', '#00ff88'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: document.body.classList.contains('light-theme') ? '#444' : '#ccc' }
                }
            }
        }
    });
}

function loadAuditLogs() {
    fetch('/api/admin/logs')
        .then(res => res.json())
        .then(logs => {
            const list = document.getElementById('auditLogList');
            if (!list) return;
            
            if (logs.length === 0) {
                list.innerHTML = '<li style="color: #666;">No recent actions recorded.</li>';
                return;
            }

            list.innerHTML = logs.map(log => {
                const time = new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
                return `<li>
                    <span class="time">${time}</span> 
                    <strong style="color: #ff3e3e;">${log.action}</strong> by ${log.adminEmail} 
                    <div style="font-size: 10px; color: #888; margin-top: 2px;">${log.details}</div>
                </li>`;
            }).join('');
        })
        .catch(err => console.error('Failed to load audit logs:', err));
}

function sendAdminBroadcast() {
    const msg = document.getElementById('broadcastMsg').value;
    const target = document.getElementById('broadcastTarget').value;
    
    if (!msg) {
        showToast('Please enter a message', 'error');
        return;
    }

    fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, target: target })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast(`Broadcast sent to ${data.count} users!`);
            document.getElementById('broadcastMsg').value = '';
            loadAuditLogs();
        } else {
            showToast(data.error || 'Broadcast failed', 'error');
        }
    })
    .catch(err => showToast('Connection error', 'error'));
}
