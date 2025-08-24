# إعداد نظام Push Notifications للتطبيق

## نظرة عامة
تم إضافة نظام Push Notifications للتطبيق باستخدام Expo Notifications. هذا النظام يسمح بإرسال إشعارات للسائقين حتى عندما يكون التطبيق مغلق، مما يضمن وصول الطلبات الجديدة فوراً.

## الميزات المضافة

### 1. Push Notifications للطلبات الجديدة
- إرسال إشعارات فورية لجميع السائقين عند إنشاء طلب جديد
- إرسال إشعارات للسائقين في منطقة معينة (10 كم من المتجر)
- إشعارات مخصصة تحتوي على تفاصيل الطلب

### 2. نظام إدارة الإشعارات
- تخزين Push Tokens للسائقين والمتاجر
- تتبع إرسال الإشعارات
- إعدادات إشعارات مخصصة لكل مستخدم

### 3. تحديث الموقع التلقائي
- تتبع موقع السائق الحالي
- إرسال إشعارات للسائقين القريبين من المتجر

## الملفات المضافة

### 1. `utils/notificationService.js`
- خدمة إدارة الإشعارات المحلية
- طلب إذن الإشعارات
- إدارة Push Tokens
- معالجة الإشعارات الواردة

### 2. `utils/pushNotificationSender.js`
- خدمة إرسال Push Notifications عبر Expo
- إرسال إشعارات لسائق واحد أو جميع السائقين
- إرسال إشعارات للسائقين في منطقة معينة
- حساب المسافات وتصفية السائقين

### 3. `add_push_token_fields.sql`
- تحديث قاعدة البيانات لدعم Push Notifications
- إضافة حقول Push Token
- إنشاء جداول تتبع الإشعارات
- إنشاء إعدادات الإشعارات

## كيفية الإعداد

### 1. تحديث قاعدة البيانات
قم بتشغيل ملف `add_push_token_fields.sql` في Supabase SQL Editor:

```sql
-- تشغيل الملف في Supabase SQL Editor
-- سيتم إضافة جميع الجداول والحقول المطلوبة تلقائياً
```

### 2. تثبيت المكتبات المطلوبة
```bash
npm install expo-notifications
```

### 3. تحديث app.json
تم تحديث `app.json` تلقائياً لدعم Push Notifications.

### 4. إعداد Expo Push Notifications
1. تأكد من أن لديك حساب Expo
2. احصل على Project ID من `app.json`
3. تأكد من أن التطبيق مُسجل في Expo

## كيفية الاستخدام

### 1. في شاشة إنشاء الطلب (NewOrderScreen)
عند إنشاء طلب جديد، سيتم إرسال Push Notifications تلقائياً لجميع السائقين:

```javascript
// يتم استدعاء هذه الدالة تلقائياً
const sendPushNotificationsToDrivers = async (orderData) => {
  // إرسال إشعارات للسائقين في المنطقة
  if (storeInfo?.latitude && storeInfo?.longitude) {
    await pushNotificationSender.sendNewOrderNotificationToNearbyDrivers(
      orderData,
      storeInfo.latitude,
      storeInfo.longitude,
      10 // 10 كم
    );
  }
  
  // إرسال إشعارات لجميع السائقين كاحتياطي
  await pushNotificationSender.sendNewOrderNotification(orderData);
};
```

### 2. في شاشة السائق (DriverDashboardScreen)
يتم تهيئة خدمة الإشعارات تلقائياً عند تسجيل دخول السائق:

```javascript
// تهيئة خدمة الإشعارات
const initializeNotificationService = async (driverId) => {
  const initialized = await notificationService.initialize();
  
  if (initialized) {
    const pushToken = notificationService.getPushToken();
    
    // تحديث Push Token في قاعدة البيانات
    await pushNotificationsAPI.updatePushToken(driverId, 'driver', pushToken);
  }
};
```

### 3. إرسال إشعارات مخصصة
يمكن إرسال إشعارات مخصصة من أي مكان في التطبيق:

```javascript
import pushNotificationSender from '../utils/pushNotificationSender';

// إرسال إشعار لسائق واحد
await pushNotificationSender.sendToDriver(
  driverId,
  'عنوان الإشعار',
  'نص الإشعار',
  { type: 'custom', data: 'additional_data' }
);

// إرسال إشعار لجميع السائقين
await pushNotificationSender.sendToAllDrivers(
  'عنوان الإشعار',
  'نص الإشعار',
  { type: 'announcement' }
);
```

## إعدادات الإشعارات

### 1. إعدادات المستخدم
يمكن لكل مستخدم تخصيص إعدادات الإشعارات:

```javascript
// جلب إعدادات الإشعارات
const { data: settings } = await pushNotificationsAPI.getNotificationSettings(
  userId, 
  'driver'
);

// تحديث الإعدادات
await pushNotificationsAPI.updateNotificationSettings(
  userId, 
  'driver', 
  {
    new_orders_enabled: true,
    order_updates_enabled: false,
    quiet_hours_enabled: true,
    quiet_hours_start: '22:00:00',
    quiet_hours_end: '08:00:00'
  }
);
```

### 2. ساعات الهدوء
يمكن تعطيل الإشعارات خلال ساعات معينة:

```javascript
const settings = {
  quiet_hours_enabled: true,
  quiet_hours_start: '22:00:00', // 10 مساءً
  quiet_hours_end: '08:00:00'    // 8 صباحاً
};
```

## تتبع الإشعارات

### 1. سجلات الإشعارات
يتم تسجيل جميع الإشعارات المرسلة في جدول `push_notification_logs`:

```javascript
// تسجيل إرسال إشعار
await pushNotificationsAPI.logPushNotification(
  userId,
  'driver',
  'new_order',
  'طلب جديد',
  'تم إرسال طلب جديد',
  { orderId: 123 },
  expoPushToken,
  true, // نجح
  null, // لا يوجد خطأ
  { successCount: 5 } // بيانات الاستجابة
);
```

### 2. إحصائيات الإشعارات
يمكن جلب إحصائيات الإشعارات:

```javascript
// جلب سجلات الإشعارات
const { data: logs } = await supabase
  .from('push_notification_logs')
  .select('*')
  .eq('user_id', userId)
  .eq('success', true)
  .order('sent_at', { ascending: false });
```

## استكشاف الأخطاء

### 1. مشاكل شائعة

#### الإشعارات لا تصل
- تأكد من منح إذن الإشعارات
- تحقق من صحة Push Token
- تأكد من اتصال الإنترنت

#### Push Token غير صحيح
- أعد تهيئة خدمة الإشعارات
- تحقق من تحديث Token في قاعدة البيانات
- تأكد من صحة Project ID

### 2. رسائل التصحيح
```javascript
// تفعيل رسائل التصحيح
console.log('Push Token:', notificationService.getPushToken());
console.log('إعدادات الإشعارات:', await pushNotificationsAPI.getNotificationSettings(userId, 'driver'));

// اختبار الإشعارات
await notificationService.sendTestNotification();
```

## اختبار النظام

### 1. إرسال إشعار اختبار
```javascript
// في شاشة السائق
const sendTestNotification = async () => {
  const success = await notificationService.sendTestNotification();
  
  if (success) {
    Alert.alert('نجح', 'تم إرسال إشعار اختبار بنجاح!');
  } else {
    Alert.alert('خطأ', 'فشل في إرسال إشعار الاختبار');
  }
};
```

### 2. اختبار إنشاء طلب
1. سجل دخول كمتجر
2. أنشئ طلب جديد
3. تحقق من وصول الإشعارات للسائقين
4. تحقق من سجلات الإشعارات في قاعدة البيانات

## الأمان والخصوصية

### 1. حماية البيانات
- Push Tokens محمية في قاعدة البيانات
- لا يتم مشاركة البيانات الشخصية في الإشعارات
- تسجيل جميع العمليات للتدقيق

### 2. التحكم في الإشعارات
- يمكن للمستخدمين تعطيل أنواع معينة من الإشعارات
- ساعات الهدوء لمنع الإزعاج
- إعدادات مخصصة لكل مستخدم

## الدعم الفني

إذا واجهت أي مشاكل:

1. تحقق من رسائل التصحيح في Console
2. تأكد من صحة إعدادات قاعدة البيانات
3. تحقق من اتصال الإنترنت
4. أعد تشغيل التطبيق
5. تحقق من إعدادات الإشعارات في الجهاز

## التطوير المستقبلي

### 1. ميزات مقترحة
- إشعارات مخصصة حسب نوع المتجر
- إشعارات الطلبات العاجلة
- إشعارات المكافآت والخصومات
- إشعارات الطقس والظروف الجوية

### 2. تحسينات الأداء
- تخزين مؤقت للإشعارات
- إرسال مجمع للإشعارات
- تحسين خوارزمية حساب المسافات
- دعم الإشعارات المجدولة

---

**ملاحظة**: تأكد من اختبار النظام على أجهزة حقيقية، حيث أن Push Notifications لا تعمل في المحاكي.
