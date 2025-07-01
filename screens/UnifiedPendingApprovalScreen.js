import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import colors from '../colors';

export default function UnifiedPendingApprovalScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState('pending');
  const [userType, setUserType] = useState('driver');
  const pollingRef = useRef(null);
  
  const { email, user_type, password } = route.params || {};

  useEffect(() => {
    if (email) {
      checkRequestStatus();
      pollingRef.current = setInterval(() => {
        checkRequestStatus();
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [email]);

  const checkRequestStatus = async () => {
    setLoading(true);
    try {
      const { data: request, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('Error checking request status:', error);
        return;
      }

      if (request) {
        setRequestStatus(request.status);
        setUserType(request.user_type);
        
        if (request.status === 'approved') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          handleApprovedUser(request);
        } else if (request.status === 'rejected') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          Alert.alert(
            'تم رفض الطلب',
            `تم رفض طلب تسجيلك. السبب: ${request.rejection_reason || 'غير محدد'}`,
            [{ text: 'حسناً', onPress: () => navigation.navigate('Login') }]
          );
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovedUser = async (request) => {
    try {
      let loginTable = request.user_type === 'driver' ? 'drivers' : 'stores';
      let userPassword = password || request.password;
      if (!userPassword) {
        Alert.alert(
          'تمت الموافقة',
          'تمت الموافقة على طلبك! يرجى تسجيل الدخول يدويًا.',
          [{ text: 'تسجيل الدخول', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }
      const { data: user, error } = await supabase
        .from(loginTable)
        .select('*')
        .eq('email', email)
        .eq('password', userPassword)
        .single();
      if (error || !user) {
        Alert.alert(
          'تمت الموافقة',
          'تمت الموافقة على طلبك! يرجى تسجيل الدخول يدويًا.',
          [{ text: 'تسجيل الدخول', onPress: () => navigation.navigate('Login') }]
        );
        return;
      }
      if (request.user_type === 'driver') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'DriverDashboardScreen', params: { user } }],
        });
      } else if (request.user_type === 'store') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'StoreDashboardScreen', params: { user } }],
        });
      }
    } catch (error) {
      console.error('Error handling approved user:', error);
      Alert.alert(
        'خطأ',
        'حدث خطأ أثناء تسجيل الدخول التلقائي. يرجى تسجيل الدخول يدويًا.',
        [{ text: 'تسجيل الدخول', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  const getIconName = () => {
    return userType === 'driver' ? 'car-sport' : 'storefront-outline';
  };

  const getTitle = () => {
    return userType === 'driver' ? 'طلب تسجيل السائق قيد المراجعة' : 'طلب تسجيل المتجر قيد المراجعة';
  };

  const getDescription = () => {
    return userType === 'driver' 
      ? 'تم إرسال طلب تسجيلك كسائق بنجاح وسيتم مراجعته من قبل الإدارة خلال 24-48 ساعة عمل.'
      : 'تم إرسال طلب تسجيل متجرك بنجاح وسيتم مراجعته من قبل الإدارة خلال 24-48 ساعة عمل.';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري التحقق من حالة الطلب...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>انتظار الموافقة</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={getIconName()} size={120} color={colors.primary} />
        </View>

        <Text style={styles.title}>{getTitle()}</Text>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={colors.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>معلومات مهمة</Text>
            <Text style={styles.infoText}>{getDescription()}</Text>
          </View>
        </View>

        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>مراحل المراجعة:</Text>
          
          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.completedStep]}>
              <Ionicons name="checkmark" size={20} color={colors.secondary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>تم إرسال الطلب</Text>
              <Text style={styles.stepDescription}>تم استلام طلبك بنجاح</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.currentStep]}>
              <Ionicons name="time" size={20} color={colors.secondary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>قيد المراجعة</Text>
              <Text style={styles.stepDescription}>الإدارة تدرس طلبك</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.pendingStep]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.dark} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>الموافقة</Text>
              <Text style={styles.stepDescription}>ستتم الموافقة على طلبك</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={checkRequestStatus}
        >
          <LinearGradient
            colors={colors.gradient}
            style={styles.gradientButton}
          >
            <Ionicons name="refresh" size={20} color={colors.secondary} />
            <Text style={styles.buttonText}>تحديث حالة الطلب</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>العودة لتسجيل الدخول</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark
  },
  backButton: {
    padding: 8
  },
  content: {
    flexGrow: 1,
    padding: 20
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 30
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  infoContent: {
    flex: 1,
    marginLeft: 12
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4
  },
  infoText: {
    fontSize: 14,
    color: colors.dark,
    lineHeight: 20
  },
  stepsContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  completedStep: {
    backgroundColor: colors.primary
  },
  currentStep: {
    backgroundColor: colors.primary
  },
  pendingStep: {
    backgroundColor: colors.dark
  },
  stepContent: {
    flex: 1
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 2
  },
  stepDescription: {
    fontSize: 14,
    color: colors.dark
  },
  refreshButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginRight: 8
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 16
  },
  loginButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold'
  }
}); 