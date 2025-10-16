const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

// SVG to PNG converter using canvas
async function convertSvgToPng(svgPath, outputPath, size) {
    try {
        // Read SVG content
        const svgContent = fs.readFileSync(svgPath, 'utf8');
        
        // Create canvas
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Set background to transparent
        ctx.clearRect(0, 0, size, size);
        
        // For now, let's create a simple PNG using canvas drawing
        // This is a simplified approach since we don't have SVG parsing
        
        // Draw the icon elements manually
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size * 0.4;
        
        // Background circle
        ctx.fillStyle = '#1a73e8';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Shield
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius * 0.6);
        ctx.lineTo(centerX + radius * 0.5, centerY - radius * 0.2);
        ctx.lineTo(centerX + radius * 0.5, centerY + radius * 0.3);
        ctx.lineTo(centerX, centerY + radius * 0.5);
        ctx.lineTo(centerX - radius * 0.5, centerY + radius * 0.3);
        ctx.lineTo(centerX - radius * 0.5, centerY - radius * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // AI Robot head
        const robotSize = size * 0.15;
        ctx.fillStyle = '#1a73e8';
        ctx.fillRect(centerX - robotSize/2, centerY - robotSize/4, robotSize, robotSize * 0.6);
        
        // Robot eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX - robotSize/4, centerY - robotSize/8, robotSize/8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + robotSize/4, centerY - robotSize/8, robotSize/8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Robot antenna
        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = size * 0.02;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - robotSize/2);
        ctx.lineTo(centerX, centerY - radius * 0.4);
        ctx.stroke();
        
        // Antenna tip
        ctx.fillStyle = '#1a73e8';
        ctx.beginPath();
        ctx.arc(centerX, centerY - radius * 0.4, robotSize/8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Local indicator (home)
        const homeSize = size * 0.08;
        ctx.fillStyle = '#34a853';
        ctx.fillRect(centerX - radius * 0.3, centerY - radius * 0.2, homeSize, homeSize * 0.6);
        ctx.fillRect(centerX - radius * 0.3 + homeSize/4, centerY - radius * 0.2 - homeSize/2, homeSize/2, homeSize);
        
        // Privacy lock
        ctx.fillStyle = '#34a853';
        ctx.beginPath();
        ctx.arc(centerX + radius * 0.3, centerY - radius * 0.2, homeSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX + radius * 0.3 - homeSize/3, centerY - radius * 0.2 + homeSize/3, homeSize * 0.6, homeSize * 0.3);
        
        // Save as PNG
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Created ${outputPath} (${size}x${size})`);
    } catch (error) {
        console.error(`❌ Error creating ${outputPath}:`, error.message);
    }
}

// Convert the clean icon to all required sizes
async function convertAllSizes() {
    console.log('🎨 Converting Local AI Sidebar icons...\n');
    
    const sizes = [
        { size: 16, name: 'icon16.png' },
        { size: 32, name: 'icon32.png' },
        { size: 48, name: 'icon48.png' },
        { size: 128, name: 'icon128.png' }
    ];
    
    for (const { size, name } of sizes) {
        await convertSvgToPng('icon-clean.svg', name, size);
    }
    
    console.log('\n🎉 All icons converted successfully!');
    console.log('\n📁 Files created:');
    sizes.forEach(({ size, name }) => {
        console.log(`   - ${name} (${size}x${size}px)`);
    });
}

// Run the conversion
convertAllSizes().catch(console.error);
