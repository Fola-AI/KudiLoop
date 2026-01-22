const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '..', 'assets', 'images');

// Ensure directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

async function generateIcon(size, filename) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0A0A0B"/>
      <text 
        x="50%" 
        y="52%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.45}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >K</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(assetsDir, filename));
  
  console.log(`Generated ${filename}`);
}

async function main() {
  await generateIcon(1024, 'icon.png');
  await generateIcon(1024, 'adaptive-icon.png');
  await generateIcon(200, 'splash-icon.png');
  console.log('All assets generated!');
}

main().catch(console.error);







