import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, systemSettingsAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorMessage from '../components/ErrorMessage';
import colors from '../colors';

export default function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [debtPointValue, setDebtPointValue] = useState(250);
  const [maxDebtPoints, setMaxDebtPoints] = useState(20);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [itemLoading, setItemLoading] = useState({});
  const [error, setError] = useState(null);
  const [completedOrdersList, setCompletedOrdersList] = useState([]);

  useEffect(() => {
    loadDriverInfo();
    loadMyOrders();
    // جلب الطلبات المكتملة من سجل السائق
    if (driverInfo?.completed_orders_list) {
      setCompletedOrdersList(driverInfo.completed_orders_list);
    }
    const fetchSettings = async () => {
      setSettingsLoading(true);
      const { data, error } = await systemSettingsAPI.getSystemSettings();
      if (data) {
        setDebtPointValue(data.debt_point_value);
        setMaxDebtPoints(data.max_debt_points);
      }
      setSettingsLoading(false);
    };
    fetchSettings();

    // تحديث الطلبات كل 15 ثانية
    const interval = setInterval(() => {
      loadMyOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (driverInfo?.completed_orders_list) {
      setCompletedOrdersList(driverInfo.completed_orders_list);
    }
  }, [driverInfo]);

  const loadDriverInfo = async () => {
    try {
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) {
        return;
      }

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) {
        throw error;
      }

      setDriverInfo(data);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل معلومات السائق');
    }
  };

  const loadMyOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) {
        throw new Error('لم يتم العثور على معرف السائق');
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores (
            id,
            name,
            phone,
            address,
            description
          )
        `)
        .eq('driver_id', driverId)
        .in('status', ['accepted', 'in_progress', 'completed'])
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error('تعذر جلب الطلبات: ' + error.message);
      }

      // فلترة الطلبات المكتملة حسب الوقت
      const now = new Date();
      const filtered = (data || []).filter(order => {
        if (order.status === 'completed' && order.completed_at) {
          const completedAt = new Date(order.completed_at);
          const diff = now - completedAt;
          // 24 ساعة = 86400000 مللي ثانية
          if (diff > 86400000) {
            // حذف الطلب من قاعدة البيانات إذا مضى عليه أكثر من 24 ساعة
            supabase.from('orders').delete().eq('id', order.id);
            return false;
          }
        }
        return true;
      });

      setOrders(filtered);
      // احذف setCompletedOrdersList وكل قسم الطلبات المكتملة من الواجهة
    } catch (error) {
      setError(error.message || 'حدث خطأ غير متوقع في تحميل الطلبات');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyOrders();
    setRefreshing(false);
  };

  const completeOrder = async (orderId) => {
    try {
      const currentOrder = orders.find(o => o.id === orderId);
      if (!currentOrder) {
        throw new Error('لم يتم العثور على الطلب');
      }

      const driverId = await AsyncStorage.getItem('userId');
      if (currentOrder.driver_id !== parseInt(driverId)) {
        throw new Error('هذا الطلب لا يخصك');
      }

      if (currentOrder.status !== 'accepted') {
        Alert.alert('خطأ', 'لا يمكن إكمال هذا الطلب');
        return;
      }

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        throw new Error('فشل في إكمال الطلب: ' + error.message);
      }

      const deliveryFee = currentOrder.delivery_fee || 0;
      await supabase
        .from('drivers')
        .update({ 
          total_orders: (driverInfo?.total_orders || 0) + 1,
          total_earnings: (driverInfo?.total_earnings || 0) + deliveryFee
        })
        .eq('id', driverId);

      // إشعار المتجر بإكمال الطلب
      await supabase
        .from('store_notifications')
        .insert({
          store_id: currentOrder.store_id,
          title: 'تم توصيل الطلب',
          message: `تم توصيل طلبك رقم #${orderId} بنجاح من قبل السائق.`,
          type: 'order'
        });

      Alert.alert('نجح', 'تم إكمال الطلب بنجاح');
      loadMyOrders();
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع في إكمال الطلب');
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'accepted': return colors.success;
      case 'completed': return colors.info;
      case 'cancelled': return colors.danger;
      default: return colors.text;
    }
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'accepted': return 'مقبول';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return 'غير محدد';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})} ${date.toLocaleTimeString('ar-IQ', {hour: '2-digit', minute: '2-digit'})}`;
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>طلب #{item.id}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getOrderStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.storeInfo}>
        <Ionicons name="business-outline" size={20} color={colors.text} />
        <Text style={styles.storeName}>{item.stores?.name || 'متجر غير محدد'}</Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.detailsTitle}>تفاصيل الطلب:</Text>
        <Text style={styles.detailsText}>{item.description || 'لا يوجد تفاصيل'}</Text>
      </View>

      <View style={styles.addressInfo}>
        <Ionicons name="location-outline" size={20} color={colors.text} />
        <Text style={styles.addressText}>{item.address || 'عنوان غير محدد'}</Text>
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.amountInfo}>
          <Text style={styles.amountLabel}>المبلغ:</Text>
          <Text style={styles.amountValue}>{((item.amount || 0) / 1000).toFixed(2)} ألف دينار</Text>
        </View>
        
        {item.status === 'accepted' && (
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => completeOrder(item.id)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.textOnPrimary} />
            <Text style={styles.completeButtonText}>إكمال الطلب</Text>
          </TouchableOpacity>
        )}

        {item.status === 'completed' && (
          <View style={styles.completedInfo}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.completedText}>تم الإكمال</Text>
          </View>
        )}
      </View>

      {item.accepted_at && (
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>تم القبول في:</Text>
          <Text style={styles.timeValue}>{formatDate(item.accepted_at)}</Text>
        </View>
      )}

      {item.completed_at && (
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>تم الإكمال في:</Text>
          <Text style={styles.timeValue}>{formatDate(item.completed_at)}</Text>
        </View>
      )}
    </View>
  );

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

  if (settingsLoading || loading) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{marginTop:12}}>جاري تحميل الإعدادات...</Text>
      </View>
    );
  }
  if (error) {
    return <ErrorMessage message={error} suggestion="يرجى التحقق من اتصالك بالإنترنت أو إعادة المحاولة." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.warning]}
            tintColor={colors.warning}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle" size={80} color={colors.text} />
            <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
            <Text style={styles.emptySubtitle}>
              لم تقبل أي طلبات بعد.
            </Text>
            {/* تم حذف زر الطلبات المتاحة */}
          </View>
        }
      />

      {isOutOfWorkHours ? (
        <View style={styles.driverInfoCard}>
          <Text style={styles.driverName}>{driverInfo?.name}</Text>
          <Text style={styles.warningText}>
            أنت خارج أوقات العمل المحددة من الإدارة. يرجى الالتزام بجدول الدوام.
          </Text>
        </View>
      ) : isBlocked ? (
        <View style={styles.driverInfoCard}>
          <Text style={styles.driverName}>{driverInfo?.name}</Text>
          <Text style={styles.warningText}>
            تم إيقافك مؤقتًا بسبب تجاوز حد الديون. يرجى تصفير الديون للعودة للعمل.
          </Text>
        </View>
      ) : (
        // باقي محتوى الشاشة: الطلبات الخاصة بي
        <>
          {driverInfo && (
            <View style={styles.driverInfoCard}>
              <Text style={styles.driverName}>{driverInfo.name}</Text>
              <Text style={styles.driverStatus}>
                الحالة: {driverInfo.is_active ? 'متصل' : 'غير متصل'}
              </Text>
              <Text style={styles.debtInfo}>
                نقاط الديون: {driverInfo.debt_points || 0} نقطة ({driverInfo.total_debt || 0} دينار)
              </Text>
              {driverInfo.debt_points >= maxDebtPoints && (
                <Text style={styles.warningText}>
                  ⚠️ لا يمكنك العمل - تجاوزت الحد الأقصى للنقاط
                </Text>
              )}
            </View>
          )}
          {/* احذف قسم الطلبات المكتملة المنفصل */}
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 0,
  },
  headerRight: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    width: '90%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.primary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: colors.text,
    marginRight: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.warning,
  },
  completeButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  completeButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.text,
  },
  timeValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    backgroundColor: colors.secondary,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  goToAvailableButton: {
    borderColor: colors.primary,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  goToAvailableButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  driverInfoCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  driverStatus: {
    fontSize: 14,
    color: colors.text,
  },
  debtInfo: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: 'bold',
  },
  completedSection: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  completedTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#222' },
  completedCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, width: '100%', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#eee' },
  completedOrderId: { fontWeight: 'bold', fontSize: 16, color: '#2196F3', marginBottom: 4 },
  completedText: { fontSize: 15, color: '#333', marginBottom: 2 },
  noCompleted: { fontSize: 16, color: '#888', textAlign: 'center', marginTop: 12 },
}); 