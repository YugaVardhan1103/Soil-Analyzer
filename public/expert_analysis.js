// =====================================================
// Expert Analysis Logic - expert_analysis.js
// =====================================================

var currentReport = null;

document.addEventListener('DOMContentLoaded', function() {
    checkExpertAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadSelectedReport();
});

function loadSelectedReport() {
    var raw = localStorage.getItem('selectedReport');
    if (!raw) {
        window.location.href = 'expert_reports.html';
        return;
    }
    
    currentReport = JSON.parse(raw);
    
    // UI Update
    document.getElementById('farmer-name').innerText = currentReport.email.split('@')[0].toUpperCase();
    document.getElementById('farmer-email').innerText = currentReport.email;
    document.getElementById('farmer-avatar').src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentReport.email) + '&background=random';
    
    var statusBadge = document.getElementById('report-status-badge');
    statusBadge.innerText = currentReport.hasAdvisory ? 'ADVISED' : 'PENDING REVIEW';
    statusBadge.className = 'badge ' + (currentReport.hasAdvisory ? 'active' : 'urgent');
    
    document.getElementById('val-n').innerText = currentReport.n;
    document.getElementById('val-p').innerText = currentReport.p;
    document.getElementById('val-k').innerText = currentReport.k;
    document.getElementById('val-ph').innerText = currentReport.ph;
    
    generateAIInsights(currentReport);
}


function generateAIInsights(r) {
    var insights = document.getElementById('aiInsights');
    var text = "";
    
    if (r.n < 30) text += "❌ CRITICAL: Nitrogen levels are dangerously low for " + (r.crop || "most crops") + ". Immediate fertilization required. ";
    if (r.ph < 5.5) text += "⚠️ WARNING: Soil is highly acidic. Lime treatment recommended. ";
    if (r.n >= 50 && r.k >= 50) text += "✅ OPTIMAL: Macro-nutrients are in a healthy range for sustainable growth. ";
    
    if (!text) text = "Soil composition is stable. Minor adjustments to Potassium might improve yield.";
    
    insights.innerText = text;
}

function sendAdvisory() {
    var msg = document.getElementById('advisoryText').value;
    if (!msg.trim()) {
        showToast('Please enter an advisory message.');
        return;
    }
    
    var expertEmail = localStorage.getItem('userEmail') || '';
    
    fetch('/api/expert/advisory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            farmerEmail: currentReport.email,
            expertEmail: expertEmail,
            reportId: currentReport._id,
            message: msg
        })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        if (data.success) {
            showToast('Advisory sent successfully!');
            // Update local state
            currentReport.hasAdvisory = true;
            localStorage.setItem('selectedReport', JSON.stringify(currentReport));
            setTimeout(function() { window.location.href = 'expert_advisories.html'; }, 1500);
        }
    });
}

function requestResample() {
    var msg = "🚨 RESAMPLE REQUEST: I have reviewed your report and would like a fresh soil sample for more accurate results. Please re-test your field and submit a new analysis.";
    document.getElementById('advisoryText').value = msg;
    showToast('Template added. Click SEND to confirm.');
}
