#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📤 رفع أيقونة مخصصة للتطبيق...');

// تعليمات للمستخدم
console.log(`
🎨 لاستخدام أيقونة مخصصة:

1. احفظ الأيقونة الجديدة باسم: assets/custom-icon.png
   - الحجم المُفضل: 512x512 أو 1024x1024
   - الصيغة: PNG
   - خلفية شفافة أو ملونة

2. بعد حفظ الملف، شغل هذا السكريبت مرة أخرى

📋 متطلبات الأيقونة:
- ✅ حجم مربع (مثل 512x512)
- ✅ صيغة PNG
- ✅ جودة عالية
- ✅ تصميم واضح وبسيط
`);

const customIconPath = path.join(__dirname, '../assets/custom-icon.png');

if (fs.existsSync(customIconPath)) {
  console.log('✅ تم العثور على assets/custom-icon.png');
  
  // استخدام الأيقونة المخصصة
  function useCustomIcon() {
    const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    let totalUpdated = 0;
    
    // استبدال splashscreen_logo
    densities.forEach(density => {
      const targetPath = path.join(__dirname, `../android/app/src/main/res/drawable-${density}/splashscreen_logo.png`);
      
      try {
        fs.copyFileSync(customIconPath, targetPath);
        console.log(`✅ تحديث drawable-${density}`);
        totalUpdated++;
      } catch (error) {
        console.log(`❌ خطأ في ${density}: ${error.message}`);
      }
    });
    
    // نسخ إلى mipmap
    densities.forEach(density => {
      const targetFolder = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}`);
      
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }
      
      const targets = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
      
      targets.forEach(target => {
        try {
          const targetPath = path.join(targetFolder, target);
          fs.copyFileSync(customIconPath, targetPath);
          totalUpdated++;
        } catch (error) {
          console.log(`❌ خطأ في نسخ ${target}: ${error.message}`);
        }
      });
    });
    
    console.log(`\n📊 تم تحديث ${totalUpdated}/20 ملف`);
    
    if (totalUpdated > 15) {
      console.log('\n🎉 تم تحديث الأيقونة المخصصة بنجاح!');
      console.log('🚀 ادفع التغييرات: git add . && git commit -m "🎨 أيقونة مخصصة" && git push');
    }
  }
  
  useCustomIcon();
} else {
  console.log('⏳ في انتظار رفع assets/custom-icon.png...');
}
