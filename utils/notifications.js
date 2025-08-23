import * as Notifications from 'expo-notifications';
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
      // تأخير قصير لضمان استقرار التطبيق
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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

      // الحصول على Expo Push Token
      if (Platform.OS !== 'web') {
        try {
          this.expoPushToken = await Notifications.getExpoPushTokenAsync({
            projectId: '7afda903-8cd5-422f-9192-e535509be738'
          });
          
          console.log('Expo Push Token:', this.expoPushToken.data);
          
          // حفظ التوكن في التخزين المحلي
          await AsyncStorage.setItem('expoPushToken', this.expoPushToken.data);
        } catch (tokenError) {
          console.error('خطأ في الحصول على Expo Push Token:', tokenError);
          // لا توقف التهيئة إذا فشل الحصول على التوكن
        }
      } else {
        console.log('يجب استخدام جهاز حقيقي للإشعارات');
      }

      // إعداد مستمع الإشعارات الواردة
      try {
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
          console.log('تم استلام إشعار:', notification);
          this.handleNotificationReceived(notification);
        });
      } catch (listenerError) {
        console.error('خطأ في إعداد مستمع الإشعارات:', listenerError);
      }

      // إعداد مستمع النقر على الإشعار
      try {
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          console.log('تم النقر على الإشعار:', response);
          this.handleNotificationResponse(response);
        });
      } catch (responseError) {
        console.error('خطأ في إعداد مستمع النقر على الإشعار:', responseError);
      }

      return true;
    } catch (error) {
      console.error('خطأ في تهيئة الإشعارات:', error);
      return false;
    }
  }

  // معالجة الإشعارات الواردة
  handleNotificationReceived(notification) {
    // يمكنك إضافة منطق إضافي هنا
    console.log('إشعار جديد:', notification.request.content);
  }

  // معالجة النقر على الإشعار
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;
    
    // يمكنك إضافة منطق التنقل هنا بناءً على نوع الإشعار
    if (data && data.type === 'new_order') {
      // التنقل إلى شاشة الطلبات المتاحة
      console.log('تنقل إلى الطلبات المتاحة');
    }
  }

  // إرسال إشعار محلي
  async scheduleLocalNotification(title, body, data = {}, trigger = null) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: trigger || null, // null يعني إرسال فوري
      });
      
      console.log('تم جدولة الإشعار المحلي:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('خطأ في جدولة الإشعار المحلي:', error);
      return null;
    }
  }

  // إرسال إشعار فوري
  async sendImmediateNotification(title, body, data = {}) {
    return await this.scheduleLocalNotification(title, body, data);
  }

  // إرسال إشعار بعد تأخير
  async sendDelayedNotification(title, body, data = {}, delaySeconds = 5) {
    const trigger = {
      seconds: delaySeconds,
    };
    
    return await this.scheduleLocalNotification(title, body, data, trigger);
  }

  // إرسال إشعار في وقت محدد
  async sendScheduledNotification(title, body, data = {}, date) {
    const trigger = {
      date: date,
    };
    
    return await this.scheduleLocalNotification(title, body, data, trigger);
  }

  // إلغاء إشعار محدد
  async cancelNotification(notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('تم إلغاء الإشعار:', notificationId);
      return true;
    } catch (error) {
      console.error('خطأ في إلغاء الإشعار:', error);
      return false;
    }
  }

  // إلغاء جميع الإشعارات
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('تم إلغاء جميع الإشعارات');
      return true;
    } catch (error) {
      console.error('خطأ في إلغاء جميع الإشعارات:', error);
      return false;
    }
  }

  // الحصول على التوكن الحالي
  async getCurrentToken() {
    if (this.expoPushToken) {
      return this.expoPushToken.data;
    }
    
    const savedToken = await AsyncStorage.getItem('expoPushToken');
    if (savedToken) {
      this.expoPushToken = { data: savedToken };
      return savedToken;
    }
    
    return null;
  }

  // حفظ التوكن في قاعدة البيانات
  async saveTokenToDatabase(userId, userType) {
    try {
      const token = await this.getCurrentToken();
      if (!token) {
        console.log('لا يوجد توكن للإشعارات');
        return false;
      }

      // حفظ التوكن في الجدول المناسب
      const tableName = userType === 'driver' ? 'drivers' : 'stores';
      const { error } = await supabase
        .from(tableName)
        .update({ 
          expo_push_token: token,
          token_updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('خطأ في حفظ التوكن:', error);
        return false;
      }

      console.log('تم حفظ التوكن بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في حفظ التوكن:', error);
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
}

// إنشاء نسخة واحدة من الخدمة
const notificationService = new NotificationService();

export default notificationService;
