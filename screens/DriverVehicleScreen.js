import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../colors';

export default function DriverVehicleScreen({ navigation, route }) {
  const { formData, documents } = route.params;
  const [vehicleData, setVehicleData] = useState({
    name: '',
    phone: '',
    vehicle_type: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setVehicleData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // التحقق من البيانات
    if (!vehicleData.name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم الشخص');
      return;
    }
    if (!vehicleData.phone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }
    if (vehicleData.phone.length < 8) {
      Alert.alert('خطأ', 'رقم الهاتف غير صحيح');
      return;
    }
    if (!vehicleData.vehicle_type.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال نوع المركبة');
      return;
    }

    setLoading(true);
    try {
      // إنشاء طلب تسجيل جديد مع جميع البيانات
      const { error } = await supabase
        .from('registration_requests')
        .insert([
          {
            email: formData.email,
            password: formData.password,
            user_type: 'driver',
            name: vehicleData.name,
            phone: vehicleData.phone,
            vehicle_type: vehicleData.vehicle_type,
            national_card_front: documents.nationalCardFront,
            national_card_back: documents.nationalCardBack,
            residence_card_front: documents.residenceCardFront,
            residence_card_back: documents.residenceCardBack,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Database error:', error);
        Alert.alert('خطأ', 'فشل في إرسال طلب التسجيل');
      } else {
        console.log('Registration request sent successfully');
        Alert.alert('نجح', 'تم إرسال طلب التسجيل بنجاح! سيتم مراجعة طلبك من قبل الإدارة.', [
          {
            text: 'حسناً',
            onPress: () => navigation.replace('UnifiedPendingApproval', { email: formData.email, user_type: 'driver', password: formData.password })
          }
        ]);
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>بيانات السائق</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <Ionicons name="bicycle" size={80} color="#FF9800" />
            <Text style={styles.logoText}>سمسم</Text>
            <Text style={styles.subtitle}>بيانات السائق والمركبة</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>اسم الشخص *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="أدخل اسمك الكامل"
                value={vehicleData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>رقم الهاتف *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="أدخل رقم هاتفك"
                value={vehicleData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>نوع المركبة *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="bicycle" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="أدخل نوع مركبتك (مثال: دراجة نارية، سيارة، شاحنة)"
                value={vehicleData.vehicle_type}
                onChangeText={(text) => handleInputChange('vehicle_type', text)}
              />
            </View>
            <Text style={styles.hintText}>أدخل نوع المركبة التي ستستخدمها في التوصيل</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              سيتم مراجعة طلبك من قبل الإدارة قبل الموافقة على حسابك
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={['#FF9800', '#F57C00']}
              style={styles.gradientButton}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'جاري الإرسال...' : 'إرسال طلب التسجيل'}
              </Text>
              <Ionicons name="send" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
    backgroundColor: colors.secondary,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#ccc',
  },
  hintText: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 