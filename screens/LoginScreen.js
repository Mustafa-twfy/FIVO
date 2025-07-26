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
  Image,
} from 'react-native';
import { supabase } from '../supabase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);



  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    
    try {
      console.log('=== بداية عملية تسجيل الدخول ===');
      console.log('البريد الإلكتروني:', email);
      
      // تحقق الأدمن (بريد خاص)
      if (email === 'nmcmilli07@gmail.com' && password === 'admin1234') {
        console.log('تسجيل دخول الأدمن');
        await AsyncStorage.setItem('userType', 'admin');
        Alert.alert('مرحباً بك أيها الأدمن!');
        navigation.replace('AdminDashboard');
        setLoading(false);
        return;
      }

      console.log('=== التحقق من طلبات التسجيل ===');
      // التحقق من وجود طلب تسجيل معلق أولاً
      const { data: pendingRequest, error: requestError } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      console.log('نتيجة البحث في طلبات التسجيل:', { pendingRequest, requestError });

      if (requestError && requestError.code !== 'PGRST116') {
        console.error('خطأ في البحث في طلبات التسجيل:', requestError);
        Alert.alert('خطأ', 'حدث خطأ في التحقق من طلبات التسجيل');
        setLoading(false);
        return;
      }

      if (pendingRequest) {
        console.log('تم العثور على طلب تسجيل:', pendingRequest);
        if (pendingRequest.status === 'pending') {
          Alert.alert('انتظار الموافقة', 'يرجى انتظار موافقة الإدارة على حسابك');
          navigation.replace('UnifiedPendingApproval', { email, user_type: pendingRequest.user_type, password });
          setLoading(false);
          return;
        } else if (pendingRequest.status === 'rejected') {
          await deleteUserEverywhere(email);
          Alert.alert('تم رفض طلبك', `تم رفض طلب تسجيلك. السبب: ${pendingRequest.rejection_reason || 'غير محدد'}`, [
            { text: 'حسناً', onPress: () => navigation.replace('Login') }
          ]);
          setLoading(false);
          return;
        }
      } else {
        console.log('لا يوجد طلب تسجيل معلق');
      }

      console.log('=== التحقق من جدول السائقين ===');
      // تحقق السائق
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('status', 'approved')
        .single();
      
      console.log('نتيجة البحث في جدول السائقين:', { driver, driverError });
      console.log('البريد الإلكتروني المدخل:', email);
      console.log('كلمة المرور المدخلة:', password);
      
      if (driverError && driverError.code !== 'PGRST116') {
        console.error('خطأ في البحث في جدول السائقين:', driverError);
      }
      
      if (driver) {
        console.log('تم العثور على سائق:', driver);
        await AsyncStorage.setItem('userId', driver.id.toString());
        await AsyncStorage.setItem('userType', 'driver');
        // حساب تاريخ انتهاء الجلسة بعد 7 أيام
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        login(driver, 'driver', expiry.toISOString());
        console.log('تم العثور على سائق، توجيه لـ DriverDrawer');
        Alert.alert('نجح تسجيل الدخول', `مرحباً بك ${driver.name || ''}!`);
        navigation.replace('Driver', { driverId: driver.id });
        setLoading(false);
        return;
      } else {
        console.log('لم يتم العثور على سائق بهذه البيانات');
        // جلب جميع السائقين للتحقق
        const { data: allDrivers } = await supabase
          .from('drivers')
          .select('email, status, name')
          .limit(10);
        console.log('جميع السائقين في قاعدة البيانات:', allDrivers);
      }

      console.log('=== التحقق من جدول المتاجر ===');
      // تحقق المتجر
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .eq('is_active', true)
        .single();
      
      console.log('نتيجة البحث في جدول المتاجر:', { store, storeError });
      
      if (storeError && storeError.code !== 'PGRST116') {
        console.error('خطأ في البحث في جدول المتاجر:', storeError);
      }
      
      if (store) {
        await AsyncStorage.setItem('userId', store.id.toString());
        await AsyncStorage.setItem('userType', 'store');
        // حساب تاريخ انتهاء الجلسة بعد 7 أيام
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        login(store, 'store', expiry.toISOString());
        console.log('تم العثور على متجر، توجيه لـ StoreDrawer');
        Alert.alert('نجح تسجيل الدخول', `مرحباً بك ${store.name || ''}!`);
        navigation.replace('Store', { storeId: store.id });
        setLoading(false);
        return;
      }

      console.log('=== لم يتم العثور على حساب صالح ===');
      console.log('ملخص البحث:');
      console.log('- طلب تسجيل معلق:', pendingRequest ? 'نعم' : 'لا');
      console.log('- سائق معتمد:', driver ? 'نعم' : 'لا');
      console.log('- متجر نشط:', store ? 'نعم' : 'لا');
      
      Alert.alert('خطأ في تسجيل الدخول', 'بيانات الدخول غير صحيحة أو لم تتم الموافقة بعد');
    } catch (error) {
      console.error('=== خطأ عام في عملية تسجيل الدخول ===');
      console.error('نوع الخطأ:', error.constructor.name);
      console.error('رسالة الخطأ:', error.message);
      console.error('تفاصيل الخطأ:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول: ' + error.message);
    } finally {
      console.log('=== انتهاء عملية تسجيل الدخول ===');
      setLoading(false);
    }
  };

  const handleRegister = (userType) => {
    if (userType === 'driver') {
      navigation.navigate('DriverRegistration');
    } else if (userType === 'store') {
      navigation.navigate('StoreRegistration');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userType');
    navigation.replace('Login');
  };



  // أضف دالة حذف بيانات المستخدم من جميع الجداول عند الرفض
  const deleteUserEverywhere = async (email) => {
    await supabase.from('registration_requests').delete().eq('email', email);
    await supabase.from('drivers').delete().eq('email', email);
    await supabase.from('stores').delete().eq('email', email);
    // أضف أي جداول أخرى مرتبطة إذا لزم الأمر
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="bicycle" size={80} color={colors.primary} />
          <Text style={styles.logoText}>Fivo</Text>
          <Text style={styles.subtitle}>خدمة التوصيل الأسرع والأفضل</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>تسجيل الدخول</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.dark} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.dark} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.dark}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.registerTitle}>إنشاء حساب جديد</Text>
          
          <View style={styles.registerButtons}>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => handleRegister('driver')}
            >
              <Ionicons name="bicycle" size={24} color={colors.primary} />
              <Text style={styles.registerButtonText}>سائق</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => handleRegister('store')}
            >
              <Ionicons name="storefront-outline" size={24} color={colors.primary} />
              <Text style={styles.registerButtonText}>متجر</Text>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.dark,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: colors.dark,
    textAlign: 'right',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: colors.secondary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: colors.dark,
    fontSize: 16,
  },
  registerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  registerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
}); 