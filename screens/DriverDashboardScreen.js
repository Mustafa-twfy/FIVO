import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Button
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, driversAPI, supportAPI, systemSettingsAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';
import illustration from '../assets/driver-illustration.png'; // استخدم صورة افتراضية أو أضف صورتك
import { useAuth } from '../context/AuthContext';

export default function DriverDashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [driverId, setDriverId] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    todayEarnings: 0
  });
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [debtPointValue, setDebtPointValue] = useState(250);
  const [maxDebtPoints, setMaxDebtPoints] = useState(20);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchDriverId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setDriverId(id);
      if (id) loadDriverData(id);
    };
    fetchDriverId();
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      const { data, error } = await systemSettingsAPI.getSystemSettings();
      if (data) {
        setDebtPointValue(data.debt_point_value);
        setMaxDebtPoints(data.max_debt_points);
      }
      setSettingsLoading(false);
    };
    fetchSettings();
  }, []);

  const loadDriverData = async (id) => {
    setLoading(true);
    try {
      console.log('Loading driver data for ID:', id);
      
      // جلب بيانات السائق من supabase
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();
        
      console.log('Driver data result:', { driver, driverError });
      
      // تحقق من حالة الحساب
      if (!driver || driver.is_suspended || driver.status !== 'approved') {
        Alert.alert(
          'تم إيقاف الحساب',
          driver?.is_suspended
            ? 'تم إيقاف حسابك من قبل الإدارة. يرجى التواصل مع الدعم.'
            : driver?.status !== 'approved'
              ? 'حسابك غير مفعل أو بانتظار الموافقة. سيتم تسجيل الخروج.'
              : 'تعذر العثور على حسابك. سيتم تسجيل الخروج.',
          [
            { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
          ]
        );
        setLoading(false);
        return;
      }
      
      if (driverError) {
        console.error('Driver error:', driverError);
        // إذا لم يتم العثور على السائق، استخدم بيانات افتراضية
        setDriverInfo({
          id: id,
          name: 'سائق تجريبي',
          phone: '+966501234567',
          email: 'driver@example.com',
          is_active: false
        });
        setIsOnline(false);
      } else if (driver) {
        setDriverInfo(driver);
        setIsOnline(driver?.is_active || false);
      } else {
        // بيانات افتراضية
        setDriverInfo({
          id: id,
          name: 'سائق تجريبي',
          phone: '+966501234567',
          email: 'driver@example.com',
          is_active: false
        });
        setIsOnline(false);
      }
      
      // جلب الطلبات المرتبطة بالسائق
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', id);
        
      console.log('Orders data result:', { ordersData, ordersError });
      
      if (ordersError) {
        console.error('Orders error:', ordersError);
        setAvailableOrders([]);
        setMyOrders([]);
      } else {
        setAvailableOrders(ordersData || []);
        setMyOrders(ordersData || []);
      }
      
      // حساب الإحصائيات
      const orders = ordersData || [];
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const today = new Date().toISOString().substring(0, 10);
      const todayEarnings = orders.filter(order => (order.actual_delivery_time || '').substring(0, 10) === today).reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      setStats({ 
        totalOrders, 
        pendingOrders, 
        completedOrders, 
        totalRevenue, 
        todayEarnings 
      });
      
    } catch (error) {
      console.error('Load driver data error:', error);
      // في حالة الخطأ، استخدم بيانات افتراضية
      setDriverInfo({
        id: id,
        name: 'سائق تجريبي',
        phone: '+966501234567',
        email: 'driver@example.com',
        is_active: false
      });
      setIsOnline(false);
      setAvailableOrders([]);
      setMyOrders([]);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        todayEarnings: 0
      });
    }
    setLoading(false);
  };

  const toggleOnlineStatus = async (value) => {
    setIsOnline(value);
    try {
      await supabase
        .from('drivers')
        .update({ is_active: value })
        .eq('id', driverInfo?.id);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحديث حالة العمل');
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          driver_id: driverInfo?.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        Alert.alert('خطأ', 'فشل في قبول الطلب');
      } else {
        Alert.alert('نجح', 'تم قبول الطلب بنجاح');
        loadDriverData(driverId); // إعادة تحميل البيانات
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
  };

  const completeOrder = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        Alert.alert('خطأ', 'فشل في إكمال الطلب');
      } else {
        Alert.alert('نجح', 'تم إكمال الطلب بنجاح');
        loadDriverData(driverId); // إعادة تحميل البيانات
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
  };

  const handleOptionPress = (optionId) => {
    switch (optionId) {
      case 'available_orders':
        navigation.navigate('AvailableOrders');
        break;
      case 'my_orders':
        navigation.navigate('MyOrders');
        break;
      case 'earnings':
        navigation.navigate('DriverEarnings');
        break;
      case 'profile':
        navigation.navigate('DriverProfile');
        break;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.primary;
      case 'accepted': return colors.success;
      case 'completed': return colors.info;
      case 'cancelled': return colors.danger;
      default: return colors.dark;
    }
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'accepted': return 'مقبول';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return 'غير محدد';
    }
  };

  // دالة تسجيل الخروج
  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userType');
    navigation.replace('Login');
  };

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) return;
    setLoading(true);
    const { error } = await supportAPI.sendSupportMessage('driver', driverId, supportMessage.trim(), 'user');
    if (!error) {
      Alert.alert('تم الإرسال', 'تم إرسال رسالتك للدعم الفني بنجاح');
      setSupportMessage('');
      setSupportModalVisible(false);
    } else {
      Alert.alert('خطأ', 'تعذر إرسال الرسالة');
    }
    setLoading(false);
  };

  // دالة للتحقق من الوقت الحالي ضمن أوقات الدوام
  function isWithinWorkHours() {
    if (!driverInfo?.work_start_time || !driverInfo?.work_end_time) return true; // إذا لم يتم تحديد أوقات الدوام اعتبره متاح
    const now = new Date();
    const [startH, startM] = driverInfo.work_start_time.split(':').map(Number);
    const [endH, endM] = driverInfo.work_end_time.split(':').map(Number);
    const start = new Date(now);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(now);
    end.setHours(endH, endM, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1); // دعم الدوام الليلي
    return now >= start && now <= end;
  }
  const isOutOfWorkHours = !isWithinWorkHours();
  const isBlocked = driverInfo?.is_suspended || (driverInfo?.debt_points >= maxDebtPoints) || isOutOfWorkHours;
  const isAvailable = isOnline && !isBlocked;

  if (settingsLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل الإعدادات...</Text>
      </View>
    );
  }

  // شاشة فارغة إذا لم توجد طلبات متاحة
  if (availableOrders.length === 0) {
    return (
      <View style={[styles.container, {justifyContent: 'flex-start', backgroundColor: '#fff'}]}>
        {/* Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={26} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.profileCircle}>
            <Ionicons name="person" size={38} color={colors.primary} />
          </View>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.headerIcon}>
            <Ionicons name="menu" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {/* حالة السائق */}
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>{isOnline ? 'متاح' : 'غير متاح'}</Text>
          <View style={[styles.statusDot, {backgroundColor: isOnline ? '#4CAF50' : '#bbb'}]} />
        </View>
        {/* محتوى فارغ */}
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="list-outline" size={54} color={colors.primary} />
          </View>
          <Text style={styles.emptyText}>لا يوجد طلبات</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{flex:1, backgroundColor:'#fff'}}>
      {/* الشريط العلوي */}
      <View style={{backgroundColor: colors.primary, paddingTop: 40, paddingBottom: 12, paddingHorizontal: 16, flexDirection:'row', alignItems:'center', justifyContent:'space-between'}}>
        <View style={{flexDirection:'row', alignItems:'center'}}>
          <Ionicons name="mail-outline" size={22} color="#fff" style={{marginHorizontal:4}} />
          <Ionicons name="notifications-outline" size={22} color="#fff" style={{marginHorizontal:4}} />
          <Ionicons name="pause-circle" size={22} color="#fff" style={{marginHorizontal:4}} />
          <Ionicons name="wifi" size={22} color="#fff" style={{marginHorizontal:4}} />
        </View>
        <TouchableOpacity onPress={()=>navigation.openDrawer()}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* معلومات السائق */}
      <View style={{backgroundColor:'#fff', flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:8, borderBottomWidth:1, borderColor:'#F5F5F5'}}>
        <Text style={{color:colors.primary, fontWeight:'bold'}}>غير متصل</Text>
        <Text style={{color:'#222'}}>الحالة - {isAvailable ? 'متوفر' : 'غير متوفر'}</Text>
        <Text style={{color:'#222'}}>سعة السائق: {driverInfo?.capacity || 50}</Text>
      </View>
      {/* محتوى الشاشة */}
      <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:24}}>
        <Image source={illustration} style={{width:180, height:180, resizeMode:'contain', marginBottom:24}} />
        <Text style={{fontSize:18, color:'#222', textAlign:'center', marginBottom:24, fontWeight:'bold'}}>
          يرجى تحويل حالتك إلى متوفر لاستقبال طلبات جديدة
        </Text>
        <View style={{flexDirection:'row', backgroundColor:'#F5F5F5', borderRadius:24, overflow:'hidden', marginTop:8}}>
          <TouchableOpacity
            style={{paddingVertical:10, paddingHorizontal:32, backgroundColor: isAvailable ? colors.primary : '#fff'}}
            onPress={()=>!isBlocked && setIsOnline(true)}
            disabled={isBlocked}
          >
            <Text style={{color: isAvailable ? '#fff' : colors.primary, fontWeight:'bold'}}>متوفر</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{paddingVertical:10, paddingHorizontal:32, backgroundColor: !isAvailable ? colors.primary : '#fff'}}
            onPress={()=>setIsOnline(false)}
          >
            <Text style={{color: !isAvailable ? '#fff' : colors.primary, fontWeight:'bold'}}>غير متوفر</Text>
          </TouchableOpacity>
        </View>
        {isBlocked && (
          <Text style={{color:colors.danger, marginTop:24, fontWeight:'bold', textAlign:'center'}}>
            تم إيقافك مؤقتًا بسبب تجاوز حد الديون. يرجى تصفير الديون للعودة للعمل.
          </Text>
        )}
        {isOutOfWorkHours && (
          <Text style={{color:colors.warning, marginTop:24, fontWeight:'bold', textAlign:'center'}}>
            أنت خارج أوقات العمل المحددة من الإدارة. يرجى الالتزام بجدول الدوام.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, backgroundColor: colors.secondary },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  content: { flex: 1, padding: 20, backgroundColor: colors.secondary },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  welcomeCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeGradient: {
    padding: 24,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.secondary,
    opacity: 0.9,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  availableOrders: {
    marginBottom: 16,
  },
  myOrders: {
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDetails: {
    fontSize: 16,
    color: colors.dark,
    marginBottom: 12,
    lineHeight: 22,
  },
  orderAddress: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  orderAmount: {
    fontSize: 18,
    color: colors.success,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: colors.success,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: colors.info,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    color: colors.dark,
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  warningCard: {
    backgroundColor: colors.dangerGradient[1],
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
    marginTop: 12,
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: colors.warningGradient[1],
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  alertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
    marginTop: 12,
    lineHeight: 22,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerIcon: {
    padding: 6,
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginRight: 8,
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e0f7fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
}); 