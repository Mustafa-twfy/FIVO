/*
  Brand asset generator for Simsim (سمسم)
  - Generates:
    ./assets/icon.png            (1024x1024, mint background)
    ./assets/splash-icon.png     (2000x2000, mint background)
    ./assets/adaptive-icon.png   (1024x1024, transparent bg for Android adaptive icon)

  Usage:
    node scripts/generate-brand-assets.js
*/

const fs = require('fs');
const path = require('path');
const { createCanvas, registerFont } = require('canvas');
const fontDir = path.resolve(__dirname, '..', 'assets', 'fonts');
const arabicFontPath = path.join(fontDir, 'NotoKufiArabic-Bold.ttf');
try {
  if (fs.existsSync(arabicFontPath)) {
    registerFont(arabicFontPath, { family: 'SimsimKufi', weight: '700' });
    console.log('✓ Registered Arabic font:', arabicFontPath);
  } else {
    console.warn('! Arabic font not found at', arabicFontPath, '\n  Add NotoKufiArabic-Bold.ttf to assets/fonts for best rendering.');
  }
} catch (e) {
  console.warn('! Font registration failed:', e?.message || e);
}

const MINT = '#00C897';
const WHITE = '#FFFFFF';
const OUTPUTS = [
  { file: 'icon.png', size: 1024, transparent: false },
  { file: 'splash-icon.png', size: 2000, transparent: false },
  { file: 'adaptive-icon.png', size: 1024, transparent: true },
];

const assetsDir = path.resolve(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function drawCenteredText(ctx, text, color, paddingRatio = 0.06) {
  // Fit text to canvas (both width and height) with small padding
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const family = 'SimsimKufi, system-ui, -apple-system, Segoe UI, Arial, sans-serif';
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const boxW = W * (1 - paddingRatio * 2);
  const boxH = H * (1 - paddingRatio * 2);

  // Binary search for max font size that fits boxW and boxH
  let lo = 24, hi = Math.floor(Math.min(boxW, boxH));
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = `bold ${mid}px ${family}`;
    const w = ctx.measureText(text).width;
    if (w <= boxW && mid <= boxH) {
      best = mid; lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const fontPx = best;
  ctx.font = `bold ${fontPx}px ${family}`;
  // subtle edge
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = Math.max(2, Math.floor(fontPx * 0.06));
  ctx.fillText(text, W / 2, H / 2);
  ctx.shadowColor = 'transparent';
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawGlyphBadge(ctx, size, colorBg, colorFg, isAdaptive = false) {
  // For adaptive icons, keep minimal padding for safe zone; otherwise almost full bleed
  const padding = isAdaptive ? 0.14 : 0.06;
  drawCenteredText(ctx, 'سمسم', colorFg, padding);
}

function generatePng({ file, size, transparent }) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  if (!transparent) {
    ctx.fillStyle = MINT;
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.clearRect(0, 0, size, size);
  }

  // For splash/icon: draw big white text; for adaptive: draw white text on transparent, a bit smaller
  if (transparent) {
    drawGlyphBadge(ctx, size, WHITE, WHITE, true);
  } else {
    drawGlyphBadge(ctx, size, WHITE, WHITE, false);
  }

  const outPath = path.join(assetsDir, file);
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buf);
  console.log('✓ Wrote', outPath);
}

function main() {
  OUTPUTS.forEach(generatePng);
  console.log('\nAll brand assets generated. Ensure app.json uses:');
  console.log('  expo.icon = ./assets/icon.png');
  console.log('  expo.splash.image = ./assets/splash-icon.png');
  console.log('  expo.android.adaptiveIcon.foregroundImage = ./assets/adaptive-icon.png');
  console.log('  expo.android.adaptiveIcon.backgroundColor =', MINT);
}

main();


