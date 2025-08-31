import * as React from 'react';
import { I18nManager, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

import { supabase, initializeDatabase, updatesAPI } from './supabase';
import { AuthProvider, useAuth } from './context/AuthContext';
import notificationService from './utils/notifications';

// Screens (يجب التأكد من أن جميع الملفات موجودة)
import LoginScreen from './screens/LoginScreen';
import DriverRegistrationScreen from './screens/DriverRegistrationScreen';
import DriverDocumentsScreen from './screens/DriverDocumentsScreen';
import DriverVehicleScreen from './screens/DriverVehicleScreen';
import PendingApprovalScreen from './screens/PendingApprovalScreen';
import UnifiedPendingApprovalScreen from './screens/UnifiedPendingApprovalScreen';
import UnifiedStoreRegistrationScreen from './screens/UnifiedStoreRegistrationScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import DriversScreen from './screens/DriversScreen';
import StoresScreen from './screens/StoresScreen';
import BannedUsersScreen from './screens/BannedUsersScreen';
import RegistrationRequestsScreen from './screens/RegistrationRequestsScreen';
import StoreOrdersScreen from './screens/StoreOrdersScreen';
import NewOrderScreen from './screens/NewOrderScreen';
import DriverDashboardScreen from './screens/DriverDashboardScreen';
import StoreDashboardScreen from './screens/StoreDashboardScreen';
import AvailableOrdersScreen from './screens/AvailableOrdersScreen';
import MyOrdersScreen from './screens/MyOrdersScreen';
import DriverProfileScreen from './screens/DriverProfileScreen';
import FinancialAccountsScreen from './screens/FinancialAccountsScreen';
import RewardsScreen from './screens/RewardsScreen';
import SupportChatScreen from './screens/SupportChatScreen';
import DriverNotificationsScreen from './screens/DriverNotificationsScreen';
import StoreSupportChatScreen from './screens/StoreSupportChatScreen';
import StoreNotificationsScreen from './screens/StoreNotificationsScreen';
import StoreProfileScreen from './screens/StoreProfileScreen';
import AdminSupportScreen from './screens/AdminSupportScreen';
import AdminNewOrderScreen from './screens/AdminNewOrderScreen';
import UpdateStoreLocationScreen from './screens/UpdateStoreLocationScreen';
import SplashScreen from './screens/SplashScreen';

// Components
import UpdateModal from './components/UpdateModal';
import DriverDrawerContent from './components/DriverDrawerContent';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorScreen from './components/ErrorScreen';

I18nManager.forceRTL(true);

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff',
    card: '#fff',
    text: '#222',
    primary: '#FF9800',
    border: '#E0E0E0',
    notification: '#FF9800',
  },
};
const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#181818',
    card: '#232323',
    text: '#fff',
    primary: '#FF9800',
    border: '#333',
    notification: '#FF9800',
  },
};

// دالة اختبار الاتصال بقاعدة البيانات
const testDatabaseConnection = async () => {
  console.log('=== بداية اختبار الاتصال بقاعدة البيانات ===');
  try {
    // تقليل التأخير لضمان استقرار التطبيق
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { count, error } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error);
      return false;
    }
    console.log('✅ الاتصال بقاعدة البيانات ناجح');
    return true;
  } catch (error) {
    console.error('❌ خطأ عام في اختبار قاعدة البيانات:', error);
    return false;
  }
};

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
      <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
      <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="UnifiedStoreRegistrationScreen" component={UnifiedStoreRegistrationScreen} />
      <Stack.Screen name="UnifiedPendingApproval" component={UnifiedPendingApprovalScreen} />
    </Stack.Navigator>
  );
}

// Admin Drawer (تمت إضافته لأنه كان مفقودًا)
function AdminDrawer() {
  return (
    <Drawer.Navigator initialRouteName="AdminDashboard" screenOptions={{
      headerShown: false,
      drawerType: 'slide',
      overlayColor: 'rgba(0,0,0,0.2)',
      sceneContainerStyle: { backgroundColor: '#fff' },
      animationTypeForReplace: 'push',
      animation: 'slide_from_right',
    }}>
      <Drawer.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{drawerLabel: 'لوحة التحكم'}} />
      <Drawer.Screen name="Drivers" component={DriversScreen} options={{drawerLabel: 'السائقين'}} />
      <Drawer.Screen name="Stores" component={StoresScreen} options={{drawerLabel: 'المتاجر'}} />
      <Drawer.Screen name="BannedUsers" component={BannedUsersScreen} options={{drawerLabel: 'المستخدمين المحظورين'}} />
      <Drawer.Screen name="RegistrationRequests" component={RegistrationRequestsScreen} options={{drawerLabel: 'طلبات التسجيل'}} />
      <Drawer.Screen name="AdminSupport" component={AdminSupportScreen} options={{drawerLabel: 'الدعم الفني'}} />
      <Drawer.Screen name="AdminNewOrderScreen" component={AdminNewOrderScreen} options={{drawerLabel: 'إنشاء طلب جديد'}} />
    </Drawer.Navigator>
  );
}

// Driver Drawer
function DriverDrawer() {
  return (
    <Drawer.Navigator 
      initialRouteName="DriverDashboard" 
      drawerContent={(props) => <DriverDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.2)',
        sceneContainerStyle: { backgroundColor: '#fff' },
        animationTypeForReplace: 'push',
        animation: 'slide_from_right',
      }}
    >
      <Drawer.Screen name="DriverDashboard" component={DriverDashboardScreen} options={{drawerLabel: 'الرئيسية'}} />
      <Drawer.Screen name="AvailableOrders" component={AvailableOrdersScreen} options={{drawerLabel: 'الطلبات المتاحة'}} />
      <Drawer.Screen name="MyOrders" component={MyOrdersScreen} options={{drawerLabel: 'طلباتي'}} />
      <Drawer.Screen name="DriverProfile" component={DriverProfileScreen} options={{drawerLabel: 'الملف الشخصي'}} />
      <Drawer.Screen name="FinancialAccounts" component={FinancialAccountsScreen} options={{drawerLabel: 'الحسابات المالية'}} />
      <Drawer.Screen name="Rewards" component={RewardsScreen} options={{drawerLabel: 'المكافآت'}} />
      <Drawer.Screen name="SupportChat" component={SupportChatScreen} options={{drawerLabel: 'الدعم الفني'}} />
      <Drawer.Screen name="DriverNotifications" component={DriverNotificationsScreen} options={{drawerLabel: 'الإشعارات'}} />
    </Drawer.Navigator>
  );
}

// Store Drawer
function StoreDrawer() {
  return (
    <Drawer.Navigator initialRouteName="StoreDashboard" screenOptions={{
      headerShown: false,
      drawerType: 'slide',
      overlayColor: 'rgba(0,0,0,0.2)',
      sceneContainerStyle: { backgroundColor: '#fff' },
      animationTypeForReplace: 'push',
      animation: 'slide_from_right',
    }}>
      <Drawer.Screen name="StoreDashboard" component={StoreDashboardScreen} options={{drawerLabel: 'الرئيسية'}} />
      <Drawer.Screen name="StoreOrders" component={StoreOrdersScreen} options={{drawerLabel: 'طلبات المتجر'}} />
      <Drawer.Screen name="NewOrder" component={NewOrderScreen} options={{drawerLabel: 'إنشاء طلب جديد'}} />
      <Drawer.Screen name="StoreProfile" component={StoreProfileScreen} options={{drawerLabel: 'الملف الشخصي'}} />
      <Drawer.Screen name="StoreSupportChat" component={StoreSupportChatScreen} options={{drawerLabel: 'الدعم الفني'}} />
      <Drawer.Screen name="StoreNotifications" component={StoreNotificationsScreen} options={{drawerLabel: 'الإشعارات'}} />
      <Drawer.Screen name="UpdateStoreLocation" component={UpdateStoreLocationScreen} options={{drawerLabel: 'تحديث الموقع'}} />
    </Drawer.Navigator>
  );
}

// App Content
function AppContent() {
  const [appReady, setAppReady] = useState(false);
  const [error, setError] = useState(null);
  const scheme = useColorScheme();
  const { login, user, userType, loading, restoring } = useAuth();
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [updateVisible, setUpdateVisible] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 بدء تهيئة التطبيق...');
        
        // تأخير أقصر لضمان استقرار التطبيق
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // التحقق من الجلسة
        await checkUserSession();
        
        // تهيئة قاعدة البيانات في الخلفية
        initializeDatabaseBackground();
        
        // إعداد التطبيق جاهز
        setAppReady(true);
        
        console.log('✅ تم تهيئة التطبيق بنجاح');
      } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
        setError(error.message || 'حدث خطأ في تهيئة التطبيق');
        setAppReady(true);
        console.log('⚠️ تم تفعيل التطبيق رغم وجود خطأ لتجنب الشاشة البيضاء');
      }
    };

    // إضافة timeout لضمان عدم بقاء التطبيق معلق
    const timeoutId = setTimeout(() => {
      if (!appReady) {
        console.log('⏰ انتهت مهلة التحميل، تفعيل التطبيق تلقائياً');
        setAppReady(true);
      }
    }, 1000);
    
    // إضافة fallback إضافي للتأكد من عدم بقاء التطبيق معلق
    const fallbackTimeoutId = setTimeout(() => {
      if (!appReady) {
        console.log('🚨 تم تفعيل fallback طارئ لـ appReady');
        setAppReady(true);
      }
    }, 2000);
    
    // إضافة fallback نهائي كحل طارئ أقصى
    const emergencyTimeoutId = setTimeout(() => {
      console.log('🆘 تم تفعيل fallback نهائي طارئ');
      setAppReady(true);
      setError(null);
    }, 4000);

    initializeApp();

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(fallbackTimeoutId);
      clearTimeout(emergencyTimeoutId);
    };
  }, []);

  const checkUserSession = async () => {
    try {
      console.log('🔍 التحقق من الجلسة...');
      
      if (user && userType) {
        console.log('👤 المستخدم مسجل دخول:', userType);
        return;
      }

      const sessionStr = await EncryptedStorage.getItem('session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        
        // التحقق من صحة userType
        if (session.userType && !['driver', 'store', 'admin'].includes(session.userType)) {
          console.log('❌ userType غير صحيح، تنظيف الجلسة');
          await EncryptedStorage.removeItem('session');
          throw new Error('نوع المستخدم غير صحيح، يرجى تسجيل الدخول من جديد');
        }
        
        if (!session.sessionExpiry) {
          const d = new Date();
          d.setDate(d.getDate() + 7);
          session.sessionExpiry = d.toISOString();
          try {
            await EncryptedStorage.setItem('session', JSON.stringify(session));
          } catch (storageError) {
            console.error('❌ خطأ في حفظ الجلسة:', storageError);
          }
        }
        
        if (session.sessionExpiry) {
          const now = new Date();
          const expiry = new Date(session.sessionExpiry);
          if (now < expiry) {
            console.log('🔑 جلسة صالحة موجودة');
            try {
              await login(session.user, session.userType, session.sessionExpiry, session.token || null);
              return;
            } catch (loginError) {
              console.error('❌ خطأ في تسجيل الدخول:', loginError);
              // تنظيف الجلسة الفاسدة
              await EncryptedStorage.removeItem('session');
              throw new Error('فشل في تسجيل الدخول، يرجى المحاولة من جديد');
            }
          }
        }
      }

      console.log('📭 لا توجد جلسة صالحة');
    } catch (error) {
      console.error('❌ خطأ في التحقق من الجلسة:', error);
      throw new Error('فشل في التحقق من الجلسة: ' + error.message);
    }
  };

  const initializeDatabaseBackground = async () => {
    try {
      console.log('🗄️ تهيئة قاعدة البيانات في الخلفية...');
      
      setTimeout(async () => {
        try {
          const shouldInit = process.env.EXPO_PUBLIC_ENABLE_DB_INIT === 'true';
          if (!shouldInit) {
            console.log('⏭️ تم تخطي تهيئة قاعدة البيانات');
            return;
          }
          
          const connectionTest = await testDatabaseConnection();
          if (!connectionTest) {
            console.log('⚠️ فشل في اختبار الاتصال بقاعدة البيانات');
            return;
          }
          
          const result = await initializeDatabase();
          if (result.success) {
            console.log('✅ تم تهيئة قاعدة البيانات بنجاح');
          } else {
            console.log('❌ فشل في تهيئة قاعدة البيانات:', result.error);
          }
        } catch (error) {
          console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
    }
  };

  const handleRetry = () => {
    setError(null);
    setAppReady(false);
    // إعادة تشغيل التطبيق
    setTimeout(() => {
      const initializeApp = async () => {
        try {
          console.log('🔄 إعادة محاولة تهيئة التطبيق...');
          await checkUserSession();
          initializeDatabaseBackground();
          setAppReady(true);
          console.log('✅ تم إعادة تهيئة التطبيق بنجاح');
        } catch (error) {
          console.error('❌ فشل في إعادة التهيئة:', error);
          setError(error.message || 'فشل في إعادة التهيئة');
          setAppReady(true);
        }
      };
      initializeApp();
    }, 1000);
  };

  // فحص التحديثات النشطة للمستخدم الحالي وإظهار نافذة منبثقة مع رابط
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        if (!userType || !appReady) return;
        
        console.log('🔍 فحص التحديثات للمستخدم:', userType);
        
        const { data, error } = await updatesAPI.getActiveUpdatesForUser(userType);
        if (error) {
          console.error('❌ خطأ في فحص التحديثات:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const latest = data[0];
          const ackKey = `ack_update_${latest.id}_${userType}_${user?.id || 'anon'}`;
          try {
            const alreadyAck = await AsyncStorage.getItem(ackKey);
            if (!alreadyAck) {
              setPendingUpdate(latest);
              setUpdateVisible(true);
            }
          } catch (storageError) {
            console.error('❌ خطأ في قراءة AsyncStorage:', storageError);
          }
        }
      } catch (error) {
        console.error('❌ خطأ في فحص التحديثات:', error);
      }
    };
    checkUpdates();
  }, [userType, user, appReady]);

  const acknowledgeUpdate = async () => {
    try {
      if (pendingUpdate) {
        const ackKey = `ack_update_${pendingUpdate.id}_${userType}_${user?.id || 'anon'}`;
        try {
          await AsyncStorage.setItem(ackKey, '1');
        } catch (storageError) {
          console.error('❌ خطأ في كتابة AsyncStorage:', storageError);
        }
        
        try {
          if (user && userType) {
            await updatesAPI.acknowledgeUpdate(pendingUpdate.id, user.id, userType, { dismissed: false });
          }
        } catch (ackError) {
          console.error('❌ خطأ في تأكيد التحديث:', ackError);
        }
      }
    } catch (error) {
      console.error('❌ خطأ في acknowledgeUpdate:', error);
    } finally {
      setUpdateVisible(false);
      setPendingUpdate(null);
    }
  };

  // إضافة logs للتشخيص
  console.log("🚦 Rendering App:", { user, userType, loading, appReady, error, restoring });

  // عرض شاشة التحميل إذا لم يكن التطبيق جاهز أو أثناء استعادة الجلسة
  if (loading || !appReady || restoring) {
    console.log("⏳ عرض شاشة التحميل:", { loading, appReady, restoring });
    
    // إضافة fallback للتأكد من عدم بقاء الشاشة البيضاء
    if (loading && !appReady) {
      console.log("⚠️ التطبيق معلق على التحميل، عرض شاشة التحميل");
    }
    
    if (restoring) {
      console.log("🔄 استعادة الجلسة، عرض شاشة التحميل");
    }
    
    try {
      return <SplashScreen />;
    } catch (splashError) {
      console.error("❌ خطأ في عرض شاشة التحميل:", splashError);
      
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 18, color: '#333', textAlign: 'center' }}>توصيل سمسم</Text>
          <Text style={{ fontSize: 14, color: '#666', marginTop: 10 }}>جاري تحميل التطبيق...</Text>
        </View>
      );
    }
  }

  // عرض شاشة الخطأ إذا كان هناك خطأ
  if (error) {
    console.log("❌ عرض شاشة الخطأ:", error);
    return <ErrorScreen error={error} onRetry={handleRetry} />;
  }

  // Fallback للتأكد من عدم بقاء الشاشة البيضاء
  if (!user && !userType) {
    console.log("👤 مستخدم غير مسجل، عرض شاشة تسجيل الدخول");
  } else {
    console.log("👤 مستخدم مسجل:", { userType, userId: user?.id });
  }

  // إرجاع NavigationContainer مع التصحيح الرئيسي
  return (
    <>
      <NavigationContainer theme={scheme === 'dark' ? darkTheme : lightTheme}>
        {!user || !userType ? (
          // إذا لم يكن هناك مستخدم مسجل، عرض شاشات المصادقة
          <AuthStack />
        ) : userType === 'admin' ? (
          <AdminDrawer />
        ) : userType === 'driver' ? (
          <DriverDrawer />
        ) : userType === 'store' ? (
          <StoreDrawer />
        ) : (
          // Fallback للأنواع غير المعروفة
          <AuthStack />
        )}
      </NavigationContainer>

      {/* Update Modal */}
      {pendingUpdate && (
        <UpdateModal visible={updateVisible} update={pendingUpdate} onAcknowledge={acknowledgeUpdate} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}