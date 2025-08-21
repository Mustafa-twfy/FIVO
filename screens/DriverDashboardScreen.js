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
  Button,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, driversAPI, supportAPI, systemSettingsAPI, ordersAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';
import { useAuth } from '../context/AuthContext';
import isEqual from 'lodash.isequal';

export default function DriverDashboardScreen({ navigation }) {
  const { logout, user, userType } = useAuth();
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
  const [supportLoading, setSupportLoading] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isUpdatingOnline, setIsUpdatingOnline] = useState(false);
  const [lastOnlineUpdate, setLastOnlineUpdate] = useState(0);

  useEffect(() => {
    const initializeDriver = async () => {
      try {
        console.log('=== بداية تهيئة بيانات السائق ===');
        console.log('AuthContext user:', user);
        console.log('AuthContext userType:', userType);
        
        // التحقق من نوع المستخدم أولاً
        if (userType !== 'driver') {
          console.error('نوع المستخدم غير صحيح:', userType);
          Alert.alert(
            'خطأ في نوع المستخدم',
            'يجب أن تكون سائق للوصول لهذه الشاشة. سيتم تسجيل الخروج.',
            [
              { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
            ]
          );
          return;
        }
        
        // استخدام البيانات من AuthContext
        if (user && user.id) {
          console.log('استخدام بيانات السائق من AuthContext');
          const driverIdNumber = parseInt(user.id);
          console.log('معرف السائق (رقم):', driverIdNumber);
          setDriverId(driverIdNumber);
          setDriverInfo(user);
          setIsOnline(user.is_active || false);
          
                  // تحميل باقي البيانات من قاعدة البيانات
        await loadDriverData(driverIdNumber);
        
        // جلب عدد الإشعارات غير المقروءة
        const { data: notifications, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('driver_id', driverIdNumber)
          .eq('is_read', false);
        if (!notificationsError) {
          setUnreadNotifications(notifications?.length || 0);
        }
        } else {
          console.error('لم يتم العثور على بيانات السائق في AuthContext');
          Alert.alert(
            'خطأ في البيانات',
            'لم يتم العثور على بيانات السائق. سيتم تسجيل الخروج.',
            [
              { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
            ]
          );
        }
      } catch (error) {
        console.error('خطأ في تهيئة السائق:', error);
        Alert.alert(
          'خطأ',
          'حدث خطأ في تحميل بيانات السائق. سيتم تسجيل الخروج.',
          [
            { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
          ]
        );
      }
    };

    initializeDriver();

    // تحديث بيانات السائق كل 10 ثواني مع مقارنة ذكية (تحديث صامت)
    const interval = setInterval(async () => {
      if (driverId && !isUpdatingOnline) {
        // جلب البيانات الجديدة بدون setLoading
        const { data: currentOrderDb } = await supabase
          .from('orders')
          .select('*')
          .eq('driver_id', parseInt(driverId))
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
        
        // تحديث عدد الإشعارات غير المقروءة
        const { data: notifications, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('driver_id', driverId)
          .eq('is_read', false);
        if (!notificationsError) {
          setUnreadNotifications(notifications?.length || 0);
        }
        
        // تحديث بيانات السائق بدون تعديل حالة is_active إذا كان المستخدم يقوم بالتحديث
        const { data: driverData } = await supabase
          .from('drivers')
          .select('*')
          .eq('id', parseInt(driverId))
          .single();
        
        if (driverData && !isUpdatingOnline) {
          setDriverInfo(prev => {
            if (!isEqual(prev, driverData)) {
              // فقط تحديث is_active إذا لم يكن هناك تحديث جاري من المستخدم
              return driverData;
            }
            return prev;
          });
          
          // تحديث حالة الاتصال فقط إذا كانت مختلفة وليس هناك تحديث جاري
          // وفقط إذا لم يتم تغييرها مؤخراً (لتجنب الصراع مع التحديث اليدوي)
          if (driverData.is_active !== isOnline && Math.abs(Date.now() - lastOnlineUpdate) > 3000) {
            setIsOnline(driverData.is_active || false);
          }
        }
        // لا يوجد setLoading هنا إطلاقًا
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [driverId, user, userType]); // إزالة currentOrder و availableOrders لتجنب التحديثات الزائدة

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
    try {
      console.log('Loading driver data for ID:', id, 'Type:', typeof id);
      
      // التحقق من أن المعرف صحيح
      if (!id || isNaN(id)) {
        console.error('معرف السائق غير صحيح:', id);
        Alert.alert('خطأ', 'معرف السائق غير صحيح. يرجى إعادة تسجيل الدخول.');
        return;
      }
      
      // التحقق من وجود السائق في قاعدة البيانات
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();
        
      console.log('Driver data result:', { driver, driverError });
      
      // تحقق من حالة الحساب
      if (!driver) {
        console.error('لم يتم العثور على السائق في قاعدة البيانات');
        Alert.alert(
          'خطأ في البيانات',
          'لم يتم العثور على حسابك في قاعدة البيانات. سيتم تسجيل الخروج.',
          [
            { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
          ]
        );
        setLoading(false);
        return;
      }
      
      if (driver.is_suspended) {
        Alert.alert(
          'تم إيقاف الحساب',
          'تم إيقاف حسابك من قبل الإدارة. يرجى التواصل مع الدعم.',
          [
            { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
          ]
        );
        setLoading(false);
        return;
      }
      
      if (driver.status !== 'approved') {
        Alert.alert(
          'حساب غير مفعل',
          'حسابك غير مفعل أو بانتظار الموافقة. سيتم تسجيل الخروج.',
          [
            { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
          ]
        );
        setLoading(false);
        return;
      }
      
      // تحديث بيانات السائق
      setDriverInfo(driver);
      if (!isUpdatingOnline) {
        setIsOnline(driver.is_active || false);
      }
      console.log('DriverDashboardScreen: loaded driver debt_points=', driver.debt_points);
      
      // جلب الطلبات المرتبطة بالسائق
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', parseInt(id))
        .limit(10);
        
      console.log('Orders data result:', { ordersData, ordersError });
      
      if (ordersError) {
        console.error('Orders error:', ordersError);
        setAvailableOrders([]);
        setMyOrders([]);
      } else {
        setMyOrders(ordersData || []);
      }

      // جلب الطلب الجاري مع بيانات المتجر
      const { data: currentOrderDb } = await supabase
        .from('orders')
        .select(`
          *,
          stores (
            id,
            name,
            location_url,
            address,
            phone
          )
        `)
        .eq('driver_id', parseInt(id))
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (currentOrderDb) {
        setCurrentOrder(currentOrderDb);
        setAvailableOrders([]); // لا تعرض الطلبات المتاحة إذا كان هناك طلب جاري
      } else {
        setCurrentOrder(null);
        // جلب الطلبات المتاحة
        const { data: availableOrdersData, error: availableOrdersError } = await ordersAPI.getAvailableOrders();
        if (availableOrdersError) {
          setAvailableOrders([]);
        } else {
          setAvailableOrders(availableOrdersData || []);
        }
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
      Alert.alert(
        'خطأ في الاتصال',
        'حدث خطأ في الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.',
        [
          { text: 'حسناً', onPress: () => { logout(); navigation.replace('Login'); } }
        ]
      );
    }
    setLoading(false);
  };

  const toggleOnlineStatus = async (value) => {
    if (isUpdatingOnline) return;
    setIsUpdatingOnline(true);
    const previous = isOnline;
    
    try {
      // تسجيل وقت التحديث
      const updateTime = Date.now();
      setLastOnlineUpdate(updateTime);
      
    // تحديث متفائل لتقليل الوميض
    setIsOnline(value);
    setDriverInfo((prev) => (prev ? { ...prev, is_active: value } : prev));
      
      // تحديث قاعدة البيانات
      const { error } = await supabase
        .from('drivers')
        .update({ is_active: value })
        .eq('id', driverInfo?.id);
      
      if (error) {
        throw error;
      }
      
      // إنتظار قصير قبل السماح بالتحديثات التلقائية مرة أخرى
      setTimeout(() => {
        setIsUpdatingOnline(false);
      }, 2000);
      
    } catch (error) {
      // تراجع عند الفشل
      setIsOnline(previous);
      setDriverInfo((prev) => (prev ? { ...prev, is_active: previous } : prev));
      setIsUpdatingOnline(false);
      Alert.alert('خطأ', 'فشل في تحديث حالة العمل');
      console.error('Toggle online status error:', error);
    }
  };

  const acceptOrder = async (orderId) => {
    // التحقق من وجود البيانات المطلوبة
    if (!driverId) {
      Alert.alert('خطأ', 'لم يتم العثور على معرف السائق. يرجى إعادة تسجيل الدخول.');
      return;
    }

    if (!orderId) {
      Alert.alert('خطأ', 'لم يتم العثور على معرف الطلب.');
      return;
    }

    setAcceptLoading(true);
    try {
      console.log('قبول الطلب المباشر:', {
        driverId: driverId,
        orderId: orderId,
        driverInfo: driverInfo
      });

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          driver_id: parseInt(driverId), // تأكيد أنه رقم صحيح
          accepted_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('status', 'pending'); // ✅ تأكيد أن الطلب لم يُقبل بعد

      if (error) {
        console.error('خطأ في قبول الطلب المباشر:', error);
        Alert.alert('خطأ', 'فشل في قبول الطلب: ' + error.message);
      } else {
        Alert.alert('نجح', 'تم قبول الطلب بنجاح');
        await loadDriverData(driverId); // إعادة تحميل البيانات
      }
    } catch (error) {
      console.error('خطأ في قبول الطلب المباشر:', error);
      Alert.alert('خطأ', 'حدث خطأ غير متوقع: ' + error.message);
    } finally {
      setAcceptLoading(false);
    }
  };

  const completeOrder = async (orderId) => {
    try {
      const { data, error } = await ordersAPI.completeOrder(orderId);
      if (error) {
        Alert.alert('خطأ', 'فشل في إكمال الطلب: ' + error.message);
      } else {
        Alert.alert('نجح', 'تم إكمال الطلب بنجاح! تم حساب النقاط وتحديث الإحصائيات.');
        await loadDriverData(driverId);
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع: ' + error.message);
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
    setSupportLoading(true);
    const { error } = await supportAPI.sendSupportMessage('driver', driverId, supportMessage.trim(), 'user');
    if (!error) {
      Alert.alert('تم الإرسال', 'تم إرسال رسالتك للدعم الفني بنجاح');
      setSupportMessage('');
      setSupportModalVisible(false);
    } else {
      Alert.alert('خطأ', 'تعذر إرسال الرسالة: ' + (error.message || 'خطأ غير معروف'));
    }
    setSupportLoading(false);
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
    console.log('=== بداية إكمال الطلب ===');
    console.log('الطلب الحالي:', currentOrder);
    
    if (!currentOrder) {
      console.log('لا يوجد طلب حالي لإكماله');
      Alert.alert('خطأ', 'لا يوجد طلب حالي لإكماله');
      return;
    }

    if (currentOrder.status !== 'accepted') {
      console.log('حالة الطلب غير صحيحة:', currentOrder.status);
      Alert.alert('خطأ', `لا يمكن إكمال هذا الطلب. الحالة الحالية: ${currentOrder.status}`);
      return;
    }

    // تأكيد إكمال الطلب
    Alert.alert(
      'تأكيد إكمال الطلب',
      `هل أنت متأكد من إكمال الطلب رقم #${currentOrder.id}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'إكمال الطلب', 
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await ordersAPI.completeOrder(currentOrder.id);
              if (error) {
                throw new Error('فشل في إكمال الطلب: ' + error.message);
              }
              // إعادة تعيين الطلب الحالي وتحديث البيانات
              setCurrentOrder(null);
              await loadDriverData(driverId);
              Alert.alert('نجح', 'تم إكمال الطلب بنجاح!');
            } catch (error) {
              console.error('خطأ في إكمال الطلب:', error);
              Alert.alert('خطأ', error.message || 'حدث خطأ أثناء إكمال الطلب');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // دالة تنفيذ القبول بعد اجتياز الاختبار
  const handleQuizOptionPress = async (selected) => {
    if (selected === quizTarget) {
      // التحقق من وجود البيانات المطلوبة
      if (!driverId) {
        Alert.alert('خطأ', 'لم يتم العثور على معرف السائق. يرجى إعادة تسجيل الدخول.');
        return;
      }

      if (!pendingOrderToAccept?.id) {
        Alert.alert('خطأ', 'لم يتم العثور على بيانات الطلب.');
        return;
      }

      setQuizModalVisible(false);
      setQuizLoading(true);
      try {
        console.log('قبول الطلب:', {
          driverId: driverId,
          orderId: pendingOrderToAccept.id,
          driverInfo: driverInfo
        });

        // تحديث الطلب وتعيين السائق مع Race Condition Fix
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: 'accepted', 
            driver_id: parseInt(driverId), // تأكيد أنه رقم صحيح
            accepted_at: new Date().toISOString()
          })
          .eq('id', pendingOrderToAccept.id)
          .eq('status', 'pending'); // ✅ تأكيد أن الطلب لم يُقبل بعد

        if (orderError) {
          console.error('خطأ في تحديث الطلب:', orderError);
          throw new Error('فشل في قبول الطلب: ' + orderError.message);
        }

        setCurrentOrder(pendingOrderToAccept);
        Alert.alert('تم قبول الطلب', 'تم تعيين الطلب لك بنجاح!');
      } catch (error) {
        console.error('خطأ في قبول الطلب:', error);
        Alert.alert('خطأ', 'حدث خطأ أثناء قبول الطلب: ' + error.message);
      } finally {
        setQuizLoading(false);
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
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => navigation.navigate('DriverNotifications')} style={{padding: 8, marginRight: 8}}>
            <View style={{position: 'relative'}}>
              <Ionicons name="notifications-outline" size={26} color={colors.secondary} />
              {unreadNotifications > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -5,
                  right: -5,
                  backgroundColor: '#FF4444',
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: colors.secondary
                }}>
                  <Text style={{
                    color: colors.secondary,
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={{padding: 8}}>
            <Ionicons name="log-out-outline" size={26} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
      {/* معلومات السائق */}
      <View style={{backgroundColor:'#fff', flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:8, borderBottomWidth:1, borderColor:'#F5F5F5'}}>
        <Text style={{color:colors.primary, fontWeight:'bold'}}>{isOnline ? 'متصل' : 'غير متصل'}</Text>
        <Text style={{color: isAvailable ? colors.success : colors.danger, fontWeight: 'bold'}}>
          {isAvailable ? '✅ متوفر' : '⛔ غير متوفر'}
        </Text>
      </View>
      {/* محتوى الشاشة */}
      {currentOrder ? (
        // إذا كان هناك طلب جاري، اعرضه فقط
        <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:16}}>
          <Text style={{fontWeight:'bold', fontSize:18, marginBottom:12}}>طلب جاري</Text>
          <View style={{backgroundColor:'#F5F5F5', borderRadius:12, padding:16, width:'100%', marginBottom:16}}>
            {currentOrder.store_id ? (
              <>
                <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>
                  المتجر: {currentOrder.stores?.name || 'غير محدد'}
                </Text>
                {currentOrder.stores?.location_url && (
                  <TouchableOpacity 
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#E3F2FD',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 10,
                      marginTop: 8,
                      justifyContent: 'center',
                      gap: 8,
                      borderWidth: 1,
                      borderColor: '#2196F3'
                    }}
                    onPress={() => {
                      // فتح الرابط في المتصفح
                      Linking.openURL(currentOrder.stores.location_url);
                    }}
                  >
                    <Ionicons name="map-outline" size={20} color="#2196F3" />
                    <Text style={{color: '#2196F3', fontWeight: 'bold', fontSize: 14}}>عرض موقع المتجر</Text>
                    <Ionicons name="open-outline" size={16} color="#2196F3" />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>من: {currentOrder.pickup_address || 'غير محدد'}</Text>
                <Text style={{fontWeight: 'bold', fontSize: 16, marginBottom: 4}}>إلى: {currentOrder.delivery_address || 'غير محدد'}</Text>
              </>
            )}
            <Text>المبلغ: {currentOrder.total_amount || 0} دينار</Text>
            <Text>العنوان: {currentOrder.delivery_address || currentOrder.address || 'غير محدد'}</Text>
            {currentOrder.customer_phone && (
              <Text>هاتف الزبون: {currentOrder.customer_phone}</Text>
            )}
            {/* تفاصيل الطلب */}
            {(currentOrder.description || currentOrder.items_description || currentOrder.extra_details) && (
              <Text style={{marginTop:8, color:'#555'}}>
                تفاصيل الطلب: {currentOrder.description || currentOrder.items_description || currentOrder.extra_details}
              </Text>
            )}
            {currentOrder.extra_details && (
              <Text style={{marginTop:8, color:'#555'}}>تفاصيل إضافية: {currentOrder.extra_details}</Text>
            )}

          </View>
          {/* الزر في واجهة الطلب الجاري */}
          <TouchableOpacity 
            onPress={handleFinishOrder} 
            style={{
              backgroundColor: loading ? '#ccc' : colors.primary, 
              borderRadius:8, 
              padding:12, 
              alignItems:'center', 
              width:'100%'
            }}
            disabled={loading}
          >
            {loading ? (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ActivityIndicator size="small" color="#fff" style={{marginRight: 8}} />
                <Text style={{color:'#fff', fontWeight:'bold'}}>جاري الإكمال...</Text>
              </View>
            ) : (
              <Text style={{color:'#fff', fontWeight:'bold'}}>اكمال الطلب</Text>
            )}
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
                    style={{
                      marginTop:12, 
                      backgroundColor: (currentOrder || acceptLoading) ? '#ccc' : colors.primary, 
                      borderRadius:8, 
                      padding:10, 
                      alignItems:'center',
                      flexDirection: 'row',
                      justifyContent: 'center'
                    }} 
                    onPress={() => !currentOrder && !acceptLoading && handleAcceptOrder(order)}
                    disabled={!!currentOrder || acceptLoading}
                  >
                    {acceptLoading ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" style={{marginRight: 8}} />
                        <Text style={{color:'#fff', fontWeight:'bold'}}>جاري القبول...</Text>
                      </>
                    ) : (
                      <Text style={{color:'#fff', fontWeight:'bold'}}>قبول الطلب</Text>
                    )}
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
                await toggleOnlineStatus(true);
                setLoading(false);
              }
            }}
            disabled={isBlocked || isUpdatingOnline}
          >
            <Text style={{color: isAvailable ? '#fff' : colors.primary, fontWeight:'bold'}}>متوفر</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{paddingVertical:10, paddingHorizontal:32, backgroundColor: !isAvailable ? colors.primary : '#fff'}}
            onPress={async ()=>{
              if (!isBlocked) {
                setLoading(true);
                await toggleOnlineStatus(false);
                setLoading(false);
              }
            }}
            disabled={isUpdatingOnline}
          >
            <Text style={{color: !isAvailable ? '#fff' : colors.primary, fontWeight:'bold'}}>غير متوفر</Text>
          </TouchableOpacity>
        </View>
        {isBlocked && (
          <>
            <Text style={{color:colors.danger, marginTop:24, fontWeight:'bold', textAlign:'center'}}>
              تم إيقافك مؤقتًا بسبب تجاوز حد الديون. يرجى تصفير الديون للعودة للعمل.
            </Text>
            {!isWithinWorkHours() && (
              <Text style={{color:'#888', textAlign:'center', marginTop:8}}>
                خارج أوقات العمل: من {driverInfo?.work_start_time} إلى {driverInfo?.work_end_time}
              </Text>
            )}
          </>
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
            <Text style={{fontSize:18, marginBottom:12}}>اختر الرقم التالي من الخيارات:</Text>
            <Text style={{fontSize:32, fontWeight:'bold', marginBottom:24, color:colors.primary}}>{quizTarget}</Text>
            <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
              {quizOptions.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    backgroundColor: quizLoading ? '#ccc' : '#F5F5F5', 
                    borderRadius:8, 
                    padding:16, 
                    marginHorizontal:6, 
                    minWidth:60, 
                    alignItems:'center', 
                    borderWidth:1, 
                    borderColor:'#ccc'
                  }}
                  onPress={() => !quizLoading && handleQuizOptionPress(opt)}
                  disabled={quizLoading}
                >
                  <Text style={{fontSize:22, fontWeight:'bold', color: quizLoading ? '#888' : '#333'}}>{opt}</Text>
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