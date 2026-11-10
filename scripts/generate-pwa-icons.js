const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const iconsDir = path.resolve(__dirname, '../public/icons');

const icons = [
  {
    svg: 'icon-512.svg',
    png: 'icon-512.png',
    size: 512,
  },
  {
    svg: 'icon-192.svg',
    png: 'icon-192.png',
    size: 192,
  },
  {
    svg: 'icon-maskable-512.svg',
    png: 'icon-maskable-512.png',
    size: 512,
  },
  {
    svg: 'icon-maskable-192.svg',
    png: 'icon-maskable-192.png',
    size: 192,
  },
];

for (const icon of icons) {
  const svgPath = path.join(iconsDir, icon.svg);
  const pngPath = path.join(iconsDir, icon.png);
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${icon.size}px; height: ${icon.size}px; overflow: hidden; background: transparent; }
  svg { display: block; width: ${icon.size}px; height: ${icon.size}px; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

  const tempHtmlPath = path.join(iconsDir, `temp-${icon.size}-${icon.png}.html`);
  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

  const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
  const cmd = `"${chromePath}" --headless=new --screenshot="${pngPath}" --window-size=${icon.size},${icon.size} --default-background-color=00000000 --hide-scrollbars "${fileUrl}"`;

  console.log(`Generating ${icon.png} (${icon.size}x${icon.size})...`);
  execSync(cmd, { stdio: 'inherit' });

  // Delay unlinking slightly or ignore Windows lock
  setTimeout(() => {
    try {
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    } catch {
      // Ignored if still locked by Chrome process
    }
  }, 500);
}

// Clean up any temp html files after 1.5 seconds
setTimeout(() => {
  const files = fs.readdirSync(iconsDir);
  for (const f of files) {
    if (f.startsWith('temp-') && f.endsWith('.html')) {
      try {
        fs.unlinkSync(path.join(iconsDir, f));
      } catch {}
    }
  }
  console.log('PWA icon generation complete!');
}, 1500);
