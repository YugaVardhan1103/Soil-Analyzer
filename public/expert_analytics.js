// =====================================================
// Expert Analytics Logic - expert_analytics.js (Real Data)
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    checkExpertAuth();
    injectSidebar();
    initTheme();
    initBackground();
    loadAndRenderAnalytics();
});

function loadAndRenderAnalytics() {
    fetch('/api/expert/reports')
        .then(res => res.json())
        .then(reports => {
            if (!reports || reports.length === 0) {
                showNoDataMessage();
                return;
            }
            renderNTrend(reports);
            renderCropDist(reports);
            renderPHDist(reports);
        })
        .catch(err => {
            console.error('Failed to load analytics data:', err);
        });
}

function showNoDataMessage() {
    const containers = ['nTrendChart', 'cropChart', 'phDistChart'];
    containers.forEach(id => {
        const ctx = document.getElementById(id);
        if (ctx) {
            const parent = ctx.parentElement;
            parent.innerHTML = '<p style="color:#888; font-size:12px; text-align:center; padding:20px;">No report data available yet.</p>';
        }
    });
}

function renderNTrend(reports) {
    const ctx = document.getElementById('nTrendChart');
    if (!ctx) return;

    // Group by month and calculate average N
    const monthlyData = {};
    reports.forEach(r => {
        const date = new Date(r.date);
        const month = date.toLocaleString('default', { month: 'short' });
        if (!monthlyData[month]) monthlyData[month] = { total: 0, count: 0 };
        monthlyData[month].total += r.n;
        monthlyData[month].count += 1;
    });

    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = Object.keys(monthlyData).sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    const data = labels.map(m => Math.round(monthlyData[m].total / monthlyData[m].count));

    const isLight = document.body.classList.contains('light-theme');
    const mainColor = isLight ? '#008a47' : '#00ff88';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Nitrogen (mg/kg)',
                data: data,
                borderColor: mainColor,
                backgroundColor: isLight ? 'rgba(0, 138, 71, 0.1)' : 'rgba(0, 255, 136, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function renderCropDist(reports) {
    const ctx = document.getElementById('cropChart');
    if (!ctx) return;

    const cropCounts = {};
    reports.forEach(r => {
        const crop = r.crop ? r.crop.charAt(0).toUpperCase() + r.crop.slice(1) : 'General';
        cropCounts[crop] = (cropCounts[crop] || 0) + 1;
    });

    const labels = Object.keys(cropCounts);
    const data = Object.values(cropCounts);
    const colors = ['#00ff88', '#00cc66', '#00994d', '#006633', '#88ffcc', '#22bb33', '#44dd55', '#119922', '#66ff99'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#aaa',
                        font: { size: 10, family: 'Roboto Mono' },
                        padding: 20,
                        usePointStyle: true
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function renderPHDist(reports) {
    const ctx = document.getElementById('phDistChart');
    if (!ctx) return;

    // Buckets: <5.0, 5.0-6.0, 6.0-7.0, 7.0-8.0, >8.0
    const buckets = { '<5.0': 0, '5.0-6.0': 0, '6.0-7.0': 0, '7.0-8.0': 0, '>8.0': 0 };
    reports.forEach(r => {
        if (r.ph < 5.0) buckets['<5.0']++;
        else if (r.ph <= 6.0) buckets['5.0-6.0']++;
        else if (r.ph <= 7.0) buckets['6.0-7.0']++;
        else if (r.ph <= 8.0) buckets['7.0-8.0']++;
        else buckets['>8.0']++;
    });

    const labels = Object.keys(buckets);
    const data = Object.values(buckets);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Reports',
                data: data,
                backgroundColor: '#00ff88'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}
