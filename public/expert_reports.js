// =====================================================
// Expert Reports Logic - expert_reports.js
// =====================================================

var allReports = [];

document.addEventListener('DOMContentLoaded', function() {
    checkExpertAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadReportQueue();
});

function loadReportQueue() {
    fetch('/api/expert/reports')
        .then(function(res) { return res.json(); })
        .then(function(reports) {
            allReports = reports;
            renderReportsList(allReports);
        })
        .catch(function(err) {
            console.error('Failed to load reports:', err);
        });
}

function renderReportsList(reports) {
    var container = document.getElementById('reportQueue');
    if (!container) return;

    if (reports.length === 0) {
        container.innerHTML = '<p style="color:#888; font-size:12px;">No reports match your criteria.</p>';
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

        html += '<div class="queue-item glass-panel' + (r.hasAdvisory ? '' : ' unread') + '" style="margin-bottom:0;">' +
            '<div class="queue-header">' +
                '<strong>' + r.email + '</strong>' +
                '<span class="date">' + dateStr + '</span>' +
            '</div>' +
            '<p style="font-size:12px; color:var(--neon-green); margin-bottom:10px;">Crop: ' + cropName + '</p>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; margin-top: 15px; border-top: 1px solid rgba(0, 255, 136, 0.5); padding-top: 12px;">' +
                '<p style="margin:0; font-size:11px; opacity:0.8;">N: ' + r.n + ' | P: ' + r.p + ' | K: ' + r.k + ' | pH: ' + r.ph + '</p>' +
                statusHtml +
            '</div>' +
            '<button class="glow-button sm" style="margin-top:15px; width:100%;" onclick="goToAnalysis(\'' + encodeURIComponent(JSON.stringify(r)) + '\')">Analyze Full Report</button>' +
        '</div>';
    }

    container.innerHTML = html;
}

function filterReports() {
    var query = document.getElementById('reportSearch').value.toLowerCase();
    var status = document.getElementById('statusFilter').value;
    
    var filtered = allReports.filter(function(r) {
        var email = (r.email || '').toLowerCase();
        var crop = (r.crop || '').toLowerCase();
        var matchesSearch = email.includes(query) || crop.includes(query);
        
        if (!matchesSearch) return false;
        
        if (status === 'all') return true;
        if (status === 'pending') return !r.hasAdvisory;
        if (status === 'advised') return r.hasAdvisory;
        if (status === 'critical') return r.n < 30 || r.k < 40 || r.ph < 5.5;
        if (status === 'optimal') return r.n >= 50 && r.p >= 40 && r.k >= 50 && r.ph >= 6.0 && r.ph <= 7.5;
        
        return true;
    });

    renderReportsList(filtered);
}

function goToAnalysis(reportJson) {
    localStorage.setItem('selectedReport', decodeURIComponent(reportJson));
    window.location.href = 'expert_analysis.html';
}
