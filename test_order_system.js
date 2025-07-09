// اختبار نظام الطلبات
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nzxmhpigoeexuadrnith.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eG1ocGlnb2VleHVhZHJuaXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4MDcsImV4cCI6MjA2NjI4NzgwN30.2m_HhlKIlI1D6TN976zNJT-T8axXLAfUIOcOD1TPgUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOrderSystem() {
  console.log('=== اختبار نظام الطلبات ===');
  
  try {
    // 1. اختبار جدول الطلبات
    console.log('1. اختبار جدول orders...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(5);
    
    if (ordersError) {
      console.error('❌ خطأ في جدول orders:', ordersError);
    } else {
      console.log(`✅ جدول orders يعمل - ${ordersData?.length || 0} طلب`);
      if (ordersData && ordersData.length > 0) {
        console.log('مثال على طلب:', {
          id: ordersData[0].id,
          status: ordersData[0].status,
          total_amount: ordersData[0].total_amount,
          is_urgent: ordersData[0].is_urgent,
          priority_score: ordersData[0].priority_score
        });
      }
    }
    
    // 2. اختبار إنشاء طلب جديد
    console.log('2. اختبار إنشاء طلب جديد...');
    
    // التحقق من المتاجر الموجودة أولاً
    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id, name')
      .limit(1);
    
    if (storesError || !storesData || storesData.length === 0) {
      console.log('⚠️ لا توجد متاجر في قاعدة البيانات. تخطي اختبار إنشاء الطلب.');
    } else {
      const storeId = storesData[0].id;
      const storeName = storesData[0].name;
      
      const newOrder = {
        store_id: storeId,
        customer_name: 'عميل اختبار',
        customer_phone: '07801234567',
        pickup_address: `${storeName}، الرياض`,
        delivery_address: 'حي النزهة، الرياض',
        items_description: 'برجر دجاج + بطاطس',
        description: 'برجر دجاج + بطاطس',
        phone: '07801234567',
        total_amount: 45.00,
        is_urgent: false
      };
      
      const { data: createdOrder, error: createError } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();
      
      if (createError) {
        console.error('❌ خطأ في إنشاء الطلب:', createError);
      } else {
        console.log('✅ تم إنشاء طلب جديد بنجاح:', {
          id: createdOrder.id,
          status: createdOrder.status,
          priority_score: createdOrder.priority_score
        });
      }
    }
    
    // 3. اختبار جلب الطلبات المتاحة
    console.log('3. اختبار جلب الطلبات المتاحة...');
    const { data: availableOrders, error: availableError } = await supabase
      .from('orders')
      .select(`
        *,
        stores (
          id,
          name,
          phone,
          category
        )
      `)
      .eq('status', 'pending')
      .order('priority_score', { ascending: false });
    
    if (availableError) {
      console.error('❌ خطأ في جلب الطلبات المتاحة:', availableError);
    } else {
      console.log(`✅ تم جلب ${availableOrders?.length || 0} طلب متاح`);
      if (availableOrders && availableOrders.length > 0) {
        console.log('أول طلب متاح:', {
          id: availableOrders[0].id,
          store_name: availableOrders[0].stores?.name,
          priority_score: availableOrders[0].priority_score,
          is_urgent: availableOrders[0].is_urgent
        });
      }
    }
    
    // 4. اختبار قبول طلب
    if (availableOrders && availableOrders.length > 0) {
      console.log('4. اختبار قبول طلب...');
      const orderToAccept = availableOrders[0];
      
      // التحقق من السائقين الموجودة
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('id, name')
        .limit(1);
      
      if (driversError || !driversData || driversData.length === 0) {
        console.log('⚠️ لا توجد سائقين في قاعدة البيانات. تخطي اختبار قبول الطلب.');
      } else {
        const driverId = driversData[0].id;
        
        const { data: acceptedOrder, error: acceptError } = await supabase
          .from('orders')
          .update({
            status: 'accepted',
            driver_id: driverId,
            accepted_at: new Date().toISOString()
          })
          .eq('id', orderToAccept.id)
          .eq('status', 'pending')
          .select()
          .single();
        
        if (acceptError) {
          console.error('❌ خطأ في قبول الطلب:', acceptError);
        } else {
          console.log('✅ تم قبول الطلب بنجاح:', {
            id: acceptedOrder.id,
            status: acceptedOrder.status,
            driver_id: acceptedOrder.driver_id
          });
        }
      }
    }
    
    // 5. اختبار إحصائيات الطلبات
    console.log('5. اختبار إحصائيات الطلبات...');
    const { data: stats, error: statsError } = await supabase
      .from('orders')
      .select('status, total_amount, is_urgent');
    
    if (statsError) {
      console.error('❌ خطأ في جلب الإحصائيات:', statsError);
    } else {
      const statistics = {
        total_orders: stats.length,
        pending_orders: stats.filter(o => o.status === 'pending').length,
        accepted_orders: stats.filter(o => o.status === 'accepted').length,
        completed_orders: stats.filter(o => o.status === 'completed').length,
        cancelled_orders: stats.filter(o => o.status === 'cancelled').length,
        total_revenue: stats
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + parseFloat(o.total_amount), 0),
        urgent_orders: stats.filter(o => o.is_urgent).length
      };
      
      console.log('✅ إحصائيات الطلبات:', statistics);
    }
    
    // 6. اختبار الطلبات العاجلة
    console.log('6. اختبار الطلبات العاجلة...');
    const { data: urgentOrders, error: urgentError } = await supabase
      .from('orders')
      .select('*')
      .eq('is_urgent', true)
      .order('priority_score', { ascending: false });
    
    if (urgentError) {
      console.error('❌ خطأ في جلب الطلبات العاجلة:', urgentError);
    } else {
      console.log(`✅ تم العثور على ${urgentOrders?.length || 0} طلب عاجل`);
    }
    
    console.log('=== انتهاء اختبار نظام الطلبات ===');
    
  } catch (error) {
    console.error('❌ خطأ عام في اختبار نظام الطلبات:', error);
  }
}

// تشغيل الاختبار
testOrderSystem(); 