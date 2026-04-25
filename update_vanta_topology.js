const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const htmlFiles = ['index.html', 'about.html', 'analyzer.html', 'crops.html', 'database.html', 'login.html'];

htmlFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(/vanta\.cells\.min\.js/g, 'vanta.topology.min.js');
        // Vanta.Topology requires p5.js instead of three.js
        content = content.replace(/cdnjs\.cloudflare\.com\/ajax\/libs\/three\.js\/r134\/three\.min\.js/g, 'cdnjs.cloudflare.com/ajax/libs/p5.js/1.1.9/p5.min.js');
        fs.writeFileSync(filePath, content);
    }
});

const scriptJsPath = path.join(publicDir, 'script.js');
if (fs.existsSync(scriptJsPath)) {
    let scriptContent = fs.readFileSync(scriptJsPath, 'utf8');
    
    scriptContent = scriptContent.replace('!VANTA.CELLS', '!VANTA.TOPOLOGY');
    
    const oldVantaCells = /vantaEffect\s*=\s*VANTA\.CELLS\(\{[\s\S]*?\}\);/;
    
    const newVantaTopology = `vantaEffect = VANTA.TOPOLOGY({
        el: "#vanta-bg",
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: isLight ? 0x008a47 : 0x00ff88,
        backgroundColor: isLight ? 0xeaf2ee : 0x000000
    });`;
    
    scriptContent = scriptContent.replace(oldVantaCells, newVantaTopology);
    
    // Change setOptions back since we used color1/color2 for cells, and topology uses color
    const oldSetOptions = /vantaEffect\.setOptions\(\{[\s\S]*?\}\);/;
    const newSetOptions = `vantaEffect.setOptions({
            color: isLight ? 0x008a47 : 0x00ff88,
            backgroundColor: isLight ? 0xeaf2ee : 0x000000
        });`;
    scriptContent = scriptContent.replace(oldSetOptions, newSetOptions);

    fs.writeFileSync(scriptJsPath, scriptContent);
}

console.log("Updated to Vanta Topology successfully!");
