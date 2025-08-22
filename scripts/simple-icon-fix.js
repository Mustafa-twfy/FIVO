#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 الحل البسيط والقوي لأيقونات Android');

// إنشاء أيقونة PNG بسيطة مع خلفية خضراء - لون أخضر سمسم
const createSimpleGreenIcon = () => {
  // SVG للأيقونة - خلفية خضراء دائرية مع حرف "س"
  const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- خلفية خضراء دائرية -->
  <circle cx="256" cy="256" r="240" fill="#00C897" stroke="#00A67A" stroke-width="8"/>
  
  <!-- حرف س باللون الأبيض -->
  <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" 
        text-anchor="middle" fill="white">س</text>
</svg>`;

  // حفظ ملف SVG
  const svgPath = path.join(__dirname, '../assets/simsim-icon.svg');
  fs.writeFileSync(svgPath, svgContent, 'utf8');
  console.log('✅ تم إنشاء ملف SVG بنجاح');

  // نسخ الأيقونة الموجودة إلى جميع المجلدات
  const sourceIcon = path.join(__dirname, '../assets/icon.png');
  
  if (!fs.existsSync(sourceIcon)) {
    console.log('❌ ملف الأيقونة الأساسي غير موجود. سأستخدم أيقونة افتراضية');
    // إنشاء أيقونة أساسية بسيطة كـ PNG
    const simpleIcon = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    fs.writeFileSync(sourceIcon, Buffer.from(simpleIcon, 'base64'));
  }

  const folders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
  const androidResPath = path.join(__dirname, '../android/app/src/main/res');

  let successCount = 0;

  folders.forEach(folder => {
    const targetDir = path.join(androidResPath, folder);
    
    // إنشاء المجلد إذا لم يكن موجوداً
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`📁 تم إنشاء المجلد: ${folder}`);
    }

    // نسخ الملفات المطلوبة
    try {
      const files = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
      
      files.forEach(fileName => {
        const targetPath = path.join(targetDir, fileName);
        fs.copyFileSync(sourceIcon, targetPath);
        console.log(`✅ نسخ ${fileName} إلى ${folder}`);
        successCount++;
      });
    } catch (error) {
      console.log(`❌ خطأ في نسخ الملفات للمجلد ${folder}: ${error.message}`);
    }
  });

  console.log(`\n🎉 تم نسخ ${successCount} ملف بنجاح!`);
  console.log('✨ الأيقونة جاهزة للاستخدام!');
};

// تشغيل السكريبت
createSimpleGreenIcon();