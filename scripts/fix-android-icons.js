#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 إصلاح أيقونات Android - سمسم');

// مجلدات الأيقونات Android بأحجامها
const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// مسارات الملفات
const sourceIcon = path.join(__dirname, '../assets/icon.png');
const sourceAdaptiveIcon = path.join(__dirname, '../assets/adaptive-icon.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyIconToFolder(iconPath, targetFolder, fileName) {
  try {
    ensureDirectoryExists(targetFolder);
    const targetPath = path.join(targetFolder, fileName);
    
    if (fs.existsSync(iconPath)) {
      fs.copyFileSync(iconPath, targetPath);
      console.log(`✅ نسخ ${fileName} إلى ${targetFolder}`);
      return true;
    } else {
      console.log(`❌ لم يتم العثور على ${iconPath}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ خطأ في نسخ ${fileName}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('\n📁 فحص الملفات المصدر...');
  
  // فحص وجود الأيقونات المصدر
  if (!fs.existsSync(sourceIcon)) {
    console.log('❌ لم يتم العثور على assets/icon.png');
    return;
  }
  
  if (!fs.existsSync(sourceAdaptiveIcon)) {
    console.log('⚠️ لم يتم العثور على assets/adaptive-icon.png، سيتم استخدام icon.png');
  }

  console.log('\n🎯 نسخ الأيقونات إلى مجلدات Android...');

  let successCount = 0;
  let totalOperations = 0;

  // نسخ الأيقونات لكل حجم
  Object.keys(iconSizes).forEach(folderName => {
    const folderPath = path.join(androidResPath, folderName);
    
    // نسخ ic_launcher.png
    totalOperations++;
    if (copyIconToFolder(sourceIcon, folderPath, 'ic_launcher.png')) {
      successCount++;
    }
    
    // نسخ ic_launcher_round.png
    totalOperations++;
    if (copyIconToFolder(sourceIcon, folderPath, 'ic_launcher_round.png')) {
      successCount++;
    }
    
    // نسخ ic_launcher_foreground.png (للـ adaptive icon)
    const adaptiveSource = fs.existsSync(sourceAdaptiveIcon) ? sourceAdaptiveIcon : sourceIcon;
    totalOperations++;
    if (copyIconToFolder(adaptiveSource, folderPath, 'ic_launcher_foreground.png')) {
      successCount++;
    }
  });

  console.log(`\n📊 النتيجة: ${successCount}/${totalOperations} عمليات نجحت`);
  
  if (successCount === totalOperations) {
    console.log('\n✅ تم إصلاح أيقونات Android بنجاح!');
    console.log('\n🚀 الخطوات التالية:');
    console.log('1. ادفع التغييرات: git add . && git commit -m "إصلاح أيقونات Android"');
    console.log('2. أعد بناء التطبيق عبر GitHub Actions');
    console.log('3. أو اختبر محلياً: cd android && ./gradlew assembleRelease');
  } else {
    console.log('\n⚠️ بعض العمليات فشلت. تحقق من رسائل الخطأ أعلاه.');
  }
}

main();
