import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../colors';

export default function StorePendingApprovalScreen({ navigation, route }) {
  const { formData, storeInfo, documents } = route.params || {};
  
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
          <Ionicons name="storefront-outline" size={120} color={colors.primary} />
        </View>

        <Text style={styles.title}>طلب تسجيل المتجر قيد المراجعة</Text>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={colors.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>معلومات مهمة</Text>
            <Text style={styles.infoText}>
              تم إرسال طلب تسجيل متجرك بنجاح وسيتم مراجعته من قبل الإدارة خلال 24-48 ساعة عمل.
            </Text>
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
              <Text style={styles.stepDescription}>تم استلام طلب تسجيل المتجر بنجاح</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.currentStep]}>
              <Ionicons name="time" size={20} color={colors.secondary} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>قيد المراجعة</Text>
              <Text style={styles.stepDescription}>الإدارة تدرس طلب المتجر</Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepIcon, styles.pendingStep]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.dark} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>الموافقة</Text>
              <Text style={styles.stepDescription}>ستتم الموافقة على طلب المتجر</Text>
            </View>
          </View>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>مزايا الانضمام كمتجر:</Text>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.benefitText}>إدارة الطلبات بسهولة</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.benefitText}>تتبع الإيرادات والمبيعات</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.benefitText}>دعم فني متخصص</Text>
          </View>
          <View style={styles.benefit}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            <Text style={styles.benefitText}>وصول لعملاء جدد</Text>
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
          onPress={() => navigation.navigate('StoreSupportChat')}
        >
          <LinearGradient
            colors={colors.gradient}
            style={styles.gradientButton}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.secondary} />
            <Text style={styles.supportButtonText}>تواصل مع الدعم الفني</Text>
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
  benefitsCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 16
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  benefitText: {
    fontSize: 14,
    color: colors.dark,
    marginLeft: 8
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
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