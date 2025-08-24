// خدمة إرسال Push Notifications عبر Expo
class PushNotificationSender {
  constructor() {
    this.expoApiUrl = 'https://exp.host/--/api/v2/push/send';
  }

  // إرسال إشعار لسائق واحد
  async sendToDriver(driverId, title, body, data = {}) {
    try {
      // جلب Push Token للسائق
      const { data: driver, error } = await supabase
        .from('drivers')
        .select('push_token')
        .eq('id', driverId)
        .single();

      if (error || !driver?.push_token) {
        console.log(`لا يوجد Push Token للسائق ${driverId}`);
        return { success: false, error: 'لا يوجد Push Token' };
      }

      return await this.sendPushNotification(driver.push_token, title, body, data);
    } catch (error) {
      console.error('خطأ في إرسال إشعار للسائق:', error);
      return { success: false, error: error.message };
    }
  }

  // إرسال إشعار لجميع السائقين
  async sendToAllDrivers(title, body, data = {}) {
    try {
      // جلب جميع السائقين المفعلين مع Push Tokens
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('id, push_token, name')
        .eq('status', 'approved')
        .not('push_token', 'is', null);

      if (error) {
        throw new Error('فشل في جلب السائقين');
      }

      if (!drivers || drivers.length === 0) {
        return { success: false, error: 'لا يوجد سائقين مع Push Tokens' };
      }

      const results = [];
      let successCount = 0;

      // إرسال الإشعارات لجميع السائقين
      for (const driver of drivers) {
        if (driver.push_token) {
          const result = await this.sendPushNotification(
            driver.push_token, 
            title, 
            body, 
            { ...data, driverId: driver.id }
          );
          
          results.push({
            driverId: driver.id,
            driverName: driver.name,
            success: result.success,
            error: result.error
          });

          if (result.success) {
            successCount++;
          }
        }
      }

      return {
        success: successCount > 0,
        successCount,
        totalCount: drivers.length,
        results
      };
    } catch (error) {
      console.error('خطأ في إرسال إشعار لجميع السائقين:', error);
      return { success: false, error: error.message };
    }
  }

  // إرسال إشعار لسائقين في منطقة معينة
  async sendToDriversInArea(latitude, longitude, radiusKm, title, body, data = {}) {
    try {
      // جلب السائقين في المنطقة المحددة
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('id, push_token, name, current_latitude, current_longitude')
        .eq('status', 'approved')
        .not('push_token', 'is', null);

      if (error) {
        throw new Error('فشل في جلب السائقين');
      }

      if (!drivers || drivers.length === 0) {
        return { success: false, error: 'لا يوجد سائقين في المنطقة' };
      }

      // فلترة السائقين حسب المسافة
      const nearbyDrivers = drivers.filter(driver => {
        if (!driver.current_latitude || !driver.current_longitude) return false;
        
        const distance = this.calculateDistance(
          latitude, 
          longitude, 
          driver.current_latitude, 
          driver.current_longitude
        );
        
        return distance <= radiusKm;
      });

      if (nearbyDrivers.length === 0) {
        return { success: false, error: 'لا يوجد سائقين في النطاق المحدد' };
      }

      // إرسال الإشعارات للسائقين القريبين
      const results = [];
      let successCount = 0;

      for (const driver of nearbyDrivers) {
        const result = await this.sendPushNotification(
          driver.push_token,
          title,
          body,
          { ...data, driverId: driver.id, distance: this.calculateDistance(
            latitude, 
            longitude, 
            driver.current_latitude, 
            driver.current_longitude
          )}
        );

        results.push({
          driverId: driver.id,
          driverName: driver.name,
          success: result.success,
          error: result.error
        });

        if (result.success) {
          successCount++;
        }
      }

      return {
        success: successCount > 0,
        successCount,
        totalCount: nearbyDrivers.length,
        results
      };
    } catch (error) {
      console.error('خطأ في إرسال إشعار للسائقين في المنطقة:', error);
      return { success: false, error: error.message };
    }
  }

  // إرسال إشعار طلب جديد لجميع السائقين
  async sendNewOrderNotification(orderData) {
    const title = 'طلب جديد! 🚚';
    const body = `طلب جديد من ${orderData.store_name || 'متجر'} - ${orderData.total_amount} ريال`;
    
    const data = {
      type: 'new_order',
      orderId: orderData.id,
      storeId: orderData.store_id,
      storeName: orderData.store_name,
      totalAmount: orderData.total_amount,
      pickupAddress: orderData.pickup_address,
      deliveryAddress: orderData.delivery_address,
      timestamp: new Date().toISOString()
    };

    return await this.sendToAllDrivers(title, body, data);
  }

  // إرسال إشعار طلب جديد للسائقين في منطقة المتجر
  async sendNewOrderNotificationToNearbyDrivers(orderData, storeLatitude, storeLongitude, radiusKm = 10) {
    const title = 'طلب جديد! 🚚';
    const body = `طلب جديد من ${orderData.store_name || 'متجر'} - ${orderData.total_amount} ريال`;
    
    const data = {
      type: 'new_order',
      orderId: orderData.id,
      storeId: orderData.store_id,
      storeName: orderData.store_name,
      totalAmount: orderData.total_amount,
      pickupAddress: orderData.pickup_address,
      deliveryAddress: orderData.delivery_address,
      timestamp: new Date().toISOString()
    };

    return await this.sendToDriversInArea(storeLatitude, storeLongitude, radiusKm, title, body, data);
  }

  // إرسال Push Notification عبر Expo
  async sendPushNotification(expoPushToken, title, body, data = {}) {
    try {
      const message = {
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        badge: 1,
        priority: 'high',
        channelId: 'orders',
        categoryId: 'order_notifications'
      };

      const response = await fetch(this.expoApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (response.ok && result.data) {
        console.log('تم إرسال Push Notification بنجاح:', result);
        return { success: true, result };
      } else {
        console.error('فشل في إرسال Push Notification:', result);
        return { success: false, error: result.errors || 'فشل في الإرسال' };
      }
    } catch (error) {
      console.error('خطأ في إرسال Push Notification:', error);
      return { success: false, error: error.message };
    }
  }

  // حساب المسافة بين نقطتين
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // نصف قطر الأرض بالكيلومترات
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // المسافة بالكيلومترات
    return distance;
  }

  // تحويل الدرجات إلى راديان
  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // إرسال إشعار اختبار
  async sendTestNotification(driverId) {
    const title = 'اختبار الإشعارات 🧪';
    const body = 'هذا إشعار اختبار للتأكد من عمل نظام Push Notifications';
    
    return await this.sendToDriver(driverId, title, body, {
      type: 'test',
      timestamp: new Date().toISOString()
    });
  }
}

// إنشاء نسخة واحدة من الخدمة
const pushNotificationSender = new PushNotificationSender();

export default pushNotificationSender;
