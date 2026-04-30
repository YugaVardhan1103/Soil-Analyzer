// Navigation and Theme Functions
function checkAuth() {
    const isLoginScreen = window.location.pathname.endsWith('login.html');
    if (localStorage.getItem('loggedIn') !== 'true' && !isLoginScreen) {
        window.location.href = 'login.html';
    }
}

async function processAuth(type) {
    const errorEl = document.getElementById('authError');
    let emailInput = '';
    let passwordInput = '';
    
    if (type === 'login') {
        const emailField = document.getElementById('loginUser');
        const passwordField = document.getElementById('loginPass');
        if(emailField) emailInput = emailField.value;
        if(passwordField) passwordInput = passwordField.value;
    } else {
        const emailField = document.getElementById('signupUser');
        const passwordField = document.getElementById('signupPass');
        if(emailField) emailInput = emailField.value;
        if(passwordField) passwordInput = passwordField.value;
    }

    // Strict email regex requiring a valid domain and TLD
    const emailRegex = /^[^\s@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailInput || !emailRegex.test(emailInput)) {
        errorEl.innerText = " Please enter a valid email address.";
        errorEl.classList.remove('hidden');
        return;
    }

    try {
        const endpoint = type === 'login' ? '/api/auth/login' : '/api/auth/signup';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput, password: passwordInput })
        });
        const data = await response.json();

        if (!response.ok) {
            errorEl.innerText = ` ${data.error || "Authentication failed"}`;
            errorEl.classList.remove('hidden');
            return;
        }

        errorEl.classList.add('hidden');
        
        if (type === 'login') {
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userRole', data.role);
            
            if (data.role === 'admin') {
                window.location.href = 'admin_dashboard.html';
            } else if (data.role === 'expert') {
                window.location.href = 'expert_dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            // After signup, switch to login form
            alert("Account created successfully! Please log in.");
            toggleAuthMode();
        }
    } catch (err) {
        errorEl.innerText = " Connection error. Is the server running?";
        errorEl.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    window.location.href = 'login.html';
}

function toggleAuthMode() {
    const login = document.getElementById('loginForm');
    const signup = document.getElementById('signupForm');
    const errorEl = document.getElementById('authError');
    if (errorEl) errorEl.classList.add('hidden'); // Clear errors when switching
    
    if (login && signup) {
        login.classList.toggle('hidden');
        signup.classList.toggle('hidden');
    }
}

function setupAuthListeners() {
    const loginInputs = ['loginUser', 'loginPass'];
    const signupInputs = ['signupUser', 'signupPass'];

    loginInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') processAuth('login');
            });
        }
    });

    signupInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') processAuth('signup');
            });
        }
    });
}

function toggleTheme(initTheme = null) {
    if (initTheme === 'light') {
        document.body.classList.add('light-theme');
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.checked = true;
    } else if (initTheme === 'dark') {
        document.body.classList.remove('light-theme');
    } else {
        document.body.classList.toggle('light-theme');
    }
    
    const isLight = document.body.classList.contains('light-theme');
    const label = document.getElementById('themeLabel');
    if (label) label.innerText = isLight ? "LIGHT" : "DARK";
    
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// TerraBot Functions
function toggleChat() {
    const chat = document.getElementById('chatWindow');
    chat.classList.toggle('hidden');
}

function handleChatPress(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function sendQuickReply(msg) {
    document.getElementById('chatInput').value = msg;
    const qrDiv = document.getElementById('quickReplies');
    if (qrDiv) qrDiv.style.display = 'none';
    sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    // Append User message
    const history = document.getElementById('chatHistory');
    history.insertAdjacentHTML('beforeend', `<div class="user-msg">${msg}</div>`);
    input.value = '';
    history.scrollTop = history.scrollHeight;

    // Add Thinking...
    const thinkId = 'think-' + Date.now();
    history.insertAdjacentHTML('beforeend', `<div class="bot-msg" id="${thinkId}">Analyzing query...</div>`);
    history.scrollTop = history.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await response.json();
        document.getElementById(thinkId).innerText = data.reply;
    } catch (err) {
        document.getElementById(thinkId).innerText = "[!] OFFLINE: Unable to reach TerraBot.";
    }
    history.scrollTop = history.scrollHeight;
}

function showAnalyzer() {
    document.getElementById('heroSection').classList.add('hidden');
    document.getElementById('analyzerSection').classList.remove('hidden');
}

function showHero() {
    document.getElementById('analyzerSection').classList.add('hidden');
    document.getElementById('heroSection').classList.remove('hidden');
}

// Soil Analysis Function
async function analyzeSoil() {
    const n = document.getElementById('n').value;
    const p = document.getElementById('p').value;
    const k = document.getElementById('k').value;
    const ph = document.getElementById('ph').value;
    const cropEl = document.getElementById('crop');
    const crop = cropEl ? cropEl.value : 'generic';
    const outputDiv = document.getElementById('output');
    const list = document.getElementById('recList');
    const btn = document.getElementById('scanBtn');

    // Field Validation
    if (!n || !p || !k || !ph) {
        outputDiv.classList.remove('hidden');
        list.innerHTML = `<li style="color: var(--error-red); font-weight: bold;">[!] ERROR: DATA_FIELDS_INCOMPLETE</li>`;
        return;
    }

    btn.innerText = "SCANNING CORE...";
    btn.disabled = true;

    try {
        const email = localStorage.getItem('userEmail');
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ n, p, k, ph, crop, email })
        });
        const data = await response.json();

        outputDiv.classList.remove('hidden');

        // --- NEW ENHANCED MATTER LOGIC ---
        const healthScoreEl = document.getElementById('healthScore');
        const summaryTitleEl = document.getElementById('summaryTitle');
        const summaryDescEl = document.getElementById('summaryDesc');
        const soilStatusEl = document.getElementById('soilStatus');
        const cropCompEl = document.getElementById('cropCompatibility');

        // Calculate Score: Start at 100, deduct 20 per recommendation (except profile loaded)
        const recommendations = data.results.filter(r => !r.includes("CROP PROFILE LOADED") && !r.includes("Status: OPTIMAL"));
        let score = 100 - (recommendations.length * 20);
        score = Math.max(score, 15); // Don't show 0
        if (data.results.some(r => r.includes("OPTIMAL"))) score = 100;

        healthScoreEl.innerText = score;

        // Set matter based on score
        if (score === 100) {
            summaryTitleEl.innerText = "Premium Soil Grade";
            summaryDescEl.innerText = "Your soil is in peak condition. The nutrient balance is perfect for maximizing yield without any further chemical input.";
            soilStatusEl.innerText = "EXCELLENT";
            soilStatusEl.style.color = "var(--neon-green)";
            cropCompEl.innerText = "100% MATCH";
        } else if (score >= 70) {
            summaryTitleEl.innerText = "Productive (Minor Needs)";
            summaryDescEl.innerText = "Soil is healthy but requires slight balancing. Minimal fertilizer application will push your crop to its full genetic potential.";
            soilStatusEl.innerText = "STABLE";
            soilStatusEl.style.color = "#88ffcc";
            cropCompEl.innerText = "85% COMPATIBLE";
        } else if (score >= 40) {
            summaryTitleEl.innerText = "Deficient (Needs Treatment)";
            summaryDescEl.innerText = "Significant nutrient gaps detected. Without treatment, you may face stunted growth and reduced fruit quality this season.";
            soilStatusEl.innerText = "RECOVERING";
            soilStatusEl.style.color = "#ffd700";
            cropCompEl.innerText = "60% POTENTIAL";
        } else {
            summaryTitleEl.innerText = "Critical Soil Condition";
            summaryDescEl.innerText = "Extreme imbalances or toxicity detected. Immediate soil remediation is required to prevent total crop loss.";
            soilStatusEl.innerText = "WARNING";
            soilStatusEl.style.color = "#ff4444";
            cropCompEl.innerText = "POOR MATCH";
        }

        // Render Recommendation list
        list.innerHTML = '';
        for (let res of data.results) {
            if (res.includes("CROP PROFILE LOADED")) continue;
            let li = document.createElement('li');
            li.innerHTML = `<span>></span> ${res}`;
            list.appendChild(li);
        }

        const hasError = data.results.some(r => r.includes('Error'));
        const chartContainer = document.querySelector('.chart-container');

        if (hasError) {
            if (yieldChart) { yieldChart.destroy(); yieldChart = null; }
            chartContainer.classList.add('glitch-canvas');
        } else {
            chartContainer.classList.remove('glitch-canvas');
            renderYieldChart(n, p, k);

            
        }
    } catch (err) {
        list.innerHTML = `<li style="color: orange;">[!] CONNECTION_FAILURE</li>`;
    } finally {
        btn.innerText = "START ANALYSIS";
        btn.disabled = false;
    }
}

// Render Yield Visualization Chart
let yieldChart = null;

function renderYieldChart(n, p, k) {
    const ctx = document.getElementById('yieldChart').getContext('2d');
    if (yieldChart) yieldChart.destroy();

    // Theoretical response curves generator
    const genLine = (maxYield, optX) => {
        let pts = [];
        for (let x = 0; x <= 100; x += 5) {
            let y = maxYield - Math.pow((x - optX), 2) / 60;
            pts.push({ x: x, y: Math.max(10, y) });
        }
        return pts;
    };

    const highData = genLine(95, 75);
    const medData = genLine(75, 65);
    const lowData = genLine(55, 60);

    // Estimate current status based on inputs
    let totalInput = parseFloat(n || 0) + parseFloat(p || 0) + parseFloat(k || 0);
    // Rough normalization assumption that input values are around 0-100 range combined
    let currentX = Math.min(80, Math.max(0, totalInput / 1.5));
    // Placed upon the medium curve
    let currentY = 75 - Math.pow((currentX - 65), 2) / 60;

    // Optimal point Target (After)
    let optimalX = 65;
    let optimalY = 75;

    // Adapt colors dynamically with the theme
    const isLight = document.body.classList.contains('light-theme') || document.body.classList.contains('pdf-capture-temp');
    const colorGrid = isLight ? 'rgba(0,138,71,0.2)' : 'rgba(0,255,136,0.2)';
    const colorText = isLight ? '#222222' : '#00ff88';
    const mainColor = isLight ? '#008a47' : '#00ff88';

    yieldChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'HIGH FERTILITY',
                    data: highData,
                    showLine: true,
                    borderColor: 'rgba(0, 255, 136, 0.2)',
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: 'YOUR SOIL CURVE (MED)',
                    data: medData,
                    showLine: true,
                    borderColor: isLight ? 'rgba(0, 138, 71, 0.8)' : 'rgba(0, 255, 136, 0.8)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: 'LOW FERTILITY',
                    data: lowData,
                    showLine: true,
                    borderColor: 'rgba(0, 255, 136, 0.2)',
                    pointRadius: 0,
                    tension: 0.4
                },
                {
                    label: 'Current Status (Before)',
                    data: [{ x: currentX, y: currentY }],
                    backgroundColor: '#ff3e3e',
                    borderColor: '#ff3e3e',
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Optimal Target (After)',
                    data: [{ x: optimalX, y: optimalY }],
                    backgroundColor: mainColor,
                    borderColor: mainColor,
                    pointRadius: 8,
                    pointHoverRadius: 10,
                    pointStyle: 'star'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: {
                    title: { display: true, text: 'Amount of Fertilizer Added ➔', color: colorText, font: { family: 'Orbitron', size: 10 } },
                    grid: { color: colorGrid },
                    ticks: { color: colorText, font: { family: 'Roboto Mono' } }
                },
                y: {
                    title: { display: true, text: 'Expected Yield ➔', color: colorText, font: { family: 'Orbitron', size: 10 } },
                    grid: { color: colorGrid },
                    ticks: { color: colorText, font: { family: 'Roboto Mono' } },
                    min: 0, max: 100
                }
            },
            plugins: {
                legend: {
                    labels: { color: colorText, font: { family: 'Roboto Mono', size: 10 }, boxWidth: 10 }
                }
            }
        }
    });
}

// Interconnected Neural Particle Background
function initBackground() {
    const pEl = document.getElementById('particles-js');
    if (!pEl) return;

    // Destroy existing particles canvas when toggling theme
    pEl.innerHTML = '';

    let isLight = document.body.classList.contains('light-theme');

    if (!window.particlesJS) {
        console.warn('Particles.js not loaded properly.');
        return;
    }

    const colorHex = isLight ? "#008a47" : "#00ff88";
    particlesJS("particles-js", {
        "particles": {
            "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
            "color": { "value": colorHex },
            "shape": { "type": "circle" },
            "opacity": { "value": 0.5, "random": false },
            "size": { "value": 3, "random": true },
            "line_linked": {
                "enable": true,
                "distance": 150,
                "color": colorHex,
                "opacity": 0.4,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": 2,
                "direction": "none",
                "random": false,
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": { "enable": false }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": { "enable": true, "mode": "repulse" },
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            },
            "modes": {
                "repulse": { "distance": 100, "duration": 0.4 },
                "push": { "particles_nb": 4 }
            }
        },
        "retina_detect": true
    });
}

const CROP_DATA = {
    generic: { n: [30, 150, 150], p: [20, 100, 100], k: [40, 150, 150], ph: [6.0, 7.5] },
    tomatoes: { n: [50, 120, 150], p: [40, 100, 120], k: [80, 180, 200], ph: [6.0, 6.8] },
    corn: { n: [80, 200, 250], p: [30, 80, 100], k: [50, 120, 150], ph: [5.8, 7.0] },
    rice: { n: [40, 100, 120], p: [20, 60, 80], k: [30, 80, 100], ph: [5.5, 6.5] },
    wheat: { n: [60, 150, 180], p: [30, 80, 100], k: [40, 100, 120], ph: [6.0, 7.0] },
    sugarcane: { n: [100, 250, 300], p: [40, 100, 150], k: [80, 200, 250], ph: [6.5, 7.5] },
    cotton: { n: [60, 120, 180], p: [30, 80, 100], k: [40, 100, 150], ph: [5.8, 6.5] },
    soybean: { n: [20, 60, 80], p: [40, 80, 100], k: [50, 120, 150], ph: [6.0, 7.0] },
    potato: { n: [80, 150, 200], p: [50, 120, 180], k: [120, 250, 300], ph: [5.0, 6.5] }
};

document.addEventListener('DOMContentLoaded', () => {
    // Check Authorization before rendering
    checkAuth();

    // Setup Auth Listeners if on login page
    if (window.location.pathname.endsWith('login.html')) {
        setupAuthListeners();
    }

    // Restore Theme State
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') toggleTheme('light');

    initBackground();

    const cropSelect = document.getElementById('crop');
    const inputs = {
        n: document.getElementById('n'),
        p: document.getElementById('p'),
        k: document.getElementById('k'),
        ph: document.getElementById('ph')
    };
    const helpers = {
        n: document.getElementById('n-helper'),
        p: document.getElementById('p-helper'),
        k: document.getElementById('k-helper'),
        ph: document.getElementById('ph-helper')
    };

    const validateField = (input, min, max, toxic, isPh = false) => {
        if (!input) return;
        const val = parseFloat(input.value);
        const statusSpan = document.getElementById(input.id + '-status');

        input.classList.remove('input-optimal', 'input-warning', 'input-danger');
        if (statusSpan) statusSpan.innerText = '';
        if (isNaN(val)) return;

        let status = '';
        if (isPh) {
            if (val >= min && val <= max) status = 'optimal';
            else if (val < 5.0 || val > 8.5) status = 'danger';
            else status = 'warning';
        } else {
            if (toxic !== null && val > toxic) status = 'danger';
            else if (val >= min && val <= max) status = 'optimal';
            else status = 'warning';
        }

        input.classList.add('input-' + status);
        if (statusSpan) {
            if (status === 'optimal') statusSpan.innerText = '✅';
            else if (status === 'warning') statusSpan.innerText = '⚠️';
            else if (status === 'danger') statusSpan.innerText = '❌';
        }
    };

    const runValidation = () => {
        const crop = cropSelect ? cropSelect.value : 'generic';
        const ranges = CROP_DATA[crop] || CROP_DATA.generic;

        // Update helper text dynamically
        if (helpers.n) helpers.n.innerText = `Optimal Range: ${ranges.n[0]} - ${ranges.n[1]}`;
        if (helpers.p) helpers.p.innerText = `Optimal Range: ${ranges.p[0]} - ${ranges.p[1]}`;
        if (helpers.k) helpers.k.innerText = `Optimal Range: ${ranges.k[0]} - ${ranges.k[1]}`;
        if (helpers.ph) helpers.ph.innerText = `Optimal Range: ${ranges.ph[0]} - ${ranges.ph[1]}`;

        // Validate inputs
        validateField(inputs.n, ranges.n[0], ranges.n[1], ranges.n[2], false);
        validateField(inputs.p, ranges.p[0], ranges.p[1], ranges.p[2], false);
        validateField(inputs.k, ranges.k[0], ranges.k[1], ranges.k[2], false);
        validateField(inputs.ph, ranges.ph[0], ranges.ph[1], null, true);
    };

    if (cropSelect) cropSelect.addEventListener('change', runValidation);
    if (inputs.n) inputs.n.addEventListener('input', runValidation);
    if (inputs.p) inputs.p.addEventListener('input', runValidation);
    if (inputs.k) inputs.k.addEventListener('input', runValidation);
    if (inputs.ph) inputs.ph.addEventListener('input', runValidation);

    // Initial update
    runValidation();
});

// Feature Enhancements: PDF Export & History

function exportPDF() {
    const btn = document.getElementById('exportPdfBtn');
    if (btn) btn.style.display = 'none';

    // Read current scan values
    const crop  = (document.getElementById('crop')  || {}).value || 'N/A';
    const n     = (document.getElementById('n')     || {}).value || 'N/A';
    const p     = (document.getElementById('p')     || {}).value || 'N/A';
    const k     = (document.getElementById('k')     || {}).value || 'N/A';
    const ph    = (document.getElementById('ph')    || {}).value || 'N/A';
    const items = document.querySelectorAll('#recList li');
    const logLines = Array.from(items).map(li => `<li style="margin-bottom:8px;">${li.innerText}</li>`).join('');

    // Capture chart as image before building PDF
    const chartCanvas = document.getElementById('yieldChart');
    
    // Force chart to high-contrast colors for PDF capture
    const originalChart = yieldChart;
    const nVal = document.getElementById('n').value;
    const pVal = document.getElementById('p').value;
    const kVal = document.getElementById('k').value;
    
    // Temporarily switch to light colors for capture
    document.body.classList.add('pdf-capture-temp');
    renderYieldChart(nVal, pVal, kVal); 
    const chartImg = chartCanvas ? chartCanvas.toDataURL('image/png') : null;
    
    // Revert to original theme
    document.body.classList.remove('pdf-capture-temp');
    renderYieldChart(nVal, pVal, kVal); 


    // Build a clean, fully white standalone report
    // Read new summary values
    const healthScore = document.getElementById('healthScore').innerText;
    const summaryTitle = document.getElementById('summaryTitle').innerText;
    const summaryDesc = document.getElementById('summaryDesc').innerText;
    const soilStatus = document.getElementById('soilStatus').innerText;
    const cropComp = document.getElementById('cropCompatibility').innerText;

    // Build a clean, fully white standalone report
    const reportHTML = `
    <div style="font-family: 'Arial', sans-serif; background: #ffffff; color: #111; padding: 40px; max-width: 700px; margin: auto;">
        <div style="border-bottom: 4px solid #00aa55; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 28px; color: #007a3d; margin: 0; letter-spacing: 1px;">TERRASCAN REPORT</h1>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 13px;">Official Soil Quality Assessment</p>
            </div>
            <div style="text-align: right; font-size: 11px; color: #999;">
                Date: ${new Date().toLocaleDateString()}<br>
                Time: ${new Date().toLocaleTimeString()}
            </div>
        </div>

        <div style="display: flex; gap: 30px; margin-bottom: 35px; background: #f9fffb; border: 1px solid #cce5d6; border-radius: 12px; padding: 25px;">
            <div style="width: 100px; height: 100px; border-radius: 50%; border: 5px solid #00aa55; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="font-size: 32px; font-weight: bold; color: #007a3d;">${healthScore}</span>
                <small style="font-size: 9px; color: #777; font-weight: bold;">SCORE</small>
            </div>
            <div style="flex-grow: 1;">
                <h2 style="margin: 0 0 8px 0; color: #007a3d; font-size: 20px;">${summaryTitle}</h2>
                <p style="margin: 0; font-size: 14px; color: #444; line-height: 1.5;">${summaryDesc}</p>
            </div>
        </div>

        <!-- Ultra-Simple Text Layout for absolute PDF reliability -->
        <div style="margin-bottom: 40px; padding: 20px; border: 1px solid #eee; background: #fafafa; page-break-inside: avoid;">
             <p style="font-size: 12px; color: #007a3d; margin: 8px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;"><strong>HEALTH STATUS:</strong> ${soilStatus} &nbsp;&nbsp; | &nbsp;&nbsp; <strong>CROP COMPATIBILITY:</strong> ${cropComp}</p>
             <p style="font-size: 12px; color: #333; margin: 8px 0; border-bottom: 1px solid #eee; padding-bottom: 5px;"><strong>NITROGEN (N):</strong> ${n} mg/kg &nbsp;&nbsp; | &nbsp;&nbsp; <strong>PHOSPHORUS (P):</strong> ${p} mg/kg</p>
             <p style="font-size: 12px; color: #333; margin: 8px 0;"><strong>POTASSIUM (K):</strong> ${k} mg/kg &nbsp;&nbsp; | &nbsp;&nbsp; <strong>SOIL pH:</strong> ${ph}</p>
        </div>

        <h2 style="color: #007a3d; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">DETAILED RECOMMENDATIONS</h2>
        <ul style="font-size: 13px; line-height: 1.8; padding-left: 20px; margin-bottom: 35px; color: #333; list-style: square;">
            ${Array.from(document.querySelectorAll('#recList li')).map(li =>
                `<li style="margin-bottom: 12px; page-break-inside: avoid; padding-left: 5px;">${li.innerText.replace('>', '')}</li>`
            ).join('') || '<li>No specific recommendations needed. Soil is optimal.</li>'}
        </ul>

        ${chartImg ? `
        <h2 style="color: #007a3d; font-size: 16px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">YIELD POTENTIAL VISUALIZATION</h2>
        <img src="${chartImg}" style="width: 100%; border: 1px solid #e1eee6; border-radius: 8px; margin-bottom: 40px;" />
        ` : ''}

        <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 11px; color: #aaa; text-align: center;">
            TerraScan Agriculture Intelligence System — Precision Farming Tool<br>
            <span style="color: #ccc;">Generated by ${localStorage.getItem('userEmail') || 'Registered User'}</span>
        </div>
        <div style="height: 80px;"></div>
    </div>`;

    const opt = {
        margin:      [0.5, 0.5, 1.0, 0.5],
        filename:    'soil_scan_report.pdf',
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            backgroundColor: '#ffffff', 
            useCORS: true, 
            logging: false,
            scrollY: 0,
            scrollX: 0
        },
        jsPDF:       { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf()
        .set(opt)
        .from(reportHTML)
        .save()
        .then(() => {
            if (btn) btn.style.display = 'block';
        });
}


function toggleHistory() {
    const modal = document.getElementById('historyModal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        loadHistory();
    }
}


async function loadHistory() {
    const list = document.getElementById('historyList');
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    try {
        const response = await fetch(`/api/history?email=${email}`);
        const history = await response.json();
        if (history.length === 0) {
            list.innerHTML = '<li>No history found.</li>';
            return;
        }

        list.innerHTML = history.map(item => `
            <div>
                <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <span style="color: var(--neon-green); font-weight: bold;">${item.crop.toUpperCase()}</span><br>
                        <small style="color: #888;">N:${item.n} P:${item.p} K:${item.k} pH:${item.ph}</small>
                    </div>
                    <div style="font-size: 10px; color: #666;">
                        ${new Date(item.date).toLocaleDateString()}
                    </div>
                </div>
                <div class="rating-container">
                    <div class="stars-row">
                        ${[1, 2, 3, 4, 5].map(star => `
                            <span class="star ${item.rating >= star ? 'active' : ''}" 
                                  onclick="rateScan('${item._id}', ${star})">★</span>
                        `).join('')}
                    </div>
                    <span class="feedback-status">${item.rating > 0 ? 'Harvest Rated' : 'Rate Success'}</span>
                </div>
                <input type="text" class="feedback-input" placeholder="Add harvest notes..." value="${item.feedback || ''}" onblur="saveFeedback('${item._id}', this.value)">
            </li>
        `).join('');
    } catch (err) {
        list.innerHTML = '<li> Failed to load history.</li>';
    }
}


async function rateScan(id, stars) {
    try {
        await fetch(`/api/scans/${id}/rate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: stars })
        });
        loadHistory();
    } catch (err) {
        console.error('Rating failed:', err);
    }
}

async function saveFeedback(id, text) {
    try {
        await fetch(`/api/scans/${id}/rate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedback: text })
        });
    } catch (err) {
        console.error('Feedback save failed:', err);
    }
}

// =====================================================
// EXPERT ADVISORY NOTIFICATIONS (Farmer Dashboard)
// =====================================================

function loadAdvisories() {
    var email = localStorage.getItem('userEmail');
    if (!email) return;

    var panel = document.getElementById('advisoryPanel');
    var list = document.getElementById('advisoryList');
    var badge = document.getElementById('advisoryBadge');
    if (!panel || !list) return;

    fetch('/api/farmer/advisories?email=' + encodeURIComponent(email))
        .then(function(res) { return res.json(); })
        .then(function(advisories) {
            if (!advisories || advisories.length === 0) {
                panel.classList.add('hidden');
                return;
            }

            panel.classList.remove('hidden');

            var unreadCount = 0;
            for (var i = 0; i < advisories.length; i++) {
                if (advisories[i].status === 'unread') unreadCount++;
            }

            if (unreadCount > 0 && badge) {
                badge.innerText = unreadCount;
                badge.classList.remove('hidden');
            } else if (badge) {
                badge.classList.add('hidden');
            }

            var html = '';
            for (var i = 0; i < advisories.length; i++) {
                var a = advisories[i];
                var dateStr = new Date(a.date).toLocaleDateString() + ' ' + new Date(a.date).toLocaleTimeString();
                var statusClass = a.status === 'unread' ? 'advisory-unread' : 'advisory-read';
                html += '<div class="advisory-item ' + statusClass + '">' +
                    '<div class="advisory-item-header">' +
                        '<strong>From: ' + a.expertEmail + '</strong>' +
                        '<span class="advisory-date">' + dateStr + '</span>' +
                    '</div>' +
                    '<p class="advisory-message">' + a.message + '</p>';

                if (a.status === 'unread') {
                    html += '<button class="glow-button sm" onclick="markAdvisoryRead(\'' + a._id + '\')">Mark as Read</button>';
                } else {
                    html += '<span class="advisory-read-label">Read</span>';
                }
                html += '</div>';
            }
            list.innerHTML = html;
        })
        .catch(function(err) {
            console.error('Failed to load advisories:', err);
        });
}

function markAdvisoryRead(id) {
    fetch('/api/farmer/advisories/' + id + '/read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(function() {
        loadAdvisories();
    })
    .catch(function(err) {
        console.error('Failed to mark as read:', err);
    });
}

// Auto-load advisories on farmer pages
(function() {
    var role = localStorage.getItem('userRole') || '';
    if (role === 'farmer' && document.getElementById('advisoryPanel')) {
        loadAdvisories();
    }
})();
