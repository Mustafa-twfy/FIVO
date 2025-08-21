#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// إنشاء أيقونة PNG بسيطة وصحيحة برمجياً
function createValidPNG() {
  // هذا هو PNG أيقونة بسيطة 48x48 (أخضر مع نص)
  // Base64 لـ PNG أساسي صالح
  const pngBase64 = `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`;
  
  const buffer = Buffer.from(pngBase64, 'base64');
  
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const adaptiveIconPath = path.join(__dirname, '../assets/adaptive-icon.png');
  
  fs.writeFileSync(iconPath, buffer);
  fs.writeFileSync(adaptiveIconPath, buffer);
  
  console.log('✅ تم إنشاء أيقونة PNG صحيحة');
  console.log(`📁 حُفظت في: ${iconPath}`);
  console.log(`📁 وأيضاً في: ${adaptiveIconPath}`);
  
  return true;
}

createValidPNG();
