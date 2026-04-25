const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlFiles = ['index.html', 'about.html', 'analyzer.html', 'crops.html', 'database.html', 'login.html'];

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/vanta-bg/g, 'particles-js');
        // Vanta.Topology uses p5.js and vanta.toplogy.min.js
        content = content.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\/1\.1\.9\/p5\.min\.js"><\/script>\s*/g, '');
        content = content.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/vanta@latest\/dist\/vanta\.topology\.min\.js"><\/script>/g, '<script src="https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js"></script>');
        fs.writeFileSync(filePath, content);
    }
});

const styleCssPath = path.join(publicDir, 'style.css');
if (fs.existsSync(styleCssPath)) {
    let styleContent = fs.readFileSync(styleCssPath, 'utf8');
    styleContent = styleContent.replace(/#vanta-bg/g, '#particles-js');
    fs.writeFileSync(styleCssPath, styleContent);
}

const scriptJsPath = path.join(publicDir, 'script.js');
if (fs.existsSync(scriptJsPath)) {
    let scriptContent = fs.readFileSync(scriptJsPath, 'utf8');
    
    scriptContent = scriptContent.replace('!VANTA.TOPOLOGY', '!window.particlesJS');
    
    const oldVantaTopology = /vantaEffect\s*=\s*VANTA\.TOPOLOGY\(\{[\s\S]*?\}\);/;
    
    const newParticles = `const colorHex = isLight ? "#008a47" : "#00ff88";
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
    });`;
    
    scriptContent = scriptContent.replace(oldVantaTopology, newParticles);
    
    // update setOptions manually
    const oldSetOptions = /if\s*\(typeof\s*vantaEffect[\s\S]*?\}\s*\}/;
    const newSetOptions = `
    const el = document.getElementById('particles-js');
    if (el) {
        initBackground();
    }
`;
    scriptContent = scriptContent.replace(oldSetOptions, newSetOptions);

    fs.writeFileSync(scriptJsPath, scriptContent);
}

console.log("Updated to Particles.js successfully!");
