# تشخيص وإصلاح مشكلة زر الحذف في الإدارة

## 🔍 المشكلة
زر الحذف في شاشة إدارة السائقين والمتاجر لا يعمل بشكل صحيح.

## 🛠️ خطوات التشخيص والإصلاح

### 1. فحص Console Logs
أولاً، تأكد من ظهور رسائل التصحيح في console:

**في شاشة السائقين:**
- عند الضغط على زر الحذف، يجب أن تظهر رسائل:
  ```
  === بداية عملية تأكيد حذف السائق ===
  السائق المحدد: {id: ..., name: ..., email: ...}
  ```

**في شاشة المتاجر:**
- عند الضغط على زر الحذف، يجب أن تظهر رسائل:
  ```
  === بداية عملية تأكيد حذف المتجر ===
  المتجر المحدد: {id: ..., name: ..., email: ...}
  ```

### 2. اختبار زر الحذف
في كل شاشة، يوجد زر اختبار (أيقونة bug) في الهيدر:

**للسائقين:**
- اضغط على أيقونة 🐛 في الهيدر
- سيتم اختبار حذف السائق الأول في القائمة

**للمتاجر:**
- اضغط على أيقونة 🐛 في الهيدر  
- سيتم اختبار حذف المتجر الأول في القائمة

### 3. فحص قاعدة البيانات
تأكد من أن الجداول موجودة في Supabase:

```sql
-- فحص جدول السائقين
SELECT * FROM drivers LIMIT 5;

-- فحص جدول المتاجر  
SELECT * FROM stores LIMIT 5;

-- فحص جدول طلبات التسجيل
SELECT * FROM registration_requests LIMIT 5;
```

### 4. فحص الصلاحيات
تأكد من أن المستخدم لديه صلاحيات الحذف:

```sql
-- فحص صلاحيات المستخدم الحالي
SELECT current_user, session_user;
```

### 5. إصلاحات محتملة

#### أ. إضافة Foreign Key Constraints
إذا كانت هناك مشاكل في العلاقات:

```sql
-- إضافة foreign key constraints
ALTER TABLE orders ADD CONSTRAINT fk_orders_driver 
FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;

ALTER TABLE orders ADD CONSTRAINT fk_orders_store 
FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
```

#### ب. إصلاح RLS (Row Level Security)
إذا كان RLS مفعل:

```sql
-- إلغاء RLS مؤقتاً للاختبار
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_requests DISABLE ROW LEVEL SECURITY;
```

#### ج. إضافة Policies للحذف
إذا كان RLS مفعل، أضف policies للحذف:

```sql
-- سياسة الحذف للسائقين
CREATE POLICY "Enable delete for authenticated users" ON drivers
FOR DELETE USING (auth.role() = 'authenticated');

-- سياسة الحذف للمتاجر  
CREATE POLICY "Enable delete for authenticated users" ON stores
FOR DELETE USING (auth.role() = 'authenticated');

-- سياسة الحذف لطلبات التسجيل
CREATE POLICY "Enable delete for authenticated users" ON registration_requests
FOR DELETE USING (auth.role() = 'authenticated');
```

### 6. اختبار يدوي
1. افتح شاشة السائقين
2. اضغط على زر الحذف (🗑️) بجانب أي سائق
3. تأكد من ظهور dialog التأكيد
4. اضغط "حذف" في dialog
5. راقب console للرسائل
6. تحقق من اختفاء السائق من القائمة

### 7. رسائل الخطأ الشائعة

#### خطأ: "foreign key constraint"
**الحل:** حذف الطلبات المرتبطة أولاً:
```sql
DELETE FROM orders WHERE driver_id = [driver_id];
DELETE FROM notifications WHERE driver_id = [driver_id];
DELETE FROM support_messages WHERE driver_id = [driver_id];
DELETE FROM rewards WHERE driver_id = [driver_id];
DELETE FROM fines WHERE driver_id = [driver_id];
```

#### خطأ: "permission denied"
**الحل:** فحص صلاحيات المستخدم أو إلغاء RLS مؤقتاً.

#### خطأ: "table does not exist"
**الحل:** إنشاء الجداول المفقودة باستخدام `initializeDatabase()`.

### 8. إضافة Debugging إضافي
إذا استمرت المشكلة، أضف المزيد من الـ logs:

```javascript
// في دالة deleteDriver
console.log('=== فحص البيانات قبل الحذف ===');
console.log('driver.id:', driver.id);
console.log('driver.email:', driver.email);

// فحص وجود السائق قبل الحذف
const { data: checkDriver } = await supabase
  .from('drivers')
  .select('*')
  .eq('id', driver.id)
  .single();

console.log('السائق موجود قبل الحذف:', checkDriver);
```

### 9. اختبار الاتصال
تأكد من أن الاتصال بـ Supabase يعمل:

```javascript
// اختبار الاتصال
const { data, error } = await supabase
  .from('drivers')
  .select('count')
  .limit(1);

console.log('اختبار الاتصال:', { data, error });
```

## 📞 إذا استمرت المشكلة
1. شارك رسائل console كاملة
2. شارك رسائل الخطأ من Supabase
3. تأكد من أن جميع الجداول موجودة
4. تحقق من صلاحيات المستخدم

## ✅ النتيجة المتوقعة
بعد الإصلاح، يجب أن يعمل زر الحذف كالتالي:
1. ظهور dialog تأكيد
2. حذف السائق/المتجر من جميع الجداول
3. إعادة تحميل القائمة تلقائياً
4. ظهور رسالة نجاح 