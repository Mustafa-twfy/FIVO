// إصلاح نظام الدعم الفني - طريقة مبسطة
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nzxmhpigoeexuadrnith.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eG1ocGlnb2VleHVhZHJuaXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4MDcsImV4cCI6MjA2NjI4NzgwN30.2m_HhlKIlI1D6TN976zNJT-T8axXLAfUIOcOD1TPgUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSupportSystem() {
  console.log('=== بداية إصلاح نظام الدعم الفني ===');
  
  try {
    // 1. فحص الجدول الحالي
    console.log('1. فحص الجدول الحالي...');
    
    const { data: currentData, error: currentError } = await supabase
      .from('support_messages')
      .select('*')
      .limit(1);
    
    if (currentError) {
      console.log('الجدول غير موجود أو يحتاج إصلاح:', currentError.message);
    } else {
      console.log('الجدول موجود، جاري فحص الأعمدة...');
      if (currentData && currentData.length > 0) {
        console.log('أعمدة الجدول:', Object.keys(currentData[0]));
      }
    }
    
    // 2. محاولة إرسال رسالة تجريبية
    console.log('2. اختبار إرسال رسالة تجريبية...');
    
    const testMessage = {
      user_type: 'driver',
      user_id: 1,
      message: 'رسالة اختبار من النظام',
      sender: 'user',
      created_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('support_messages')
      .insert(testMessage)
      .select();
    
    if (insertError) {
      console.error('❌ خطأ في إرسال الرسالة:', insertError);
      
      // إذا كان الخطأ بسبب عدم وجود الأعمدة، نحتاج لإصلاح الجدول
      if (insertError.message.includes('user_type') || insertError.message.includes('user_id')) {
        console.log('يبدو أن الجدول يحتاج إصلاح. يرجى تشغيل ملف fix_support_system.sql في Supabase SQL Editor');
        console.log('أو قم بإنشاء الجدول يدوياً في لوحة تحكم Supabase');
      }
    } else {
      console.log('✅ تم إرسال رسالة تجريبية بنجاح');
      
      // حذف الرسالة التجريبية
      if (insertData && insertData.length > 0) {
        await supabase
          .from('support_messages')
          .delete()
          .eq('id', insertData[0].id);
      }
    }
    
    // 3. إدخال بيانات تجريبية إذا كان الجدول يعمل
    console.log('3. إدخال بيانات تجريبية...');
    
    const sampleData = [
      { user_type: 'driver', user_id: 1, message: 'أحتاج مساعدة في تحديث بياناتي الشخصية', sender: 'user' },
      { user_type: 'driver', user_id: 1, message: 'مرحباً! يمكننا مساعدتك في تحديث بياناتك. ما هي البيانات التي تريد تحديثها؟', sender: 'admin' },
      { user_type: 'driver', user_id: 2, message: 'مشكلة في تسجيل الدخول', sender: 'user' },
      { user_type: 'driver', user_id: 2, message: 'سنقوم بفحص مشكلة تسجيل الدخول. هل يمكنك إخبارنا بالخطأ الذي يظهر لك؟', sender: 'admin' },
      { user_type: 'store', user_id: 1, message: 'أحتاج مساعدة في إضافة منتجات جديدة', sender: 'user' },
      { user_type: 'store', user_id: 1, message: 'مرحباً! يمكننا مساعدتك في إضافة المنتجات. هل تريد دليل مفصل؟', sender: 'admin' },
      { user_type: 'store', user_id: 2, message: 'مشكلة في تحديث عنوان المتجر', sender: 'user' },
      { user_type: 'store', user_id: 2, message: 'سنقوم بمساعدتك في تحديث العنوان. ما هو العنوان الجديد؟', sender: 'admin' }
    ];
    
    let successCount = 0;
    for (const data of sampleData) {
      const { error: sampleError } = await supabase
        .from('support_messages')
        .insert({
          ...data,
          created_at: new Date().toISOString()
        });
      
      if (sampleError) {
        console.log(`تحذير: لا يمكن إدخال الرسالة "${data.message}":`, sampleError.message);
      } else {
        successCount++;
      }
    }
    
    console.log(`✅ تم إدخال ${successCount} من ${sampleData.length} رسالة تجريبية`);
    
    // 4. اختبار جلب الرسائل
    console.log('4. اختبار جلب الرسائل...');
    
    const { data: allMessages, error: fetchError } = await supabase
      .from('support_messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ خطأ في جلب الرسائل:', fetchError);
    } else {
      console.log(`✅ تم جلب ${allMessages?.length || 0} رسالة بنجاح`);
      
      // تجميع الرسائل حسب المستخدم
      const conversations = {};
      allMessages.forEach(msg => {
        const key = `${msg.user_type}-${msg.user_id}`;
        if (!conversations[key]) {
          conversations[key] = {
            user_type: msg.user_type,
            user_id: msg.user_id,
            messages: []
          };
        }
        conversations[key].messages.push(msg);
      });
      
      console.log(`📊 عدد المحادثات: ${Object.keys(conversations).length}`);
      Object.keys(conversations).forEach(key => {
        const conv = conversations[key];
        console.log(`  - ${conv.user_type} (ID: ${conv.user_id}): ${conv.messages.length} رسالة`);
      });
    }
    
    console.log('=== انتهاء إصلاح نظام الدعم الفني ===');
    
  } catch (error) {
    console.error('❌ خطأ عام في إصلاح النظام:', error);
  }
}

// تشغيل الإصلاح
fixSupportSystem(); 