import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

// تكوين الإشعارات
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // تهيئة خدمة الإشعارات
  async initialize({ requestPermission = true, silent = true } = {}) {
    try {
      // طلب إذن الإشعارات بشكل آمن مع timeout
      if (requestPermission) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const p = Notifications.requestPermissionsAsync();
          const res = await Promise.race([
            p,
            new Promise((r) => setTimeout(() => r({ status: 'denied' }), 8000))
          ]);
          finalStatus = res?.status || 'denied';
        }

        if (finalStatus !== 'granted') {
          if (!silent) console.log('لم يتم منح إذن الإشعارات');
          return false;
        }
      }

      // الحصول على Push Token بأمان
      if (!Device.isDevice) {
        if (!silent) console.log('محاكي: تتطلب إشعارات جهازاً حقيقياً');
        return false;
      }

      try {
        const tokenResponse = await Promise.race([
          Notifications.getExpoPushTokenAsync({ projectId: '7afda903-8cd5-422f-9192-e535509be738' }),
          new Promise((r) => setTimeout(() => r(null), 8000))
        ]);

        this.expoPushToken = tokenResponse?.data || null;
        if (this.expoPushToken) {
          await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
          // محاولة آمنة لتحديث الـ DB في الخلفية
          this.updatePushTokenSafe().catch(() => {});
        }

        // إعداد المستمعين
        this.setupNotificationListeners();
        return true;
      } catch (err) {
        console.error('الحصول على Push Token فشل:', err);
        return false;
      }
    } catch (error) {
      console.error('خطأ عام في تهيئة خدمة الإشعارات:', error);
      return false;
    }
  }

  // إعداد مستمعي الإشعارات
  setupNotificationListeners() {
    // مستمع الإشعارات الواردة
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('تم استلام إشعار:', notification);
      this.handleNotificationReceived(notification);
    });

    // مستمع استجابة المستخدم على الإشعار
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('استجابة المستخدم على الإشعار:', response);
      this.handleNotificationResponse(response);
    });
  }

  // معالجة الإشعارات الواردة
  handleNotificationReceived(notification) {
    // يمكن إضافة منطق إضافي هنا
    console.log('معالجة الإشعار الوارد:', notification);
  }

  // معالجة استجابة المستخدم على الإشعار
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;
    
    // التنقل إلى الشاشة المناسبة بناءً على نوع الإشعار
    if (data.type === 'order') {
      // التنقل إلى شاشة الطلبات
      console.log('تنقل إلى شاشة الطلبات');
    } else if (data.type === 'notification') {
      // التنقل إلى شاشة الإشعارات
      console.log('تنقل إلى شاشة الإشعارات');
    }
  }

  // إرسال إشعار محلي
  async sendLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          data: data,
          sound: true,
          badge: 1,
        },
        trigger: null, // إرسال فوري
      });
      return true;
    } catch (error) {
      console.error('خطأ في إرسال الإشعار المحلي:', error);
      return false;
    }
  }

  // إرسال إشعار محلي للطلب الجديد
  async sendOrderNotification(orderData) {
    const title = 'طلب جديد! 🚚';
    const body = `طلب جديد من ${orderData.store_name || 'متجر'} - ${orderData.total_amount} ريال`;
    
    return await this.sendLocalNotification(title, body, {
      type: 'order',
      orderId: orderData.id,
      storeId: orderData.store_id
    });
  }

  // تحديث آمن مع retry بسيط
  async updatePushTokenSafe(retries = 2) {
    if (!this.expoPushToken) return false;
    try {
      const userId = await AsyncStorage.getItem('userId');
      const userType = await AsyncStorage.getItem('userType');
      if (!userId || !userType) return false;

      const table = userType === 'driver' ? 'drivers' : 'stores';

      // تحقق إن لم يتطابق التوكن لتقليل الكتابة
      const { data, error } = await supabase.from(table).select('push_token').eq('id', Number(userId)).single();
      if (!error && data && data.push_token === this.expoPushToken) return true;

      const up = await supabase.from(table).update({ push_token: this.expoPushToken, token_updated_at: new Date().toISOString() }).eq('id', Number(userId));
      if (up.error) throw up.error;
      return true;
    } catch (err) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return this.updatePushTokenSafe(retries - 1);
      }
      console.error('فشل تحديث Push Token بعد محاولات:', err);
      return false;
    }
  }

  // تنظيف الموارد
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // الحصول على Push Token
  getPushToken() {
    return this.expoPushToken;
  }

  // إرسال إشعار اختبار
  async sendTestNotification() {
    return await this.sendLocalNotification(
      'اختبار الإشعارات',
      'هذا إشعار اختبار للتأكد من عمل النظام',
      { type: 'test' }
    );
  }
}

// إنشاء نسخة واحدة من الخدمة
const notificationService = new NotificationService();

export default notificationService;
