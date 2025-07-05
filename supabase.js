import { createClient } from '@supabase/supabase-js';

// ضع هنا بيانات مشروعك من لوحة تحكم Supabase
const SUPABASE_URL = 'https://nzxmhpigoeexuadrnith.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eG1ocGlnb2VleHVhZHJuaXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4MDcsImV4cCI6MjA2NjI4NzgwN30.2m_HhlKIlI1D6TN976zNJT-T8axXLAfUIOcOD1TPgUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// دالة إنشاء جميع الجداول تلقائياً
export const initializeDatabase = async () => {
  console.log('بدء تهيئة قاعدة البيانات...');
  
  try {
    // التحقق من وجود الجداول المطلوبة
    const requiredTables = [
      'drivers', 'stores', 'orders', 'notifications', 
      'store_notifications', 'support_messages', 'store_support_messages',
      'rewards', 'fines', 'banned_users', 'registration_requests'
    ];
    
    console.log('التحقق من وجود الجداول المطلوبة...');
    
    for (const tableName of requiredTables) {
      try {
        const { data: existingTable } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_name', tableName)
          .eq('table_schema', 'public');
        
        if (existingTable && existingTable.length > 0) {
          console.log(`✅ جدول ${tableName} موجود`);
        } else {
          console.log(`❌ جدول ${tableName} غير موجود`);
          console.log(`يرجى تشغيل ملف create_all_tables.sql في Supabase SQL Editor`);
        }
      } catch (error) {
        console.log(`خطأ في التحقق من جدول ${tableName}:`, error.message);
      }
    }
    
    // إدخال بيانات تجريبية
    await insertSampleData();
    
    console.log('تم تهيئة قاعدة البيانات بنجاح!');
    return { success: true, message: 'تم تهيئة قاعدة البيانات بنجاح' };
    
  } catch (error) {
    console.error('خطأ في تهيئة قاعدة البيانات:', error);
    return { success: false, error: error.message };
  }
};

// دالة إدخال بيانات تجريبية
const insertSampleData = async () => {
  try {
    // إدخال سائقين تجريبيين
    await supabase.from('drivers').upsert([
      {
        email: 'driver1@tawseel.com',
        password: 'password123',
        name: 'أحمد محمد',
        phone: '+966501234567',
        vehicle_type: 'سيارة نقل صغيرة',
        status: 'approved',
        is_active: true
      },
      {
        email: 'driver2@tawseel.com',
        password: 'password123',
        name: 'محمد علي',
        phone: '+966502345678',
        vehicle_type: 'دراجة نارية',
        status: 'approved',
        is_active: true
      }
    ], { onConflict: 'email' });

    // إدخال متاجر تجريبية
    await supabase.from('stores').upsert([
      {
        email: 'store1@tawseel.com',
        password: 'password123',
        name: 'مطعم الشرق',
        phone: '+966504567890',
        address: 'شارع الملك فهد، الرياض',
        category: 'مطاعم',
        is_active: true
      },
      {
        email: 'store2@tawseel.com',
        password: 'password123',
        name: 'صيدلية النور',
        phone: '+966505678901',
        address: 'شارع التحلية، جدة',
        category: 'صيدليات',
        is_active: true
      }
    ], { onConflict: 'email' });

    console.log('تم إدخال البيانات التجريبية بنجاح');
  } catch (error) {
    console.log('خطأ في إدخال البيانات التجريبية:', error.message);
  }
};

// دوال إدارة السائقين
export const driversAPI = {
  // جلب جميع السائقين
  getAllDrivers: async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // تحديث نقاط السائق
  updateDriverDebt: async (driverId, newPoints) => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ debt_points: newPoints })
      .eq('id', driverId);
    return { data, error };
  },

  // تصفية ديون السائق
  clearDriverDebt: async (driverId) => {
    // تصفير النقاط
    const { data, error } = await supabase
      .from('drivers')
      .update({ debt_points: 0 })
      .eq('id', driverId);
    // إرسال إشعار عند النجاح
    if (!error) {
      await driversAPI.sendNotification(
        driverId,
        'تصفير نقاط الديون',
        'تم تصفير جميع نقاط الديون الخاصة بك. مجموع نقاطك الآن: 0 نقطة (0 دينار).'
      );
    }
    return { data, error };
  },

  // تحديث وقت الدوام
  updateWorkHours: async (driverId, startTime, endTime) => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        work_start_time: startTime,
        work_end_time: endTime 
      })
      .eq('id', driverId);
    return { data, error };
  },

  // تغريم السائق
  fineDriver: async (driverId, finePoints, reason) => {
    // جلب النقاط الحالية
    const { data: driver } = await supabase
      .from('drivers')
      .select('debt_points')
      .eq('id', driverId)
      .single();
    const newPoints = (driver?.debt_points || 0) + finePoints;
    const { data, error } = await supabase
      .from('drivers')
      .update({ debt_points: newPoints })
      .eq('id', driverId);
    // إضافة سجل التغريم
    if (!error) {
      await supabase
        .from('fines')
        .insert({
          driver_id: driverId,
          amount: finePoints,
          reason: reason,
          date: new Date().toISOString()
        });
      // إرسال إشعار للسائق
      await driversAPI.sendNotification(
        driverId,
        'إضافة غرامة',
        `تم إضافة غرامة ${finePoints} نقطة (${finePoints * 250} دينار). مجموع نقاطك الآن: ${newPoints} نقطة (${newPoints * 250} دينار).${reason ? ' السبب: ' + reason : ''}`
      );
    }
    return { data, error };
  },

  // إيقاف السائق
  suspendDriver: async (driverId, reason) => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        is_suspended: true,
        suspension_reason: reason,
        suspended_at: new Date().toISOString()
      })
      .eq('id', driverId);
    return { data, error };
  },

  // إلغاء إيقاف السائق
  unsuspendDriver: async (driverId) => {
    const { data, error } = await supabase
      .from('drivers')
      .update({ 
        is_suspended: false,
        suspension_reason: null,
        suspended_at: null
      })
      .eq('id', driverId);
    return { data, error };
  },

  // إرسال إشعار للسائق
  sendNotification: async (driverId, title, message) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        driver_id: driverId,
        title: title,
        message: message,
        created_at: new Date().toISOString()
      });
    return { data, error };
  },

  // جلب مكافآت السائق
  getDriverRewards: async (driverId) => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // إرسال رسالة دعم فني
  sendSupportMessage: async (driverId, message) => {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        driver_id: driverId,
        message: message,
        created_at: new Date().toISOString(),
        sender: 'driver'
      });
    return { data, error };
  },

  // جلب رسائل الدعم الفني للسائق
  getSupportMessages: async (driverId) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // جلب إشعارات السائق
  getDriverNotifications: async (driverId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // إنشاء حساب سائق جديد
  createDriverAccount: async (driverData) => {
    const { data, error } = await supabase
      .from('drivers')
      .insert({
        email: driverData.email,
        password: driverData.password, // في التطبيق الحقيقي يجب تشفير كلمة المرور
        vehicle_type: driverData.vehicleType,
        vehicle_number: driverData.vehicleNumber || null,
        phone: driverData.phone,
        national_card_front: driverData.nationalCardFront,
        national_card_back: driverData.nationalCardBack,
        residence_card_front: driverData.residenceCardFront,
        residence_card_back: driverData.residenceCardBack,
        status: 'pending', // في انتظار موافقة الإدارة
        is_active: false,
        debt_points: 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    return { data, error };
  },

  // تسجيل دخول السائق
  loginDriver: async (email, password) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('status', 'approved')
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// دوال إدارة المتاجر
export const storesAPI = {
  // جلب جميع المتاجر
  getAllStores: async () => {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // جلب طلبات المتجر
  getStoreOrders: async (storeId) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // تفعيل/إلغاء تفعيل المتجر
  toggleStoreStatus: async (storeId, isActive) => {
    const { data, error } = await supabase
      .from('stores')
      .update({ is_active: isActive })
      .eq('id', storeId);
    return { data, error };
  },

  // إرسال إشعار للمتجر
  sendStoreNotification: async (storeId, title, message) => {
    const { data, error } = await supabase
      .from('store_notifications')
      .insert({
        store_id: storeId,
        title: title,
        message: message,
        created_at: new Date().toISOString()
      });
    return { data, error };
  },

  // إرسال رسالة دعم فني للمتجر
  sendSupportMessage: async (storeId, message) => {
    const { data, error } = await supabase
      .from('store_support_messages')
      .insert({
        store_id: storeId,
        message: message,
        created_at: new Date().toISOString(),
        sender: 'store'
      });
    return { data, error };
  },

  // جلب رسائل الدعم الفني للمتجر
  getSupportMessages: async (storeId) => {
    const { data, error } = await supabase
      .from('store_support_messages')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // جلب إشعارات المتجر
  getStoreNotifications: async (storeId) => {
    const { data, error } = await supabase
      .from('store_notifications')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    return { data, error };
  }
};

// دوال إدارة المحظورين
export const bannedUsersAPI = {
  // جلب جميع المحظورين
  getBannedUsers: async () => {
    const { data, error } = await supabase
      .from('banned_users')
      .select('*')
      .order('banned_at', { ascending: false });
    return { data, error };
  },

  // حظر مستخدم
  banUser: async (userId, userType, reason) => {
    const { data, error } = await supabase
      .from('banned_users')
      .insert({
        user_id: userId,
        user_type: userType, // 'driver' or 'store'
        reason: reason,
        banned_at: new Date().toISOString()
      });
    return { data, error };
  },

  // فك حظر مستخدم
  unbanUser: async (userId) => {
    const { data, error } = await supabase
      .from('banned_users')
      .delete()
      .eq('user_id', userId);
    return { data, error };
  }
};

// دوال طلبات التسجيل
export const registrationRequestsAPI = {
  // جلب جميع طلبات التسجيل
  getRegistrationRequests: async () => {
    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // قبول طلب تسجيل سائق
  approveDriverRequest: async (requestId, startTime, endTime) => {
    const { data: request } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (request) {
      // إنشاء حساب السائق
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .insert({
          email: request.email,
          name: request.name,
          phone: request.phone,
          work_start_time: startTime,
          work_end_time: endTime,
          is_active: true
        });

      if (!driverError) {
        // تحديث حالة الطلب
        await supabase
          .from('registration_requests')
          .update({ 
            status: 'approved',
            approved_at: new Date().toISOString()
          })
          .eq('id', requestId);
      }

      return { data: driver, error: driverError };
    }
  },

  // رفض طلب تسجيل
  rejectRequest: async (requestId, reason) => {
    const { data, error } = await supabase
      .from('registration_requests')
      .update({ 
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString()
      })
      .eq('id', requestId);
    return { data, error };
  }
};

// دوال الدعم الفني الموحدة
export const supportAPI = {
  // إرسال رسالة دعم فني من سائق أو متجر
  sendSupportMessage: async (userType, userId, message, sender = 'user') => {
    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        user_type: userType, // 'driver' أو 'store'
        user_id: userId,     // driver_id أو store_id
        message: message,
        sender: sender,      // 'user' أو 'admin'
        created_at: new Date().toISOString()
      });
    return { data, error };
  },

  // جلب جميع رسائل الدعم الفني لمستخدم معين (سائق أو متجر)
  getSupportMessages: async (userType, userId) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_type', userType)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // جلب جميع المحادثات (لصفحة الإدارة)
  getAllSupportConversations: async () => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: true });
    return { data, error };
  },

  // جلب عدد الرسائل غير المقروءة للدعم الفني
  getUnreadSupportCount: async () => {
    const { count, error } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender', 'user')
      .eq('read_by_admin', false);
    return { data: count || 0, error };
  }
};

// دوال إعدادات النظام العامة
export const systemSettingsAPI = {
  // جلب إعدادات النظام
  getSystemSettings: async () => {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('id', { ascending: true })
      .limit(1);
    return { data: data && data[0], error };
  },
  // تحديث إعدادات النظام
  updateSystemSettings: async (debt_point_value, max_debt_points) => {
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        debt_point_value,
        max_debt_points,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();
    return { data, error };
  }
}; 