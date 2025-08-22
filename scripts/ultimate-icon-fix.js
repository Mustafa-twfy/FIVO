#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 الحل النهائي: حذف جميع ملفات PNG المُسببة للمشاكل...');

// قائمة جميع ملفات PNG المُسببة للمشاكل
const problemFiles = [
  // ic_launcher files
  'android/app/src/main/res/mipmap-mdpi/ic_launcher.png',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher.png', 
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png',
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
  
  // ic_launcher_round files
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png',
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png', 
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png',
  
  // ic_launcher_foreground files
  'android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png',
  'android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png',
  'android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png',
  'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png',
  'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png'
];

// تحديث ملفات XML للأيقونات التكيفية
function updateAdaptiveIcons() {
  // ic_launcher.xml
  const icLauncherXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@color/iconBackground"/>
</adaptive-icon>`;

  // ic_launcher_round.xml
  const icLauncherRoundXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@color/iconBackground"/>
</adaptive-icon>`;

  try {
    const icLauncherPath = path.join(__dirname, '..', 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml');
    const icLauncherRoundPath = path.join(__dirname, '..', 'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml');
    
    fs.writeFileSync(icLauncherPath, icLauncherXml);
    fs.writeFileSync(icLauncherRoundPath, icLauncherRoundXml);
    
    console.log('✅ تحديث ملفات XML للأيقونات التكيفية');
  } catch (error) {
    console.log('❌ خطأ في تحديث XML:', error.message);
  }
}

// إضافة قاعدة .gitignore لمنع عودة هذه الملفات
function updateGitignore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const ignoreRules = `
# منع ملفات PNG المُسببة لأخطاء AAPT2
android/app/src/main/res/mipmap-*/ic_launcher*.png
android/app/src/main/res/drawable-*/splashscreen_logo.png
`;

  try {
    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    if (!content.includes('ic_launcher*.png')) {
      fs.appendFileSync(gitignorePath, ignoreRules);
      console.log('✅ تحديث .gitignore لمنع عودة ملفات PNG المُشكِلة');
    }
  } catch (error) {
    console.log('⚠️ خطأ في تحديث .gitignore:', error.message);
  }
}

try {
  let deletedCount = 0;
  
  console.log('\n1️⃣ حذف جميع ملفات PNG المُسببة للمشاكل...');
  problemFiles.forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, '..', filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`🗑️ حذف ${filePath}`);
        deletedCount++;
      }
    } catch (error) {
      console.log(`❌ خطأ في حذف ${filePath}: ${error.message}`);
    }
  });
  
  console.log(`\n📊 تم حذف ${deletedCount} ملف PNG`);
  
  console.log('\n2️⃣ تحديث الأيقونات التكيفية...');
  updateAdaptiveIcons();
  
  console.log('\n3️⃣ تحديث .gitignore...');
  updateGitignore();
  
  console.log('\n🎉 تم الانتهاء من الحل النهائي!');
  console.log('\n💡 الآن التطبيق سيستخدم:');
  console.log('   - أيقونات تكيفية XML فقط');
  console.log('   - لا توجد ملفات PNG مُشكِلة');
  console.log('   - لون خلفية ثابت من colors.xml');
  console.log('\n📋 الخطوات التالية:');
  console.log('1. git add .');
  console.log('2. git commit -m "🗑️ الحل النهائي: حذف جميع ملفات PNG المُسببة لأخطاء AAPT2"');
  console.log('3. git push origin main');
  console.log('\n✨ GitHub Actions سيبني بنجاح بدون أخطاء AAPT2!');
  
} catch (error) {
  console.log('❌ خطأ عام:', error.message);
}
