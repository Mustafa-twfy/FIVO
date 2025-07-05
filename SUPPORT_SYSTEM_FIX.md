# 🔧 إصلاح نظام الدعم الفني - توصيل بلس

## 🚨 المشكلة المكتشفة

نظام الدعم الفني لا يعمل بسبب تضارب في هيكل قاعدة البيانات:

### المشاكل:
1. **جدول `support_messages`** يحتوي على `driver_id` فقط (للسائقين)
2. **جدول `store_support_messages`** منفصل للمتاجر
3. **`supportAPI`** يحاول استخدام `user_type` و `user_id` غير موجودة
4. **عدم توحيد النظام** بين السائقين والمتاجر

## ✅ الحل المطبق

### 1. توحيد جدول الدعم الفني
```sql
CREATE TABLE support_messages (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL, -- 'driver' أو 'store'
    user_id INTEGER NOT NULL,       -- driver_id أو store_id
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,    -- 'user' أو 'admin'
    is_read BOOLEAN DEFAULT false,
    read_by_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. تحديث `supportAPI`
- إصلاح دوال الإرسال والاستقبال
- إضافة دالة `getUnreadSupportCount`
- توحيد النظام للسائقين والمتاجر

### 3. تحديث `AdminSupportScreen`
- إصلاح عرض المحادثات
- جلب معلومات المستخدمين من الجداول الصحيحة
- تحسين تجربة المستخدم

## 🛠️ خطوات الإصلاح

### الخطوة 1: تحديث قاعدة البيانات
```bash
# تشغيل ملف الإصلاح في Supabase SQL Editor
# انسخ محتوى fix_support_system.sql واضغط Run
```

### الخطوة 2: اختبار النظام
1. **تسجيل دخول كسائق**:
   - البريد: `driver1@tawseel.com`
   - كلمة المرور: `password123`
   - اذهب للدعم الفني وأرسل رسالة

2. **تسجيل دخول كمتجر**:
   - البريد: `store1@tawseel.com`
   - كلمة المرور: `password123`
   - اذهب للدعم الفني وأرسل رسالة

3. **تسجيل دخول كمدير**:
   - البريد: `nmcmilli07@gmail.com`
   - كلمة المرور: `admin1234`
   - اذهب للدعم الفني واختبر الرد على الرسائل

## 📋 الميزات الجديدة

### ✅ نظام موحد
- جدول واحد للدعم الفني
- دعم كلاً من السائقين والمتاجر
- نظام رسائل موحد

### ✅ إدارة محسنة
- عرض جميع المحادثات
- معلومات المستخدمين
- حالة القراءة
- عدد الرسائل غير المقروءة

### ✅ تجربة مستخدم محسنة
- واجهة موحدة
- رسائل واضحة
- تحديثات فورية

## 🔍 اختبار النظام

### اختبار السائقين:
```javascript
// إرسال رسالة
await supportAPI.sendSupportMessage('driver', driverId, 'رسالة تجريبية', 'user');

// جلب الرسائل
const messages = await supportAPI.getSupportMessages('driver', driverId);
```

### اختبار المتاجر:
```javascript
// إرسال رسالة
await supportAPI.sendSupportMessage('store', storeId, 'رسالة تجريبية', 'user');

// جلب الرسائل
const messages = await supportAPI.getSupportMessages('store', storeId);
```

### اختبار الإدارة:
```javascript
// جلب جميع المحادثات
const conversations = await supportAPI.getAllSupportConversations();

// إرسال رد
await supportAPI.sendSupportMessage('driver', driverId, 'رد الإدارة', 'admin');
```

## 🐛 استكشاف الأخطاء

### إذا لم تظهر الرسائل:
1. تحقق من تشغيل `fix_support_system.sql`
2. تأكد من وجود البيانات التجريبية
3. راجع Console للأخطاء

### إذا لم يتم الإرسال:
1. تحقق من صحة `userType` و `userId`
2. تأكد من اتصال قاعدة البيانات
3. راجع رسائل الخطأ

### إذا لم تظهر المحادثات في الإدارة:
1. تحقق من وجود رسائل في الجدول
2. تأكد من صحة `user_type` و `user_id`
3. راجع دالة `loadConversations`

## 📊 البيانات التجريبية

تم إدخال بيانات تجريبية تشمل:
- **رسائل من السائقين**: 4 رسائل
- **ردود الإدارة**: 3 ردود
- **رسائل من المتاجر**: 3 رسائل
- **ردود إضافية**: 3 ردود

## 🎯 النتيجة المتوقعة

بعد الإصلاح:
- ✅ نظام دعم فني موحد يعمل
- ✅ إرسال واستقبال الرسائل
- ✅ عرض المحادثات في الإدارة
- ✅ ردود الإدارة تعمل
- ✅ تجربة مستخدم محسنة

## 📞 الدعم

إذا واجهت مشاكل:
1. راجع Console للأخطاء
2. تحقق من تشغيل ملف SQL
3. تأكد من صحة البيانات التجريبية
4. راجع ملف `DEBUG.md` للمزيد من المساعدة

---

**تم إصلاح نظام الدعم الفني بنجاح! 🎉** 