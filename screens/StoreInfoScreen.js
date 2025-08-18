import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';

const storeIcon = { uri: 'https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg' };

export default function StoreInfoScreen({ navigation, route }) {
  const [formDataLocal, setFormDataLocal] = useState(null);

  useEffect(() => {
    console.log('StoreInfoScreen route.params:', route.params);
    const init = async () => {
      try {
        // إذا كانت البيانات مرّرت عبر التنقّل فاحتفظ بها
        if (route.params && route.params.formData) {
          setFormDataLocal(route.params.formData);
          try { await AsyncStorage.removeItem('pendingStoreRegistration'); } catch (e) { console.error('remove pendingStoreRegistration', e); }
          return;
        }

        // خلاف ذلك جرب استعادة بيانات محفوظة مؤقتاً
        const pending = await AsyncStorage.getItem('pendingStoreRegistration');
        if (pending) {
          try {
            setFormDataLocal(JSON.parse(pending));
            await AsyncStorage.removeItem('pendingStoreRegistration');
            return;
          } catch (parseErr) {
            console.error('Error parsing pendingStoreRegistration', parseErr);
          }
        }

      } catch (e) {
        console.error('StoreInfoScreen init error:', e);
        try {
          setFormDataLocal({ email: '', password: '' });
        } catch (s) {
          console.error('Failed to set fallback formDataLocal', s);
        }
        Alert.alert('خطأ', 'حدث خطأ داخل شاشة بيانات المتجر. الرجاء المحاولة مرة أخرى.');
      }
    };
    init().catch(err => {
      console.error('Unhandled error in StoreInfoScreen.init:', err);
      try { setFormDataLocal({ email: '', password: '' }); } catch (s) { console.error(s); }
      Alert.alert('خطأ', 'حدث خطأ غير متوقع. الرجاء المحاولة لاحقاً.');
    });
  }, [route.params]);

  if (!formDataLocal) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 18, color: '#333', marginBottom: 12 }}>لم يتم استلام بيانات النموذج بعد. الرجاء الضغط التالي مرة أخرى.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12, backgroundColor: '#FF9800', borderRadius: 8 }}>
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
    } else if (!/^\d{8,15}$/.test(info.phone)) {
      newErrors.phone = 'يرجى إدخال رقم هاتف صحيح بدون أحرف';
      valid = false;
    }
    if (!info.locationUrl.trim()) {
      newErrors.locationUrl = 'يرجى إدخال رابط موقع المتجر من Google Maps';
      valid = false;
    } else {
      const mapUrlRegex = /https?:\/\/(www\.)?google\.[a-z]+\/maps/;
      if (!mapUrlRegex.test(info.locationUrl.trim())) {
        newErrors.locationUrl = 'يرجى إدخال رابط صحيح من Google Maps';
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleNext = async () => {
    if (validateForm()) {
      setLoading(true);
      try {
        const payload = {
          email: (formDataLocal && formDataLocal.email) || '',
          password: (formDataLocal && formDataLocal.password) || '',
          user_type: 'store',
          name: info.storeName,
          phone: info.phone,
          address: info.address,
          location_url: info.locationUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('registration_requests')
          .insert([payload]);

        if (error) {
          // حفظ البيانات مؤقتًا لإعادة المحاولة
          await AsyncStorage.setItem('pendingStoreRegistration', JSON.stringify(formDataLocal));
          Alert.alert('خطأ', 'فشل في إرسال طلب التسجيل. سيتم حفظ بياناتك لإعادة المحاولة.');
        } else {
          Alert.alert('نجاح', 'تم إرسال طلب التسجيل بنجاح! سيتم مراجعة طلبك من قبل الإدارة.', [
            {
              text: 'حسناً',
              onPress: () => {
                navigation.replace('UnifiedPendingApproval', { email: payload.email, user_type: 'store' });
              }
            }
          ]);
        }
      } catch (error) {
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
          <TouchableOpacity onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FF9800" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>بيانات المتجر</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image source={storeIcon} style={{ width: 80, height: 80, resizeMode: 'contain', marginBottom: 10 }} />
            <Text style={styles.logoText}>سمسم</Text>
            <Text style={styles.subtitle}>معلومات المتجر</Text>
          </View>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>معلومات المتجر</Text>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                لا حاجة لرفع مستندات - سيتم مراجعة طلبك من قبل الإدارة
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>اسم المتجر</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="pricetag-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="اسم المتجر"
                  value={info.storeName}
                  onChangeText={(value) => handleInputChange('storeName', value)}
                />
              </View>
              {errors.storeName && <Text style={styles.errorText}>{errors.storeName}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>العنوان</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="عنوان المتجر"
                  value={info.address}
                  onChangeText={(value) => handleInputChange('address', value)}
                />
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="رقم الهاتف"
                  value={info.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رابط موقع المتجر من Google Maps</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="map-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="https://maps.google.com/..."
                  value={info.locationUrl}
                  onChangeText={(value) => handleInputChange('locationUrl', value)}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
              {errors.locationUrl && <Text style={styles.errorText}>{errors.locationUrl}</Text>}
              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                <Text style={styles.infoText}>
                  اذهب إلى Google Maps، ابحث عن موقع متجرك، انقر على "مشاركة" ثم انسخ الرابط
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading} activeOpacity={0.7}>
              <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.gradientButton}>
                <Text style={styles.nextButtonText}>
                  {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  scrollContent: { flexGrow: 1, backgroundColor: colors.secondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, backgroundColor: colors.secondary },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  backButton: { padding: 8 },
  content: { flex: 1, padding: 20, backgroundColor: colors.secondary },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: colors.primary, marginTop: 10 },
  subtitle: { fontSize: 16, color: colors.dark, marginTop: 5 },
  formContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 12, backgroundColor: '#fafafa', paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#333' },
  nextButton: { borderRadius: 12, overflow: 'hidden' },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  nextButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginRight: 8 },
  errorText: { color: 'red', fontSize: 13, marginTop: 4, marginRight: 8, textAlign: 'right' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 8,
    flex: 1,
  },
}); 