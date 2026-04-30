// =====================================================
// Expert Shared Logic - expert_shared.js
// =====================================================

function checkExpertAuth() {
    if (localStorage.getItem('loggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }
    const role = localStorage.getItem('userRole');
    if (role !== 'expert' && role !== 'admin') {
        window.location.href = 'index.html';
    } else {
        var email = localStorage.getItem('userEmail') || '';
        var el = document.getElementById('expertEmailDisplay');
        if (el) el.innerText = email;
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userEmail');
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


function showToast(msg) {
    var existing = document.getElementById('expert-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.id = 'expert-toast';
    toast.innerText = msg;
    toast.style.cssText = [
        'position:fixed', 'bottom:30px', 'left:50%', 'transform:translateX(-50%)',
        'background:#00ff88', 'color:#000', 'padding:12px 28px',
        'border-radius:5px', 'font-family:Roboto Mono,monospace', 'font-weight:bold',
        'font-size:13px', 'z-index:9999', 'box-shadow:0 0 20px rgba(0,255,136,0.5)',
        'transition:opacity 0.5s'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function() { toast.style.opacity = '0'; }, 2500);
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 3000);
}

function addActivityItem(text) {
    var list = document.getElementById('activityList');
    if (!list) return;
    
    var li = document.createElement('li');
    var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.innerHTML = '<span class="time">' + time + '</span> ' + text;
    list.prepend(li);
    if (list.children.length > 5) list.lastElementChild.remove();
}

function injectSidebar() {
    var sidebar = document.createElement('div');
    sidebar.className = 'expert-sidebar';
    
    var path = window.location.pathname;
    var isActive = function(p) { return path.includes(p) ? 'active' : ''; };

    sidebar.innerHTML = `
        <div class="sidebar-logo">TERRA<span>EXPERT</span></div>
        <nav class="sidebar-nav">
            <a href="expert_dashboard.html" class="nav-item ${isActive('dashboard')}">
                <i class="icon">📊</i> Dashboard
            </a>
            <a href="expert_reports.html" class="nav-item ${isActive('reports')}">
                <i class="icon">📋</i> Reports
            </a>
            <a href="expert_farmers.html" class="nav-item ${isActive('farmers')}">
                <i class="icon">👥</i> Farmers
            </a>
            <a href="expert_analytics.html" class="nav-item ${isActive('analytics')}">
                <i class="icon">📈</i> Analytics
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
            number: { value: 50, density: { enable: true, value_area: 800 } },
            color: { value: colorHex },
            shape: { type: 'circle' },
            opacity: { value: 0.3, random: false },
            size: { value: 2, random: true },
            line_linked: { enable: true, distance: 150, color: colorHex, opacity: 0.2, width: 1 },
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
