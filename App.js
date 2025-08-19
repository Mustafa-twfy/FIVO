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
import UnifiedStoreRegistrationScreen from './screens/UnifiedStoreRegistrationScreen';
import StoreInfoScreen from './screens/StoreInfoScreen';
import StoreDocumentsScreen from './screens/StoreDocumentsScreen';
import StorePendingApprovalScreen from './screens/StorePendingApprovalScreen';
import UpdateStoreLocationScreen from './screens/UpdateStoreLocationScreen';
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
import UnifiedPendingApprovalScreen from './screens/UnifiedPendingApprovalScreen';

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
      <Stack.Screen name="UnifiedStoreRegistration" component={UnifiedStoreRegistrationScreen} />
      <Stack.Screen name="StoreInfoScreen" component={StoreInfoScreen} />
      <Stack.Screen name="StoreDocuments" component={StoreDocumentsScreen} />
      <Stack.Screen name="StorePendingApproval" component={StorePendingApprovalScreen} />
      <Stack.Screen name="UpdateStoreLocation" component={UpdateStoreLocationScreen} />
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
          if (session.sessionExpiry && new Date() < new Date(session.sessionExpiry)) {
            await login(session.user, session.userType, session.sessionExpiry);
            if (session.userType === 'admin') setInitialRoute('AdminDashboard');
            else if (session.userType === 'driver') setInitialRoute('Driver');
            else if (session.userType === 'store') setInitialRoute('Store');
            return;
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

    const backgroundInit = async () => {
      try {
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

  if (loading || showSplash || !databaseInitialized) return <LoginScreen />;

  return (
    <>
      <NavigationContainer theme={scheme === 'dark' ? darkTheme : lightTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="DriverRegistration" component={DriverRegistrationScreen} />
          <Stack.Screen name="DriverDocuments" component={DriverDocumentsScreen} />
          <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
          <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
          <Stack.Screen name="UnifiedStoreRegistration" component={UnifiedStoreRegistrationScreen} />
          <Stack.Screen name="StoreInfoScreen" component={StoreInfoScreen} />
          <Stack.Screen name="StoreDocuments" component={StoreDocumentsScreen} />
          <Stack.Screen name="StorePendingApproval" component={StorePendingApprovalScreen} />
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
