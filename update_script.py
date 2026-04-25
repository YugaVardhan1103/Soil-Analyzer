import re

with open('public/script.js', 'r', encoding='utf-8') as f:
    text = f.read()

old_toggleTheme = """function toggleTheme(initTheme = null) {
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
}"""
new_toggleTheme = """function toggleTheme(initTheme = null) {
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
}"""

if old_toggleTheme in text:
    text = text.replace(old_toggleTheme, new_toggleTheme)
else:
    print("toggleTheme not found")

new_anim = """// Interconnected Neural Vanta Background
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
}"""
text = re.sub(r"// Interconnected Neural Particle Background[\s\S]*?requestAnimationFrame\(animate\);\s*\}", new_anim, text)

with open('public/script.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated script.js successfully")
