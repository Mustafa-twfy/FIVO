# إصلاح مشكلة الإشعارات العامة

## المشكلة
عندما يرسل المدير إشعار عام، لا يظهر لدى جميع المستخدمين المفعلين.

## الأسباب المحتملة
1. دوال `getAllDrivers` و `getAllStores` كانت تجلب جميع المستخدمين بما فيهم غير المفعلين
2. عدم وجود معالجة أخطاء كافية في عملية إرسال الإشعارات
3. عدم تحديث الإحصائيات بعد إرسال الإشعارات

## الحلول المطبقة

### 1. تحديث دوال جلب المستخدمين
- **ملف**: `supabase.js`
- **التغيير**: إضافة فلتر للمستخدمين المفعلين فقط

```javascript
// جلب جميع السائقين المفعلين فقط
getAllDrivers: async () => {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('status', 'approved')  // إضافة فلتر
    .order('created_at', { ascending: false });
  return { data, error };
},

// جلب جميع المتاجر المفعلة فقط
getAllStores: async () => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)  // إضافة فلتر
    .order('created_at', { ascending: false });
  return { data, error };
},
```

### 2. تحسين معالجة الأخطاء
- **ملف**: `screens/AdminDashboardScreen.js`
- **التغيير**: إضافة معالجة أخطاء مفصلة وعد الإشعارات المرسلة بنجاح

```javascript
try {
  let errors = [];
  let successCount = 0;
  
  if(notificationTarget==='drivers'||notificationTarget==='all'){
    const {data:drivers, error: driversError} = await driversAPI.getAllDrivers();
    if(driversError) {
      errors.push('خطأ في جلب السائقين: ' + driversError.message);
    } else if(drivers && drivers.length > 0) {
      for(const driver of drivers){
        const {error} = await driversAPI.sendNotification(driver.id,notificationTitle,notificationMessage);
        if(error) {
          errors.push(`خطأ في إرسال إشعار للسائق ${driver.name || driver.id}: ${error.message}`);
        } else {
          successCount++;
        }
      }
    } else {
      errors.push('لا يوجد سائقين مفعلين');
    }
  }
  
  // نفس المنطق للمتاجر...
  
  if(successCount > 0){
    Alert.alert('تم الإرسال',`تم إرسال الإشعار بنجاح إلى ${successCount} مستخدم${successCount > 1 ? 'ين' : ''}`);
    setNotificationModalVisible(false);
    setNotificationTitle('');setNotificationMessage('');setNotificationTarget('all');
    loadStats(); // تحديث الإحصائيات
  }else{
    Alert.alert('تنبيه','فشل في إرسال الإشعار: '+errors.join('\n'));
  }
} catch(e) {
  console.error('خطأ في إرسال الإشعارات:', e);
  Alert.alert('خطأ','حدث خطأ أثناء الإرسال: ' + e.message);
}
```

### 3. تحسين دوال إرسال الإشعارات
- **ملف**: `supabase.js`
- **التغيير**: إضافة معالجة أخطاء وتحسين إدراج البيانات

```javascript
// إرسال إشعار للسائق
sendNotification: async (driverId, title, message) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        driver_id: driverId,
        title: title,
        message: message,
        is_read: false,  // إضافة حقل is_read
        created_at: new Date().toISOString()
      });
    return { data, error };
  } catch (error) {
    console.error('خطأ في إرسال إشعار للسائق:', error);
    return { data: null, error };
  }
},

// إرسال إشعار للمتجر
sendStoreNotification: async (storeId, title, message) => {
  try {
    const { data, error } = await supabase
      .from('store_notifications')
      .insert({
        store_id: storeId,
        title: title,
        message: message,
        is_read: false,  // إضافة حقل is_read
        created_at: new Date().toISOString()
      });
    return { data, error };
  } catch (error) {
    console.error('خطأ في إرسال إشعار للمتجر:', error);
    return { data: null, error };
  }
},
```

## النتائج المتوقعة
1. الإشعارات ستصل فقط للمستخدمين المفعلين
2. رسائل خطأ مفصلة في حالة فشل الإرسال
3. عرض عدد المستخدمين الذين تم إرسال الإشعار لهم بنجاح
4. تحديث الإحصائيات والنقطة الحمراء بعد إرسال الإشعارات

## اختبار الحل
1. تسجيل دخول كمدير
2. إرسال إشعار عام
3. التحقق من وصول الإشعار للمستخدمين المفعلين فقط
4. التحقق من عدم وصول الإشعار للمستخدمين غير المفعلين
5. التحقق من تحديث النقطة الحمراء في الشاشات المختلفة 