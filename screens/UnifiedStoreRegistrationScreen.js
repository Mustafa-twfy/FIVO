// UnifiedStoreRegistrationScreen.js
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert,
  ScrollView, KeyboardAvoidingView, Platform, Image, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';     // عدّلي المسار إن لزم
import colors from '../colors';             // عدّلي المسار إن لزم

const storeIcon = { uri: 'https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg' };

export default function UnifiedStoreRegistrationScreen({ navigation }) {
  // بيانات الحساب
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  // بيانات المتجر
  const [info, setInfo] = useState({
    storeName: '',
    address: '',
    phone: '',
    locationUrl: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const handleAccChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleInfoChange = (field, value) => {
    setInfo(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateAll = () => {
    let valid = true;
    const newErrors = {};

    // تحقق الإيميل/الباسوورد (من الشاشة الأولى سابقًا)
    if (!formData.email.trim()) {
      newErrors.email = 'يرجى إدخال البريد الإلكتروني';
      valid = false;
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
      newErrors.email = 'يرجى إدخال بريد إلكتروني صحيح';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'يرجى إدخال كلمة المرور';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      valid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'يرجى إعادة كتابة كلمة المرور';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
      valid = false;
    }

    // تحقق بيانات المتجر (من الشاشة الثانية سابقًا)
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

  const handleSubmit = async () => {
    if (!validateAll()) {
      Alert.alert('خطأ', 'يرجى تصحيح الأخطاء في النموذج قبل المتابعة.');
      return;
    }

    setLoading(true);
    try {
      // فحص البريد في registration_requests
      const { data: existingRequest, error: requestError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('email', formData.email)
        .maybeSingle();

      if (requestError) {
        console.error('registration_requests check error:', requestError);
      }

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل بالفعل وفي انتظار الموافقة من الإدارة.', [
            {
              text: 'عرض حالة الطلب',
              onPress: () =>
                navigation.replace('UnifiedPendingApproval', {
                  email: formData.email,
                  user_type: existingRequest.user_type || 'store',
                }),
            },
            { text: 'إلغاء', style: 'cancel' },
          ]);
          setLoading(false);
          return;
        } else if (existingRequest.status === 'approved') {
          Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل وتمت الموافقة عليه. يمكنك تسجيل الدخول مباشرة.', [
            { text: 'تسجيل الدخول', onPress: () => navigation.replace('Login') },
          ]);
          setLoading(false);
          return;
        } else if (existingRequest.status === 'rejected') {
          Alert.alert('تم رفض الطلب السابق', `تم رفض طلب تسجيل سابق لهذا البريد. السبب: ${existingRequest.rejection_reason || 'غير محدد'}`, [
            { text: 'حسناً' },
          ]);
          setLoading(false);
          return;
        }
      }

      // فحص البريد في stores
      const { data: existingStore, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('email', formData.email)
        .maybeSingle();

      if (storeError) {
        console.error('stores check error:', storeError);
      }

      if (existingStore) {
        Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل بالفعل كمتجر. يمكنك تسجيل الدخول مباشرة.', [
          { text: 'تسجيل الدخول', onPress: () => navigation.replace('Login') },
        ]);
        setLoading(false);
        return;
      }

      // فحص البريد في drivers
      const { data: existingDriver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('email', formData.email)
        .maybeSingle();

      if (driverError) {
        console.error('drivers check error:', driverError);
      }

      if (existingDriver) {
        Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل بالفعل كسائق. يمكنك تسجيل الدخول مباشرة.', [
          { text: 'تسجيل الدخول', onPress: () => navigation.replace('Login') },
        ]);
        setLoading(false);
        return;
      }

      // إدراج الطلب في registration_requests (نفس الحقول القديمة)
      const payload = {
        email: formData.email,
        password: formData.password,
        user_type: 'store',
        name: info.storeName,
        phone: info.phone,
        address: info.address,
        location_url: info.locationUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('registration_requests')
        .insert([payload]);

      if (insertError) {
        console.error('supabase.insert error:', insertError);
        Alert.alert('خطأ', 'فشل في إرسال طلب التسجيل. يرجى المحاولة لاحقاً.');
        setLoading(false);
        return;
      }

      // نجاح → الانتقال لشاشة الانتظار
      Alert.alert('نجاح', 'تم إرسال طلب التسجيل بنجاح! سيتم مراجعة طلبك من قبل الإدارة.', [
        {
          text: 'حسناً',
          onPress: () =>
            navigation.replace('UnifiedPendingApproval', {
              email: payload.email,
              user_type: 'store',
            }),
        },
      ]);
    } catch (err) {
      console.error('handleSubmit exception:', err);
      Alert.alert('خطأ', 'حدث خطأ أثناء معالجة الطلب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* الهيدر */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() && navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تسجيل متجر جديد</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* لوجو وعنوان */}
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image source={storeIcon} style={{ width: 100, height: 100, resizeMode: 'contain', marginBottom: 10 }} />
            <Text style={styles.logoText}>سمسم</Text>
            <Text style={styles.subtitle}>انضم إلينا كمتجر</Text>
          </View>

          {/* معلومات الحساب */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>معلومات الحساب</Text>

            {/* البريد */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="أدخل بريدك الإلكتروني"
                  value={formData.email}
                  onChangeText={(v) => handleAccChange('email', v)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* كلمة المرور */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="أدخل كلمة المرور"
                  value={formData.password}
                  onChangeText={(v) => handleAccChange('password', v)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* تأكيد كلمة المرور */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="أعد إدخال كلمة المرور"
                  value={formData.confirmPassword}
                  onChangeText={(v) => handleAccChange('confirmPassword', v)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          </View>

          {/* معلومات المتجر */}
          <View style={[styles.formContainer, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>معلومات المتجر</Text>

            {/* اسم المتجر */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>اسم المتجر</Text>
              <TextInput
                style={styles.standaloneInput}
                placeholder="اسم المتجر"
                value={info.storeName}
                onChangeText={(v) => handleInfoChange('storeName', v)}
              />
              {errors.storeName && <Text style={styles.errorText}>{errors.storeName}</Text>}
            </View>

            {/* العنوان */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>العنوان</Text>
              <TextInput
                style={styles.standaloneInput}
                placeholder="عنوان المتجر"
                value={info.address}
                onChangeText={(v) => handleInfoChange('address', v)}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* الهاتف */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رقم الهاتف</Text>
              <TextInput
                style={styles.standaloneInput}
                placeholder="رقم الهاتف"
                value={info.phone}
                onChangeText={(v) => handleInfoChange('phone', v)}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* رابط الموقع */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>رابط موقع المتجر من Google Maps</Text>
              <TextInput
                style={styles.standaloneInput}
                placeholder="https://maps.google.com/..."
                value={info.locationUrl}
                onChangeText={(v) => handleInfoChange('locationUrl', v)}
                keyboardType="url"
                autoCapitalize="none"
              />
              {errors.locationUrl && <Text style={styles.errorText}>{errors.locationUrl}</Text>}
            </View>

            {/* زر الإرسال */}
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity style={styles.nextButton} onPress={handleSubmit} disabled={loading} activeOpacity={0.7}>
                <LinearGradient colors={colors.gradient} style={styles.gradientButton}>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.secondary} />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>إرسال الطلب</Text>
                      <Ionicons name="arrow-forward" size={20} color={colors.secondary} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 16 },

  // مدخلات داخل "inputContainer" (مع أيقونة عين وغيرها)
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, color: colors.primary, marginBottom: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8, color: colors.primary },
  input: { flex: 1, height: 44, fontSize: 16, color: colors.dark },
  eyeButton: { padding: 8 },

  // مدخلات منفصلة مثل شاشة المعلومات السابقة
  standaloneInput: {
    height: 44,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.dark,
    backgroundColor: '#fafafa',
  },

  nextButton: { borderRadius: 12, overflow: 'hidden', marginTop: 16 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  nextButtonText: { fontSize: 16, fontWeight: 'bold', color: colors.secondary, marginRight: 8 },
  errorText: { color: 'red', fontSize: 12, marginTop: 4 },
});
