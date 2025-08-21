#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 إصلاح ملفات splash screen logo...');

// إنشاء أيقونة PNG بسيطة (1x1 شفافة كملف أساسي)
function createMinimalPNG() {
  // PNG بأصغر حجم ممكن (1x1 شفاف)
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // width: 1
    0x00, 0x00, 0x00, 0x01, // height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0B, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, // compressed data
    0x0A, 0x2D, 0xB4, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return minimalPNG;
}

// إنشاء أيقونة أكبر (64x64 شفافة)
function createLargerPNG() {
  // استخدام مكتبة Canvas أو إنشاء PNG بسيط
  // هنا سنستخدم ملف أيقونة موجود إذا كان متاحاً
  const possibleSources = [
    'assets/icon.png',
    'assets/adaptive-icon.png',
    'assets/simsim-logo.png',
    'android/app/src/main/res/mipmap-hdpi/ic_launcher.png'
  ];
  
  for (const source of possibleSources) {
    const sourcePath = path.join(__dirname, '..', source);
    if (fs.existsSync(sourcePath)) {
      console.log(`📋 استخدام ${source} كمصدر للـ splash logo`);
      return fs.readFileSync(sourcePath);
    }
  }
  
  // إذا لم توجد ملفات، استخدم PNG أساسي
  console.log('⚠️ لم توجد أيقونة مصدر، استخدام PNG أساسي');
  return createMinimalPNG();
}

// المجلدات المطلوب إنشاء الملفات فيها
const drawableDirs = [
  'android/app/src/main/res/drawable-mdpi',
  'android/app/src/main/res/drawable-hdpi',
  'android/app/src/main/res/drawable-xhdpi',
  'android/app/src/main/res/drawable-xxhdpi',
  'android/app/src/main/res/drawable-xxxhdpi'
];

try {
  const logoData = createLargerPNG();
  let filesCreated = 0;
  
  drawableDirs.forEach(dir => {
    try {
      // التأكد من وجود المجلد
      const fullDirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullDirPath)) {
        fs.mkdirSync(fullDirPath, { recursive: true });
        console.log(`📁 إنشاء مجلد ${dir}`);
      }
      
      // إنشاء ملف splashscreen_logo.png
      const logoPath = path.join(fullDirPath, 'splashscreen_logo.png');
      fs.writeFileSync(logoPath, logoData);
      console.log(`✅ إنشاء ${dir}/splashscreen_logo.png`);
      filesCreated++;
      
    } catch (error) {
      console.log(`❌ خطأ في إنشاء ${dir}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 تم إنشاء ${filesCreated}/5 ملفات splash logo`);
  
  if (filesCreated === 5) {
    console.log('🎉 تم إصلاح جميع ملفات splash screen logo!');
    console.log('\n🚀 يمكنك الآن تشغيل:');
    console.log('cd android && ./gradlew assembleRelease');
  } else {
    console.log('⚠️ بعض الملفات لم يتم إنشاؤها بنجاح');
  }
  
} catch (error) {
  console.log('❌ خطأ عام:', error.message);
}

console.log('\n💡 إذا كان لديك أيقونة مخصصة، ضعها في assets/icon.png وشغل السكريبت مرة أخرى');
