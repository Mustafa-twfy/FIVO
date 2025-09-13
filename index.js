import { registerRootComponent } from 'expo';

// استيراد إعدادات البيئة أولاً
import './environment';

// تطبيق الإصلاح الطارئ الفوري
import './EMERGENCY_FIX';

// استخدام التطبيق الأصلي مع الإصلاحات
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
