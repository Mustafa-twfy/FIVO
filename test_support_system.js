// اختبار نظام الدعم الفني
const { createClient } = require('@supabase/supabase-js');

// إعدادات Supabase
const supabaseUrl = 'https://nzxmhpigoeexuadrnith.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eG1ocGlnb2VleHVhZHJuaXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4MDcsImV4cCI6MjA2NjI4NzgwN30.2m_HhlKIlI1D6TN976zNJT-T8axXLAfUIOcOD1TPgUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupportSystem() {
  console.log('=== اختبار نظام الدعم الفني ===');
  
  try {
    // اختبار جدول support_messages
    console.log('1. اختبار جدول support_messages...');
    const { data: supportData, error: supportError } = await supabase
      .from('support_messages')
      .select('*')
      .limit(5);
    
    if (supportError) {
      console.error('❌ خطأ في جدول support_messages:', supportError);
    } else {
      console.log(`✅ جدول support_messages يعمل - ${supportData?.length || 0} رسالة`);
      if (supportData && supportData.length > 0) {
        console.log('مثال على رسالة:', supportData[0]);
      }
    }
    
    // اختبار إرسال رسالة جديدة
    console.log('2. اختبار إرسال رسالة جديدة...');
    const { data: newMessage, error: sendError } = await supabase
      .from('support_messages')
      .insert({
        user_type: 'driver',
        user_id: 1,
        message: 'رسالة اختبار من النظام',
        sender: 'user',
        created_at: new Date().toISOString()
      })
      .select();
    
    if (sendError) {
      console.error('❌ خطأ في إرسال الرسالة:', sendError);
    } else {
      console.log('✅ تم إرسال رسالة اختبار بنجاح');
    }
    
    // اختبار جلب رسائل مستخدم معين
    console.log('3. اختبار جلب رسائل سائق...');
    const { data: driverMessages, error: driverError } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_type', 'driver')
      .eq('user_id', 1)
      .order('created_at', { ascending: true });
    
    if (driverError) {
      console.error('❌ خطأ في جلب رسائل السائق:', driverError);
    } else {
      console.log(`✅ تم جلب ${driverMessages?.length || 0} رسالة للسائق`);
    }
    
    console.log('=== انتهاء اختبار نظام الدعم الفني ===');
    
  } catch (error) {
    console.error('❌ خطأ عام في اختبار نظام الدعم الفني:', error);
  }
}

// تشغيل الاختبار
testSupportSystem(); 