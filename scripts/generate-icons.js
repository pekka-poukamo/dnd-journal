const fs = require('fs');
const path = require('path');

// Simple SVG icon for D&D Journal
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2c3e50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#34495e;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.1}"/>
  
  <!-- Book/Journal representation -->
  <rect x="${size * 0.2}" y="${size * 0.15}" width="${size * 0.6}" height="${size * 0.7}" fill="#ecf0f1" rx="${size * 0.02}" stroke="#bdc3c7" stroke-width="${size * 0.01}"/>
  
  <!-- Book spine -->
  <rect x="${size * 0.2}" y="${size * 0.15}" width="${size * 0.08}" height="${size * 0.7}" fill="#95a5a6"/>
  
  <!-- D20 die in center -->
  <circle cx="${size * 0.5}" cy="${size * 0.45}" r="${size * 0.12}" fill="#e74c3c" stroke="#c0392b" stroke-width="${size * 0.01}"/>
  <text x="${size * 0.5}" y="${size * 0.48}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" fill="white">20</text>
  
  <!-- Lines representing text -->
  <line x1="${size * 0.32}" y1="${size * 0.3}" x2="${size * 0.68}" y2="${size * 0.3}" stroke="#7f8c8d" stroke-width="${size * 0.008}"/>
  <line x1="${size * 0.32}" y1="${size * 0.6}" x2="${size * 0.65}" y2="${size * 0.6}" stroke="#7f8c8d" stroke-width="${size * 0.008}"/>
  <line x1="${size * 0.32}" y1="${size * 0.65}" x2="${size * 0.7}" y2="${size * 0.65}" stroke="#7f8c8d" stroke-width="${size * 0.008}"/>
  <line x1="${size * 0.32}" y1="${size * 0.7}" x2="${size * 0.62}" y2="${size * 0.7}" stroke="#7f8c8d" stroke-width="${size * 0.008}"/>
</svg>`;
};

// Convert SVG to simple data URL (for basic icon generation)
const createIconDataURL = (size) => {
  const svg = createSVGIcon(size);
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
};

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create icons directory
const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating PWA icons...');

// For this simple approach, we'll create SVG files that browsers can use
iconSizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svg);
  console.log(`Created ${filename}`);
});

// Also create a favicon
const favicon = createSVGIcon(32);
fs.writeFileSync(path.join(__dirname, '..', 'favicon.svg'), favicon);
console.log('Created favicon.svg');

console.log('Icon generation complete!');
console.log('Note: For production, consider converting SVG icons to PNG using a tool like sharp or imagemagick.');