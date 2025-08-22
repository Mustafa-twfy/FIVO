#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 الحل البسيط والقوي لأيقونات Android');

// مجلدات الأيقونات
const folders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];

// مسارات الملفات
const sourceIcon = path.join(__dirname, '../assets/icon.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

function copyIconToFolder(iconPath, targetFolder, fileName) {
  try {
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }
    
    const targetPath = path.join(targetFolder, fileName);
    fs.copyFileSync(iconPath, targetPath);
    console.log(`✅ نسخ ${fileName} إلى ${path.basename(targetFolder)}`);
    return true;
  } catch (error) {
    console.log(`❌ خطأ في نسخ ${fileName}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('\n📁 فحص الملفات المصدر...');
  
  if (!fs.existsSync(sourceIcon)) {
    console.log('❌ لم يتم العثور على assets/icon.png');
    return;
  }

  console.log('\n🎯 نسخ الأيقونات إلى مجلدات Android...');

  let successCount = 0;
  let totalOperations = 0;

  folders.forEach(folderName => {
    const folderPath = path.join(androidResPath, folderName);
    console.log(`\n📂 معالجة: ${folderName}`);
    
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
    
    // نسخ ic_launcher_foreground.png
    totalOperations++;
    if (copyIconToFolder(sourceIcon, folderPath, 'ic_launcher_foreground.png')) {
      successCount++;
    }
  });

  console.log(`\n📊 النتيجة: ${successCount}/${totalOperations} عمليات نجحت`);
  
  if (successCount === totalOperations) {
    console.log('\n✅ تم إصلاح أيقونات Android بنجاح!');
    console.log('\n🚀 الخطوات التالية:');
    console.log('1. ادفع التغييرات: git add . && git commit -m "إصلاح نهائي لأيقونات Android"');
    console.log('2. أعد بناء التطبيق عبر GitHub Actions');
  } else {
    console.log('\n⚠️ بعض العمليات فشلت. تحقق من رسائل الخطأ أعلاه.');
  }
}

main();
