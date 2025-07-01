# حل مشكلة تسجيل الحسابات

## المشكلة
عند محاولة تسجيل حساب جديد (سائق أو متجر)، يظهر خطأ "حدث خطأ في إنشاء حساب".

## السبب
الجداول المطلوبة غير موجودة في قاعدة البيانات، أو جدول `registration_requests` لا يحتوي على جميع الحقول المطلوبة.

## الحل

### الخطوة 1: إنشاء جميع الجداول
1. اذهب إلى لوحة تحكم Supabase
2. اذهب إلى SQL Editor
3. انسخ محتوى ملف `create_all_tables.sql`
4. اضغط "Run" لتنفيذ الأوامر

### الخطوة 2: التحقق من إنشاء الجداول
بعد تنفيذ الأوامر، تأكد من أن الجداول التالية تم إنشاؤها:
- `drivers` (السائقين)
- `stores` (المتاجر)
- `orders` (الطلبات)
- `notifications` (الإشعارات)
- `store_notifications` (إشعارات المتاجر)
- `support_messages` (رسائل الدعم الفني)
- `store_support_messages` (رسائل دعم المتاجر)
- `rewards` (المكافآت)
- `fines` (الغرامات)
- `banned_users` (المستخدمين المحظورين)
- `registration_requests` (طلبات التسجيل)

### الخطوة 3: التحقق من جدول registration_requests
تأكد من أن جدول `registration_requests` يحتوي على الحقول التالية:
- `address` (TEXT)
- `vehicle_type` (VARCHAR(100))
- `vehicle_number` (VARCHAR(50))
- `national_card_front` (TEXT)
- `national_card_back` (TEXT)
- `residence_card_front` (TEXT)
- `residence_card_back` (TEXT)

### الخطوة 4: اختبار التسجيل
1. شغل التطبيق
2. جرب تسجيل حساب جديد كسائق أو متجر
3. تأكد من عدم ظهور أي أخطاء

## ملاحظات
- إذا كانت الجداول موجودة بالفعل، سيتم تجاهل إنشاؤها (IF NOT EXISTS)
- البيانات التجريبية ستتم إضافتها تلقائياً
- تأكد من أن بيانات الاتصال في `supabase.js` صحيحة
- إذا استمرت المشكلة، تحقق من Console للأخطاء 