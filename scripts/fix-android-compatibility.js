#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 تحسين توافق Android للأجهزة القديمة...');

function updateBuildGradle() {
  const buildGradlePath = path.join(__dirname, '..', 'android', 'build.gradle');
  
  try {
    let content = fs.readFileSync(buildGradlePath, 'utf8');
    
    // تخفيض minSdkVersion إلى 21 (Android 5.0) لدعم أوسع
    content = content.replace(
      /minSdkVersion = Integer\.parseInt\(findProperty\('android\.minSdkVersion'\) \?\: '24'\)/,
      "minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '21')"
    );
    
    // تحديث targetSdkVersion إلى 33 لتجنب مشاكل التوافق
    content = content.replace(
      /targetSdkVersion = Integer\.parseInt\(findProperty\('android\.targetSdkVersion'\) \?\: '34'\)/,
      "targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '33')"
    );
    
    fs.writeFileSync(buildGradlePath, content);
    console.log('✅ تم تحديث android/build.gradle');
    console.log('   - Minimum SDK: 21 (Android 5.0+)');
    console.log('   - Target SDK: 33 (Android 13)');
    
  } catch (error) {
    console.log('❌ خطأ في تحديث build.gradle:', error.message);
  }
}

function addInstallInstructions() {
  const instructionsPath = path.join(__dirname, '..', 'INSTALLATION_TROUBLESHOOTING.md');
  
  const instructions = `# 📱 دليل حل مشاكل التثبيت

## 🚨 إذا لم يتثبت التطبيق على هاتفك:

### 1️⃣ **تفعيل المصادر غير المعروفة:**
\`\`\`
الإعدادات → الأمان → المصادر غير المعروفة → تفعيل
أو
الإعدادات → التطبيقات → وصول خاص → تثبيت تطبيقات غير معروفة
\`\`\`

### 2️⃣ **إلغاء تثبيت الإصدار السابق:**
- احذف أي إصدار سابق من التطبيق قبل تثبيت الجديد
- **الإعدادات → التطبيقات → سمسم → إلغاء التثبيت**

### 3️⃣ **التحقق من مساحة التخزين:**
- تأكد من وجود مساحة كافية (على الأقل 100 MB)

### 4️⃣ **إعادة تشغيل الهاتف:**
- أعد تشغيل الهاتف وحاول مرة أخرى

### 5️⃣ **استخدام مدير ملفات مختلف:**
- جرب تثبيت APK باستخدام مدير ملفات آخر

### 6️⃣ **التحقق من نوع المعالج:**
- التطبيق يدعم: ARM64, ARM32, x86, x86_64
- معظم الهواتف الحديثة تستخدم ARM64

### 7️⃣ **تحديث إصدار Android:**
- **الحد الأدنى المطلوب:** Android 5.0 (API 21)
- **المُوصى به:** Android 8.0+ للأداء الأمثل

## 🔧 **إعدادات التطبيق:**
- **Package Name:** com.twfy.simsim
- **Minimum Android:** 5.0 (API 21)
- **Target Android:** 13 (API 33)
- **Architectures:** armeabi-v7a, arm64-v8a, x86, x86_64

## 📞 **إذا استمرت المشكلة:**
1. احذف التطبيق القديم تماماً
2. أعد تشغيل الهاتف
3. نزّل أحدث إصدار من GitHub Releases
4. ثبّته باستخدام مدير ملفات موثوق
`;

  try {
    fs.writeFileSync(instructionsPath, instructions);
    console.log('✅ تم إنشاء دليل حل المشاكل: INSTALLATION_TROUBLESHOOTING.md');
  } catch (error) {
    console.log('❌ خطأ في إنشاء الدليل:', error.message);
  }
}

function addPermissionsCompatibility() {
  const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  
  try {
    let content = fs.readFileSync(manifestPath, 'utf8');
    
    // إضافة permissions للتوافق مع الأجهزة القديمة
    if (!content.includes('INSTALL_PACKAGES')) {
      const permissionsToAdd = `  <uses-permission android:name="android.permission.INSTALL_PACKAGES" tools:ignore="ProtectedPermissions"/>
  <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES"/>`;
      
      content = content.replace(
        '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>',
        `<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
${permissionsToAdd}`
      );
      
      fs.writeFileSync(manifestPath, content);
      console.log('✅ تم إضافة صلاحيات التثبيت للتوافق');
    }
  } catch (error) {
    console.log('⚠️ خطأ في تحديث AndroidManifest:', error.message);
  }
}

try {
  console.log('\n1️⃣ تحديث إعدادات SDK...');
  updateBuildGradle();
  
  console.log('\n2️⃣ إضافة صلاحيات التوافق...');
  addPermissionsCompatibility();
  
  console.log('\n3️⃣ إنشاء دليل حل المشاكل...');
  addInstallInstructions();
  
  console.log('\n🎉 تم تحسين توافق Android!');
  console.log('\n📋 الخطوات التالية:');
  console.log('1. git add .');
  console.log('2. git commit -m "🔧 تحسين توافق Android للأجهزة القديمة"');
  console.log('3. git push origin main');
  console.log('4. انتظر اكتمال البناء في GitHub Actions');
  console.log('5. نزّل APK الجديد وجرب التثبيت');
  
} catch (error) {
  console.log('❌ خطأ عام:', error.message);
}
