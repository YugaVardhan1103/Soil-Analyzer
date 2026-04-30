// =====================================================
// Admin Audit Logs Logic - admin_logs.js
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadLogs();
});

function loadLogs() {
    fetch('/api/admin/logs')
        .then(res => res.json())
        .then(logs => {
            const list = document.getElementById('logList');
            if (!list) return;

            if (logs.length === 0) {
                list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#666;">No audit records found.</td></tr>';
                return;
            }

            list.innerHTML = logs.map(log => {
                const date = new Date(log.timestamp).toLocaleString();
                const actionColor = log.action.includes('DELETE') ? '#ff4444' : (log.action.includes('UPDATE') ? '#ffaa00' : '#00ff88');

                return `<tr>
                    <td style="font-family: 'Roboto Mono'; font-size:11px; color:#888;">${date}</td>
                    <td style="font-weight:bold;">${log.adminEmail}</td>
                    <td><span style="color:${actionColor}; font-weight:bold;">${log.action}</span></td>
                    <td style="color: #ccc;">${log.targetId}</td>
                    <td style="font-size:12px; color:#888;">${log.details}</td>
                </tr>`;
            }).join('');
        })
        .catch(err => {
            console.error('Failed to load logs:', err);
            showToast('Failed to load logs', 'error');
        });
}
