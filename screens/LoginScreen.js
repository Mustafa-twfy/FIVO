import React, { useState, useEffect } from 'react';
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

const simsimLogo = { uri: 'https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg' };
// رابط دالة المصادقة على Supabase Functions (اختياري عبر متغير بيئة)
const AUTH_API_URL = process.env.EXPO_PUBLIC_AUTH_API_URL || '';
const USE_AUTH_FUNCTION = process.env.EXPO_PUBLIC_USE_AUTH_FUNCTION === 'true';
// تعطيل مهلة تسجيل الدخول: اجعل المهلة غير مفعلة افتراضيًا
const REQUEST_TIMEOUT_MS = 0;

const fetchWithTimeout = async (url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  let id = null;
  if (timeoutMs && timeoutMs > 0) {
    id = setTimeout(() => controller.abort(), timeoutMs);
  }
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    if (id) clearTimeout(id);
  }
};

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // تنظيف الإدخال: إزالة محارف اتجاه النص الخفية، تقليم، وتوحيد الأرقام العربية إلى لاتينية
  const toWesternDigits = (s) =>
    s
      .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0));
  // تنظيف موسّع: محارف RTL المخفية + ZWJ + NBSP + BOM + isolates
  const clean = (s) =>
    toWesternDigits(
      (s ?? '')
        .toString()
        .replace(/[\u200e\u200f\u200d\u202a-\u202e\u2066-\u2069\ufeff\u00a0]/g, '')
        .trim()
    );

  // ✅ استعادة جلسة محفوظة (إن وجدت) + توجيه فوري
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [userId, userType, sessionExpiry, sessionToken, userEmail] = await Promise.all([
          AsyncStorage.getItem('userId'),
          AsyncStorage.getItem('userType'),
          AsyncStorage.getItem('sessionExpiry'),
          AsyncStorage.getItem('sessionToken'),
          AsyncStorage.getItem('userEmail'),
        ]);

        if (!userId || !userType) return;

        // فحص انتهاء الجلسة (إن وُجدت)
        if (sessionExpiry) {
          const now = new Date();
          const exp = new Date(sessionExpiry);
          if (isNaN(exp.getTime()) || exp <= now) {
            // انتهت الجلسة
            await AsyncStorage.multiRemove(['userId', 'userType', 'sessionExpiry', 'sessionToken', 'userEmail']);
            return;
          }
        }

        // استدعاء login في الكونتكست (ببيانات متاحة) ثم توجيه
        const userObj = { id: Number(userId), email: userEmail || '' };
        await login(userObj, userType, sessionExpiry || null, sessionToken || null);
        redirectByRole(userType, Number(userId));
      } catch (_) {
        // تجاهل
      }
    };
    restoreSession();
  }, []);

  const redirectByRole = (role, id) => {
    if (role === 'admin') navigation.replace('AdminDashboard');
    else if (role === 'driver') navigation.replace('Driver', { driverId: id });
    else if (role === 'store' || role === 'restaurant') navigation.replace('Store', { storeId: id });
    else navigation.replace('UnifiedPendingApproval');
  };

  const persistSession = async (user, role, expiryDate, token) => {
    // حفظ الجلسة محليًا بالإضافة إلى login من الكونتكست
    await AsyncStorage.setItem('userId', String(user.id));
    await AsyncStorage.setItem('userType', role);
    await AsyncStorage.setItem('userEmail', user.email || '');
    if (token) await AsyncStorage.setItem('sessionToken', token);
    if (expiryDate) await AsyncStorage.setItem('sessionExpiry', expiryDate);

    await login(user, role, expiryDate || null, token || null);
  };

  // مطابقة متسامحة: تجلب السجل ثم تنظّف كلمة المرور من قاعدة البيانات وتقارن
  const tolerantFetchByEmail = async (table, email, rawPassword) => {
    try {
      const sel = table === 'drivers'
        ? 'id,name,email,phone,status,is_suspended,is_active,token,password'
        : 'id,name,email,is_active,token,password';
      const { data } = await supabase
        .from(table)
        .select(sel)
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      if (!data) return null;

      const dbRaw = ((data.password ?? '') + '');
      const dbClean = clean(dbRaw);
      const inputRaw = (rawPassword ?? '') + '';
      const inputClean = clean(inputRaw);
      if (dbRaw && dbRaw === inputRaw) return data;
      if (dbClean && dbClean === inputClean) return data;
      return null;
    } catch (_) {
      return null;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);

    try {
      console.log('=== بداية عملية تسجيل الدخول ===');
      const normalizedEmail = clean(email).toLowerCase();
      const cleanedPassword = clean(password);
      console.log('البريد الإلكتروني (بعد التطبيع):', normalizedEmail);

      // 1) محاولة API خارجي إن كانت مفعلة عبر متغير بيئة (بمهلة قصيرة)
      if (USE_AUTH_FUNCTION && AUTH_API_URL) {
        try {
          const resp = await fetchWithTimeout(`${AUTH_API_URL.replace(/\/$/, '')}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: normalizedEmail, password: cleanedPassword })
          });
          const json = await resp.json();
          if (resp.ok && json.token && json.role && json.user) {
            const { token, role, user, expires_at } = json;

            // حفظ الجلسة
            await persistSession(user, role, expires_at || null, token);

            // توجيه
            redirectByRole(role, user.id);
            setLoading(false);
            return;
          } else {
            console.warn('Auth API rejected credentials or responded unexpectedly', json);
            // نكمل للمنطق الداخلي
          }
        } catch (apiErr) {
          console.warn('Auth API call failed, falling back to built-in checks', apiErr);
          // نكمل للمنطق الداخلي
        }
      }

      // 2) حساب أدمن ثابت (إن وجد)
      if (email === 'nmcmilli07@gmail.com' && password === 'admin1234') {
        const adminUser = { id: 0, name: 'Admin', email };
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        const token = 'admin-token-placeholder';

        await persistSession(adminUser, 'admin', expiry.toISOString(), token);
        Alert.alert('مرحباً بك أيها الأدمن!');
        navigation.replace('AdminDashboard');
        setLoading(false);
        return;
      }

      // 3) التحقق من الحسابات
      const { data: pendingRequest, error: requestError } = await supabase
        .from('registration_requests')
        .select('email,status,user_type,password,rejection_reason')
        .ilike('email', normalizedEmail)
        .single();

      // 4) مطابقة متسامحة أولًا: نجلب السجل ثم نقارن clean(password)
      const driver = await tolerantFetchByEmail('drivers', normalizedEmail, password);
      const store = driver ? null : await tolerantFetchByEmail('stores', normalizedEmail, password);

      console.log('نتيجة السائق:', { found: !!driver });
      console.log('نتيجة المتجر:', { found: !!store });
      console.log('نتيجة طلب التسجيل:', { pendingRequest, requestError });

      // أولوية: السائق → المتجر → طلب تسجيل
      if (driver) {
        if (driver.status && driver.status !== 'approved') {
          Alert.alert('حساب غير مفعل', 'تم العثور على حساب سائق لكنه غير مفعل بعد. يرجى انتظار الموافقة.');
          navigation.replace('UnifiedPendingApproval', { email: normalizedEmail, user_type: 'driver', password });
          setLoading(false);
          return;
        }
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        const token = driver.token || 'driver-token-placeholder';
        await persistSession(driver, 'driver', expiry.toISOString(), token);
        navigation.replace('Driver', { driverId: driver.id });
        setLoading(false);
        return;
      }

      if (store) {
        if (store.is_active === false) {
          Alert.alert('حسابك غير مفعل', 'يرجى انتظار موافقة الإدارة على حساب المتجر.');
          navigation.replace('UnifiedPendingApproval', { email: normalizedEmail, user_type: 'store', password });
          setLoading(false);
          return;
        }
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 7);
        const token = store.token || 'store-token-placeholder';
        await persistSession(store, 'store', expiry.toISOString(), token);
        navigation.replace('Store', { storeId: store.id });
        setLoading(false);
        return;
      }

      // لا حاجة لمحاولة متسامحة ثانية؛ تم تطبيقها مسبقًا

      if (pendingRequest) {
        if (pendingRequest.status === 'pending') {
          Alert.alert('انتظار الموافقة', 'يرجى انتظار موافقة الإدارة على حسابك');
          navigation.replace('UnifiedPendingApproval', { email: normalizedEmail, user_type: pendingRequest.user_type, password });
          setLoading(false);
          return;
        } else if (pendingRequest.status === 'rejected') {
          await deleteUserEverywhere(normalizedEmail);
          Alert.alert('تم رفض طلبك', `تم رفض طلب تسجيلك. السبب: ${pendingRequest.rejection_reason || 'غير محدد'}`, [
            { text: 'حسناً', onPress: () => navigation.replace('Login') }
          ]);
          setLoading(false);
          return;
        }
      }

      // 6) لا يوجد حساب صالح
      // تحقّق إضافي لتقديم رسالة أدقّ
      const [{ data: driverByEmail }, { data: storeByEmail }] = await Promise.all([
        supabase.from('drivers').select('id,status').ilike('email', normalizedEmail).maybeSingle(),
        supabase.from('stores').select('id,is_active').ilike('email', normalizedEmail).maybeSingle(),
      ]);
      if (driverByEmail) {
        if (driverByEmail.status && driverByEmail.status !== 'approved') {
          Alert.alert('انتظار الموافقة', 'تم العثور على حساب سائق لكن لم تتم الموافقة بعد.');
          navigation.replace('UnifiedPendingApproval', { email: normalizedEmail, user_type: 'driver', password });
        } else {
          Alert.alert('خطأ في كلمة المرور', 'كلمة المرور غير صحيحة.');
        }
      } else if (storeByEmail) {
        if (storeByEmail.is_active === false) {
          Alert.alert('انتظار الموافقة', 'تم العثور على حساب متجر لكن لم تتم الموافقة بعد.');
          navigation.replace('UnifiedPendingApproval', { email: normalizedEmail, user_type: 'store', password });
        } else {
          Alert.alert('خطأ في كلمة المرور', 'كلمة المرور غير صحيحة.');
        }
      } else {
        Alert.alert('خطأ في تسجيل الدخول', 'لا يوجد حساب بهذا البريد. يرجى إنشاء حساب أولاً.');
      }
    } catch (error) {
      console.error('=== خطأ عام في عملية تسجيل الدخول ===', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول: ' + error.message);
    } finally {
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
    await AsyncStorage.multiRemove(['userId', 'userType', 'sessionExpiry', 'sessionToken', 'userEmail']);
    navigation.replace('Login');
  };

  // حذف بيانات المستخدم من كل الجداول عند الرفض
  const deleteUserEverywhere = async (email) => {
    await supabase.from('registration_requests').delete().eq('email', email);
    await supabase.from('drivers').delete().eq('email', email);
    await supabase.from('stores').delete().eq('email', email);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <View className="logoWrapper" style={styles.logoWrapper}>
            <Image source={simsimLogo} style={styles.logo} />
          </View>
          <Text style={styles.logoText}>سمسم</Text>
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
  logoWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70, // دائري تماماً
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: colors.primary,
    marginBottom: 15,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    borderRadius: 50, // دائري للصورة أيضاً
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
