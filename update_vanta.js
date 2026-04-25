const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlFiles = ['index.html', 'about.html', 'analyzer.html', 'crops.html', 'database.html', 'login.html'];

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/vanta\.net\.min\.js/g, 'vanta.dots.min.js');
        fs.writeFileSync(filePath, content);
    }
});

const scriptJsPath = path.join(publicDir, 'script.js');
if (fs.existsSync(scriptJsPath)) {
    let scriptContent = fs.readFileSync(scriptJsPath, 'utf8');
    
    // Replace the specific warning
    scriptContent = scriptContent.replace('!VANTA.NET', '!VANTA.DOTS');
    
    // Completely replace the VANTA.NET initialization
    const oldVantaNet = /vantaEffect\s*=\s*VANTA\.NET\(\{[\s\S]*?\}\);/;
    
    const newVantaDots = `vantaEffect = VANTA.DOTS({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: isLight ? 0x008a47 : 0x00ff88,
        color2: isLight ? 0x008a47 : 0x00ff88,
        backgroundColor: isLight ? 0xeaf2ee : 0x000000,
        size: 3.00,
        spacing: 25.00
    });`;
    
    scriptContent = scriptContent.replace(oldVantaNet, newVantaDots);
    
    fs.writeFileSync(scriptJsPath, scriptContent);
}

console.log("Updated to Vanta Dots successfully!");
