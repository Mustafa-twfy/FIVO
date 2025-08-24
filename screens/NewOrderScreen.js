import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, ordersAPI, pushNotificationsAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pushNotificationSender from '../utils/pushNotificationSender';

export default function NewOrderScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isUrgent, setIsUrgent] = useState(false); // تم تعطيل خيار الطلب العاجل (لن يُرسل كعاجل حالياً)
  const [loading, setLoading] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const [storeLocationUrl, setStoreLocationUrl] = useState('');

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    try {
      const storeId = await AsyncStorage.getItem('userId');
      if (storeId) {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();
        
        if (!error && data) {
          setStoreInfo(data);
          setStoreLocationUrl(data.location_url || '');
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل معلومات المتجر:', error);
    }
  };

  const validateForm = () => {
    if (!description.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال وصف الطلب');
      return false;
    }
    
    if (!amount.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ الطلب');
      return false;
    }
    
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح أكبر من صفر');
      return false;
    }
    
    if (!address.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان التوصيل');
      return false;
    }
    
    if (!phone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return false;
    }
    
    // التحقق من صحة رقم الهاتف العراقي
    const phoneRegex = /^07[3-9]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف عراقي صحيح (مثال: 07801234567)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('=== بداية إنشاء طلب جديد ===');
      
      // الحصول على معرف المتجر من AsyncStorage
      const storeId = await AsyncStorage.getItem('userId');
      if (!storeId) {
        throw new Error('لم يتم العثور على معرف المتجر');
      }

      console.log('معرف المتجر:', storeId);
      console.log('تفاصيل الطلب:', {
        description,
        amount: parseFloat(amount),
        address,
        phone
      });

      // إنشاء الطلب باستخدام API الجديد
      const { data, error } = await ordersAPI.createOrder({
        store_id: parseInt(storeId),
        customer_name: 'عميل',
        customer_phone: phone,
        pickup_address: storeInfo?.address || 'عنوان المتجر',
        delivery_address: address,
        items_description: description,
        description: description,
        total_amount: parseFloat(amount),
        delivery_fee: 0,
        // إيقاف خاصية الطلب العاجل مؤقتاً - نرسل كل الطلبات كغير عاجلة
        is_urgent: false,
        payment_method: 'cash',
        payment_status: 'pending',
        status: 'pending',
        driver_id: null,
        store_location_url: storeLocationUrl
      });

      if (error) {
        console.error('خطأ في إنشاء الطلب:', error);
        throw new Error('فشل في إنشاء الطلب: ' + error.message);
      }

      console.log('تم إنشاء الطلب بنجاح:', data);

      // إرسال إشعار Push لجميع السائقين المتاحين
      try {
        const orderData = {
          id: data.id,
          store_name: storeInfo?.name || 'متجر',
          total_amount: parseFloat(amount),
          pickup_address: storeInfo?.address || 'عنوان المتجر',
          delivery_address: address
        };
        
        const notificationResult = await pushNotificationsAPI.sendNewOrderNotificationToDrivers(orderData);
        if (notificationResult.success) {
          console.log('تم إرسال إشعارات Push للسائقين:', notificationResult.message);
        } else {
          console.log('فشل في إرسال إشعارات Push:', notificationResult.error);
        }
      } catch (notificationError) {
        console.error('خطأ في إرسال إشعارات Push:', notificationError);
        // لا نوقف العملية إذا فشل إرسال الإشعارات
      }

      // تحديث إحصائيات المتجر
      await supabase
        .from('stores')
        .update({ 
          total_orders: (storeInfo?.total_orders || 0) + 1,
          total_revenue: (storeInfo?.total_revenue || 0) + parseFloat(amount)
        })
        .eq('id', storeId);

      // إرسال Push Notifications لجميع السائقين
      await sendPushNotificationsToDrivers(data);

      Alert.alert(
        'تم إنشاء الطلب بنجاح! 🎉',
        'تم إرسال الطلب لجميع السائقين المتاحين. سيتم إشعارك عند قبول أحد السائقين للطلب.',
        [
          {
            text: 'عرض الطلبات',
            onPress: () => navigation.navigate('StoreOrders')
          },
          {
            text: 'إنشاء طلب آخر',
            onPress: () => {
              setDescription('');
              setAmount('');
              setAddress('');
              setPhone('');
            }
          }
        ]
      );

    } catch (error) {
      console.error('خطأ في إنشاء الطلب:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع في إنشاء الطلب');
    } finally {
      setLoading(false);
    }
  };

  // دالة إرسال Push Notifications للسائقين
  const sendPushNotificationsToDrivers = async (orderData) => {
    try {
      console.log('بدء إرسال Push Notifications للسائقين...');
      
      // إضافة معلومات المتجر للطلب
      const orderWithStoreInfo = {
        ...orderData,
        store_name: storeInfo?.name || 'متجر',
        store_category: storeInfo?.category || 'عام'
      };

      // محاولة إرسال الإشعارات للسائقين في المنطقة أولاً
      if (storeInfo?.latitude && storeInfo?.longitude) {
        console.log('إرسال إشعارات للسائقين في المنطقة...');
        const nearbyResult = await pushNotificationSender.sendNewOrderNotificationToNearbyDrivers(
          orderWithStoreInfo,
          storeInfo.latitude,
          storeInfo.longitude,
          10 // 10 كم
        );
        
        if (nearbyResult.success) {
          console.log(`تم إرسال إشعارات لـ ${nearbyResult.successCount} سائق في المنطقة`);
        } else {
          console.log('لا يوجد سائقين في المنطقة، إرسال لجميع السائقين...');
        }
      }

      // إرسال إشعارات لجميع السائقين كاحتياطي
      console.log('إرسال إشعارات لجميع السائقين...');
      const allDriversResult = await pushNotificationSender.sendNewOrderNotification(orderWithStoreInfo);
      
      if (allDriversResult.success) {
        console.log(`تم إرسال إشعارات لـ ${allDriversResult.successCount} سائق من أصل ${allDriversResult.totalCount}`);
        
        // تسجيل نجاح الإرسال
        await pushNotificationsAPI.logPushNotification(
          parseInt(await AsyncStorage.getItem('userId')),
          'store',
          'new_order',
          'طلب جديد',
          `تم إرسال طلب جديد لـ ${allDriversResult.successCount} سائق`,
          { orderId: orderData.id, successCount: allDriversResult.successCount },
          null,
          true,
          null,
          allDriversResult
        );
      } else {
        console.error('فشل في إرسال Push Notifications:', allDriversResult.error);
        
        // تسجيل فشل الإرسال
        await pushNotificationsAPI.logPushNotification(
          parseInt(await AsyncStorage.getItem('userId')),
          'store',
          'new_order',
          'طلب جديد',
          'فشل في إرسال الإشعارات للسائقين',
          { orderId: orderData.id },
          null,
          false,
          allDriversResult.error,
          allDriversResult
        );
      }

    } catch (error) {
      console.error('خطأ في إرسال Push Notifications:', error);
      
      // تسجيل الخطأ
      try {
        await pushNotificationsAPI.logPushNotification(
          parseInt(await AsyncStorage.getItem('userId')),
          'store',
          'new_order',
          'طلب جديد',
          'خطأ في إرسال الإشعارات',
          { orderId: orderData.id },
          null,
          false,
          error.message,
          { error: error.toString() }
        );
      } catch (logError) {
        console.error('فشل في تسجيل الخطأ:', logError);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلب جديد</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>تفاصيل الطلب</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>وصف الطلب *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="اكتب تفاصيل الطلب هنا..."
              placeholderTextColor="#BDBDBD"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>المبلغ (دينار) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#BDBDBD"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>عنوان التوصيل *</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل عنوان التوصيل"
              placeholderTextColor="#BDBDBD"
              value={address}
              onChangeText={setAddress}
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم هاتف الزبون *</Text>
            <TextInput
              style={styles.input}
              placeholder="07801234567"
              placeholderTextColor="#BDBDBD"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
              maxLength={11}
            />
          </View>

          {/* خيار 'طلب عاجل' معطل مؤقتاً - سيتم تطويره لاحقاً */}

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
            <Text style={styles.infoText}>
              سيتم إرسال الطلب للسائقين المتاحين في منطقتك
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={["#FFD600", "#FF9800"]}
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={24} color="#fff" />
                  <Text style={styles.submitText}>إنشاء الطلب</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    flex: 1,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // أنماط الطلب العاجل
  urgentSection: {
    marginBottom: 20,
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  urgentInfo: {
    flex: 1,
  },
  urgentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  urgentDescription: {
    fontSize: 12,
    color: '#666',
  },
  urgentBadge: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
}); 