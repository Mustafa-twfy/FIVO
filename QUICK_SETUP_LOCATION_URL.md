# إعداد سريع لميزة رابط موقع المتجر

## الخطوات المطلوبة

### 1. تحديث قاعدة البيانات
```sql
-- تشغيل في Supabase SQL Editor
\i add_location_url_fields.sql
```

### 2. تحديث البيانات الموجودة
```sql
-- تشغيل في Supabase SQL Editor
\i update_existing_data.sql
```

### 3. إعادة تشغيل التطبيق
```bash
npm start
```

## اختبار الميزة

### للمتاجر:
1. سجل متجر جديد
2. أضف رابط من Google Maps
3. أنشئ طلب جديد

### للسائقين:
1. سجل دخول كسائق
2. انتقل للطلبات المتاحة
3. اضغط "عرض موقع المتجر"

## الملفات المحدثة
- `screens/StoreInfoScreen.js`
- `screens/NewOrderScreen.js`
- `screens/AvailableOrdersScreen.js`
- `screens/DriverDashboardScreen.js`
- `supabase.js`

## ملاحظات
- الميزة متوافقة مع الإصدارات السابقة
- لا تحتاج لإعادة تثبيت التطبيق
- تعمل على جميع الأجهزة 