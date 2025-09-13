import { registerRootComponent } from 'expo';

// استيراد إعدادات البيئة أولاً
import './environment';

// استخدام التطبيق مع Navigation
import App from './SimpleAppWithNavigation';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
