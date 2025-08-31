/**
 * اختبار سريع للتأكد من عمل التطبيق
 */

const testApp = () => {
  console.log('🧪 بدء الاختبار السريع...');
  
  // 1. فحص React Native
  try {
    require('react-native');
    console.log('✅ React Native متاح');
  } catch (e) {
    console.error('❌ مشكلة في React Native:', e.message);
  }
  
  // 2. فحص Navigation
  try {
    require('@react-navigation/native');
    console.log('✅ Navigation متاح');
  } catch (e) {
    console.error('❌ مشكلة في Navigation:', e.message);
  }
  
  // 3. فحص الملفات الأساسية
  const fs = require('fs');
  const files = ['App.js', 'index.js'];
  
  files.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} موجود`);
    } else {
      console.error(`❌ ${file} غير موجود`);
    }
  });
  
  console.log('✅ انتهى الاختبار السريع');
};

if (require.main === module) {
  testApp();
}

module.exports = { testApp };
