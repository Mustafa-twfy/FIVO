#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 إنشاء أيقونة سمسم جميلة وعصرية...');

// أيقونة سمسم جميلة مع تدرج أخضر وتصميم عصري
function createBeautifulSimsimIcon() {
  // أيقونة 512x512 بتصميم جميل - تدرج أخضر مع شعار سمسم
  const beautifulIconBase64 = `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`;
  
  return Buffer.from(beautifulIconBase64, 'base64');
}

// إنشاء أيقونة أصغر للاستخدامات المختلفة
function createCompactIcon() {
  // أيقونة مضغوطة 128x128
  const compactIconBase64 = `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`;
  
  return Buffer.from(compactIconBase64, 'base64');
}

// دالة لإنشاء وحفظ الأيقونات
function createAndSaveIcons() {
  const beautifulIcon = createBeautifulSimsimIcon();
  const compactIcon = createCompactIcon();
  
  // حفظ الأيقونة الأساسية
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const adaptiveIconPath = path.join(__dirname, '../assets/adaptive-icon.png');
  const simsimLogoPath = path.join(__dirname, '../assets/simsim-logo.png');
  
  try {
    // حفظ الأيقونات الجديدة
    fs.writeFileSync(iconPath, beautifulIcon);
    fs.writeFileSync(adaptiveIconPath, beautifulIcon);
    fs.writeFileSync(simsimLogoPath, beautifulIcon);
    
    console.log('✅ تم إنشاء أيقونة سمسم جميلة!');
    console.log(`📁 حُفظت في: ${iconPath}`);
    console.log(`📁 وأيضاً في: ${adaptiveIconPath}`);
    console.log(`📁 وأيضاً في: ${simsimLogoPath}`);
    
    return true;
  } catch (error) {
    console.log(`❌ خطأ في الحفظ: ${error.message}`);
    return false;
  }
}

// تحديث جميع ملفات splashscreen_logo
function updateAllSplashLogos() {
  const beautifulIcon = createBeautifulSimsimIcon();
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  let updatedCount = 0;
  
  densities.forEach(density => {
    const logoPath = path.join(__dirname, `../android/app/src/main/res/drawable-${density}/splashscreen_logo.png`);
    
    try {
      fs.writeFileSync(logoPath, beautifulIcon);
      console.log(`✅ تحديث drawable-${density}/splashscreen_logo.png`);
      updatedCount++;
    } catch (error) {
      console.log(`❌ خطأ في تحديث ${density}: ${error.message}`);
    }
  });
  
  return updatedCount;
}

// تحديث جميع ملفات mipmap
function updateAllMipmaps() {
  const beautifulIcon = createBeautifulSimsimIcon();
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  let updatedCount = 0;
  
  densities.forEach(density => {
    const targetFolder = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}`);
    
    // إنشاء المجلد إذا لم يكن موجوداً
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    const targets = [
      'ic_launcher.png',
      'ic_launcher_round.png',
      'ic_launcher_foreground.png'
    ];
    
    targets.forEach(target => {
      try {
        const targetPath = path.join(targetFolder, target);
        fs.writeFileSync(targetPath, beautifulIcon);
        updatedCount++;
      } catch (error) {
        console.log(`❌ خطأ في ${target} لـ ${density}: ${error.message}`);
      }
    });
  });
  
  return updatedCount;
}

console.log('\n🎨 بدء إنشاء أيقونة سمسم جميلة...\n');

// تنفيذ العملية
const iconsSaved = createAndSaveIcons();
const splashUpdated = updateAllSplashLogos();
const mipmapUpdated = updateAllMipmaps();

console.log('\n📊 تقرير النتائج:');
console.log(`📁 أيقونات assets: ${iconsSaved ? '✅' : '❌'}`);
console.log(`🎨 drawable logos: ${splashUpdated}/5`);
console.log(`📱 mipmap icons: ${mipmapUpdated}/15`);

if (iconsSaved && splashUpdated === 5 && mipmapUpdated === 15) {
  console.log('\n🎉 تم إنشاء أيقونة سمسم الجميلة بنجاح!');
  console.log('🎨 تصميم عصري مع تدرج أخضر وشعار سمسم');
  console.log('\n🚀 الخطوات التالية:');
  console.log('1. git add .');
  console.log('2. git commit -m "🎨 أيقونة سمسم جميلة وعصرية"');
  console.log('3. git push');
  console.log('\n✨ الأيقونة ستظهر بتصميم جميل في الشاشة الرئيسية!');
} else {
  console.log('\n⚠️ حدثت بعض الأخطاء في العملية');
}
