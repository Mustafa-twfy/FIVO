import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import colors from '../colors';

export default function PendingApprovalScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState('pending');
  const [userType, setUserType] = useState('driver');
  
  const { email, user_type } = route.params || {};

  useEffect(() => {
    if (email) {
      checkRequestStatus();
    }
  }, [email]);

  const checkRequestStatus = async () => {
    setLoading(true);
    try {
      // التحقق من حالة الطلب
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
        
        // إذا تمت الموافقة، توجيه المستخدم للواجهة المناسبة
        if (request.status === 'approved') {
          handleApprovedUser(request);
        } else if (request.status === 'rejected') {
          Alert.alert(
            'تم رفض الطلب',
            `تم رفض طلب تسجيلك. السبب: ${request.rejection_reason || 'غير محدد'}`,
            [
              {
                text: 'حسناً',
                onPress: () => navigation.navigate('Login')
              }
            ]
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
      if (request.user_type === 'driver') {
        // التحقق من وجود السائق في جدول السائقين
        const { data: driver } = await supabase
          .from('drivers')
          .select('*')
          .eq('email', email)
          .single();

        if (driver) {
          Alert.alert(
            'تمت الموافقة',
            'تمت الموافقة على طلبك! يمكنك الآن تسجيل الدخول.',
            [
              {
                text: 'تسجيل الدخول',
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
        }
      } else if (request.user_type === 'store') {
        // التحقق من وجود المتجر في جدول المتاجر
        const { data: store } = await supabase
          .from('stores')
          .select('*')
          .eq('email', email)
          .single();

        if (store) {
          Alert.alert(
            'تمت الموافقة',
            'تمت الموافقة على طلبك! يمكنك الآن تسجيل الدخول.',
            [
              {
                text: 'تسجيل الدخول',
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error handling approved user:', error);
    }
  };

  const getIconName = () => {
    return userType === 'driver' ? 'bicycle' : 'storefront-outline';
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

        <View style={styles.contactCard}>
          <Ionicons name="call-outline" size={24} color={colors.primary} />
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>للمساعدة</Text>
            <Text style={styles.contactText}>
              إذا كان لديك أي استفسار، يمكنك التواصل مع الدعم الفني
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.supportButton}
          onPress={() => navigation.navigate('SupportChat')}
        >
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.gradientButton}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.secondary} />
            <Text style={styles.supportButtonText}>تواصل مع الدعم الفني</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={checkRequestStatus}
        >
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.gradientButton}
          >
            <Ionicons name="refresh" size={20} color={colors.secondary} />
            <Text style={styles.supportButtonText}>تحديث حالة الطلب</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
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
    backgroundColor: '#4CAF50'
  },
  currentStep: {
    backgroundColor: '#FF9800'
  },
  pendingStep: {
    backgroundColor: '#ccc'
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
  contactCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  contactContent: {
    flex: 1,
    marginLeft: 12
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4
  },
  contactText: {
    fontSize: 14,
    color: colors.dark,
    lineHeight: 20
  },
  supportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8
  },
  refreshButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 16
  },
  loginButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 20
  }
}); 