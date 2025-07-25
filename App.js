import * as React from 'react';
import { I18nManager, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import OrderScreen from './screens/OrderScreen';
import OrderListScreen from './screens/OrderListScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import StoreDashboardScreen from './screens/StoreDashboardScreen';
import SplashScreen from './screens/SplashScreen';
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
import DriverRegistrationScreen from './screens/DriverRegistrationScreen';
import DriverDocumentsScreen from './screens/DriverDocumentsScreen';
import DriverVehicleScreen from './screens/DriverVehicleScreen';
import PendingApprovalScreen from './screens/PendingApprovalScreen';
import AdminSupportScreen from './screens/AdminSupportScreen';
import StoreRegistrationScreen from './screens/StoreRegistrationScreen';
import StoreInfoScreen from './screens/StoreInfoScreen';
import StorePendingApprovalScreen from './screens/StorePendingApprovalScreen';
import StoreDocumentsScreen from './screens/StoreDocumentsScreen';
import UpdateStoreLocationScreen from './screens/UpdateStoreLocationScreen';
import StoreProfileScreen from './screens/StoreProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DefaultTheme, DarkTheme } from '@react-navigation/native';
import { initializeDatabase } from './supabase';
import UnifiedPendingApprovalScreen from './screens/UnifiedPendingApprovalScreen';
import { supabase } from './supabase';
import DriverDrawerContent from './components/DriverDrawerContent';
import { AuthProvider } from './context/AuthContext';
import AdminNewOrderScreen from './screens/AdminNewOrderScreen';

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

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
      <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
      <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
      <Stack.Screen name="StoreInfo" component={StoreInfoScreen} />
      <Stack.Screen name="StoreLocation" component={StoreLocationScreen} />
      <Stack.Screen name="StoreDocuments" component={StoreDocumentsScreen} />
      <Stack.Screen name="StorePendingApproval" component={StorePendingApprovalScreen} />
      <Stack.Screen name="StoreMap" component={StoreMapScreen} />
      <Stack.Screen name="UpdateStoreLocation" component={UpdateStoreLocationScreen} />
    </Stack.Navigator>
  );
}

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

// دالة اختبار الاتصال بقاعدة البيانات
const testDatabaseConnection = async () => {
  console.log('=== بداية اختبار قاعدة البيانات ===');
  
  try {
    // اختبار الاتصال
    console.log('اختبار الاتصال بقاعدة البيانات...');
    const { data, error } = await supabase
      .from('drivers')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ خطأ في الاتصال:', error);
      return false;
    }
    
    console.log('✅ الاتصال بقاعدة البيانات ناجح');
    
    // اختبار البيانات التجريبية
    console.log('اختبار البيانات التجريبية...');
    
    // اختبار السائقين
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .limit(5);
    
    if (driversError) {
      console.error('❌ خطأ في جلب السائقين:', driversError);
    } else {
      console.log(`✅ تم العثور على ${drivers?.length || 0} سائق`);
      if (drivers && drivers.length > 0) {
        console.log('مثال على سائق:', drivers[0]);
      }
    }
    
    // اختبار المتاجر
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .limit(5);
    
    if (storesError) {
      console.error('❌ خطأ في جلب المتاجر:', storesError);
    } else {
      console.log(`✅ تم العثور على ${stores?.length || 0} متجر`);
      if (stores && stores.length > 0) {
        console.log('مثال على متجر:', stores[0]);
      }
    }
    
    // اختبار طلبات التسجيل
    const { data: requests, error: requestsError } = await supabase
      .from('registration_requests')
      .select('*')
      .limit(5);
    
    if (requestsError) {
      console.error('❌ خطأ في جلب طلبات التسجيل:', requestsError);
    } else {
      console.log(`✅ تم العثور على ${requests?.length || 0} طلب تسجيل`);
      if (requests && requests.length > 0) {
        console.log('مثال على طلب تسجيل:', requests[0]);
      }
    }
    
    console.log('=== انتهاء اختبار قاعدة البيانات ===');
    return true;
    
  } catch (error) {
    console.error('❌ خطأ عام في اختبار قاعدة البيانات:', error);
    return false;
  }
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [databaseInitialized, setDatabaseInitialized] = useState(false);
  const scheme = useColorScheme();
  
  useEffect(() => {
    // إظهار شاشة البداية لمدة ثابتة فقط
    const splashTimeout = setTimeout(() => setShowSplash(false), 800);

    // فحص قاعدة البيانات وتهيئة الجداول في الخلفية
    const backgroundInit = async () => {
      try {
        const connectionTest = await testDatabaseConnection();
        if (!connectionTest) {
          console.error('فشل في اختبار الاتصال بقاعدة البيانات');
        }
        const result = await initializeDatabase();
        if (result.success) {
          setDatabaseInitialized(true);
        } else {
          console.error('فشل في تهيئة قاعدة البيانات:', result.error);
        }
      } catch (error) {
        console.error('خطأ في تهيئة التطبيق:', error);
      }
    };
    backgroundInit();

    return () => clearTimeout(splashTimeout);
  }, []);
  
  if (showSplash) return <SplashScreen />;
  
  return (
    <AuthProvider>
      <NavigationContainer theme={scheme === 'dark' ? darkTheme : lightTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
          <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
          <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
          <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
          <Stack.Screen name="StoreInfo" component={StoreInfoScreen} />
          <Stack.Screen name="StoreLocation" component={StoreLocationScreen} />
          <Stack.Screen name="StoreDocuments" component={StoreDocumentsScreen} />
          <Stack.Screen name="StoreMap" component={StoreMapScreen} />
          <Stack.Screen name="UpdateStoreLocation" component={UpdateStoreLocationScreen} />
          <Stack.Screen name="UnifiedPendingApproval" component={UnifiedPendingApprovalScreen} />
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
          <Stack.Screen name="StoreProfile" component={StoreInfoScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}
