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
import { supabase, driversAPI, supportAPI, systemSettingsAPI, ordersAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';
import { useAuth } from '../context/AuthContext';
import isEqual from 'lodash.isequal';

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
  const [currentOrder, setCurrentOrder] = useState(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizCorrectAnswer, setQuizCorrectAnswer] = useState('');
  const [pendingOrderToAccept, setPendingOrderToAccept] = useState(null);
  const [quizOptions, setQuizOptions] = useState([]); // خيارات الأرقام
  const [quizTarget, setQuizTarget] = useState(null); // الرقم الثابت

  useEffect(() => {
    const fetchDriverId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setDriverId(id);
      if (id) {
        // تحميل سريع للبيانات الأساسية
        const { data: driver } = await supabase
          .from('drivers')
          .select('id, name, phone, is_active, status, is_suspended')
          .eq('id', id)
          .single();
        
        if (driver) {
          setDriverInfo(driver);
          setIsOnline(driver.is_active || false);
        }
        
        loadDriverData(id); // تحميل باقي البيانات
      }
    };
    fetchDriverId();

    // تحديث بيانات السائق كل 10 ثواني مع مقارنة ذكية (تحديث صامت)
    const interval = setInterval(async () => {
      if (driverId) {
        // جلب البيانات الجديدة بدون setLoading
        const { data: currentOrderDb } = await supabase
          .from('orders')
          .select('*')
          .eq('driver_id', driverId)
          .in('status', ['accepted', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!isEqual(currentOrder, currentOrderDb)) {
          setCurrentOrder(currentOrderDb || null);
        }
        if (!currentOrderDb) {
          const { data: availableOrdersData, error: availableOrdersError } = await ordersAPI.getAvailableOrders();
          if (!availableOrdersError && !isEqual(availableOrders, availableOrdersData)) {
            setAvailableOrders(availableOrdersData || []);
          }
        }
        // لا يوجد setLoading هنا إطلاقًا
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [driverId, currentOrder, availableOrders]);

  useEffect(() => {
    const fetchSettings = async () => {
      // تحميل الإعدادات في الخلفية بدون إظهار شاشة التحميل
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
    // لا نضع setLoading(true) هنا لأن البيانات الأساسية تم تحميلها مسبقاً
    try {
      console.log('Loading driver data for ID:', id);
      
      // جلب بيانات السائق من supabase (إذا لم تكن متوفرة مسبقاً)
      if (!driverInfo) {
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
        
        setDriverInfo(driver);
        setIsOnline(driver?.is_active || false);
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
      
      // جلب الطلبات المرتبطة بالسائق (تحميل سريع)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', id)
        .limit(10); // تحديد عدد الطلبات للتحميل السريع
        
      console.log('Orders data result:', { ordersData, ordersError });
      
      if (ordersError) {
        console.error('Orders error:', ordersError);
        setAvailableOrders([]);
        setMyOrders([]);
      } else {
        setAvailableOrders(ordersData || []);
        setMyOrders(ordersData || []);
      }

      // جلب الطلب الجاري من قاعدة البيانات (تحميل سريع)
      const { data: currentOrderDb } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', id)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (currentOrderDb) {
        setCurrentOrder(currentOrderDb);
        setAvailableOrders([]); // لا تعرض الطلبات المتاحة إذا كان هناك طلب جاري
      } else {
        setCurrentOrder(null);
        // جلب الطلبات المتاحة كالمعتاد (تحميل سريع)
        const { data: availableOrdersData, error: availableOrdersError } = await ordersAPI.getAvailableOrders();
        if (availableOrdersError) {
          setAvailableOrders([]);
        } else {
          setAvailableOrders(availableOrdersData || []);
        }
      }
      
      // حساب الإحصائيات (تحميل سريع)
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

  // دالة توليد اختبار رقم ثابت مع خيارات
  const generateQuiz = () => {
    // توليد رقم ثابت بين 1 و10 فقط
    const target = Math.floor(Math.random() * 10) + 1;
    // توليد رقمين متشابهين (من 1 إلى 10، ولا يساويان الرقم الصحيح)
    let option2, option3;
    do {
      option2 = Math.floor(Math.random() * 10) + 1;
    } while (option2 === target);
    do {
      option3 = Math.floor(Math.random() * 10) + 1;
    } while (option3 === target || option3 === option2);
    // تجميع الخيارات وترتيبها عشوائيًا
    let options = [target, option2, option3];
    options = options.sort(() => Math.random() - 0.5);
    setQuizTarget(target);
    setQuizOptions(options);
    setQuizAnswer('');
  };

  // دالة قبول الطلب
  const handleAcceptOrder = (order) => {
    setPendingOrderToAccept(order);
    generateQuiz();
    setQuizModalVisible(true);
  };
  // دالة إكمال الطلب مع إشعار المتجر
  const handleFinishOrder = async () => {
    if (!currentOrder) return;
        setLoading(true);
    try {
      // تحديث حالة الطلب
      await supabase.from('orders').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', currentOrder.id);
      // إرسال إشعار للمتجر
      if (currentOrder.store_id) {
        await supabase.from('store_notifications').insert({
          store_id: currentOrder.store_id,
          title: 'تم إكمال الطلب',
          message: `تم إكمال طلبك رقم ${currentOrder.id} من قبل السائق.`,
          type: 'order',
          created_at: new Date().toISOString()
        });
      }
      // تحديث إحصائيات السائق
      if (driverId) {
        const { data: driver } = await supabase.from('drivers').select('total_orders, completed_orders, completed_orders_list').eq('id', driverId).single();
        const total_orders = (driver?.total_orders || 0) + 1;
        const completed_orders = (driver?.completed_orders || 0) + 1;
        // إضافة الطلب المكتمل إلى القائمة
        let completed_orders_list = Array.isArray(driver?.completed_orders_list) ? [...driver.completed_orders_list] : [];
        completed_orders_list.unshift({
          id: currentOrder.id,
          amount: currentOrder.total_amount,
          address: currentOrder.address,
          date: new Date().toLocaleString()
        });
        // احتفظ فقط بآخر 100 طلب مكتمل (اختياري)
        if (completed_orders_list.length > 100) completed_orders_list = completed_orders_list.slice(0, 100);
        await supabase.from('drivers').update({ total_orders, completed_orders, completed_orders_list }).eq('id', driverId);
      }
      // حذف الطلب من قاعدة البيانات
      // await supabase.from('orders').delete().eq('id', currentOrder.id); // This line is removed
        setCurrentOrder(null);
      await loadDriverData(driverId); // إعادة تحميل بيانات السائق
        setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('خطأ', 'حدث خطأ أثناء إكمال الطلب');
    }
  };

  // دالة تنفيذ القبول بعد اجتياز الاختبار
  const handleQuizOptionPress = async (selected) => {
    if (selected === quizTarget) {
      setQuizModalVisible(false);
      setLoading(true);
      try {
        // تحديث الطلب وتعيين السائق
        await supabase.from('orders').update({ status: 'accepted', driver_id: driverId }).eq('id', pendingOrderToAccept.id);
        // زيادة نقطة للسائق
        await supabase.from('drivers').update({ debt_points: (driverInfo?.debt_points || 0) + 1 }).eq('id', driverId);
        setCurrentOrder(pendingOrderToAccept);
        setLoading(false);
        Alert.alert('تم قبول الطلب', 'تم تعيين الطلب لك بنجاح!');
      } catch (error) {
        setLoading(false);
        Alert.alert('خطأ', 'حدث خطأ أثناء قبول الطلب');
      }
    } else {
      Alert.alert('إجابة خاطئة', 'يرجى المحاولة مرة أخرى');
    }
  };

  // عرض شاشة التحميل فقط إذا لم تكن البيانات الأساسية متوفرة
  // إزالة شاشة التحميل:
  // احذف شرط if (loading && !driverInfo) { ... }
  // في عناصر الواجهة:
  // استخدم driverInfo?.name || 'اسم السائق'، driverInfo?.phone || '---'، ...
  // في القوائم:
  // إذا لم تتوفر البيانات بعد، اعرض عناصر فارغة أو نصوص افتراضية.



  return (
    <View style={{flex:1, backgroundColor:'#fff'}}>
      {/* الشريط العلوي */}
      <View style={{backgroundColor: colors.primary, paddingTop: 40, paddingBottom: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={{padding: 8}}>
          <Ionicons name="menu" size={28} color={colors.secondary} />
        </TouchableOpacity>
        <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
          <View style={{alignItems: 'center', marginRight: 12}}>
            <Text style={{color: colors.secondary, fontWeight: 'bold', fontSize: 18}}>{driverInfo?.name || 'اسم السائق'}</Text>
            <Text style={{color: colors.secondary, fontSize: 14, opacity: 0.9}}>{driverInfo?.phone || '---'}</Text>
          </View>
          <Image source={{ uri: 'https://i.ibb.co/svdQ0fdc/IMG-20250623-233435-969.jpg' }} style={{width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.secondary, marginHorizontal: 8}} />
        </View>
        <TouchableOpacity onPress={handleLogout} style={{padding: 8}}>
          <Ionicons name="log-out-outline" size={26} color={colors.secondary} />
        </TouchableOpacity>
      </View>
      {/* معلومات السائق */}
      <View style={{backgroundColor:'#fff', flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:8, borderBottomWidth:1, borderColor:'#F5F5F5'}}>
        <Text style={{color:colors.primary, fontWeight:'bold'}}>غير متصل</Text>
        <Text style={{color:'#222'}}>الحالة - {isAvailable ? 'متوفر' : 'غير متوفر'}</Text>
      </View>
      {/* محتوى الشاشة */}
      {currentOrder ? (
        // إذا كان هناك طلب جاري، اعرضه فقط
        <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:16}}>
          <Text style={{fontWeight:'bold', fontSize:18, marginBottom:12}}>طلب جاري</Text>
          <View style={{backgroundColor:'#F5F5F5', borderRadius:12, padding:16, width:'100%', marginBottom:16}}>
            {currentOrder.store_id ? (
            <Text>المتجر: {currentOrder.stores?.name || 'غير محدد'}</Text>
            ) : (
              <>
                <Text>من: {currentOrder.pickup_address || 'غير محدد'}</Text>
                <Text>إلى: {currentOrder.delivery_address || 'غير محدد'}</Text>
              </>
            )}
            <Text>المبلغ: {currentOrder.total_amount || 0} دينار</Text>
            <Text>العنوان: {currentOrder.delivery_address || currentOrder.address || 'غير محدد'}</Text>
            {currentOrder.customer_phone && (
              <Text>هاتف الزبون: {currentOrder.customer_phone}</Text>
            )}
            {currentOrder.extra_details && (
              <Text style={{marginTop:8, color:'#555'}}>تفاصيل إضافية: {currentOrder.extra_details}</Text>
            )}
          </View>
          {/* الزر في واجهة الطلب الجاري */}
          <TouchableOpacity onPress={handleFinishOrder} style={{backgroundColor:colors.primary, borderRadius:8, padding:12, alignItems:'center', width:'100%'}}>
            <Text style={{color:'#fff', fontWeight:'bold'}}>اكمال الطلب</Text>
          </TouchableOpacity>
        </View>
      ) : isAvailable ? (
        // إذا لم يكن هناك طلب جاري، اعرض الطلبات المتاحة فقط
        <ScrollView style={{flex:1}} contentContainerStyle={{padding:16}}>
          {availableOrders.length === 0 ? (
            <View style={{flex:1, justifyContent:'center', alignItems:'center', minHeight: 400}}>
              <Ionicons name="list-outline" size={64} color={colors.primary} />
              <Text style={{fontSize:18, color:'#222', marginTop:16}}>لا يوجد طلبات متاحة حاليًا</Text>
            </View>
          ) : (
            <>
              {availableOrders.map(order => (
                <View key={order.id} style={{backgroundColor:'#F5F5F5', borderRadius:12, padding:16, marginBottom:16}}>
                {order.store_id ? (
                  <>
                    <Text>العنوان: {order.delivery_address || order.address || 'غير محدد'}</Text>
                    <Text>المتجر: {order.stores?.name || 'غير محدد'}</Text>
                  </>
                ) : (
                  // إذا كان الطلب من الأدمن
                  <>
                    <Text>من: {order.pickup_address || 'غير محدد'}</Text>
                    <Text>إلى: {order.delivery_address || 'غير محدد'}</Text>
                  </>
                )}
                  <TouchableOpacity 
                    style={{marginTop:12, backgroundColor:currentOrder ? '#ccc' : colors.primary, borderRadius:8, padding:10, alignItems:'center'}} 
                    onPress={()=>!currentOrder && handleAcceptOrder(order)}
                    disabled={!!currentOrder}
                  >
                    <Text style={{color:'#fff', fontWeight:'bold'}}>قبول الطلب</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      ) : (
        // إذا لم يكن متوفر، تظهر رسالة الحالة مع أزرار التحويل
        <>
        <Text style={{fontSize:18, color:'#222', textAlign:'center', marginBottom:24, fontWeight:'bold'}}>
          يرجى تحويل حالتك إلى متوفر لاستقبال طلبات جديدة
        </Text>
        <View style={{flexDirection:'row', backgroundColor:'#F5F5F5', borderRadius:24, overflow:'hidden', marginTop:8}}>
          <TouchableOpacity
            style={{paddingVertical:10, paddingHorizontal:32, backgroundColor: isAvailable ? colors.primary : '#fff'}}
              onPress={async ()=>{
                if (!isBlocked) {
                  setLoading(true);
                  await supabase.from('drivers').update({ is_active: true }).eq('id', driverId);
                  setIsOnline(true);
                  setLoading(false);
                }
              }}
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
        </>
      )}
      <Modal
        visible={quizModalVisible}
        transparent
        animationType="slide"
        onRequestClose={()=>setQuizModalVisible(false)}
      >
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.3)'}}>
          <View style={{backgroundColor:'#fff', borderRadius:16, padding:24, width:'80%', alignItems:'center'}}>
            <Text style={{fontSize:18, fontWeight:'bold', marginBottom:16}}>اختبار بسيط قبل قبول الطلب</Text>
            <Text style={{fontSize:16, marginBottom:16}}>اختر الرقم المطابق للرقم التالي:</Text>
            <Text style={{fontSize:28, fontWeight:'bold', marginBottom:24, color:colors.primary}}>{quizTarget}</Text>
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
              {quizOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{backgroundColor:'#F5F5F5', borderRadius:8, padding:16, marginHorizontal:6, minWidth:60, alignItems:'center', borderWidth:1, borderColor:'#ccc'}}
                  onPress={()=>handleQuizOptionPress(opt)}
                >
                  <Text style={{fontSize:22, fontWeight:'bold'}}>{opt}</Text>
            </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={{marginTop:24}} onPress={()=>setQuizModalVisible(false)}>
              <Text style={{color:colors.danger}}>إلغاء</Text>
            </TouchableOpacity>
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

}); 