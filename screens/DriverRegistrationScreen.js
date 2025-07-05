import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import colors from '../colors';

export default function DriverRegistrationScreen({ navigation }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    let valid = true;
    let newErrors = {};
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
    setErrors(newErrors);
    return valid;
  };

  const handleNext = async () => {
    console.log('DriverRegistrationScreen handleNext called');
    console.log('formData:', formData);
    
    if (validateForm()) {
      setLoading(true);
      try {
        // التحقق من وجود البريد الإلكتروني في طلبات التسجيل
        const { data: existingRequest, error: requestError } = await supabase
          .from('registration_requests')
          .select('*')
          .eq('email', formData.email)
          .single();

        if (existingRequest) {
          if (existingRequest.status === 'pending') {
            Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل بالفعل وفي انتظار الموافقة من الإدارة.', [
              {
                text: 'عرض حالة الطلب',
                onPress: () => navigation.replace('UnifiedPendingApproval', { email: formData.email, user_type: existingRequest.user_type })
              },
              {
                text: 'إلغاء',
                style: 'cancel'
              }
            ]);
            setLoading(false);
            return;
          } else if (existingRequest.status === 'approved') {
            Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل وتمت الموافقة عليه. يمكنك تسجيل الدخول مباشرة.', [
              {
                text: 'تسجيل الدخول',
                onPress: () => navigation.replace('Login')
              }
            ]);
            setLoading(false);
            return;
          } else if (existingRequest.status === 'rejected') {
            Alert.alert('تم رفض الطلب السابق', `تم رفض طلب تسجيل سابق لهذا البريد. السبب: ${existingRequest.rejection_reason || 'غير محدد'}`, [
              { text: 'حسناً' }
            ]);
            setLoading(false);
            return;
          }
        }

        // التحقق من وجود البريد في جدول السائقين
        const { data: existingDriver, error: driverError } = await supabase
          .from('drivers')
          .select('*')
          .eq('email', formData.email)
          .single();

        if (existingDriver) {
          Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل بالفعل كسائق. يمكنك تسجيل الدخول مباشرة.', [
            {
              text: 'تسجيل الدخول',
              onPress: () => navigation.replace('Login')
            }
          ]);
          setLoading(false);
          return;
        }

        // التحقق من وجود البريد في جدول المتاجر
        const { data: existingStore, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('email', formData.email)
          .single();

        if (existingStore) {
          Alert.alert('البريد مسجل', 'هذا البريد الإلكتروني مسجل بالفعل كمتجر. يمكنك تسجيل الدخول مباشرة.', [
            {
              text: 'تسجيل الدخول',
              onPress: () => navigation.replace('Login')
            }
          ]);
          setLoading(false);
          return;
        }

        console.log('Form validation passed, navigating to DriverDocuments');
        try {
          console.log('Attempting navigation to DriverDocuments with formData:', formData);
          navigation.navigate('DriverDocuments', { formData });
          console.log('Navigation to DriverDocuments successful');
        } catch (navError) {
          console.error('Navigation error:', navError);
          Alert.alert('خطأ في التنقل', 'حدث خطأ أثناء الانتقال لصفحة المستندات');
        }
        
      } catch (error) {
        console.error('Validation error:', error);
        Alert.alert('خطأ', 'حدث خطأ في التحقق من البيانات');
      }
      setLoading(false);
    } else {
      console.log('Form validation failed');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تسجيل كابتن جديد</Text>
          <View style={{width: 24}} />
        </View>

        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Ionicons name="bicycle" size={80} color={colors.primary} />
            <Text style={styles.logoText}>Fivo</Text>
            <Text style={styles.subtitle}>انضم إلينا ككابتن</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>معلومات الحساب</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.dark} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="أدخل بريدك الإلكتروني"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.dark} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="أدخل كلمة المرور"
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.dark} 
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.dark} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="أعد إدخال كلمة المرور"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={colors.dark} 
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            <View style={styles.infoCard}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                ستتم مراجعة طلبك من قبل الإدارة قبل الموافقة على حسابك
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={colors.gradient}
                style={styles.gradientButton}
              >
                <Text style={styles.nextButtonText}>التالي</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.secondary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.secondary,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.dark,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.dark,
  },
  eyeButton: {
    padding: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    lineHeight: 20,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
    marginRight: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginTop: 4,
    marginRight: 8,
    textAlign: 'right',
  },
}); 