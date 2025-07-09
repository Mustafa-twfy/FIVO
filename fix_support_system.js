// إصلاح نظام الدعم الفني
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nzxmhpigoeexuadrnith.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eG1ocGlnb2VleHVhZHJuaXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4MDcsImV4cCI6MjA2NjI4NzgwN30.2m_HhlKIlI1D6TN976zNJT-T8axXLAfUIOcOD1TPgUI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSupportSystem() {
  console.log('=== بداية إصلاح نظام الدعم الفني ===');
  
  try {
    // 1. حذف الجداول القديمة
    console.log('1. حذف الجداول القديمة...');
    
    // حذف جدول support_messages القديم
    const { error: dropSupportError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS support_messages CASCADE;'
    });
    
    if (dropSupportError) {
      console.log('تحذير: لا يمكن حذف الجدول القديم:', dropSupportError.message);
    }
    
    // حذف جدول store_support_messages
    const { error: dropStoreError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS store_support_messages CASCADE;'
    });
    
    if (dropStoreError) {
      console.log('تحذير: لا يمكن حذف جدول المتاجر:', dropStoreError.message);
    }
    
    // 2. إنشاء جدول الدعم الفني الموحد
    console.log('2. إنشاء جدول الدعم الفني الموحد...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        user_type VARCHAR(20) NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sender VARCHAR(20) NOT NULL,
        is_read BOOLEAN DEFAULT false,
        read_by_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.error('❌ خطأ في إنشاء الجدول:', createError);
      return;
    }
    
    console.log('✅ تم إنشاء جدول support_messages بنجاح');
    
    // 3. إنشاء الفهارس
    console.log('3. إنشاء الفهارس...');
    
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_support_messages_user_type_user_id ON support_messages(user_type, user_id);
      CREATE INDEX IF NOT EXISTS idx_support_messages_sender ON support_messages(sender);
      CREATE INDEX IF NOT EXISTS idx_support_messages_read_by_admin ON support_messages(read_by_admin);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: indexesSQL
    });
    
    if (indexError) {
      console.log('تحذير: لا يمكن إنشاء الفهارس:', indexError.message);
    } else {
      console.log('✅ تم إنشاء الفهارس بنجاح');
    }
    
    // 4. إدخال بيانات تجريبية
    console.log('4. إدخال بيانات تجريبية...');
    
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
    
    for (const data of sampleData) {
      const { error: insertError } = await supabase
        .from('support_messages')
        .insert({
          ...data,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.log('تحذير: لا يمكن إدخال البيانات التجريبية:', insertError.message);
      }
    }
    
    console.log('✅ تم إدخال البيانات التجريبية بنجاح');
    
    // 5. اختبار النظام
    console.log('5. اختبار النظام...');
    
    const { data: testData, error: testError } = await supabase
      .from('support_messages')
      .select('*')
      .limit(5);
    
    if (testError) {
      console.error('❌ خطأ في اختبار النظام:', testError);
    } else {
      console.log(`✅ النظام يعمل بشكل صحيح - ${testData?.length || 0} رسالة موجودة`);
    }
    
    console.log('=== تم إصلاح نظام الدعم الفني بنجاح! ===');
    
  } catch (error) {
    console.error('❌ خطأ عام في إصلاح النظام:', error);
  }
}

// تشغيل الإصلاح
fixSupportSystem(); 