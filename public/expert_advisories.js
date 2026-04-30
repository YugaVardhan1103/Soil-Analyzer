// =====================================================
// Expert Advisories Logic - expert_advisories.js
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkExpertAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadAdvisories();
});

function loadAdvisories() {
    fetch('/api/expert/advisories')
        .then(function(res) { return res.json(); })
        .then(function(advisories) {
            renderAdvisories(advisories);
        })
        .catch(function(err) {
            console.error('Failed to load advisories:', err);
        });
}

function renderAdvisories(list) {
    var container = document.getElementById('advisoriesList');
    if (!container) return;
    
    if (list.length === 0) {
        container.innerHTML = '<p style="color:#888; font-size:12px;">You haven\'t sent any advisories yet.</p>';
        return;
    }
    
    var html = '';
    var seenBroadcasts = new Set();
    
    list.forEach(function(a) {
        if (a.isBroadcast) {
            var broadcastKey = a.message + '_' + new Date(a.date).getTime();
            // Since multiple advisories for the same broadcast might have slightly different timestamps (within ms), 
            // we'll group by message and date (rounded to the nearest minute)
            var roundedDate = new Date(a.date);
            roundedDate.setSeconds(0, 0);
            broadcastKey = a.message + '_' + roundedDate.getTime();
            
            if (seenBroadcasts.has(broadcastKey)) return;
            seenBroadcasts.add(broadcastKey);
        }

        var dateStr = new Date(a.date).toLocaleString();
        var statusClass = a.status === 'read' ? 'active' : 'urgent';
        var statusLabel = a.status === 'read' ? 'READ BY FARMER' : 'UNREAD';
        
        var farmerDisplay = a.isBroadcast ? '<span style="color:#ffd700;">📢 ALL REGISTERED FARMERS</span>' : a.farmerEmail;
        var refDisplay = a.isBroadcast ? 'Broadcast Notice' : (a.reportId ? a.reportId : 'Manual Advisory');

        html += `
            <div class="queue-item glass-panel" style="margin-bottom:0; display:flex; flex-direction:column; gap:10px;">
                <div class="queue-header">
                    <strong style="color:var(--neon-green);">${farmerDisplay}</strong>
                    <span class="date">${dateStr}</span>
                </div>
                <div style="background:rgba(255,255,255,0.05); padding:15px; border-radius:5px; border-left:3px solid var(--neon-green);">
                    <p style="margin:0; font-size:13px; line-height:1.5;">${a.message}</p>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:11px; color:#666;">Ref: ${refDisplay}</span>
                    ${a.isBroadcast ? '' : `<span class="badge ${statusClass}">${statusLabel}</span>`}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
