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
  async initialize() {
    try {
      // طلب إذن الإشعارات
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('لم يتم منح إذن الإشعارات');
        return false;
      }

      // الحصول على Push Token
      if (Device.isDevice) {
        this.expoPushToken = (await Notifications.getExpoPushTokenAsync({
          projectId: '7afda903-8cd5-422f-9192-e535509be738'
        })).data;
        
        console.log('Expo Push Token:', this.expoPushToken);
        
        // حفظ Token في AsyncStorage
        await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
        
        // إعداد مستمعي الإشعارات
        this.setupNotificationListeners();
        
        return true;
      } else {
        console.log('يجب استخدام جهاز حقيقي للإشعارات');
        return false;
      }
    } catch (error) {
      console.error('خطأ في تهيئة خدمة الإشعارات:', error);
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

  // تحديث Push Token في قاعدة البيانات
  async updatePushToken(userId, userType) {
    try {
      if (!this.expoPushToken) {
        console.log('لا يوجد Push Token');
        return false;
      }

      let tableName = userType === 'driver' ? 'drivers' : 'stores';
      let idField = userType === 'driver' ? 'driver_id' : 'store_id';

      const { error } = await supabase
        .from(tableName)
        .update({ 
          push_token: this.expoPushToken,
          token_updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('خطأ في تحديث Push Token:', error);
        return false;
      }

      console.log('تم تحديث Push Token بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في تحديث Push Token:', error);
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
