# دليل إعداد قاعدة البيانات في Supabase

## الخطوات المطلوبة:

### 1. إنشاء مشروع Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. احفظ URL و API Key

### 2. تحديث ملف supabase.js
قم بتحديث البيانات التالية في ملف `supabase.js`:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
```

### 3. إنشاء الجداول
1. اذهب إلى SQL Editor في لوحة تحكم Supabase
2. انسخ محتوى ملف `create_all_tables.sql`
3. الصق الكود واضغط Run

### 4. التحقق من الجداول
بعد تشغيل الكود، تأكد من وجود الجداول التالية:
- drivers
- stores  
- orders
- notifications
- store_notifications
- support_messages
- store_support_messages
- rewards
- fines
- banned_users
- registration_requests

### 5. تشغيل التطبيق
بعد إنشاء الجداول، يمكنك تشغيل التطبيق:

```bash
npm start
```

## ملاحظات مهمة:
- تأكد من أن RLS (Row Level Security) مفعل على الجداول
- يمكنك تعديل البيانات التجريبية في ملف `create_all_tables.sql`
- في حالة وجود أخطاء، تحقق من console logs للتطبيق

## بيانات تسجيل الدخول التجريبية:

### السائقين:
- Email: driver1@tawseel.com, Password: password123
- Email: driver2@tawseel.com, Password: password123

### المتاجر:
- Email: store1@tawseel.com, Password: password123
- Email: store2@tawseel.com, Password: password123

### طلب تسجيل معلق:
- Email: nmcmilli07@gmail.com, Password: password123 