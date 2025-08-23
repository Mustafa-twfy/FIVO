# إعداد Push Notifications للتطبيق

## نظرة عامة

تم إضافة نظام Push Notifications كامل للتطبيق باستخدام **Expo Notifications**. هذا النظام يسمح بإرسال إشعارات فورية للمستخدمين حتى عندما يكون التطبيق مغلقاً.

## الميزات المضافة

### 1. إشعارات فورية للطلبات الجديدة
- عند إنشاء طلب جديد، يتم إرسال إشعار لجميع السائقين المتاحين
- الإشعار يحتوي على تفاصيل الطلب (العنوان، المبلغ، المتجر)

### 2. إشعارات تحديث حالة الطلب
- إشعارات عند قبول الطلب
- إشعارات عند استلام الطلب
- إشعارات عند إكمال الطلب
- إشعارات عند إلغاء الطلب

### 3. إشعارات إدارية
- إرسال إشعارات عامة لجميع السائقين
- إرسال إشعارات عامة لجميع المتاجر
- إرسال إشعارات عامة للجميع

### 4. نظام تتبع شامل
- سجل كامل لجميع الإشعارات المرسلة
- إحصائيات معدل النجاح
- تتبع الأخطاء وحلها

## المتطلبات

### 1. تثبيت الحزم
```bash
npm install expo-notifications
```

### 2. إعدادات Expo
- تحديث `app.json` مع إعدادات الإشعارات
- إضافة `expo-notifications` plugin
- تكوين الأيقونات والألوان

### 3. قاعدة البيانات
- تشغيل ملف `add_push_notifications_fields.sql` في Supabase
- إضافة حقول `expo_push_token` للجداول
- إنشاء جداول تتبع الإشعارات

## كيفية الاستخدام

### 1. تهيئة خدمة الإشعارات

```javascript
import notificationService from './utils/notifications';

// في App.js أو عند بدء التطبيق
useEffect(() => {
  const initializeNotifications = async () => {
    const success = await notificationService.initialize();
    if (success) {
      console.log('✅ تم تهيئة خدمة الإشعارات بنجاح');
    }
  };
  initializeNotifications();
}, []);
```

### 2. إرسال إشعارات للسائقين

```javascript
import { pushNotificationsAPI } from './supabase';

// إرسال إشعار لسائق محدد
const result = await pushNotificationsAPI.sendPushNotificationToDriver(
  driverId,
  'عنوان الإشعار',
  'محتوى الإشعار',
  { type: 'custom', data: 'additional' }
);

// إرسال إشعار لجميع السائقين
const result = await pushNotificationsAPI.sendPushNotificationToAllDrivers(
  'عنوان الإشعار',
  'محتوى الإشعار'
);
```

### 3. إرسال إشعارات للمتاجر

```javascript
// إرسال إشعار لمتجر محدد
const result = await pushNotificationsAPI.sendPushNotificationToStore(
  storeId,
  'عنوان الإشعار',
  'محتوى الإشعار'
);

// إرسال إشعار لجميع المتاجر
const result = await pushNotificationsAPI.sendPushNotificationToAllStores(
  'عنوان الإشعار',
  'محتوى الإشعار'
);
```

### 4. إشعارات الطلبات التلقائية

```javascript
// إشعار طلب جديد
await pushNotificationsAPI.sendNewOrderNotificationToDrivers(orderData);

// إشعار تحديث حالة الطلب
await pushNotificationsAPI.sendOrderStatusUpdateNotification(orderData, 'accepted');
```

## أنواع الإشعارات

### 1. إشعارات الطلبات
- `new_order`: طلب جديد متاح
- `order_accepted`: تم قبول الطلب
- `order_picked_up`: تم استلام الطلب
- `order_completed`: تم إكمال الطلب
- `order_cancelled`: تم إلغاء الطلب

### 2. إشعارات إدارية
- `general_notification`: إشعار عام
- `system_update`: تحديث النظام
- `maintenance`: صيانة

### 3. إشعارات مخصصة
- `driver_specific`: إشعار خاص بسائق معين
- `store_specific`: إشعار خاص بمتجر معين

## إعدادات الإشعارات

### 1. تكوين Expo
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#00C897",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### 2. تكوين الإشعارات
```javascript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

## معالجة الإشعارات

### 1. الإشعارات الواردة
```javascript
// مستمع الإشعارات الواردة
const notificationListener = Notifications.addNotificationReceivedListener(notification => {
  console.log('إشعار جديد:', notification.request.content);
  // معالجة الإشعار هنا
});
```

### 2. النقر على الإشعارات
```javascript
// مستمع النقر على الإشعارات
const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
  const data = response.notification.request.content.data;
  
  // التنقل بناءً على نوع الإشعار
  if (data.type === 'new_order') {
    navigation.navigate('AvailableOrders');
  }
});
```

## إدارة التوكنات

### 1. الحصول على التوكن
```javascript
const token = await notificationService.getCurrentToken();
console.log('Expo Push Token:', token);
```

### 2. حفظ التوكن في قاعدة البيانات
```javascript
await notificationService.saveTokenToDatabase(userId, userType);
```

### 3. تحديث التوكن
```javascript
// يتم تحديث التوكن تلقائياً عند تغيير الجهاز
// أو يمكن تحديثه يدوياً
await notificationService.saveTokenToDatabase(userId, userType);
```

## استكشاف الأخطاء

### 1. مشاكل شائعة
- **الإشعارات لا تصل**: تحقق من صحة التوكن
- **أخطاء في الإرسال**: تحقق من اتصال الإنترنت
- **إشعارات مكررة**: تحقق من عدم وجود مستمعين مكررين

### 2. سجلات الأخطاء
```javascript
// في console
console.log('Expo Push Token:', token);
console.log('نتيجة الإرسال:', result);
```

### 3. اختبار الإشعارات
```javascript
// إرسال إشعار تجريبي
await notificationService.sendImmediateNotification(
  'اختبار',
  'هذا إشعار تجريبي'
);
```

## الأمان والخصوصية

### 1. RLS Policies
- المستخدمون يمكنهم قراءة سجلاتهم فقط
- المديرون يمكنهم الوصول لجميع السجلات
- حماية البيانات الشخصية

### 2. تشفير البيانات
- التوكنات محفوظة بشكل آمن
- البيانات المرسلة مشفرة
- لا يتم حفظ معلومات حساسة

## الأداء والتحسين

### 1. الفهارس
- فهارس على `expo_push_token`
- فهارس على `user_id` و `user_type`
- فهارس على `sent_at`

### 2. التخزين المؤقت
- تخزين التوكنات محلياً
- تحديث التوكنات عند الحاجة
- تقليل استعلامات قاعدة البيانات

### 3. معالجة الأخطاء
- إعادة المحاولة التلقائية
- تسجيل الأخطاء للتشخيص
- عدم كسر العمليات الرئيسية

## الاختبار

### 1. اختبار محلي
```bash
# تشغيل التطبيق
expo start

# اختبار الإشعارات
# افتح التطبيق على جهاز حقيقي
# أرسل إشعار تجريبي
```

### 2. اختبار الإنتاج
```bash
# بناء التطبيق
eas build --platform android
eas build --platform ios

# اختبار Push Notifications
# أرسل إشعارات حقيقية
# تحقق من الوصول
```

## الدعم والصيانة

### 1. المراقبة
- مراقبة معدل نجاح الإشعارات
- تتبع الأخطاء والمشاكل
- إحصائيات الاستخدام

### 2. التحديثات
- تحديث Expo Notifications
- تحسين الأداء
- إضافة ميزات جديدة

### 3. الدعم الفني
- توثيق المشاكل
- حلول سريعة
- دليل استكشاف الأخطاء

## الخلاصة

تم إضافة نظام Push Notifications كامل ومتقدم للتطبيق. هذا النظام يوفر:

✅ **إشعارات فورية** للطلبات الجديدة  
✅ **تحديثات حالة الطلب** في الوقت الفعلي  
✅ **إشعارات إدارية** شاملة  
✅ **تتبع وإحصائيات** مفصلة  
✅ **أمان وخصوصية** عالية  
✅ **أداء محسن** مع فهارس قاعدة البيانات  

الآن يمكن للمستخدمين تلقي إشعارات فورية على هواتفهم حتى عندما يكون التطبيق مغلقاً، مما يحسن تجربة المستخدم بشكل كبير.
