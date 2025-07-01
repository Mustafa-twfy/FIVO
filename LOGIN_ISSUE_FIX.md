# إصلاح مشكلة تسجيل الدخول

## المشكلة
عندما يتم إنشاء حساب جديد والموافقة عليه من الإدارة، لا يتم توجيه المستخدم للواجهة المناسبة عند تسجيل الدخول.

## الأسباب المحتملة

### 1. مشكلة في إنشاء الحساب
- في دالة `approveRequest`، كان يتم إدراج `status: 'approved'` في جدول `stores`
- لكن جدول `stores` لا يحتوي على عمود `status`
- هذا يسبب خطأ في إنشاء الحساب

### 2. مشكلة في منطق التحقق
- قد تكون هناك مشكلة في شروط البحث في قاعدة البيانات
- قد تكون البيانات غير متطابقة بين الجداول

## الحلول المطبقة

### 1. إصلاح إنشاء الحساب
```javascript
// قبل الإصلاح (خطأ)
insertResult = await supabase.from('stores').insert({
  // ...
  status: 'approved', // ❌ لا يوجد عمود status في جدول stores
  is_active: true,
});

// بعد الإصلاح (صحيح)
insertResult = await supabase.from('stores').insert({
  // ...
  is_active: true, // ✅ فقط is_active
});
```

### 2. إضافة رسائل تصحيح
```javascript
// إضافة رسائل console.log لمعرفة ما يحدث
console.log('Checking driver login for:', email);
console.log('Driver check result:', { driver, driverError });
console.log('Store check result:', { store, storeError });
```

### 3. دالة اختبار قاعدة البيانات
```javascript
const testDatabaseConnection = async () => {
  // اختبار الاتصال
  // التحقق من وجود الحسابات
  // عرض النتائج في console
};
```

## خطوات الاختبار

### 1. إنشاء حساب جديد
1. تسجيل حساب سائق أو متجر جديد
2. انتظار الموافقة من الإدارة

### 2. اختبار تسجيل الدخول
1. فتح console في المتصفح أو React Native Debugger
2. محاولة تسجيل الدخول بالحساب المعتمد
3. مراقبة رسائل console لمعرفة ما يحدث

### 3. اختبار قاعدة البيانات
1. الضغط على زر "اختبار قاعدة البيانات"
2. مراجعة رسائل console
3. التأكد من وجود الحساب في الجدول الصحيح

## الجداول المستخدمة

### جدول drivers
- `email`: البريد الإلكتروني
- `password`: كلمة المرور
- `status`: حالة الحساب (pending, approved, rejected, suspended)
- `is_active`: هل الحساب نشط

### جدول stores
- `email`: البريد الإلكتروني
- `password`: كلمة المرور
- `is_active`: هل الحساب نشط (لا يوجد عمود status)

### جدول registration_requests
- `email`: البريد الإلكتروني
- `password`: كلمة المرور
- `user_type`: نوع المستخدم (driver, store)
- `status`: حالة الطلب (pending, approved, rejected)

## منطق تسجيل الدخول

### 1. التحقق من طلبات التسجيل
```javascript
// البحث في registration_requests أولاً
const { data: pendingRequest } = await supabase
  .from('registration_requests')
  .select('*')
  .eq('email', email)
  .eq('password', password)
  .single();
```

### 2. التحقق من السائقين
```javascript
// البحث في drivers مع status = 'approved'
const { data: driver } = await supabase
  .from('drivers')
  .select('*')
  .eq('email', email)
  .eq('password', password)
  .eq('status', 'approved')
  .single();
```

### 3. التحقق من المتاجر
```javascript
// البحث في stores مع is_active = true
const { data: store } = await supabase
  .from('stores')
  .select('*')
  .eq('email', email)
  .eq('password', password)
  .eq('is_active', true)
  .single();
```

## التوجيه

### السائق
```javascript
if (driver) {
  navigation.navigate('DriverDashboard', { driverId: driver.id });
}
```

### المتجر
```javascript
if (store) {
  navigation.navigate('StoreDashboard', { storeId: store.id });
}
```

## ملاحظات مهمة

1. **تأكد من تطابق البيانات**: البريد وكلمة المرور يجب أن تكون متطابقة تماماً
2. **حالة الحساب**: السائق يحتاج `status = 'approved'` والمتجر يحتاج `is_active = true`
3. **ترتيب البحث**: يتم البحث في `registration_requests` أولاً، ثم `drivers`، ثم `stores`
4. **رسائل التصحيح**: استخدم console.log لمعرفة ما يحدث بالضبط

## إذا استمرت المشكلة

1. تحقق من رسائل console
2. تأكد من وجود الحساب في الجدول الصحيح
3. تحقق من تطابق البيانات
4. تأكد من حالة الحساب (status/is_active)
5. اختبر الاتصال بقاعدة البيانات 