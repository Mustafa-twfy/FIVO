#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 نسخ splashscreen_logo كأيقونات افتراضية...');

// مجلدات الأيقونات Android
const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];

let successCount = 0;
let totalOperations = 0;

densities.forEach(density => {
  const sourcePath = path.join(__dirname, `../android/app/src/main/res/drawable-${density}/splashscreen_logo.png`);
  const targetFolder = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}`);
  
  // إنشاء المجلد إذا لم يكن موجوداً
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }
  
  // نسخ الملفات المطلوبة
  const targets = [
    'ic_launcher.png',
    'ic_launcher_round.png',
    'ic_launcher_foreground.png'
  ];
  
  targets.forEach(target => {
    try {
      totalOperations++;
      if (fs.existsSync(sourcePath)) {
        const targetPath = path.join(targetFolder, target);
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ نسخ ${target} إلى mipmap-${density}`);
        successCount++;
      } else {
        console.log(`❌ لم يتم العثور على ${sourcePath}`);
      }
    } catch (error) {
      console.log(`❌ خطأ في نسخ ${target} لـ ${density}: ${error.message}`);
    }
  });
});

console.log(`\n📊 النتيجة: ${successCount}/${totalOperations} عمليات نجحت`);

if (successCount === totalOperations) {
  console.log('\n✅ تم نسخ جميع الأيقونات بنجاح!');
  console.log('🚀 يمكن الآن إعادة بناء التطبيق');
} else {
  console.log('\n⚠️ بعض العمليات فشلت');
}
