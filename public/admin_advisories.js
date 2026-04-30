// =====================================================
// Admin Advisory Tracking Logic - admin_advisories.js
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadAdvisories();
});

function loadAdvisories() {
    fetch('/api/admin/advisories')
        .then(res => res.json())
        .then(advisories => {
            const list = document.getElementById('advisoryList');
            if (!list) return;

            if (advisories.length === 0) {
                list.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:#666;">No communication history found.</td></tr>';
                return;
            }

            // Group broadcast messages to avoid individual listing
            const displayedAdvisories = [];
            const broadcastGroups = {}; // Key: message+date, Value: true

            advisories.forEach(a => {
                if (a.isBroadcast) {
                    const key = a.message + new Date(a.date).getTime();
                    if (!broadcastGroups[key]) {
                        broadcastGroups[key] = true;
                        displayedAdvisories.push({
                            ...a,
                            farmerEmail: '📢 ALL REGISTERED FARMERS',
                            isGroupedBroadcast: true
                        });
                    }
                } else {
                    displayedAdvisories.push(a);
                }
            });

            list.innerHTML = displayedAdvisories.map(a => {
                const date = new Date(a.date).toLocaleDateString() + ' ' + new Date(a.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                const statusColor = a.status === 'read' ? 'var(--neon-green)' : '#888';
                const farmerStyle = a.isGroupedBroadcast ? 'color: var(--neon-green); font-weight: bold;' : 'color: #ccc;';

                return `<tr>
                    <td style="font-weight:bold;">${a.expertEmail}</td>
                    <td style="${farmerStyle}">${a.farmerEmail}</td>
                    <td style="font-size:12px; color:#aaa; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${a.message}
                    </td>
                    <td>
                        <span style="color:${statusColor}; font-weight:bold; font-size:11px;">
                            ${a.isGroupedBroadcast ? 'BROADCAST' : a.status.toUpperCase()}
                        </span>
                    </td>
                    <td style="color:#666; font-size:11px;">${date}</td>
                </tr>`;
            }).join('');
        })
        .catch(err => {
            console.error('Failed to load advisories:', err);
            showToast('Failed to load advisories', 'error');
        });
}
