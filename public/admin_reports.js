// =====================================================
// Admin Report Monitoring Logic - admin_reports.js
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadReports();
});

function loadReports() {
    const statusFilter = document.getElementById('statusFilter').value;
    
    fetch('/api/admin/reports')
        .then(res => res.json())
        .then(reports => {
            const list = document.getElementById('reportList');
            if (!list) return;

            // Client-side filter for healthStatus (since it's a virtual/computed field)
            let filtered = reports;
            if (statusFilter !== 'all') {
                filtered = reports.filter(r => r.healthStatus === statusFilter);
            }
            
            if (filtered.length === 0) {
                list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#666;">No reports found.</td></tr>';
                return;
            }

            list.innerHTML = filtered.map(r => {
                const date = new Date(r.date).toLocaleDateString();
                const statusColors = {
                    critical: '#ff4444',
                    warning: '#ffd700',
                    optimal: '#00ff88'
                };
                const color = statusColors[r.healthStatus] || '#888';

                return `<tr>
                    <td style="font-weight:bold;">${r.email}</td>
                    <td style="color: var(--neon-green);">${r.crop.toUpperCase()}</td>
                    <td style="font-family: 'Roboto Mono'; font-size:12px;">
                        N:${r.n} P:${r.p} K:${r.k} <span style="color:#888;">(pH: ${r.ph})</span>
                    </td>
                    <td>
                        <span style="color:${color}; font-weight:bold; font-size:11px; letter-spacing:1px;">
                            ${r.healthStatus.toUpperCase()}
                        </span>
                    </td>
                    <td style="color:#666; font-size:11px;">${date}</td>
                </tr>`;
            }).join('');
        })
        .catch(err => {
            console.error('Failed to load reports:', err);
            showToast('Failed to load reports', 'error');
        });
}
