#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 تحديث أيقونة التطبيق لسمسم...');

// إنشاء أيقونة سمسم بسيطة وجميلة (PNG أخضر مع نص)
function createSimsimIcon() {
  // أيقونة سمسم أساسية - أخضر مع نص أبيض
  const simsimIconBase64 = `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`;
  
  return Buffer.from(simsimIconBase64, 'base64');
}

// استبدال جميع ملفات splashscreen_logo
function updateSplashscreenLogos() {
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  const simsimIcon = createSimsimIcon();
  
  let updatedCount = 0;
  
  densities.forEach(density => {
    const logoPath = path.join(__dirname, `../android/app/src/main/res/drawable-${density}/splashscreen_logo.png`);
    
    try {
      if (fs.existsSync(logoPath)) {
        fs.writeFileSync(logoPath, simsimIcon);
        console.log(`✅ تحديث splashscreen_logo في drawable-${density}`);
        updatedCount++;
      }
    } catch (error) {
      console.log(`❌ خطأ في تحديث ${density}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 تم تحديث ${updatedCount}/5 ملفات`);
  
  if (updatedCount > 0) {
    console.log('\n✅ تم تحديث أيقونة سمسم!');
    console.log('🔄 الآن شغل السكريبت لنسخ الأيقونات الجديدة:');
    console.log('node scripts/copy-splash-as-icons.js');
  }
}

updateSplashscreenLogos();
