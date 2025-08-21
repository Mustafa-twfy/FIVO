/**
 * مولد أيقونات التطبيق
 * يقوم بإنشاء جميع الأحجام المطلوبة من صورة واحدة
 */

const fs = require('fs');
const path = require('path');

// التحقق من وجود الصورة الأساسية
const checkMainIcon = () => {
  const mainIconPath = path.join(__dirname, '../assets/icon.png');
  
  if (!fs.existsSync(mainIconPath)) {
    console.log('❌ لم يتم العثور على assets/icon.png');
    console.log('📝 يرجى وضع أيقونة التطبيق في assets/icon.png بحجم 1024x1024');
    return false;
  }
  
  console.log('✅ تم العثور على الأيقونة الأساسية');
  return true;
};

// التحقق من جميع الأيقونات المطلوبة
const checkAllIcons = () => {
  const requiredIcons = [
    { name: 'icon.png', size: '500x500 أو أكبر', description: 'الأيقونة الرئيسية' },
    { name: 'adaptive-icon.png', size: '500x500 أو أكبر', description: 'أيقونة Android التكيفية' },
    { name: 'favicon.png', size: '512x512', description: 'أيقونة الويب' },
    { name: 'splash-icon.png', size: 'مخصص', description: 'شاشة البداية' }
  ];
  
  console.log('\n📋 الأيقونات المطلوبة:');
  console.log('='.repeat(50));
  
  requiredIcons.forEach((icon, index) => {
    const iconPath = path.join(__dirname, '../assets', icon.name);
    const exists = fs.existsSync(iconPath);
    const status = exists ? '✅' : '❌';
    
    console.log(`${index + 1}. ${status} ${icon.name}`);
    console.log(`   📏 الحجم: ${icon.size}`);
    console.log(`   📝 الوصف: ${icon.description}`);
    console.log(`   📂 المسار: assets/${icon.name}`);
    console.log('');
  });
  
  return requiredIcons.every(icon => 
    fs.existsSync(path.join(__dirname, '../assets', icon.name))
  );
};

// إنشاء نسخ احتياطية
const createBackups = () => {
  const iconsToBackup = ['icon.png', 'adaptive-icon.png', 'favicon.png'];
  
  console.log('💾 إنشاء نسخ احتياطية...');
  
  iconsToBackup.forEach(iconName => {
    const iconPath = path.join(__dirname, '../assets', iconName);
    const backupPath = path.join(__dirname, '../assets', `${iconName}.bak`);
    
    if (fs.existsSync(iconPath)) {
      try {
        fs.copyFileSync(iconPath, backupPath);
        console.log(`✅ تم حفظ نسخة احتياطية من ${iconName}`);
      } catch (error) {
        console.log(`❌ فشل في حفظ نسخة احتياطية من ${iconName}`);
      }
    }
  });
};

// عرض معلومات التطبيق الحالية
const showCurrentAppInfo = () => {
  const appJsonPath = path.join(__dirname, '../app.json');
  
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    console.log('\n📱 معلومات التطبيق الحالية:');
    console.log('='.repeat(30));
    console.log(`📛 الاسم: ${appJson.expo.name}`);
    console.log(`🔗 المعرف: ${appJson.expo.slug}`);
    console.log(`📦 الإصدار: ${appJson.expo.version}`);
    console.log(`🎨 الأيقونة: ${appJson.expo.icon}`);
    console.log(`💫 شاشة البداية: ${appJson.expo.splash.image}`);
    
    if (appJson.expo.android && appJson.expo.android.adaptiveIcon) {
      console.log(`🤖 Android Adaptive: ${appJson.expo.android.adaptiveIcon.foregroundImage}`);
    }
    
    if (appJson.expo.web && appJson.expo.web.favicon) {
      console.log(`🌐 Favicon: ${appJson.expo.web.favicon}`);
    }
  }
};

// الدالة الرئيسية
const main = () => {
  console.log('🎨 مولد أيقونات التطبيق - سمسم');
  console.log('='.repeat(40));
  
  // عرض معلومات التطبيق
  showCurrentAppInfo();
  
  // إنشاء نسخ احتياطية
  createBackups();
  
  // التحقق من الأيقونات
  const allIconsExist = checkAllIcons();
  
  if (allIconsExist) {
    console.log('✅ جميع الأيقونات موجودة!');
    console.log('\n🚀 يمكنك الآن تشغيل التطبيق:');
    console.log('   npx expo start');
  } else {
    console.log('\n📝 تعليمات إضافة الأيقونات:');
    console.log('='.repeat(35));
    console.log('1. احفظ صورتك كـ PNG بخلفية شفافة');
    console.log('2. استخدم حجم 500x500 أو أكبر للأيقونة الرئيسية');
    console.log('3. ضعها في مجلد assets/ بالأسماء المطلوبة');
    console.log('4. شغل هذا السكريبت مرة أخرى للتحقق');
    console.log('\n💡 نصائح للتصميم:');
    console.log('• استخدم تصميم بسيط وواضح');
    console.log('• تجنب النصوص الصغيرة');
    console.log('• اجعل الأيقونة تبدو جيدة بأحجام صغيرة');
    console.log('• للـ adaptive icon، اجعل العناصر المهمة في المركز');
  }
  
  console.log('\n' + '='.repeat(40));
};

// تشغيل السكريبت
if (require.main === module) {
  main();
}

module.exports = {
  checkMainIcon,
  checkAllIcons,
  createBackups,
  showCurrentAppInfo
};
