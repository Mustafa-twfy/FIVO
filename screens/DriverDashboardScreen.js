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

export default function DriverDashboardScreen({ navigation }) {
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

  if (settingsLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل الإعدادات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{padding: 8}}>
          <Ionicons name="menu" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <View style={{alignItems: 'center', marginRight: 12}}>
            <Text style={styles.headerTitle}>{driverInfo?.name || 'اسم السائق'}</Text>
            <Text style={{color: colors.primary, fontSize: 14, opacity: 0.9}}>{driverInfo?.phone || 'رقم الهاتف'}</Text>
          </View>
          <Image source={{ uri: 'https://i.ibb.co/svdQ0fdc/IMG-20250623-233435-969.jpg' }} style={{width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.primary, marginHorizontal: 8}} />
          <TouchableOpacity onPress={() => setSupportModalVisible(true)} style={{marginLeft: 8}}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={{alignItems: 'center'}}>
          <Text style={{color: colors.primary, fontSize: 13}}>متاح</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#767577', true: '#fff' }}
            thumbColor={isOnline ? colors.primary : '#f4f3f4'}
          />
        </View>
        {/* زر تسجيل الخروج */}
        <TouchableOpacity onPress={handleLogout} style={{marginLeft: 12, padding: 8}}>
          <Ionicons name="log-out-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={32} color={colors.info} />
            <Text style={styles.statNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>إجمالي الطلبات</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color={colors.success} />
            <Text style={styles.statNumber}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>مكتملة</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={32} color={colors.secondary} />
            <Text style={styles.statNumber}>{stats.totalEarnings}</Text>
            <Text style={styles.statLabel}>إجمالي الأرباح</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="card-outline" size={32} color={colors.primary} />
            <Text style={styles.statNumber}>{driverInfo?.debt_points || 0}</Text>
            <Text style={styles.statLabel}>نقاط الديون</Text>
          </View>
        </View>

        {driverInfo?.debt_points >= maxDebtPoints && (
          <View style={styles.warningCard}>
            <Ionicons name="warning-outline" size={24} color={colors.danger} />
            <Text style={styles.warningText}>
              لا يمكنك العمل - تجاوزت الحد الأقصى للنقاط ({maxDebtPoints} نقطة = {maxDebtPoints * debtPointValue} دينار)
            </Text>
          </View>
        )}

        {driverInfo?.debt_points >= maxDebtPoints / 2 && driverInfo?.debt_points < maxDebtPoints && (
          <View style={styles.alertCard}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
            <Text style={styles.alertText}>
              تحذير: اقتربت من الحد الأقصى للنقاط ({driverInfo?.debt_points}/{maxDebtPoints} = {(driverInfo?.debt_points || 0) * debtPointValue} دينار)
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>الطلبات المتاحة الآن</Text>
        
        <View style={styles.availableOrders}>
          {availableOrders.slice(0, 3).map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>طلب #{order.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getOrderStatusText(order.status)}</Text>
                </View>
              </View>
              <Text style={styles.orderDetails}>{order.description || 'لا يوجد تفاصيل'}</Text>
              <Text style={styles.orderAddress}>العنوان: {order.address || 'غير محدد'}</Text>
              <Text style={styles.orderAmount}>المبلغ: {order.amount || 0} ألف دينار</Text>
              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => acceptOrder(order.id)}
              >
                <Text style={styles.acceptButtonText}>قبول الطلب</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {availableOrders.length === 0 && (
            <View style={styles.emptyOrders}>
              <Ionicons name="list-outline" size={64} color={colors.primary} />
              <Text style={styles.emptyText}>لا توجد طلبات متاحة حالياً</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>طلباتي الحالية</Text>
        
        <View style={styles.myOrders}>
          {myOrders.slice(0, 2).map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>طلب #{order.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getOrderStatusText(order.status)}</Text>
                </View>
              </View>
              <Text style={styles.orderDetails}>{order.description || 'لا يوجد تفاصيل'}</Text>
              <Text style={styles.orderAddress}>العنوان: {order.address || 'غير محدد'}</Text>
              <Text style={styles.orderAmount}>المبلغ: {order.amount || 0} ألف دينار</Text>
              {order.status === 'accepted' && (
                <TouchableOpacity 
                  style={styles.completeButton}
                  onPress={() => completeOrder(order.id)}
                >
                  <Text style={styles.completeButtonText}>إكمال الطلب</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          {myOrders.length === 0 && (
            <View style={styles.emptyOrders}>
              <Ionicons name="car-outline" size={64} color={colors.primary} />
              <Text style={styles.emptyText}>لا توجد طلبات حالية</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={supportModalVisible} transparent animationType="slide" onRequestClose={() => setSupportModalVisible(false)}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.3)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:colors.primary,borderRadius:16,padding:24,width:'85%',maxWidth:400,alignItems:'center'}}>
            <Text style={{fontSize:18,fontWeight:'bold',color:colors.secondary,marginBottom:12}}>الدعم الفني</Text>
            <Text style={{fontSize:15,color:colors.dark,marginBottom:16,textAlign:'center'}}>يمكنك مراسلة الدعم الفني لتصفير النقاط أو أي استفسار آخر.</Text>
            <TextInput
              style={{borderWidth:1,borderColor:colors.primary,borderRadius:8,padding:10,width:'100%',marginBottom:16,textAlign:'right'}}
              placeholder="اكتب رسالتك هنا..."
              value={supportMessage}
              onChangeText={setSupportMessage}
              multiline
              numberOfLines={3}
            />
            <View style={{flexDirection:'row',justifyContent:'space-between',width:'100%'}}>
              <Button title="إلغاء" color={colors.primary} onPress={() => setSupportModalVisible(false)} />
              <Button title="إرسال" color={colors.secondary} onPress={handleSendSupport} />
            </View>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 4,
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
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
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
    fontSize: 14,
    color: colors.secondary,
    marginBottom: 8,
  },
  orderAddress: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  acceptButton: {
    backgroundColor: colors.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: colors.info,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.secondary,
    marginTop: 16,
  },
  warningCard: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warningText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  alertCard: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
}); 