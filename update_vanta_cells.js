const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlFiles = ['index.html', 'about.html', 'analyzer.html', 'crops.html', 'database.html', 'login.html'];

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/vanta\.dots\.min\.js/g, 'vanta.cells.min.js');
        fs.writeFileSync(filePath, content);
    }
});

const scriptJsPath = path.join(publicDir, 'script.js');
if (fs.existsSync(scriptJsPath)) {
    let scriptContent = fs.readFileSync(scriptJsPath, 'utf8');
    
    // Replace the specific warning
    scriptContent = scriptContent.replace('!VANTA.DOTS', '!VANTA.CELLS');
    
    // Completely replace the VANTA.DOTS initialization
    const oldVantaDots = /vantaEffect\s*=\s*VANTA\.DOTS\(\{[\s\S]*?\}\);/;
    
    const newVantaCells = `vantaEffect = VANTA.CELLS({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        color1: isLight ? 0x008a47 : 0x00ff88,
        color2: isLight ? 0x004a27 : 0x008f48,
        size: 1.5,
        speed: 1.5
    });`;
    
    scriptContent = scriptContent.replace(oldVantaDots, newVantaCells);
    
    // Wait, the setOptions from theme change earlier needs to update color1/color2 instead of color/backgroundColor
    const oldSetOptions = /vantaEffect\.setOptions\(\{[\s\S]*?\}\);/;
    const newSetOptions = `vantaEffect.setOptions({
            color1: isLight ? 0x008a47 : 0x00ff88,
            color2: isLight ? 0x004a27 : 0x008f48
        });`;
    scriptContent = scriptContent.replace(oldSetOptions, newSetOptions);

    fs.writeFileSync(scriptJsPath, scriptContent);
}

console.log("Updated to Vanta Cells successfully!");
