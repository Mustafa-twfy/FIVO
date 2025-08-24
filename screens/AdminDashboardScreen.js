import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supportAPI, driversAPI, storesAPI, updatesAPI, pushNotificationsAPI } from '../supabase';
import { registrationRequestsAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import colors from '../colors';
import { systemSettingsAPI } from '../supabase';
import { useAuth } from '../context/AuthContext';
import pushNotificationSender from '../utils/pushNotificationSender';

export default function AdminDashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    drivers: 0,
    stores: 0,
    orders: 0,
    requests: 0,
    supportMessages: 0
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTarget, setNotificationTarget] = useState('all'); // 'drivers' | 'stores' | 'all'
  const [sendingNotification, setSendingNotification] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [debtPointValue, setDebtPointValue] = useState('');
  const [maxDebtPoints, setMaxDebtPoints] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateLink, setUpdateLink] = useState('');
  const [updateTarget, setUpdateTarget] = useState('all');
  const [updateVersion, setUpdateVersion] = useState('');
  const [sendingUpdate, setSendingUpdate] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      loadStats();
    };
    checkAdmin();
  }, []);

  const loadStats = async () => {
    try {
      console.log('Loading admin stats...');
      
      // جلب عدد السائقين الحقيقي
      const { count: driversCount, error: driversError } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true });
        
      if (driversError) {
        console.error('Drivers count error:', driversError);
      }
      
      // جلب عدد المتاجر الحقيقي
      const { count: storesCount, error: storesError } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });
        
      if (storesError) {
        console.error('Stores count error:', storesError);
      }
      
      // جلب عدد الطلبات الحقيقي
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
        
      if (ordersError) {
        console.error('Orders count error:', ordersError);
      }
      
      // جلب عدد طلبات التسجيل الجديدة
      let registrationRequests = [];
      try {
        const { data: requestsData } = await registrationRequestsAPI.getRegistrationRequests();
        registrationRequests = requestsData || [];
      } catch (error) {
        console.error('Registration requests error:', error);
      }
      
      // جلب عدد رسائل الدعم الفني
      let supportCount = 0;
      try {
        const { data: supportData } = await supportAPI.getUnreadSupportCount();
        supportCount = supportData || 0;
      } catch (error) {
        console.error('Support count error:', error);
      }
      
      // جلب عدد الإشعارات غير المقروءة للسائقين والمتاجر
      let totalUnreadNotifications = 0;
      try {
        // جلب الإشعارات غير المقروءة للسائقين
        const { count: driverNotifications, error: driverNotificationsError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);
          
        if (driverNotificationsError) {
          console.error('Driver notifications count error:', driverNotificationsError);
        }
        
        // جلب الإشعارات غير المقروءة للمتاجر
        const { count: storeNotifications, error: storeNotificationsError } = await supabase
          .from('store_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false);
          
        if (storeNotificationsError) {
          console.error('Store notifications count error:', storeNotificationsError);
        }
        
        totalUnreadNotifications = (driverNotifications || 0) + (storeNotifications || 0);
        setUnreadNotifications(totalUnreadNotifications);
      } catch (error) {
        console.error('Notifications count error:', error);
        setUnreadNotifications(0);
      }
      
      console.log('Stats loaded:', {
        drivers: driversCount || 0,
        stores: storesCount || 0,
        orders: ordersCount || 0,
        requests: registrationRequests.length,
        supportMessages: supportCount,
        unreadNotifications: totalUnreadNotifications
      });
      
      setStats({
        drivers: driversCount || 0,
        stores: storesCount || 0,
        orders: ordersCount || 0,
        requests: registrationRequests.length,
        supportMessages: supportCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        drivers: 0,
        stores: 0,
        orders: 0,
        requests: 0,
        supportMessages: 0
      });
    }
  };

  const adminOptions = [
    {
      id: 'drivers',
      title: 'السائقين',
      icon: 'people-outline',
      color: '#2196F3',
      description: 'إدارة السائقين والديون والأوقات'
    },
    {
      id: 'stores',
      title: 'المتاجر',
      icon: 'storefront-outline',
      color: '#FF9800',
      description: 'إدارة المتاجر والطلبات'
    },
    {
      id: 'support',
      title: 'الدعم الفني',
      icon: 'chatbubbles-outline',
      color: '#9C27B0',
      description: 'رسائل السائقين والمتاجر'
    },
    {
      id: 'banned',
      title: 'المحظورين',
      icon: 'shield-checkmark-outline',
      color: '#F44336',
      description: 'إدارة المستخدمين المحظورين'
    },
    {
      id: 'requests',
      title: 'طلبات التسجيل',
      icon: 'document-text-outline',
      color: '#4CAF50',
      description: 'مراجعة طلبات التسجيل الجديدة'
    }
  ];

  const handleOptionPress = (optionId) => {
    console.log('تم الضغط على زر:', optionId);
    switch (optionId) {
      case 'drivers':
        navigation.navigate('Drivers');
        break;
      case 'stores':
        navigation.navigate('Stores');
        break;
      case 'support':
        navigation.navigate('AdminSupport');
        break;
      case 'banned':
        navigation.navigate('BannedUsers');
        break;
      case 'requests':
        navigation.navigate('RegistrationRequests');
        break;
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
                  'هذا إشعار اختبار من المدير للتأكد من عمل نظام Push Notifications',
                  { type: 'admin_test', timestamp: new Date().toISOString() }
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
                            'هذا إشعار اختبار من المدير',
                            { type: 'admin_test', timestamp: new Date().toISOString() }
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.adminInfo}>
          <Image 
            source={{ uri: 'https://i.ibb.co/svdQ0fdc/IMG-20250623-233435-969.jpg' }} 
            style={styles.adminAvatar} 
          />
          <View style={styles.adminText}>
            <Text style={styles.adminTitle}>لوحة الإدارة</Text>
            <Text style={styles.adminSubtitle}>مرحباً بك في نظام إدارة توصيل بلس</Text>
          </View>
        </View>
        {/* زر تسجيل الخروج */}
        <TouchableOpacity onPress={handleLogout} style={{marginLeft: 12, padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8}}>
          <Ionicons name="log-out-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={32} color="#2196F3" />
            <Text style={styles.statNumber}>{stats.drivers}</Text>
            <Text style={styles.statLabel}>السائقين</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="storefront-outline" size={32} color="#FF9800" />
            <Text style={styles.statNumber}>{stats.stores}</Text>
            <Text style={styles.statLabel}>المتاجر</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="list-outline" size={32} color="#4CAF50" />
            <Text style={styles.statNumber}>{stats.orders}</Text>
            <Text style={styles.statLabel}>الطلبات</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles-outline" size={32} color="#9C27B0" />
            <Text style={styles.statNumber}>{stats.supportMessages}</Text>
            <Text style={styles.statLabel}>رسائل الدعم</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>أدوات الإدارة</Text>
        
        <View style={styles.optionsContainer}>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('drivers')}
            >
              <LinearGradient
                colors={['#2196F3', '#2196F3CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="people-outline" size={32} color="#fff" />
                  <Text style={styles.optionTitle}>السائقين</Text>
                  <Text style={styles.optionDescription}>إدارة السائقين والديون والأوقات</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('stores')}
            >
              <LinearGradient
                colors={['#FF9800', '#FF9800CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="storefront-outline" size={32} color="#fff" />
                  <Text style={styles.optionTitle}>المتاجر</Text>
                  <Text style={styles.optionDescription}>إدارة المتاجر والطلبات</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('support')}
            >
              <LinearGradient
                colors={['#9C27B0', '#9C27B0CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="chatbubbles-outline" size={32} color="#fff" />
                  <Text style={styles.optionTitle}>الدعم الفني</Text>
                  <Text style={styles.optionDescription}>رسائل السائقين والمتاجر</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('banned')}
            >
              <LinearGradient
                colors={['#F44336', '#F44336CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="shield-checkmark-outline" size={32} color="#fff" />
                  <Text style={styles.optionTitle}>المحظورين</Text>
                  <Text style={styles.optionDescription}>إدارة المستخدمين المحظورين</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => handleOptionPress('requests')}
            >
              <LinearGradient
                colors={['#4CAF50', '#4CAF50CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.optionGradient}
              >
                <View style={styles.optionContent}>
                  <Ionicons name="document-text-outline" size={32} color="#fff" />
                  <Text style={styles.optionTitle}>طلبات التسجيل</Text>
                  <Text style={styles.optionDescription}>مراجعة طلبات التسجيل الجديدة</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        
        <View style={styles.pointsInfoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <View style={styles.pointsInfoContent}>
            <Text style={styles.pointsInfoTitle}>نظام نقاط الديون</Text>
            <Text style={styles.pointsInfoText}>
              • كل طلب = نقطة واحدة • كل نقطة = 250 دينار • الحد الأقصى = 20 نقطة
            </Text>
            <Text style={styles.pointsInfoText}>
              • عند الوصول لـ 20 نقطة: السائق لا يمكنه العمل حتى يسدد الديون
            </Text>
          </View>
        </View>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickAction} onPress={() => setNotificationModalVisible(true)}>
            <View style={{position: 'relative'}}>
              <Ionicons name="notifications-outline" size={24} color="#2196F3" />
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
                  borderColor: '#fff'
                }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}>
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionText}>إشعار عام</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => {
            setSettingsModalVisible(true);
            setLoadingSettings(true);
            systemSettingsAPI.getSystemSettings().then(({data, error}) => {
              if (error) {
                console.error('خطأ في تحميل الإعدادات:', error);
                Alert.alert('خطأ', 'فشل في تحميل الإعدادات. تأكد من وجود جدول system_settings في قاعدة البيانات.');
                setLoadingSettings(false);
                return;
              }
              setDebtPointValue(data?.debt_point_value?.toString()||'250');
              setMaxDebtPoints(data?.max_debt_points?.toString()||'20');
              setLoadingSettings(false);
            }).catch(error => {
              console.error('خطأ في تحميل الإعدادات:', error);
              Alert.alert('خطأ', 'فشل في تحميل الإعدادات. تأكد من وجود جدول system_settings في قاعدة البيانات.');
              setLoadingSettings(false);
            });
          }}>
            <Ionicons name="settings-outline" size={24} color="#9C27B0" />
            <Text style={styles.quickActionText}>الإعدادات</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('AdminNewOrderScreen')}>
            <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
            <Text style={styles.quickActionText}>إضافة طلب جديد</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => setUpdateModalVisible(true)}>
            <Ionicons name="cloud-upload-outline" size={24} color="#00C897" />
            <Text style={styles.quickActionText}>تحديث التطبيق</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={testPushNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#FF9800" />
            <Text style={styles.quickActionText}>اختبار الإشعارات</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={notificationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,width:'90%'}}>
            <Text style={{fontSize:20,fontWeight:'bold',marginBottom:12,textAlign:'center'}}>إرسال إشعار</Text>
            <TextInput
              placeholder="عنوان الإشعار"
              value={notificationTitle}
              onChangeText={setNotificationTitle}
              style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:10,fontSize:16}}
            />
            <TextInput
              placeholder="نص الرسالة"
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              numberOfLines={3}
              style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:10,fontSize:16,minHeight:60}}
            />
            <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:16}}>
              <TouchableOpacity onPress={()=>setNotificationTarget('drivers')} style={{flex:1,backgroundColor:notificationTarget==='drivers'?'#2196F3':'#eee',padding:10,borderRadius:8,marginHorizontal:2}}>
                <Text style={{color:notificationTarget==='drivers'?'#fff':'#333',textAlign:'center'}}>سائقين</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setNotificationTarget('stores')} style={{flex:1,backgroundColor:notificationTarget==='stores'?'#2196F3':'#eee',padding:10,borderRadius:8,marginHorizontal:2}}>
                <Text style={{color:notificationTarget==='stores'?'#fff':'#333',textAlign:'center'}}>متاجر</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setNotificationTarget('all')} style={{flex:1,backgroundColor:notificationTarget==='all'?'#2196F3':'#eee',padding:10,borderRadius:8,marginHorizontal:2}}>
                <Text style={{color:notificationTarget==='all'?'#fff':'#333',textAlign:'center'}}>الكل</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={{backgroundColor:'#2196F3',padding:12,borderRadius:8,alignItems:'center',marginBottom:8,opacity:sendingNotification?0.6:1}}
              disabled={sendingNotification}
              onPress={async()=>{
                if(!notificationTitle||!notificationMessage){Alert.alert('تنبيه','يرجى إدخال عنوان ونص الرسالة');return;}
                setSendingNotification(true);
                try{
                  let errors = [];
                  let successCount = 0;
                  
                  if(notificationTarget==='drivers'||notificationTarget==='all'){
                    const {data:drivers, error: driversError} = await driversAPI.getAllDrivers();
                    if(driversError) {
                      errors.push('خطأ في جلب السائقين: ' + driversError.message);
                    } else if(drivers && drivers.length > 0) {
                      for(const driver of drivers){
                        const {error} = await driversAPI.sendNotification(driver.id,notificationTitle,notificationMessage);
                        if(error) {
                          errors.push(`خطأ في إرسال إشعار للسائق ${driver.name || driver.id}: ${error.message}`);
                        } else {
                          successCount++;
                        }
                      }
                    } else {
                      errors.push('لا يوجد سائقين مفعلين');
                    }
                  }
                  
                  if(notificationTarget==='stores'||notificationTarget==='all'){
                    const {data:stores, error: storesError} = await storesAPI.getAllStores();
                    if(storesError) {
                      errors.push('خطأ في جلب المتاجر: ' + storesError.message);
                    } else if(stores && stores.length > 0) {
                      for(const store of stores){
                        const {error} = await storesAPI.sendStoreNotification(store.id,notificationTitle,notificationMessage);
                        if(error) {
                          errors.push(`خطأ في إرسال إشعار للمتجر ${store.name || store.id}: ${error.message}`);
                        } else {
                          successCount++;
                        }
                      }
                    } else {
                      errors.push('لا يوجد متاجر مفعلة');
                    }
                  }
                  
                  if(successCount > 0){
                    Alert.alert('تم الإرسال',`تم إرسال الإشعار بنجاح إلى ${successCount} مستخدم${successCount > 1 ? 'ين' : ''}`);
                    setNotificationModalVisible(false);
                    setNotificationTitle('');setNotificationMessage('');setNotificationTarget('all');
                    // تحديث الإحصائيات بعد إرسال الإشعارات
                    loadStats();
                  }else{
                    Alert.alert('تنبيه','فشل في إرسال الإشعار: '+errors.join('\n'));
                  }
                }catch(e){
                  console.error('خطأ في إرسال الإشعارات:', e);
                  Alert.alert('خطأ','حدث خطأ أثناء الإرسال: ' + e.message);
                }
                setSendingNotification(false);
              }}
            >
              <Text style={{color:'#fff',fontSize:17,fontWeight:'bold'}}>إرسال</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={()=>setNotificationModalVisible(false)} style={{alignItems:'center',marginTop:4}}>
              <Text style={{color:'#2196F3',fontSize:15}}>إغلاق</Text>
            </TouchableOpacity>
            
            {/* مودال إنشاء تحديث التطبيق */}
            <Modal
              visible={updateModalVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setUpdateModalVisible(false)}
            >
              <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',alignItems:'center'}}>
                <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,width:'90%'}}>
                  <Text style={{fontSize:20,fontWeight:'bold',marginBottom:12,textAlign:'center'}}>إنشاء تحديث للتطبيق</Text>
                  <TextInput placeholder="عنوان التحديث" value={updateTitle} onChangeText={setUpdateTitle} style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:10,fontSize:16}} />
                  <TextInput placeholder="نص التحديث" value={updateMessage} onChangeText={setUpdateMessage} multiline numberOfLines={3} style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:10,fontSize:16,minHeight:80}} />
                  <TextInput placeholder="رابط التحديث (مطلوب)" value={updateLink} onChangeText={setUpdateLink} style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:10,fontSize:16}} />
                  <TextInput placeholder="النسخة (اختياري)" value={updateVersion} onChangeText={setUpdateVersion} style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:10,fontSize:16}} />
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:12}}>
                    <TouchableOpacity onPress={()=>setUpdateTarget('drivers')} style={{flex:1,backgroundColor:updateTarget==='drivers'?'#00C897':'#eee',padding:10,borderRadius:8,marginHorizontal:2}}>
                      <Text style={{color:updateTarget==='drivers'?'#fff':'#333',textAlign:'center'}}>سائقين</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>setUpdateTarget('stores')} style={{flex:1,backgroundColor:updateTarget==='stores'?'#00C897':'#eee',padding:10,borderRadius:8,marginHorizontal:2}}>
                      <Text style={{color:updateTarget==='stores'?'#fff':'#333',textAlign:'center'}}>متاجر</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>setUpdateTarget('all')} style={{flex:1,backgroundColor:updateTarget==='all'?'#00C897':'#eee',padding:10,borderRadius:8,marginHorizontal:2}}>
                      <Text style={{color:updateTarget==='all'?'#fff':'#333',textAlign:'center'}}>الكل</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{backgroundColor:'#00C897',padding:12,borderRadius:8,alignItems:'center',marginBottom:8,opacity:sendingUpdate?0.6:1}} disabled={sendingUpdate} onPress={async()=>{
                    if(!updateTitle||!updateMessage||!updateLink){Alert.alert('تنبيه','يرجى إدخال العنوان والنص والرابط');return;} setSendingUpdate(true);
                    try{
                      const payload = { title: updateTitle, message: updateMessage, link_url: updateLink || null, target_roles: updateTarget==='all'?['driver','store']:(updateTarget==='drivers'?['driver']:['store']), version: updateVersion || null };
                      const { data, error } = await updatesAPI.createUpdate(payload);
                      if(error){ Alert.alert('خطأ','فشل في إنشاء التحديث: ' + (error.message||JSON.stringify(error))); }
                      else{ Alert.alert('تم','تم إنشاء التحديث بنجاح وسيظهر تنبيه التحديث للمستخدمين عند فتح التطبيق'); setUpdateModalVisible(false); setUpdateTitle(''); setUpdateMessage(''); setUpdateLink(''); setUpdateVersion(''); setUpdateTarget('all'); }
                    }catch(e){ console.error('create update error', e); Alert.alert('خطأ','حدث خطأ'); }
                    setSendingUpdate(false);
                  }}>
                    <Text style={{color:'#fff',fontSize:17,fontWeight:'bold'}}>إنشاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={()=>setUpdateModalVisible(false)} style={{alignItems:'center',marginTop:4}}>
                    <Text style={{color:'#00C897',fontSize:15}}>إغلاق</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </Modal>

      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,width:'90%'}}>
            <Text style={{fontSize:20,fontWeight:'bold',marginBottom:12,textAlign:'center'}}>إعدادات النظام</Text>
            {loadingSettings ? (
              <Text style={{textAlign:'center',marginVertical:20}}>جاري التحميل...</Text>
            ) : (
              <>
                <Text style={{fontSize:16,marginBottom:6}}>قيمة النقطة (دينار):</Text>
                <TextInput
                  value={debtPointValue}
                  onChangeText={setDebtPointValue}
                  keyboardType="numeric"
                  style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:10,fontSize:16}}
                />
                <Text style={{fontSize:16,marginBottom:6}}>الحد الأقصى للنقاط:</Text>
                <TextInput
                  value={maxDebtPoints}
                  onChangeText={setMaxDebtPoints}
                  keyboardType="numeric"
                  style={{borderWidth:1,borderColor:'#ccc',borderRadius:8,padding:8,marginBottom:16,fontSize:16}}
                />
                <TouchableOpacity
                  style={{backgroundColor:'#2196F3',padding:12,borderRadius:8,alignItems:'center',marginBottom:8,opacity:savingSettings?0.6:1}}
                  disabled={savingSettings}
                  onPress={async()=>{
                    if(!debtPointValue||!maxDebtPoints||isNaN(+debtPointValue)||isNaN(+maxDebtPoints)){
                      Alert.alert('تنبيه','يرجى إدخال قيم صحيحة');return;
                    }
                    setSavingSettings(true);
                    const {error} = await systemSettingsAPI.updateSystemSettings(parseInt(debtPointValue),parseInt(maxDebtPoints));
                    setSavingSettings(false);
                    if(!error){
                      Alert.alert('تم الحفظ','تم تحديث الإعدادات بنجاح');
                      setSettingsModalVisible(false);
                    }else{
                      Alert.alert('خطأ','حدث خطأ أثناء الحفظ');
                    }
                  }}
                >
                  <Text style={{color:'#fff',fontSize:17,fontWeight:'bold'}}>حفظ</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setSettingsModalVisible(false)} style={{alignItems:'center',marginTop:4}}>
                  <Text style={{color:'#2196F3',fontSize:15}}>إغلاق</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, backgroundColor: colors.secondary },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  adminText: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  adminSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  pointsInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsInfoContent: {
    flex: 1,
  },
  pointsInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pointsInfoText: {
    fontSize: 14,
    color: '#666',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontWeight: 'bold',
  },
}); 