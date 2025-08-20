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

import { supabase, initializeDatabase, updatesAPI } from './supabase';
import { AuthProvider, useAuth } from './context/AuthContext';

// Screens
import LoginScreen from './screens/LoginScreen';
import DriverRegistrationScreen from './screens/DriverRegistrationScreen';
import DriverDocumentsScreen from './screens/DriverDocumentsScreen';
import DriverVehicleScreen from './screens/DriverVehicleScreen';
import PendingApprovalScreen from './screens/PendingApprovalScreen';
import StoreRegistrationScreen from './screens/StoreRegistrationScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import DriversScreen from './screens/DriversScreen';
import StoresScreen from './screens/StoresScreen';
import BannedUsersScreen from './screens/BannedUsersScreen';
import RegistrationRequestsScreen from './screens/RegistrationRequestsScreen';
import StoreOrdersScreen from './screens/StoreOrdersScreen';
import NewOrderScreen from './screens/NewOrderScreen';
import DriverDashboardScreen from './screens/DriverDashboardScreen';
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

// Components
import UpdateModal from './components/UpdateModal';
import DriverDrawerContent from './components/DriverDrawerContent';

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
  console.log('=== بداية اختبار قاعدة البيانات ===');
  try {
    const { data, error } = await supabase.from('drivers').select('count').limit(1);
    if (error) {
      console.error('❌ خطأ في الاتصال:', error);
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
      <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
    </Stack.Navigator>
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
    </Drawer.Navigator>
  );
}

// App Content
function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');
  const scheme = useColorScheme();
  const { login, user, userType, loading } = useAuth();
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [updateVisible, setUpdateVisible] = useState(false);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        if (user && userType) {
          if (userType === 'admin') setInitialRoute('AdminDashboard');
          else if (userType === 'driver') setInitialRoute('Driver');
          else if (userType === 'store') setInitialRoute('Store');
          return;
        }

        const sessionStr = await EncryptedStorage.getItem('session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          // إذا لا يوجد تاريخ انتهاء مضبوط، اضبطه افتراضيًا 7 أيام من الآن
          if (!session.sessionExpiry) {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            session.sessionExpiry = d.toISOString();
            await EncryptedStorage.setItem('session', JSON.stringify(session));
          }
          // تحقق من صلاحية الجلسة
          if (session.sessionExpiry) {
            const now = new Date();
            const expiry = new Date(session.sessionExpiry);
            if (now < expiry) {
              // الجلسة صالحة - استخدم login لتحميل البيانات في AuthContext
              await login(session.user, session.userType, session.sessionExpiry, session.token || null);
              if (session.userType === 'admin') {
                setInitialRoute('AdminDashboard');
              } else if (session.userType === 'driver') {
                setInitialRoute('Driver');
              } else if (session.userType === 'store') {
                setInitialRoute('Store');
              } else {
                setInitialRoute('Login');
              }
              return;
            }
          }
        }

        const storedUserType = await AsyncStorage.getItem('userType');
        if (storedUserType) {
          if (storedUserType === 'admin') setInitialRoute('AdminDashboard');
          else if (storedUserType === 'driver') setInitialRoute('Driver');
          else if (storedUserType === 'store') setInitialRoute('Store');
        } else {
          setInitialRoute('Login');
        }
      } catch (error) {
        setInitialRoute('Login');
        console.error('خطأ في التحقق من الجلسة:', error);
      }
    };

    const splashTimeout = setTimeout(() => {
      setShowSplash(false);
      checkUserSession();
    }, 800);

    // فحص/تهيئة قاعدة البيانات يمكن تعطيله بإعداد بيئة لتفادي العمل في الإنتاج
    const backgroundInit = async () => {
      try {
        const shouldInit = process.env.EXPO_PUBLIC_ENABLE_DB_INIT === 'true';
        if (!shouldInit) {
          // لا تقطع التطبيق عن الـ Navigator؛ اعتبر التهيئة منتهية عند التعطيل
          setDatabaseInitialized(true);
          return;
        }
        const connectionTest = await testDatabaseConnection();
        if (!connectionTest) console.error('فشل في اختبار الاتصال بقاعدة البيانات');
        const result = await initializeDatabase();
        if (result.success) setDatabaseInitialized(true);
        else console.error('فشل في تهيئة قاعدة البيانات:', result.error);
      } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
      }
    };
    backgroundInit();

    return () => clearTimeout(splashTimeout);
  }, []);

  useEffect(() => {
    if (user && userType && !showSplash) {
      if (userType === 'admin') setInitialRoute('AdminDashboard');
      else if (userType === 'driver') setInitialRoute('Driver');
      else if (userType === 'store') setInitialRoute('Store');
    }
  }, [user, userType, showSplash]);

  if (loading || showSplash) return <LoginScreen />;

  return (
    <>
      <NavigationContainer theme={scheme === 'dark' ? darkTheme : lightTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
          <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
          <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
          <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
          <Stack.Screen name="AdminNewOrderScreen" component={AdminNewOrderScreen} />
          <Stack.Screen name="Driver" component={DriverDrawer} />
          <Stack.Screen name="Store" component={StoreDrawer} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="Drivers" component={DriversScreen} />
          <Stack.Screen name="Stores" component={StoresScreen} />
          <Stack.Screen name="BannedUsers" component={BannedUsersScreen} />
          <Stack.Screen name="RegistrationRequests" component={RegistrationRequestsScreen} />
          <Stack.Screen name="StoreOrders" component={StoreOrdersScreen} />
          <Stack.Screen name="NewOrder" component={NewOrderScreen} />
          <Stack.Screen name="AvailableOrders" component={AvailableOrdersScreen} />
          <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
          <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
          <Stack.Screen name="FinancialAccounts" component={FinancialAccountsScreen} />
          <Stack.Screen name="Rewards" component={RewardsScreen} />
          <Stack.Screen name="SupportChat" component={SupportChatScreen} />
          <Stack.Screen name="DriverNotifications" component={DriverNotificationsScreen} />
          <Stack.Screen name="StoreSupportChat" component={StoreSupportChatScreen} />
          <Stack.Screen name="StoreNotifications" component={StoreNotificationsScreen} />
          <Stack.Screen name="AdminSupport" component={AdminSupportScreen} />
          <Stack.Screen name="StoreProfile" component={StoreProfileScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Update Modal */}
      {pendingUpdate && updateVisible && (
        <UpdateModal update={pendingUpdate} onClose={() => setUpdateVisible(false)} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}