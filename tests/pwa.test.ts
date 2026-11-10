import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(__dirname, '..');

// Helper to check PNG magic bytes and IHDR dimensions
function getPngDimensions(filePath: string): { width: number; height: number } {
  const buffer = fs.readFileSync(filePath);
  // PNG Magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  assert.equal(isPng, true, `${filePath} is not a valid PNG file`);

  // IHDR chunk starts at byte 12 (length 4 bytes, 'IHDR' 4 bytes, width 4 bytes, height 4 bytes)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

test('PWA-01: Manifest file is valid JSON and contains required PWA fields', () => {
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  assert.equal(fs.existsSync(manifestPath), true, 'manifest.json must exist');

  const content = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(content);

  assert.equal(manifest.id, '/?source=pwa');
  assert.equal(manifest.name, 'Likit – Nakit Akış Takibi');
  assert.equal(manifest.short_name, 'Likit');
  assert.equal(manifest.start_url, '/?source=pwa');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait-primary');
  assert.equal(manifest.theme_color, '#0a0a14');
  assert.equal(manifest.background_color, '#0a0a14');
  assert.ok(Array.isArray(manifest.categories));
  assert.ok(manifest.categories.includes('finance'));
});

test('PWA-02: Manifest icons meet Android Chrome WebAPK requirements (PNG & Maskable)', () => {
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.ok(Array.isArray(manifest.icons), 'icons must be an array');
  assert.ok(manifest.icons.length >= 4, 'icons should contain at least 4 entries');

  const has192Any = manifest.icons.some(
    (i: any) => i.src === '/icons/icon-192.png' && i.sizes === '192x192' && i.type === 'image/png' && i.purpose === 'any'
  );
  const has512Any = manifest.icons.some(
    (i: any) => i.src === '/icons/icon-512.png' && i.sizes === '512x512' && i.type === 'image/png' && i.purpose === 'any'
  );
  const has192Maskable = manifest.icons.some(
    (i: any) => i.src === '/icons/icon-maskable-192.png' && i.sizes === '192x192' && i.type === 'image/png' && i.purpose === 'maskable'
  );
  const has512Maskable = manifest.icons.some(
    (i: any) => i.src === '/icons/icon-maskable-512.png' && i.sizes === '512x512' && i.type === 'image/png' && i.purpose === 'maskable'
  );

  assert.equal(has192Any, true, 'Manifest must declare 192x192 PNG any icon');
  assert.equal(has512Any, true, 'Manifest must declare 512x512 PNG any icon');
  assert.equal(has192Maskable, true, 'Manifest must declare 192x192 PNG maskable icon');
  assert.equal(has512Maskable, true, 'Manifest must declare 512x512 PNG maskable icon');
});

test('PWA-03: Icon files exist on disk with exact resolutions and valid headers', () => {
  const icons = [
    { file: 'icon-192.png', width: 192, height: 192 },
    { file: 'icon-512.png', width: 512, height: 512 },
    { file: 'icon-maskable-192.png', width: 192, height: 192 },
    { file: 'icon-maskable-512.png', width: 512, height: 512 },
  ];

  for (const icon of icons) {
    const iconPath = path.join(projectRoot, 'public', 'icons', icon.file);
    assert.equal(fs.existsSync(iconPath), true, `${icon.file} must exist on disk`);
    const stat = fs.statSync(iconPath);
    assert.ok(stat.size > 1000, `${icon.file} should have meaningful byte size`);

    const dims = getPngDimensions(iconPath);
    assert.equal(dims.width, icon.width, `${icon.file} width should be ${icon.width}`);
    assert.equal(dims.height, icon.height, `${icon.file} height should be ${icon.height}`);
  }
});

test('PWA-04: Manifest shortcuts are configured for Android home screen quick actions', () => {
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert.ok(Array.isArray(manifest.shortcuts), 'shortcuts must be an array');
  assert.equal(manifest.shortcuts.length, 2);

  const newTxnShortcut = manifest.shortcuts.find((s: any) => s.url === '/?action=new-transaction');
  const cardsShortcut = manifest.shortcuts.find((s: any) => s.url === '/?tab=credit_cards');

  assert.ok(newTxnShortcut, 'Shortcut for new-transaction must be defined');
  assert.equal(newTxnShortcut.name, 'Yeni İşlem Ekle');

  assert.ok(cardsShortcut, 'Shortcut for credit_cards must be defined');
  assert.equal(cardsShortcut.name, 'Kredi Kartları');
});

test('PWA-05: Service worker (sw.js) implements lifecycle and precaching', () => {
  const swPath = path.join(projectRoot, 'public', 'sw.js');
  assert.equal(fs.existsSync(swPath), true, 'public/sw.js must exist');

  const swContent = fs.readFileSync(swPath, 'utf8');

  assert.ok(swContent.includes('likit-pwa-v1.4'), 'sw.js must use likit-pwa-v1.4 cache');
  assert.ok(swContent.includes("addEventListener('install'"), 'sw.js must handle install event');
  assert.ok(swContent.includes("addEventListener('activate'"), 'sw.js must handle activate event');
  assert.ok(swContent.includes("addEventListener('fetch'"), 'sw.js must handle fetch event');
  assert.ok(swContent.includes('/icons/icon-192.png'), 'sw.js must precache PNG icon');
  assert.ok(swContent.includes('/manifest.json'), 'sw.js must precache manifest.json');
  assert.ok(swContent.includes("request.mode === 'navigate'"), 'sw.js must handle offline navigation requests');
});

test('PWA-06: Root layout and globals.css include mobile viewport, themeColor, and safe areas', () => {
  const layoutPath = path.join(projectRoot, 'src', 'app', 'layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');

  assert.ok(layoutContent.includes('manifest: "/manifest.json"'), 'layout.tsx must reference manifest.json');
  assert.ok(layoutContent.includes('themeColor: "#0a0a14"'), 'layout.tsx viewport must set themeColor to #0a0a14');
  assert.ok(layoutContent.includes('viewportFit: "cover"'), 'layout.tsx viewport must set viewportFit: cover');
  assert.ok(layoutContent.includes('navigator.serviceWorker.register'), 'layout.tsx must register serviceWorker');

  const cssPath = path.join(projectRoot, 'src', 'app', 'globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(cssContent.includes('safe-area-inset-bottom'), 'globals.css must support safe-area-inset-bottom');
  assert.ok(cssContent.includes('pwa-install-banner'), 'globals.css must include pwa-install-banner styles');
  assert.ok(cssContent.includes('overscroll-behavior-y: contain'), 'globals.css must set overscroll-behavior-y: contain');
  assert.ok(cssContent.includes('-webkit-tap-highlight-color: transparent'), 'globals.css must remove tap highlight');
});
