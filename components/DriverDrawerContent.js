import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import colors from '../colors';

export default function DriverDrawerContent({ navigation, state }) {
  const [driverInfo, setDriverInfo] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    debtPoints: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) return;

      // جلب بيانات السائق
      const { data: driver } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (driver) {
        setDriverInfo(driver);
        setStats({
          totalOrders: driver.total_orders || 0,
          completedOrders: driver.completed_orders || 0,
          debtPoints: driver?.debt_points || 0
        });
      }

      // جلب الطلبات وحساب الإحصائيات
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driverId);

      if (orders) {
        const totalOrders = orders.length;
        const completedOrders = orders.filter(order => order.status === 'completed').length;
        const today = new Date().toISOString().substring(0, 10);
        const todayEarnings = orders
          .filter(order => (order.actual_delivery_time || '').substring(0, 10) === today)
          .reduce((sum, order) => sum + (order.total_amount || 0), 0);

        setStats({
          totalOrders,
          completedOrders,
          debtPoints: driver?.debt_points || 0
        });
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات السائق:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          onPress: async () => {
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('userType');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        }
      ]
    );
  };

  const menuItems = [
    { name: 'DriverDashboard', label: 'الرئيسية', icon: 'home-outline' },
    { name: 'MyOrders', label: 'طلباتي', icon: 'bicycle' },
    { name: 'DriverProfile', label: 'الملف الشخصي', icon: 'person-outline' },
    { name: 'FinancialAccounts', label: 'الحسابات المالية', icon: 'card-outline' },
    { name: 'Rewards', label: 'المكافآت', icon: 'gift-outline' },
    { name: 'SupportChat', label: 'الدعم الفني', icon: 'chatbubble-outline' },
    { name: 'DriverNotifications', label: 'الإشعارات', icon: 'notifications-outline' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  const maxDebtPoints = 10; // Assuming a default max debt points for this example
  function isWithinWorkHours() {
    if (!driverInfo?.work_start_time || !driverInfo?.work_end_time) return true;
    const now = new Date();
    const [startH, startM] = driverInfo.work_start_time.split(':').map(Number);
    const [endH, endM] = driverInfo.work_end_time.split(':').map(Number);
    const start = new Date(now);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(now);
    end.setHours(endH, endM, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);
    return now >= start && now <= end;
  }
  const isOutOfWorkHours = driverInfo && !isWithinWorkHours();
  const isBlocked = driverInfo?.is_suspended || (driverInfo?.debt_points >= maxDebtPoints) || isOutOfWorkHours;

  return (
    <View style={styles.container}>
      {/* Header مع معلومات السائق */}
      <LinearGradient
        colors={colors.gradient}
        style={styles.header}
      >
        <Image 
          source={{ uri: 'https://i.ibb.co/svdQ0fdc/IMG-20250623-233435-969.jpg' }} 
          style={styles.avatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{driverInfo?.name || 'اسم السائق'}</Text>
          <Text style={styles.userPhone}>{driverInfo?.phone || 'رقم الهاتف'}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: driverInfo?.is_active ? colors.success : colors.danger }]} />
            <Text style={styles.statusText}>
              {driverInfo?.is_active ? 'متاح للعمل' : 'غير متاح'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {isOutOfWorkHours && (
        <View style={{padding: 12, backgroundColor: '#FFF3E0', borderRadius: 8, marginVertical: 8}}>
          <Text style={{color: colors.warning, fontWeight: 'bold', textAlign: 'center'}}>
            أنت خارج أوقات العمل المحددة من الإدارة. يرجى الالتزام بجدول الدوام.
          </Text>
        </View>
      )}
      {/* إذا كان السائق موقوفًا، لا تعرض زر تفعيل العمل */}
      {!isBlocked && (
        // باقي عناصر القائمة الجانبية (زر متصل/غير متصل ...)
        <>
          <ScrollView style={styles.content}>
            {/* الإحصائيات */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>الإحصائيات</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="list-outline" size={24} color={colors.info} />
                  <Text style={styles.statNumber}>{stats.totalOrders}</Text>
                  <Text style={styles.statLabel}>إجمالي الطلبات</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                  <Text style={styles.statNumber}>{stats.completedOrders}</Text>
                  <Text style={styles.statLabel}>مكتملة</Text>
                </View>
                
                {/* نقاط الديون */}
                <View style={[styles.debtCard, stats.debtPoints > 10 ? styles.debtWarning : null]}>
                  <Ionicons 
                    name={stats.debtPoints > 10 ? "warning-outline" : "card-outline"} 
                    size={24} 
                    color={stats.debtPoints > 10 ? colors.danger : colors.primary} 
                  />
                  <View style={styles.debtInfo}>
                    <Text style={styles.debtLabel}>نقاط الديون</Text>
                    <Text style={[styles.debtNumber, stats.debtPoints > 10 ? styles.debtWarningText : null]}>
                      {stats.debtPoints} نقطة
                    </Text>
                    <Text style={styles.debtValue}>
                      ({stats.debtPoints * 250} دينار)
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* قائمة التنقل */}
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>القائمة</Text>
              
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    state.index === index && styles.activeMenuItem
                  ]}
                  onPress={() => navigation.navigate(item.name)}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color={state.index === index ? colors.primary : colors.dark} 
                  />
                  <Text style={[
                    styles.menuText,
                    state.index === index && styles.activeMenuText
                  ]}>
                    {item.label}
                  </Text>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={state.index === index ? colors.primary : colors.dark} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* زر تسجيل الخروج */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={colors.danger} />
            <Text style={styles.logoutText}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  loadingText: {
    fontSize: 16,
    color: colors.dark,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.secondary,
    marginBottom: 12,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.secondary,
    opacity: 0.9,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.dark,
    marginTop: 4,
    textAlign: 'center',
  },
  debtCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debtWarning: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerGradient[1],
  },
  debtInfo: {
    marginLeft: 12,
    flex: 1,
  },
  debtLabel: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 4,
  },
  debtNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  debtWarningText: {
    color: colors.danger,
  },
  debtValue: {
    fontSize: 12,
    color: colors.dark,
    opacity: 0.7,
  },
  menuSection: {
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeMenuItem: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
    marginLeft: 12,
  },
  activeMenuText: {
    color: colors.secondary,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 