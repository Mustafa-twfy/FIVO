import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';

export default function DriverEarningsScreen({ navigation }) {
  const [driverId, setDriverId] = useState(null);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    todayEarnings: 0,
    thisWeekEarnings: 0,
    thisMonthEarnings: 0
  });
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, today, week, month

  useEffect(() => {
    const fetchDriverId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setDriverId(id);
      if (id) {
        loadDriverInfo(id);
        loadEarningsData(id);
      }
    };
    fetchDriverId();
  }, []);

  const loadDriverInfo = async (id) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setDriverInfo(data);
    } catch (error) {
      console.error('Error loading driver info:', error);
    }
  };

  const loadEarningsData = async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', id)
        .eq('status', 'completed');
      if (error) throw error;
      setCompletedOrders(data || []);
      // حساب الأرباح
      const totalEarnings = (data || []).reduce((sum, order) => sum + (order.driver_earnings || 0), 0);
      const today = new Date().toISOString().substring(0, 10);
      const todayEarnings = (data || []).filter(order => (order.completed_at || '').substring(0, 10) === today).reduce((sum, order) => sum + (order.driver_earnings || 0), 0);
      // الأسبوع الحالي
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString().substring(0, 10);
      const thisWeekEarnings = (data || []).filter(order => (order.completed_at || '').substring(0, 10) >= weekStart).reduce((sum, order) => sum + (order.driver_earnings || 0), 0);
      // الشهر الحالي
      const month = new Date().toISOString().substring(0, 7);
      const thisMonthEarnings = (data || []).filter(order => (order.completed_at || '').substring(0, 7) === month).reduce((sum, order) => sum + (order.driver_earnings || 0), 0);
      setEarnings({ totalEarnings, todayEarnings, thisWeekEarnings, thisMonthEarnings });
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarningsData();
    setRefreshing(false);
  };

  const getFilteredOrders = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    switch (selectedPeriod) {
      case 'today':
        return completedOrders.filter(order => new Date(order.completed_at) >= today);
      case 'week':
        return completedOrders.filter(order => new Date(order.completed_at) >= weekAgo);
      case 'month':
        return completedOrders.filter(order => new Date(order.completed_at) >= monthAgo);
      default:
        return completedOrders;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'today': return 'اليوم';
      case 'week': return 'هذا الأسبوع';
      case 'month': return 'هذا الشهر';
      default: return 'الكل';
    }
  };

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case 'today': return earnings.todayEarnings;
      case 'week': return earnings.thisWeekEarnings;
      case 'month': return earnings.thisMonthEarnings;
      default: return earnings.totalEarnings;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>جاري تحميل بيانات الأرباح...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الأرباح</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9800']}
            tintColor="#FF9800"
          />
        }
      >
        {/* إحصائيات الأرباح */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#4CAF50', '#4CAF50CC']}
              style={styles.statGradient}
            >
              <Ionicons name="cash-outline" size={32} color="#fff" />
              <Text style={styles.statNumber}>{earnings.totalEarnings}</Text>
              <Text style={styles.statLabel}>إجمالي الأرباح</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FF9800', '#FF9800CC']}
              style={styles.statGradient}
            >
              <Ionicons name="today-outline" size={32} color="#fff" />
              <Text style={styles.statNumber}>{earnings.todayEarnings}</Text>
              <Text style={styles.statLabel}>أرباح اليوم</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#2196F3', '#2196F3CC']}
              style={styles.statGradient}
            >
              <Ionicons name="calendar-outline" size={32} color="#fff" />
              <Text style={styles.statNumber}>{earnings.thisWeekEarnings}</Text>
              <Text style={styles.statLabel}>أرباح الأسبوع</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#9C27B0', '#9C27B0CC']}
              style={styles.statGradient}
            >
              <Ionicons name="calendar-outline" size={32} color="#fff" />
              <Text style={styles.statNumber}>{earnings.thisMonthEarnings}</Text>
              <Text style={styles.statLabel}>أرباح الشهر</Text>
            </LinearGradient>
          </View>
        </View>

        {/* فلتر الفترة */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>عرض الأرباح:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, selectedPeriod === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedPeriod('all')}
            >
              <Text style={[styles.filterButtonText, selectedPeriod === 'all' && styles.filterButtonTextActive]}>
                الكل
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedPeriod === 'today' && styles.filterButtonActive]}
              onPress={() => setSelectedPeriod('today')}
            >
              <Text style={[styles.filterButtonText, selectedPeriod === 'today' && styles.filterButtonTextActive]}>
                اليوم
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedPeriod === 'week' && styles.filterButtonActive]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text style={[styles.filterButtonText, selectedPeriod === 'week' && styles.filterButtonTextActive]}>
                الأسبوع
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedPeriod === 'month' && styles.filterButtonActive]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text style={[styles.filterButtonText, selectedPeriod === 'month' && styles.filterButtonTextActive]}>
                الشهر
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ملخص الفترة المحددة */}
        <View style={styles.periodSummary}>
          <Text style={styles.periodTitle}>ملخص {getPeriodText()}</Text>
          <View style={styles.periodStats}>
            <View style={styles.periodStat}>
              <Text style={styles.periodStatLabel}>عدد الطلبات:</Text>
              <Text style={styles.periodStatValue}>{getFilteredOrders().length}</Text>
            </View>
            <View style={styles.periodStat}>
              <Text style={styles.periodStatLabel}>إجمالي الأرباح:</Text>
              <Text style={styles.periodStatValue}>{getPeriodEarnings()} ألف دينار</Text>
            </View>
          </View>
        </View>

        {/* قائمة الطلبات المكتملة */}
        <Text style={styles.sectionTitle}>الطلبات المكتملة</Text>
        
        <View style={styles.ordersList}>
          {getFilteredOrders().map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderId}>طلب #{order.id}</Text>
                <Text style={styles.orderDate}>{formatDate(order.completed_at)}</Text>
              </View>
              
              <View style={styles.storeInfo}>
                <Ionicons name="business-outline" size={16} color="#666" />
                <Text style={styles.storeName}>{order.stores?.name || 'متجر غير محدد'}</Text>
              </View>
              
              <Text style={styles.orderDetails}>{order.description || 'لا يوجد تفاصيل'}</Text>
              
              <View style={styles.orderFooter}>
                <Text style={styles.orderAmount}>المبلغ: {order.amount || 0} ألف دينار</Text>
                <Text style={styles.earningsAmount}>أرباحي: {order.driver_earnings || 0} ألف دينار</Text>
              </View>
            </View>
          ))}
          
          {getFilteredOrders().length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="cash-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>لا توجد أرباح</Text>
              <Text style={styles.emptySubtitle}>
                لم تكمل أي طلبات في {getPeriodText().toLowerCase()} بعد
              </Text>
            </View>
          )}
        </View>

        {driverInfo && (
          <View style={styles.driverInfoCard}>
            <Text style={styles.driverName}>{driverInfo.name}</Text>
            <Text style={styles.driverStatus}>
              الحالة: {driverInfo.is_active ? 'متصل' : 'غير متصل'}
            </Text>
            <Text style={styles.debtInfo}>
              نقاط الديون: {driverInfo.debt_points || 0} نقطة ({driverInfo.total_debt || 0} دينار)
            </Text>
            {driverInfo.debt_points >= 40 && (
              <Text style={styles.warningText}>
                ⚠️ لا يمكنك العمل - تجاوزت الحد الأقصى للنقاط
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FF9800',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  periodSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  periodStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodStat: {
    alignItems: 'center',
    flex: 1,
  },
  periodStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  periodStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  ordersList: {
    marginBottom: 24,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  orderDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 14,
    color: '#666',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  driverInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  driverStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  debtInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
  },
}); 