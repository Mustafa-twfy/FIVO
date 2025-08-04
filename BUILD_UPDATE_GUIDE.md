# دليل تحديث بناء التطبيق - سمسم

## التحديثات المنجزة

### 1. تغيير اسم التطبيق
- تم تغيير اسم التطبيق من "Fivo" إلى "سمسم" في جميع الملفات
- تم تحديث package name من `com.twfy.fivo` إلى `com.twfy.simsim`

### 2. تحديث الأيقونات
- تم تحديث جميع الأيقونات لاستخدام الرابط المباشر: `https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg`
- تم تحديث `app.json` لاستخدام الأيقونة الجديدة

### 3. الملفات المحدثة

#### ملفات Android:
- `android/app/src/main/res/values/strings.xml` - اسم التطبيق
- `android/app/src/main/AndroidManifest.xml` - scheme التطبيق
- `android/app/build.gradle` - package name
- `android/settings.gradle` - اسم المشروع
- `android/app/src/main/java/com/twfy/simsim/` - مجلد جديد للملفات

#### ملفات التطبيق:
- `app.json` - إعدادات التطبيق والأيقونات
- جميع ملفات الشاشات التي تحتوي على اللوقو

## كيفية بناء التطبيق

### الطريقة الأولى: استخدام EAS Build (موصى به)
```bash
# بناء نسخة تطوير
npm run build:android-dev

# بناء نسخة إنتاج
npm run build:android-prod

# بناء جميع المنصات
npm run build:all
```

### الطريقة الثانية: بناء محلي
```bash
# تنظيف المشروع
cd android
.\gradlew clean
cd ..

# بناء نسخة debug
npm run build:android-local

# بناء نسخة release
npm run build:android-release
```

## ملاحظات مهمة

1. **تأكد من تشغيل ملف SQL**: قبل بناء التطبيق، تأكد من تشغيل ملف `add_system_settings_table.sql` في Supabase

2. **تنظيف Cache**: إذا واجهت مشاكل، قم بتنظيف cache:
   ```bash
   npx expo start --clear
   ```

3. **تحديث Dependencies**: تأكد من تحديث جميع dependencies:
   ```bash
   npm install
   ```

## التحقق من التحديثات

بعد بناء التطبيق، تأكد من:
- [ ] اسم التطبيق يظهر "سمسم" في الهاتف
- [ ] الأيقونة الجديدة تظهر بشكل صحيح
- [ ] جميع الشاشات تعرض اللوقو الجديد
- [ ] نظام نقاط الديون يعمل تلقائياً
- [ ] قسم الإعدادات في لوحة الإدارة يعمل

## استكشاف الأخطاء

إذا واجهت مشاكل:

1. **مشكلة في Package Name**: تأكد من تحديث جميع الملفات المذكورة أعلاه
2. **مشكلة في الأيقونة**: تأكد من أن الرابط يعمل وأن `app.json` محدث
3. **مشكلة في قاعدة البيانات**: تأكد من تشغيل ملف SQL في Supabase

## دعم

إذا واجهت أي مشاكل، راجع:
- ملف `BUILD_GUIDE.md` الأصلي
- ملف `SOLUTION_GUIDE.md` لحلول المشاكل الشائعة 