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
import { supabase, ordersAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NewOrderScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);

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
        phone: phone,
        total_amount: parseFloat(amount),
        delivery_fee: 0,
        is_urgent: isUrgent,
        payment_method: 'cash',
        payment_status: 'pending',
        status: 'pending', // إضافة هذا السطر لضمان ظهور الطلب للسائقين
        driver_id: null // التأكد أنه لا يوجد سائق معين
      });

      if (error) {
        console.error('خطأ في إنشاء الطلب:', error);
        throw new Error('فشل في إنشاء الطلب: ' + error.message);
      }

      console.log('تم إنشاء الطلب بنجاح:', data);

      // تحديث إحصائيات المتجر
      await supabase
        .from('stores')
        .update({ 
          total_orders: (storeInfo?.total_orders || 0) + 1,
          total_revenue: (storeInfo?.total_revenue || 0) + parseFloat(amount)
        })
        .eq('id', storeId);

      Alert.alert(
        'نجح', 
        'تم إنشاء الطلب بنجاح وسيتم إرساله للسائقين المتاحين', 
        [
          {
            text: 'حسناً',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('خطأ في إنشاء الطلب:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع في إنشاء الطلب');
    }
    setLoading(false);
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
            <Text style={styles.inputLabel}>رقم الهاتف *</Text>
            <TextInput
              style={styles.input}
              placeholder="05xxxxxxxx"
              placeholderTextColor="#BDBDBD"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          <View style={styles.urgentSection}>
            <TouchableOpacity 
              style={styles.urgentToggle}
              onPress={() => setIsUrgent(!isUrgent)}
            >
              <View style={[styles.checkbox, isUrgent && styles.checkboxChecked]}>
                {isUrgent && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.urgentInfo}>
                <Text style={styles.urgentLabel}>طلب عاجل</Text>
                <Text style={styles.urgentDescription}>
                  سيحصل الطلب على أولوية أعلى عند السائقين
                </Text>
              </View>
              {isUrgent && (
                <View style={styles.urgentBadge}>
                  <Ionicons name="flash" size={16} color="#fff" />
                  <Text style={styles.urgentBadgeText}>عاجل</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

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