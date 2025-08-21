/*
  Fetch Noto Kufi Arabic Bold font to assets/fonts for brand asset generation.

  Usage:
    node scripts/fetch-arabic-font.js
*/
const fs = require('fs');
const path = require('path');
const https = require('https');

// استخدم رابط raw المباشر من GitHub
const FONT_URL = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoKufiArabic/NotoKufiArabic-Bold.ttf';
const outDir = path.resolve(__dirname, '..', 'assets', 'fonts');
const outPath = path.join(outDir, 'NotoKufiArabic-Bold.ttf');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function download(url, dest, depth = 0) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        // اتبع التحويلات حتى 5 مرات كحد أقصى
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth < 5) {
          file.close();
          fs.unlink(dest, () => {});
          return resolve(download(res.headers.location, dest, depth + 1));
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {});
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function main() {
  ensureDir(outDir);
  if (fs.existsSync(outPath)) {
    console.log('Font already exists at', outPath);
    return;
  }
  console.log('Downloading Arabic font...');
  await download(FONT_URL, outPath);
  console.log('✓ Saved', outPath);
}

main().catch((e) => {
  console.error('Failed to fetch Arabic font:', e?.message || e);
  process.exitCode = 1;
});


