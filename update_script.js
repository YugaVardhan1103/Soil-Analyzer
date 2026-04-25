const fs = require('fs');

let text = fs.readFileSync('public/script.js', 'utf8');

const oldToggleTheme = `function toggleTheme(initTheme = null) {
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
}`;

const newToggleTheme = `function toggleTheme(initTheme = null) {
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

    if (typeof vantaEffect !== 'undefined' && vantaEffect) {
        vantaEffect.setOptions({
            color: isLight ? 0x008a47 : 0x00ff88,
            backgroundColor: isLight ? 0xeaf2ee : 0x000000
        });
    }
}`;

text = text.replace(oldToggleTheme, newToggleTheme);

const newAnim = `// Interconnected Neural Vanta Background
let vantaEffect = null;

function initBackground() {
    const vantaEl = document.getElementById('vanta-bg');
    if (!vantaEl) return;

    let isLight = document.body.classList.contains('light-theme');

    if (typeof VANTA === 'undefined' || !VANTA.NET) {
        console.warn('Vanta.js not loaded properly.');
        return;
    }

    vantaEffect = VANTA.NET({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: isLight ? 0x008a47 : 0x00ff88,
        backgroundColor: isLight ? 0xeaf2ee : 0x000000,
        points: 12.00,
        maxDistance: 22.00,
        spacing: 18.00
    });
}`;

text = text.replace(/\/\/ Interconnected Neural Particle Background[\s\S]*?requestAnimationFrame\(animate\);\s*\}/, newAnim);

fs.writeFileSync('public/script.js', text);
console.log('Updated script.js successfully');
