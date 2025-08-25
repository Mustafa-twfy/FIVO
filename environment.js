/**
 * ملف إعدادات البيئة لتطبيق توصيل سمسم
 * يحتوي على متغيرات البيئة والإعدادات
 */

// تعطيل الميزات التي قد تسبب الشاشة البيضاء
process.env.EXPO_PUBLIC_ENABLE_DB_INIT = 'false';
process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS = 'false';
process.env.EXPO_PUBLIC_USE_SYSTEM_FONTS = 'true';
process.env.EXPO_PUBLIC_DISABLE_COMPLEX_ANIMATIONS = 'true';

// إعدادات قاعدة البيانات
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://nzxmhpigoeexuadrnith.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56eG1ocGlnb2VleHVhZHJuaXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MTE4MDcsImV4cCI6MjA2NjI4NzgwN30.2m_HhlKIlI1D6TN976zNJT-T8axXLAfUIOcOD1TPgUI';

// إعدادات الأداء
process.env.EXPO_PUBLIC_LOADING_TIMEOUT = '2000';
process.env.EXPO_PUBLIC_SPLASH_TIMEOUT = '300';

// تصدير الإعدادات
module.exports = {
  // تعطيل الميزات
  DISABLE_DB_INIT: true,
  DISABLE_NOTIFICATIONS: true,
  USE_SYSTEM_FONTS: true,
  DISABLE_COMPLEX_ANIMATIONS: true,
  
  // إعدادات قاعدة البيانات
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  
  // إعدادات الأداء
  LOADING_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_LOADING_TIMEOUT) || 2000,
  SPLASH_TIMEOUT: parseInt(process.env.EXPO_PUBLIC_SPLASH_TIMEOUT) || 300,
  
  // معلومات التطبيق
  APP_NAME: 'توصيل سمسم',
  APP_VERSION: '1.0.3',
  APP_ENVIRONMENT: process.env.NODE_ENV || 'development'
};

// تطبيق الإعدادات تلقائياً
console.log('🔧 تم تطبيق إعدادات البيئة');
console.log('📱 اسم التطبيق:', module.exports.APP_NAME);
console.log('🔄 إصدار التطبيق:', module.exports.APP_VERSION);
console.log('🌍 بيئة التشغيل:', module.exports.APP_ENVIRONMENT);
