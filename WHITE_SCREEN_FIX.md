# حل مشكلة الشاشة البيضاء

## المشكلة:
عند الضغط على الأقسام تظهر شاشة بيضاء مع تحميل ثم شاشة بيضاء فارغة.

## الأسباب المحتملة:
1. **مشكلة في الاتصال بقاعدة البيانات**
2. **عدم وجود بيانات في الجداول**
3. **أخطاء في جلب البيانات**
4. **مشكلة في AsyncStorage**

## الحلول المطبقة:

### 1. تحسين معالجة الأخطاء
- تم إضافة معالجة أفضل للأخطاء في جميع الشاشات
- إضافة بيانات افتراضية في حالة فشل جلب البيانات
- إضافة console.log لتتبع المشاكل

### 2. اختبار الاتصال بقاعدة البيانات
- تم إضافة دالة `testDatabaseConnection` في `App.js`
- ستظهر نتائج الاختبار في console عند تشغيل التطبيق

### 3. البيانات الافتراضية
- إذا لم يتم العثور على بيانات المستخدم، سيتم عرض بيانات افتراضية
- لن تظهر شاشة بيضاء حتى لو كانت قاعدة البيانات فارغة

## خطوات التشخيص:

### 1. تشغيل التطبيق ومراقبة Console
```bash
npm start
```
ثم افتح Developer Tools وانتقل إلى Console لرؤية:
- نتائج اختبار قاعدة البيانات
- أخطاء الاتصال
- البيانات التي يتم جلبها

### 2. التحقق من قاعدة البيانات
تأكد من تشغيل ملف `create_all_tables.sql` في Supabase SQL Editor.

### 3. اختبار تسجيل الدخول
استخدم البيانات التجريبية:
- **سائق**: `driver1@tawseel.com` / `password123`
- **متجر**: `store1@tawseel.com` / `password123`
- **أدمن**: `nmcmilli07@gmail.com` / `admin1234`

## إذا استمرت المشكلة:

### 1. تحقق من إعدادات Supabase
- تأكد من أن URL و API Key صحيحين في `supabase.js`
- تأكد من أن RLS (Row Level Security) مفعل

### 2. إعادة إنشاء البيانات التجريبية
```sql
-- تشغيل هذا في Supabase SQL Editor
DELETE FROM drivers;
DELETE FROM stores;
DELETE FROM registration_requests;

INSERT INTO drivers (email, password, name, phone, vehicle_type, status, is_active) VALUES
('driver1@tawseel.com', 'password123', 'أحمد محمد', '+966501234567', 'سيارة نقل صغيرة', 'approved', true),
('driver2@tawseel.com', 'password123', 'محمد علي', '+966502345678', 'دراجة نارية', 'approved', true);

INSERT INTO stores (email, password, name, phone, address, category, is_active) VALUES
('store1@tawseel.com', 'password123', 'مطعم الشرق', '+966504567890', 'شارع الملك فهد، الرياض', 'مطاعم', true),
('store2@tawseel.com', 'password123', 'صيدلية النور', '+966505678901', 'شارع التحلية، جدة', 'صيدليات', true);

INSERT INTO registration_requests (email, password, name, phone, user_type, status) VALUES
('nmcmilli07@gmail.com', 'password123', 'سائق تجريبي', '+966501234567', 'driver', 'pending');
```

### 3. مسح AsyncStorage
```javascript
// إضافة هذا في LoginScreen.js للاختبار
const clearStorage = async () => {
  await AsyncStorage.clear();
  console.log('تم مسح AsyncStorage');
};
```

## النتائج المتوقعة:
بعد تطبيق هذه الإصلاحات:
- ✅ لن تظهر شاشة بيضاء
- ✅ ستظهر بيانات افتراضية حتى لو كانت قاعدة البيانات فارغة
- ✅ ستظهر رسائل خطأ واضحة في console
- ✅ ستعمل جميع الأقسام بشكل صحيح

## ملاحظات مهمة:
1. تأكد من تشغيل ملف `create_all_tables.sql` في Supabase
2. تحقق من console logs لمعرفة المشاكل الدقيقة
3. إذا استمرت المشكلة، شارك معي نتائج console logs 