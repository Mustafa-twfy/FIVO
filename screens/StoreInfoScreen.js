import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';

export default function StoreInfoScreen({ navigation, route }) {
  const [formDataLocal, setFormDataLocal] = useState(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [fatalError, setFatalError] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoadingInit(true);
      try {
        if (route?.params?.formData) {
          setFormDataLocal(route.params.formData);
          await AsyncStorage.removeItem('pendingStoreRegistration');
          return;
        }
        // استعادة بيانات محفوظة مؤقتاً
        let pending = await AsyncStorage.getItem('pendingStoreRegistration');
        if (pending) {
          setFormDataLocal(JSON.parse(pending));
          await AsyncStorage.removeItem('pendingStoreRegistration');
        }
      } catch (e) {
        console.error('StoreInfoScreen init error:', e);
        setFormDataLocal({ email: '', password: '' });
      } finally {
        setLoadingInit(false);
      }
    };
    init().catch(err => {
      console.error('Unhandled error in StoreInfoScreen.init:', err);
      setFormDataLocal({ email: '', password: '' });
      setLoadingInit(false);
    });
  }, [route?.params]);

  if (fatalError) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', fontSize: 18 }}>حدث خطأ غير متوقع</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ color: '#fff' }}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!formDataLocal || !formDataLocal.email) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.centered}>
            <Text style={{ fontSize: 18, color: '#333', marginBottom: 12 }}>لم يتم إرسال بيانات التسجيل أو البيانات ناقصة. الرجاء العودة وإعادة المحاولة.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>العودة</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const [info, setInfo] = useState({
    storeName: '',
    address: '',
    phone: '',
    locationUrl: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setInfo(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = {};
    if (!info.storeName.trim()) {
      newErrors.storeName = 'يرجى إدخال اسم المتجر';
      valid = false;
    }
    if (!info.address.trim()) {
      newErrors.address = 'يرجى إدخال عنوان المتجر';
      valid = false;
    }
    if (!info.phone.trim()) {
      newErrors.phone = 'يرجى إدخال رقم الهاتف';
      valid = false;
    } else if (!/^\+?\d{8,15}$/.test(info.phone)) {
      newErrors.phone = 'يرجى إدخال رقم هاتف صحيح بدون أحرف (بدءًا بـ + مسموح)';
      valid = false;
    }
    if (!info.locationUrl.trim()) {
      newErrors.locationUrl = 'يرجى إدخال رابط موقع المتجر من Google Maps';
      valid = false;
    } else if (!/google.*maps/i.test(info.locationUrl.trim())) {
      newErrors.locationUrl = 'يرجى إدخال رابط صحيح من Google Maps';
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleNext = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const payload = {
          email: formDataLocal.email,
          password: formDataLocal.password,
          user_type: 'store',
          name: info.storeName,
          phone: info.phone,
          address: info.address,
          location_url: info.locationUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('registration_requests').insert([payload]);
        if (error) {
          console.error('supabase.insert error:', error);
          await AsyncStorage.setItem('pendingStoreRegistration', JSON.stringify(formDataLocal));
          Alert.alert('خطأ', 'فشل في إرسال طلب التسجيل. سيتم حفظ بياناتك لإعادة المحاولة.');
        } else {
          Alert.alert('نجاح', 'تم إرسال طلب التسجيل بنجاح! سيتم مراجعة طلبك من قبل الإدارة.', [
            { text: 'حسناً', onPress: () => navigation.replace('UnifiedPendingApproval', { email: payload.email, user_type: 'store' }) }
          ]);
        }
      } catch (error) {
        console.error('Exception in handleNext:', error);
        await AsyncStorage.setItem('pendingStoreRegistration', JSON.stringify(formDataLocal));
        Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الطلب. سيتم حفظ بياناتك لإعادة المحاولة.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>بيانات المتجر</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>معلومات المتجر</Text>

            {/* اسم المتجر */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>اسم المتجر</Text>
              <TextInput style={styles.input} placeholder="اسم المتجر" value={info.storeName} onChangeText={(value) => handleInputChange('storeName', value)} />
              {errors.storeName && <Text style={styles.errorText}>{errors.storeName}</Text>}
            </View>

            {/* العنوان */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>العنوان</Text>
              <TextInput style={styles.input} placeholder="عنوان المتجر" value={info.address} onChangeText={(value) => handleInputChange('address', value)} />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* الهاتف */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <TextInput style={styles.input} placeholder="رقم الهاتف" value={info.phone} onChangeText={(value) => handleInputChange('phone', value)} keyboardType="phone-pad" />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* رابط الموقع */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رابط موقع المتجر من Google Maps</Text>
              <TextInput style={styles.input} placeholder="https://maps.google.com/..." value={info.locationUrl} onChangeText={(value) => handleInputChange('locationUrl', value)} keyboardType="url" autoCapitalize="none" />
              {errors.locationUrl && <Text style={styles.errorText}>{errors.locationUrl}</Text>}
            </View>

            {/* زر الإرسال */}
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.nextButtonText}>إرسال الطلب</Text>}
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  scrollContent: { flexGrow: 1, padding: 20, backgroundColor: colors.secondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  backButton: { padding: 8, backgroundColor: colors.primary, borderRadius: 6 },
  content: { flex: 1 },
  formContainer: { backgroundColor: colors.secondary, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 4 },
  input: { height: 44, borderColor: colors.primary, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, color: '#333', backgroundColor: '#fafafa' },
  nextButton: { marginTop: 20, paddingVertical: 14, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: 'red', fontSize: 12, marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }
});
