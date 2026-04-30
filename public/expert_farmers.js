// =====================================================
// Expert Farmers – expert_farmers.js
// =====================================================

var allFarmers = [];

function loadFarmers() {
    fetch('/api/expert/farmers')
        .then(function(res) { return res.json(); })
        .then(function(farmers) {
            allFarmers = farmers;
            renderFarmersList(allFarmers);
        })
        .catch(function(err) {
            console.error('Failed to load farmers:', err);
            document.getElementById('farmerList').innerHTML = '<p style="color:var(--error-red); font-size:12px;">Failed to load farmers.</p>';
        });
}

function renderFarmersList(farmers) {
    var container = document.getElementById('farmerList');
    if (!container) return;

    if (farmers.length === 0) {
        container.innerHTML = '<p style="color:#888; font-size:12px;">No farmers found.</p>';
        return;
    }

    var html = '';
    for (var i = 0; i < farmers.length; i++) {
        var f = farmers[i];
        var name = f.email.split('@')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);

        html += '<div class="queue-item">' +
            '<div style="display:flex; align-items:center; gap:15px;">' +
                '<img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random" class="avatar" style="width:50px; height:50px;">' +
                '<div>' +
                    '<strong style="color:#fff; font-size:16px;">' + name + '</strong>' +
                    '<p style="margin:5px 0 0 0; color:#aaa; font-size:12px; font-family:\'Roboto Mono\';">' + f.email + '</p>' +
                '</div>' +
            '</div>' +
            '<div style="margin-top:15px; padding-top:12px; border-top:1px solid rgba(0,255,136,0.1); display:flex; justify-content:space-between; align-items:center;">' +
                '<span class="badge active" style="font-size:9px;">FARMER</span>' +
                '<button class="glow-button sm outline" onclick="window.location.href=\'expert_advisories.html?email=' + encodeURIComponent(f.email) + '\'">View History</button>' +
            '</div>' +
        '</div>';
    }

    container.innerHTML = html;
}

function filterFarmers() {
    var query = document.getElementById('farmerSearch').value.toLowerCase();
    var filtered = allFarmers.filter(function(f) {
        return f.email.toLowerCase().includes(query);
    });
    renderFarmersList(filtered);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkExpertAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadFarmers();
});
