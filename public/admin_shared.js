// =====================================================
// Admin Shared Logic - admin_shared.js
// =====================================================

function checkAdminAuth() {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
        window.location.href = 'index.html';
    } else {
        const email = localStorage.getItem('userEmail');
        const el = document.getElementById('adminEmailDisplay');
        if (el) el.innerText = email;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function toggleTheme(initTheme = null) {
    if (initTheme === 'light') {
        document.body.classList.add('light-theme');
        var toggle = document.getElementById('themeToggle');
        if (toggle) toggle.checked = true;
    } else if (initTheme === 'dark') {
        document.body.classList.remove('light-theme');
        var toggle = document.getElementById('themeToggle');
        if (toggle) toggle.checked = false;
    } else {
        document.body.classList.toggle('light-theme');
    }
    
    var isLight = document.body.classList.contains('light-theme');
    var lbl = document.getElementById('themeLabel');
    if (lbl) lbl.innerText = isLight ? 'LIGHT' : 'DARK';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function initTheme() {
    var saved = localStorage.getItem('theme');
    if (saved === 'light') {
        toggleTheme('light');
    } else {
        toggleTheme('dark');
    }
}

function showToast(msg, type = 'success') {
    var existing = document.getElementById('admin-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.innerText = msg;
    
    const bgColor = type === 'success' ? '#00ff88' : '#ff4444';
    const textColor = type === 'success' ? '#000' : '#fff';

    toast.style.cssText = [
        'position:fixed', 'bottom:30px', 'left:50%', 'transform:translateX(-50%)',
        `background:${bgColor}`, `color:${textColor}`, 'padding:12px 28px',
        'border-radius:5px', 'font-family:Roboto Mono,monospace', 'font-weight:bold',
        'font-size:13px', 'z-index:9999', 'box-shadow:0 0 20px rgba(0,0,0,0.5)',
        'transition:opacity 0.5s'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; }, 2500);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}

function injectSidebar() {
    var sidebar = document.createElement('div');
    sidebar.className = 'expert-sidebar admin-sidebar'; // Reusing expert classes with admin tweak
    
    var path = window.location.pathname;
    var isActive = function(p) { return path.includes(p) ? 'active' : ''; };

    sidebar.innerHTML = `
        <div class="sidebar-logo" style="color: #ff3e3e;">TERRA<span>ADMIN</span></div>
        <nav class="sidebar-nav">
            <a href="admin_dashboard.html" class="nav-item ${isActive('dashboard')}">
                <i class="icon">🏠</i> Overview
            </a>
            <a href="admin_users.html" class="nav-item ${isActive('users')}">
                <i class="icon">👥</i> Users
            </a>
            <a href="admin_reports.html" class="nav-item ${isActive('reports')}">
                <i class="icon">📋</i> Reports
            </a>
            <a href="admin_advisories.html" class="nav-item ${isActive('advisories')}">
                <i class="icon">✉️</i> Advisories
            </a>
            <a href="admin_logs.html" class="nav-item ${isActive('logs')}">
                <i class="icon">📜</i> Audit Logs
            </a>
            <a href="admin_settings.html" class="nav-item ${isActive('settings')}">
                <i class="icon">⚙️</i> Settings
            </a>
        </nav>
        <div class="sidebar-footer">
            <button onclick="logout()" class="logout-btn">Logout</button>
        </div>
    `;
    document.body.prepend(sidebar);
    document.body.classList.add('has-sidebar');
}

function initBackground() {
    var pEl = document.getElementById('particles-js');
    if (!pEl || !window.particlesJS) return;
    pEl.innerHTML = '';
    var isLight = document.body.classList.contains('light-theme');
    var colorHex = isLight ? '#008a47' : '#00ff88';
    particlesJS('particles-js', {
        particles: {
            number: { value: 40, density: { enable: true, value_area: 800 } },
            color: { value: colorHex },
            shape: { type: 'circle' },
            opacity: { value: 0.2, random: false },
            size: { value: 2, random: true },
            line_linked: { enable: true, distance: 150, color: colorHex, opacity: 0.1, width: 1 },
            move: { enable: true, speed: 1, direction: 'none', out_mode: 'out' }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: { enable: true, mode: 'grab' },
                onclick: { enable: true, mode: 'push' },
                resize: true
            }
        },
        retina_detect: true
    });
}
