// ملف اختبار الاتصال بقاعدة البيانات
import { supabase } from './supabase.js';

export const testDatabaseConnection = async () => {
  console.log('=== بداية اختبار قاعدة البيانات ===');
  
  try {
    // اختبار الاتصال
    console.log('اختبار الاتصال بقاعدة البيانات...');
    const { data, error } = await supabase
      .from('drivers')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ خطأ في الاتصال:', error);
      return false;
    }
    
    console.log('✅ الاتصال بقاعدة البيانات ناجح');
    
    // اختبار الجداول
    const tables = ['drivers', 'stores', 'orders', 'registration_requests'];
    
    for (const table of tables) {
      try {
        console.log(`اختبار جدول ${table}...`);
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (tableError) {
          console.error(`❌ خطأ في جدول ${table}:`, tableError);
        } else {
          console.log(`✅ جدول ${table} يعمل بشكل صحيح`);
        }
      } catch (err) {
        console.error(`❌ خطأ في اختبار جدول ${table}:`, err);
      }
    }
    
    // اختبار البيانات التجريبية
    console.log('اختبار البيانات التجريبية...');
    
    // اختبار السائقين
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .limit(5);
    
    if (driversError) {
      console.error('❌ خطأ في جلب السائقين:', driversError);
    } else {
      console.log(`✅ تم العثور على ${drivers?.length || 0} سائق`);
      if (drivers && drivers.length > 0) {
        console.log('مثال على سائق:', drivers[0]);
      }
    }
    
    // اختبار المتاجر
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(5);
    
    if (storesError) {
      console.error('❌ خطأ في جلب المتاجر:', storesError);
    } else {
      console.log(`✅ تم العثور على ${stores?.length || 0} متجر`);
      if (stores && stores.length > 0) {
        console.log('مثال على متجر:', stores[0]);
      }
    }
    
    // اختبار طلبات التسجيل
    const { data: requests, error: requestsError } = await supabase
      .from('registration_requests')
      .select('*')
      .limit(5);
    
    if (requestsError) {
      console.error('❌ خطأ في جلب طلبات التسجيل:', requestsError);
    } else {
      console.log(`✅ تم العثور على ${requests?.length || 0} طلب تسجيل`);
      if (requests && requests.length > 0) {
        console.log('مثال على طلب تسجيل:', requests[0]);
      }
    }
    
    console.log('=== انتهاء اختبار قاعدة البيانات ===');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ عام في اختبار قاعدة البيانات:', error);
    return false;
  }
};

// دالة لإنشاء بيانات تجريبية إذا لم تكن موجودة
export const createSampleData = async () => {
  console.log('إنشاء بيانات تجريبية...');
  
  try {
    // إنشاء سائقين تجريبيين
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .upsert([
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
    
    if (driversError) {
      console.error('خطأ في إنشاء السائقين:', driversError);
    } else {
      console.log('✅ تم إنشاء السائقين التجريبيين');
    }
    
    // إنشاء متاجر تجريبية
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .upsert([
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
    
    if (storesError) {
      console.error('خطأ في إنشاء المتاجر:', storesError);
    } else {
      console.log('✅ تم إنشاء المتاجر التجريبية');
    }
    
    // إنشاء طلب تسجيل معلق
    const { data: request, error: requestError } = await supabase
      .from('registration_requests')
      .upsert([
        {
          email: 'nmcmilli07@gmail.com',
          password: 'password123',
          name: 'سائق تجريبي',
          phone: '+966501234567',
          user_type: 'driver',
          status: 'pending'
        }
      ], { onConflict: 'email' });
    
    if (requestError) {
      console.error('خطأ في إنشاء طلب التسجيل:', requestError);
    } else {
      console.log('✅ تم إنشاء طلب التسجيل المعلق');
    }
    
    console.log('✅ تم إنشاء جميع البيانات التجريبية بنجاح');
    
  } catch (error) {
    console.error('خطأ في إنشاء البيانات التجريبية:', error);
  }
}; 