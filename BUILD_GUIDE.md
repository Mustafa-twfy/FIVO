# دليل البناء السحابي - توصيل بلس

## 🚀 الطريقة الأسهل لبناء التطبيق

### 1. تثبيت EAS CLI
```bash
npm install -g @expo/eas-cli
```

### 2. تسجيل الدخول إلى Expo
```bash
eas login
```

### 3. أوامر البناء المتاحة

#### بناء تطبيق Android للتطوير (APK سريع)
```bash
npm run build:android-dev
```

#### بناء تطبيق Android للمعاينة (APK)
```bash
npm run build:android-preview
```

#### بناء تطبيق Android للإنتاج (AAB)
```bash
npm run build:android-prod
```

#### بناء تطبيق iOS
```bash
npm run build:ios
```

#### بناء لكلا المنصتين
```bash
npm run build:all
```

### 4. أوامر مباشرة (بدون npm scripts)
```bash
# بناء Android للتطوير
eas build --platform android --profile development

# بناء Android للمعاينة
eas build --platform android --profile preview

# بناء Android للإنتاج
eas build --platform android --profile production

# بناء iOS
eas build --platform ios --profile production
```

## 📱 أنواع الملفات المنتجة

- **Development Profile**: ملف APK للتطوير السريع
- **Preview Profile**: ملف APK للمعاينة والاختبار
- **Production Profile**: ملف AAB للإنتاج (Google Play Store)

## ⏱️ وقت البناء المتوقع

- **Development**: 5-10 دقائق
- **Preview**: 10-15 دقيقة
- **Production**: 15-25 دقيقة

## 🔗 روابط التحميل

بعد اكتمال البناء، ستظهر روابط التحميل في:
1. Terminal
2. Expo Dashboard
3. Email notification

## 📋 متطلبات البناء

- حساب Expo مجاني
- اتصال إنترنت مستقر
- المشروع مرتبط بـ GitHub (مفضل)

## 🛠️ استكشاف الأخطاء

### إذا واجهت مشاكل:
1. تأكد من تسجيل الدخول: `eas whoami`
2. تحقق من إعدادات المشروع: `eas build:configure`
3. امسح الكاش: `eas build:clean`

### للبناء المحلي (بديل):
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## 🎯 التوصية

**استخدم `npm run build:android-dev` للبداية** - سيعطيك ملف APK سريع للتطوير والاختبار. 

## البناء التلقائي عبر GitHub Actions

تم تجهيز نظام بناء تلقائي (CI/CD) عبر GitHub Actions لبناء تطبيق Tawseel Plus على أندرويد وiOS مباشرة من المستودع. كل ما عليك هو دفع التعديلات (push) أو تشغيل البناء يدوياً من تبويب Actions في GitHub.

- ملف إعدادات البناء موجود في `.github/workflows/build-app.yml`.
- البناء يتم باستخدام Expo EAS Build.
- النتائج (APK/AAB/IPA) تظهر في سجل Actions بعد اكتمال البناء. 