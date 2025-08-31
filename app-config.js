// إعدادات محسنة لتجنب الشاشة البيضاء
export const APP_CONFIG = {
  // أوقات التحميل المحسنة
  LOADING_TIMEOUT: 1000,
  FALLBACK_TIMEOUT: 2000,
  EMERGENCY_TIMEOUT: 4000,
  
  // إعدادات الأداء
  FAST_STARTUP: true,
  MINIMAL_ANIMATIONS: true,
  LAZY_DB_INIT: true,
  
  // إعدادات الشاشة
  FORCE_SPLASH_DISPLAY: true,
  FALLBACK_ON_ERROR: true,
  
  // إعدادات التصحيح
  VERBOSE_LOGGING: true,
  TRACK_LOADING_STATE: true,
};

export const TIMEOUTS = {
  AUTH_CHECK: 500,
  DB_CONNECTION: 1000,
  SPLASH_MIN_DISPLAY: 300,
  MAX_LOADING_TIME: 5000,
};
