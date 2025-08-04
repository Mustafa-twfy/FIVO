# دليل إصلاح مشكلة البناء - سمسم

## المشكلة التي تم حلها

### مشكلة الملفات المكررة
كانت هناك مشكلة في البناء بسبب وجود مجلدين:
- `com/twfy/fivo/` (القديم - تم حذفه)
- `com/twfy/simsim/` (الجديد - المستخدم حالياً)

### الحل المطبق
✅ تم حذف المجلد القديم `com/twfy/fivo/`
✅ تم الاحتفاظ بالمجلد الجديد `com/twfy/simsim/`
✅ تم تحديث جميع الإشارات في الملفات

## كيفية بناء التطبيق الآن

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
# تنظيف المشروع أولاً
cd android
.\gradlew clean
cd ..

# بناء نسخة debug
npm run build:android-local

# بناء نسخة release
npm run build:android-release
```

## التحقق من الإصلاح

### 1. تأكد من عدم وجود مجلد fivo
```bash
# يجب أن لا يوجد هذا المجلد
android/app/src/main/java/com/twfy/fivo/
```

### 2. تأكد من وجود مجلد simsim
```bash
# يجب أن يوجد هذا المجلد
android/app/src/main/java/com/twfy/simsim/
```

### 3. تأكد من محتوى المجلد
```
android/app/src/main/java/com/twfy/simsim/
├── MainActivity.kt
└── MainApplication.kt
```

## الملفات المحدثة

### ملفات Android:
- ✅ `android/app/src/main/res/values/strings.xml` - اسم التطبيق "سمسم"
- ✅ `android/app/src/main/AndroidManifest.xml` - scheme التطبيق
- ✅ `android/app/build.gradle` - package name
- ✅ `android/settings.gradle` - اسم المشروع
- ✅ `android/app/src/main/java/com/twfy/simsim/` - مجلد جديد

### ملفات التطبيق:
- ✅ `app.json` - إعدادات التطبيق والأيقونات
- ✅ جميع ملفات الشاشات التي تحتوي على اللوقو

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
- [ ] زر تعديل الملف الشخصي للسائق يعمل

## استكشاف الأخطاء

إذا واجهت مشاكل:

1. **مشكلة في Package Name**: تأكد من تحديث جميع الملفات المذكورة أعلاه
2. **مشكلة في الأيقونة**: تأكد من أن الرابط يعمل وأن `app.json` محدث
3. **مشكلة في قاعدة البيانات**: تأكد من تشغيل ملف SQL في Supabase
4. **مشكلة في البناء**: تأكد من عدم وجود مجلدات مكررة

## دعم

إذا واجهت أي مشاكل، راجع:
- ملف `BUILD_GUIDE.md` الأصلي
- ملف `SOLUTION_GUIDE.md` لحلول المشاكل الشائعة 