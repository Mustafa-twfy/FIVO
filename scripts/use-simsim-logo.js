#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 استخدام simsim-logo.png كأيقونة للتطبيق...');

const simsimLogoPath = path.join(__dirname, '../assets/simsim-logo.png');

// فحص وجود الملف
if (!fs.existsSync(simsimLogoPath)) {
  console.log('❌ لم يتم العثور على assets/simsim-logo.png');
  process.exit(1);
}

// استبدال splashscreen_logo بـ simsim-logo
function replaceSplashscreenWithSimsim() {
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  let updatedCount = 0;
  
  densities.forEach(density => {
    const targetPath = path.join(__dirname, `../android/app/src/main/res/drawable-${density}/splashscreen_logo.png`);
    
    try {
      // نسخ simsim-logo.png ليحل محل splashscreen_logo.png
      fs.copyFileSync(simsimLogoPath, targetPath);
      console.log(`✅ استبدال splashscreen_logo في drawable-${density}`);
      updatedCount++;
    } catch (error) {
      console.log(`❌ خطأ في نسخ إلى ${density}: ${error.message}`);
    }
  });
  
  return updatedCount;
}

// نسخ simsim-logo لجميع مجلدات mipmap أيضاً
function copyToMipmapFolders() {
  const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
  let copiedCount = 0;
  
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
        fs.copyFileSync(simsimLogoPath, targetPath);
        copiedCount++;
      } catch (error) {
        console.log(`❌ خطأ في نسخ ${target} إلى ${density}: ${error.message}`);
      }
    });
  });
  
  return copiedCount;
}

console.log('\n📋 بدء العملية...\n');

// الخطوة 1: استبدال splashscreen_logo
const drawableUpdated = replaceSplashscreenWithSimsim();
console.log(`\n📊 تحديث drawable: ${drawableUpdated}/5 ملفات`);

// الخطوة 2: نسخ إلى mipmap
const mipmapCopied = copyToMipmapFolders();
console.log(`📊 نسخ mipmap: ${mipmapCopied}/15 ملفات`);

if (drawableUpdated > 0 && mipmapCopied > 0) {
  console.log('\n🎉 تم تحديث أيقونة التطبيق بنجاح!');
  console.log('🎨 الآن أيقونة التطبيق وشاشة البداية ستستخدم شعار سمسم');
  console.log('\n🚀 الخطوات التالية:');
  console.log('1. git add .');
  console.log('2. git commit -m "🎨 تحديث أيقونة التطبيق لشعار سمسم"');
  console.log('3. git push');
} else {
  console.log('\n⚠️ حدثت بعض الأخطاء في العملية');
}
