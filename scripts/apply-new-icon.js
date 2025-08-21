#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🎨 تطبيق الأيقونة الجديدة...');

// المسارات
const customIconPath = path.join(__dirname, '../assets/custom-icon.png');
const backupPath = path.join(__dirname, '../assets/icon-backup.png');

// التحقق من وجود الأيقونة الجديدة
if (!fs.existsSync(customIconPath)) {
  console.log('❌ لم يتم العثور على assets/custom-icon.png');
  console.log('\n📋 التعليمات:');
  console.log('1. ضع أيقونتك الجديدة في: assets/custom-icon.png');
  console.log('2. شغل هذا السكريبت مرة أخرى');
  console.log('\n💡 نصائح للأيقونة:');
  console.log('- الحجم المُفضل: 512x512 أو 1024x1024');
  console.log('- الصيغة: PNG');
  console.log('- جودة عالية');
  process.exit(1);
}

// إنشاء نسخة احتياطية
try {
  const currentIcon = path.join(__dirname, '../assets/icon.png');
  if (fs.existsSync(currentIcon)) {
    fs.copyFileSync(currentIcon, backupPath);
    console.log('✅ تم إنشاء نسخة احتياطية في: assets/icon-backup.png');
  }
} catch (error) {
  console.log('⚠️ لم يتم إنشاء نسخة احتياطية:', error.message);
}

// تطبيق الأيقونة الجديدة
function applyNewIcon() {
  try {
    // قراءة الأيقونة الجديدة
    const newIcon = fs.readFileSync(customIconPath);
    
    // المسارات المطلوب تحديثها
    const assetFiles = [
      'assets/icon.png',
      'assets/adaptive-icon.png',
      'assets/simsim-logo.png'
    ];
    
    // تحديث ملفات assets
    let assetsUpdated = 0;
    assetFiles.forEach(file => {
      try {
        const filePath = path.join(__dirname, `../${file}`);
        fs.writeFileSync(filePath, newIcon);
        console.log(`✅ تحديث ${file}`);
        assetsUpdated++;
      } catch (error) {
        console.log(`❌ خطأ في ${file}: ${error.message}`);
      }
    });
    
    // تحديث ملفات drawable
    const densities = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
    let drawableUpdated = 0;
    
    densities.forEach(density => {
      try {
        const logoPath = path.join(__dirname, `../android/app/src/main/res/drawable-${density}/splashscreen_logo.png`);
        fs.writeFileSync(logoPath, newIcon);
        console.log(`✅ تحديث drawable-${density}/splashscreen_logo.png`);
        drawableUpdated++;
      } catch (error) {
        console.log(`❌ خطأ في drawable-${density}: ${error.message}`);
      }
    });
    
    // تحديث ملفات mipmap
    let mipmapUpdated = 0;
    densities.forEach(density => {
      const targetFolder = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}`);
      
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }
      
      const targets = ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png'];
      
      targets.forEach(target => {
        try {
          const targetPath = path.join(targetFolder, target);
          fs.writeFileSync(targetPath, newIcon);
          mipmapUpdated++;
        } catch (error) {
          console.log(`❌ خطأ في ${target} لـ ${density}: ${error.message}`);
        }
      });
    });
    
    // تقرير النتائج
    console.log('\n📊 تقرير التحديث:');
    console.log(`📁 Assets: ${assetsUpdated}/3`);
    console.log(`🎨 Drawable: ${drawableUpdated}/5`);
    console.log(`📱 Mipmap: ${mipmapUpdated}/15`);
    
    const totalUpdated = assetsUpdated + drawableUpdated + mipmapUpdated;
    const totalExpected = 3 + 5 + 15;
    
    if (totalUpdated >= 20) {
      console.log('\n🎉 تم تطبيق الأيقونة الجديدة بنجاح!');
      console.log('🎨 أيقونة سمسم الجديدة جاهزة');
      console.log('\n🚀 الخطوات التالية:');
      console.log('1. git add .');
      console.log('2. git commit -m "🎨 تحديث أيقونة سمسم"');
      console.log('3. git push');
      console.log('\n💾 نسخة احتياطية متوفرة في: assets/icon-backup.png');
    } else {
      console.log('\n⚠️ بعض الملفات لم يتم تحديثها');
      console.log('🔄 يمكنك المحاولة مرة أخرى أو استخدام النسخة الاحتياطية');
    }
    
  } catch (error) {
    console.log('❌ خطأ في تطبيق الأيقونة:', error.message);
    console.log('🔄 تأكد من أن الملف assets/custom-icon.png صحيح وقابل للقراءة');
  }
}

// تنفيذ العملية
applyNewIcon();
