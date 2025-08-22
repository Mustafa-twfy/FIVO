#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 إزالة جميع مراجع splashscreen_logo من Android...');

// حذف جميع ملفات splashscreen_logo
function deleteSplashLogos() {
  const drawableDirs = [
    'android/app/src/main/res/drawable-mdpi',
    'android/app/src/main/res/drawable-hdpi', 
    'android/app/src/main/res/drawable-xhdpi',
    'android/app/src/main/res/drawable-xxhdpi',
    'android/app/src/main/res/drawable-xxxhdpi'
  ];
  
  let deletedCount = 0;
  
  drawableDirs.forEach(dir => {
    const logoPath = path.join(__dirname, '..', dir, 'splashscreen_logo.png');
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
      console.log(`🗑️ حذف ${dir}/splashscreen_logo.png`);
      deletedCount++;
    }
  });
  
  console.log(`📊 تم حذف ${deletedCount} ملف splashscreen_logo`);
}

// إنشاء .nomedia files لمنع مسح المجلدات
function createNoMediaFiles() {
  const drawableDirs = [
    'android/app/src/main/res/drawable-mdpi',
    'android/app/src/main/res/drawable-hdpi',
    'android/app/src/main/res/drawable-xhdpi', 
    'android/app/src/main/res/drawable-xxhdpi',
    'android/app/src/main/res/drawable-xxxhdpi'
  ];
  
  drawableDirs.forEach(dir => {
    const fullDirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullDirPath)) {
      fs.mkdirSync(fullDirPath, { recursive: true });
    }
    
    // إنشاء ملف فارغ للحفاظ على المجلد
    const keepFile = path.join(fullDirPath, '.gitkeep');
    fs.writeFileSync(keepFile, '# Keep this directory\n');
  });
}

// تحديث .gitignore لتجاهل splashscreen_logo نهائياً
function updateGitignore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const ignoreRule = '\n# تجاهل ملفات splashscreen_logo نهائياً\nandroid/app/src/main/res/drawable-*/splashscreen_logo.png\n';
  
  try {
    let content = '';
    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    if (!content.includes('splashscreen_logo.png')) {
      fs.appendFileSync(gitignorePath, ignoreRule);
      console.log('✅ تم تحديث .gitignore لتجاهل splashscreen_logo نهائياً');
    } else {
      console.log('ℹ️ .gitignore يحتوي بالفعل على قاعدة splashscreen_logo');
    }
  } catch (error) {
    console.log('⚠️ خطأ في تحديث .gitignore:', error.message);
  }
}

// تشغيل جميع العمليات
try {
  console.log('\n1️⃣ حذف ملفات splashscreen_logo...');
  deleteSplashLogos();
  
  console.log('\n2️⃣ إنشاء ملفات .gitkeep...');
  createNoMediaFiles();
  
  console.log('\n3️⃣ تحديث .gitignore...');
  updateGitignore();
  
  console.log('\n🎉 تم الانتهاء من التنظيف!');
  console.log('\n📋 الخطوات التالية:');
  console.log('1. git add .');
  console.log('2. git commit -m "🗑️ إزالة ملفات splashscreen_logo نهائياً"');
  console.log('3. git push origin main');
  console.log('\n✨ GitHub Actions سيبني بدون مشاكل splashscreen_logo!');
  
} catch (error) {
  console.log('❌ خطأ:', error.message);
}
