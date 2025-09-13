import { registerRootComponent } from 'expo';

// استيراد إعدادات البيئة أولاً
import './environment';

// استخدام التطبيق المبسط للاختبار
import App from './SimpleApp';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
