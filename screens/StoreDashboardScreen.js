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
  Platform,
  Modal,
  TextInput,
  Button
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, storesAPI, pushNotificationsAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import colors from '../colors'; // تم تعطيله مؤقتاً
import { useAuth } from '../context/AuthContext';
import isEqual from 'lodash.isequal';
import pushNotificationSender from '../utils/pushNotificationSender';
const storeIcon = { uri: 'https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg' };

export default function StoreDashboardScreen({ navigation }) {
  const { logout } = useAuth();
  
  // معالجة أخطاء الشاشة
  const handleError = (error) => {
    console.error('خطأ في StoreDashboardScreen:', error);
    setLoading(false);
    Alert.alert('خطأ', 'حدث خطأ غير متوقع');
  };
  const [storeId, setStoreId] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchStoreId = async () => {
      const id = await AsyncStorage.getItem('userId');
      const numericId = id ? Number(id) : null;
      setStoreId(numericId);
      if (numericId) {
        loadStoreData(numericId); // هنا فقط setLoading
      } else {
        Alert.alert('لم يتم العثور على بيانات الحساب', 'يرجى تسجيل الدخول مرة أخرى', [
          { text: 'حسناً', onPress: () => navigation.replace('Login') }
        ]);
      }
    };
    fetchStoreId();

    // تحديث بيانات المتجر كل 5 ثواني مع مقارنة ذكية (تحديث صامت)
    const interval = setInterval(async () => {
      if (storeId) {
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', Number(storeId))
          .single();
        if (storeError) {
          console.error('[StoreDashboard] interval stores error:', storeError);
        }
        if (!storeError && !isEqual(storeInfo, store)) {
          setStoreInfo(store);
        }
        
        // جلب عدد الإشعارات غير المقروءة
        const { data: notifications, error: notificationsError } = await supabase
          .from('store_notifications')
          .select('*')
          .eq('store_id', Number(storeId))
          .eq('is_read', false);
        if (!notificationsError) {
          setUnreadNotifications(notifications?.length || 0);
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [storeId]);

  const loadStoreData = async (id) => {
    setLoading(true);
    try {
      // جلب بيانات المتجر من supabase
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', Number(id))
        .single();
      if (storeError) {
        console.error('[StoreDashboard] load stores error:', storeError);
      }
      // تحقق من حالة الحساب
      if (!store || store.is_active === false) {
        Alert.alert(
          'تم إيقاف الحساب',
          !store ? 'تعذر العثور على حسابك. سيتم تسجيل الخروج.' : 'تم إيقاف حساب المتجر من قبل الإدارة. يرجى التواصل مع الدعم.',
          [
            { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
          ]
        );
        setLoading(false);
        return;
      }
      setStoreInfo(store);
      
      // جلب طلبات المتجر من supabase
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', Number(id));
        
      if (ordersError) {
        console.error('[StoreDashboard] orders error:', ordersError);
        setOrders([]);
      } else {
        setOrders(ordersData || []);
      }
      
              // حساب الإحصائيات
        const orders = ordersData || [];
        
        // جلب عدد الإشعارات غير المقروءة
        const { data: notifications, error: notificationsError } = await supabase
          .from('store_notifications')
          .select('*')
          .eq('store_id', Number(id))
          .eq('is_read', false);
        if (!notificationsError) {
          setUnreadNotifications(notifications?.length || 0);
        }
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => order.status === 'pending').length;
      const completedOrders = orders.filter(order => order.status === 'completed').length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      
      setStats({ 
        totalOrders, 
        pendingOrders, 
        completedOrders, 
        totalRevenue 
      });
      
    } catch (error) {
      // في حالة الخطأ، استخدم بيانات افتراضية
      setStoreInfo({
        id: id,
        name: 'متجر تجريبي',
        phone: '+966501234567',
        email: 'store@example.com',
        address: 'عنوان تجريبي'
      });
      setOrders([]);
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
      });
    }
    setLoading(false);
  };

  const storeOptions = [
    {
      id: 'orders',
      title: 'الطلبات',
      icon: 'list-outline',
      color: '#2196F3',
      description: 'إدارة جميع الطلبات'
    },
    {
      id: 'new_order',
      title: 'طلب جديد',
      icon: 'add-circle-outline',
      color: '#4CAF50',
      description: 'إنشاء طلب جديد'
    },
    {
      id: 'profile',
      title: 'الملف الشخصي',
      icon: 'person-outline',
      color: '#FF9800',
      description: 'تعديل معلومات المتجر'
    },
    {
      id: 'notifications',
      title: 'الإشعارات',
      icon: 'notifications-outline',
      color: '#9C27B0',
      description: 'عرض الإشعارات والرسائل'
    }
  ];

  const handleOptionPress = (optionId) => {
    switch (optionId) {
      case 'orders':
        navigation.navigate('StoreOrders');
        break;
      case 'new_order':
        navigation.navigate('NewOrder');
        break;
      case 'profile':
        navigation.navigate('StoreProfile');
        break;
      case 'location':
        navigation.navigate('UpdateStoreLocation');
        break;
      case 'notifications':
        navigation.navigate('StoreNotifications');
        break;
      case 'support':
        navigation.navigate('StoreSupportChat');
        break;
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#666';
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

  // دالة تسجيل الخروج مع تأكيد
  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userType');
            logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const handleSendSupport = () => {
    // Implementation of handleSendSupport function
  };

  // دالة اختبار Push Notifications
  const testPushNotifications = async () => {
    try {
      Alert.alert(
        'اختبار Push Notifications',
        'اختر نوع الاختبار:',
        [
          {
            text: 'إشعار لجميع السائقين',
            onPress: async () => {
              try {
                const result = await pushNotificationSender.sendToAllDrivers(
                  'اختبار الإشعارات 🧪',
                  'هذا إشعار اختبار من المتجر للتأكد من عمل نظام Push Notifications',
                  { type: 'store_test', storeId: storeId, timestamp: new Date().toISOString() }
                );
                
                if (result.success) {
                  Alert.alert(
                    'نجح الاختبار! ✅',
                    `تم إرسال إشعارات لـ ${result.successCount} سائق من أصل ${result.totalCount}`
                  );
                } else {
                  Alert.alert('فشل الاختبار', result.error || 'حدث خطأ غير متوقع');
                }
              } catch (error) {
                Alert.alert('خطأ', 'حدث خطأ في إرسال الإشعارات: ' + error.message);
              }
            }
          },
          {
            text: 'إشعار لسائق واحد',
            onPress: async () => {
              // طلب معرف السائق
              Alert.prompt(
                'اختبار سائق واحد',
                'أدخل معرف السائق:',
                [
                  {
                    text: 'إلغاء',
                    style: 'cancel'
                  },
                  {
                    text: 'إرسال',
                    onPress: async (driverId) => {
                      if (driverId && driverId.trim()) {
                        try {
                          const result = await pushNotificationSender.sendToDriver(
                            parseInt(driverId.trim()),
                            'اختبار الإشعارات 🧪',
                            'هذا إشعار اختبار من المتجر',
                            { type: 'store_test', storeId: storeId, timestamp: new Date().toISOString() }
                          );
                          
                          if (result.success) {
                            Alert.alert('نجح الاختبار! ✅', 'تم إرسال الإشعار بنجاح');
                          } else {
                            Alert.alert('فشل الاختبار', result.error || 'حدث خطأ غير متوقع');
                          }
                        } catch (error) {
                          Alert.alert('خطأ', 'حدث خطأ في إرسال الإشعار: ' + error.message);
                        }
                      }
                    }
                  }
                ],
                'plain-text',
                '',
                'keyboard-type'
              );
            }
          },
          {
            text: 'إلغاء',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في اختبار الإشعارات: ' + error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل بيانات المتجر...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{backgroundColor: colors.primary, paddingTop: 40, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{padding: 8}}>
          <Ionicons name="menu" size={28} color={colors.secondary} />
        </TouchableOpacity>
        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <View style={{alignItems: 'center', marginRight: 12}}>
            <Text style={{color: colors.secondary, fontWeight: 'bold', fontSize: 18}}>{storeInfo?.name || 'اسم المتجر'}</Text>
            <Text style={{color: colors.secondary, fontSize: 14, opacity: 0.9}}>{storeInfo?.phone || 'رقم الهاتف'}</Text>
          </View>
          <Image source={storeIcon} style={{width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.secondary, marginHorizontal: 8}} />
        </View>
        {/* زر تسجيل الخروج */}
        <TouchableOpacity onPress={handleLogout} style={{marginLeft: 12, padding: 8}}>
          <Ionicons name="log-out-outline" size={26} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.totalOrders}</Text>
            <Text style={styles.statLabel}>إجمالي الطلبات</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>في الانتظار</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.completedOrders}</Text>
            <Text style={styles.statLabel}>مكتملة</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={32} color="#9C27B0" />
            <Text style={styles.statNumber}>{stats.totalRevenue}</Text>
            <Text style={styles.statLabel}>إجمالي المبيعات</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>أدوات المتجر</Text>
        
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('orders')}
            >
              <LinearGradient
                colors={['#2196F3', '#2196F3CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="list-outline" size={32} color={colors.secondary} />
                  <Text style={styles.optionTitle}>الطلبات</Text>
                  <Text style={styles.optionDescription}>إدارة جميع الطلبات</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('new_order')}
            >
              <LinearGradient
                colors={['#4CAF50', '#4CAF50CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="add-circle-outline" size={32} color={colors.secondary} />
                  <Text style={styles.optionTitle}>طلب جديد</Text>
                  <Text style={styles.optionDescription}>إنشاء طلب جديد</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('profile')}
            >
              <LinearGradient
                colors={['#FF9800', '#FF9800CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="person-outline" size={32} color={colors.secondary} />
                  <Text style={styles.optionTitle}>الملف الشخصي</Text>
                  <Text style={styles.optionDescription}>تعديل معلومات المتجر</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('notifications')}
            >
              <LinearGradient
                colors={['#9C27B0', '#9C27B0CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <View style={{ position: 'relative' }}>
                    <Ionicons name="notifications-outline" size={32} color={colors.secondary} />
                    {unreadNotifications > 0 && (
                      <View style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        backgroundColor: '#FF4444',
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 2,
                        borderColor: colors.secondary
                      }}>
                        <Text style={{
                          color: colors.secondary,
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}>
                          {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.optionTitle}>الإشعارات</Text>
                  <Text style={styles.optionDescription}>عرض الإشعارات والرسائل</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* صف جديد لزر اختبار الإشعارات */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={testPushNotifications}
            >
              <LinearGradient
                colors={['#FF5722', '#FF5722CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="notifications-circle-outline" size={32} color={colors.secondary} />
                  <Text style={styles.optionTitle}>اختبار الإشعارات</Text>
                  <Text style={styles.optionDescription}>اختبار نظام Push Notifications</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('support')}
            >
              <LinearGradient
                colors={['#607D8B', '#607D8BCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="help-circle-outline" size={32} color={colors.secondary} />
                  <Text style={styles.optionTitle}>الدعم الفني</Text>
                  <Text style={styles.optionDescription}>طلب مساعدة أو إبلاغ عن مشكلة</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>آخر الطلبات</Text>
        
        <View style={styles.recentOrders}>
          {orders.slice(0, 3).map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>طلب #{order.id}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{getOrderStatusText(order.status)}</Text>
                </View>
              </View>
              <Text style={styles.orderDetails}>{order.description || 'لا يوجد تفاصيل'}</Text>
              <Text style={styles.orderDate}>{`${new Date(order.created_at).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})} ${new Date(order.created_at).toLocaleTimeString('ar-IQ', {hour: '2-digit', minute: '2-digit'})}`}</Text>
              <Text style={styles.orderAmount}>المبلغ: {((order.amount || 0) / 1000).toFixed(2)} ألف دينار</Text>
            </View>
          ))}
          
          {orders.length === 0 && (
            <View style={styles.emptyOrders}>
              <Ionicons name="list-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>لا توجد طلبات بعد</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={supportModalVisible} transparent animationType="slide" onRequestClose={() => setSupportModalVisible(false)}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.3)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:colors.secondary,borderRadius:16,padding:24,width:'85%',maxWidth:400,alignItems:'center'}}>
            <Text style={{fontSize:18,fontWeight:'bold',color:colors.primary,marginBottom:12}}>الدعم الفني</Text>
            <Text style={{fontSize:15,color:colors.dark,marginBottom:16,textAlign:'center'}}>يمكنك مراسلة الدعم الفني لأي استفسار أو مشكلة.</Text>
            <TextInput
              style={{borderWidth:1,borderColor:colors.secondary,borderRadius:8,padding:10,width:'100%',marginBottom:16,textAlign:'right'}}
              placeholder="اكتب رسالتك هنا..."
              value={supportMessage}
              onChangeText={setSupportMessage}
              multiline
              numberOfLines={3}
            />
            <View style={{flexDirection:'row',justifyContent:'space-between',width:'100%'}}>
              <Button title="إغلاق" color={colors.primary} onPress={() => setSupportModalVisible(false)} />
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
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  storeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  storeText: {
    flex: 1,
  },
  storeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  storeSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  refreshButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  optionGradient: {
    padding: 20,
  },
  optionContent: {
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  recentOrders: {
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
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
    color: '#333',
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
    color: '#666',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
}); 