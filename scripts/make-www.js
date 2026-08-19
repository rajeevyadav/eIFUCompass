// Assembles www/ (the folder the desktop app loads) by copying the exact web
// assets from the repo root — single source of truth: the desktop build ships
// the same index.html as the web/PWA, never a forked copy.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

const ASSETS = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icon.svg',
  'pwa-icon.svg',
  'pwa-icon-192.png',
  'pwa-icon-512.png',
  'css',
  'js',
  'data',
  'assets'
];

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });

for (const asset of ASSETS) {
  const src = path.join(root, asset);
  if (!fs.existsSync(src)) { console.error('make-www: missing', asset); process.exit(1); }
  fs.cpSync(src, path.join(www, asset), { recursive: true });
}

console.log('make-www: assembled www/');
