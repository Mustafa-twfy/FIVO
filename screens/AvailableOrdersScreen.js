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
import { OrderPrioritySystem, OrderHelpers } from '../utils/orderPriority';

export default function AvailableOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [sortedOrders, setSortedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [debtPointValue, setDebtPointValue] = useState(250);
  const [maxDebtPoints, setMaxDebtPoints] = useState(20);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [orderSummary, setOrderSummary] = useState(null);

  useEffect(() => {
    loadDriverInfo();
    loadAvailableOrders();
    loadDriverLocation();
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
  }, []);

  // تحديث الطلبات المرتبة عند تغيير الطلبات أو موقع السائق
  useEffect(() => {
    if (orders.length > 0) {
      const sorted = OrderPrioritySystem.sortOrdersByPriority(orders, driverLocation);
      setSortedOrders(sorted);
      setOrderSummary(OrderPrioritySystem.generateOrderSummary(orders));
    } else {
      setSortedOrders([]);
      setOrderSummary(null);
    }
  }, [orders, driverLocation]);

  const loadDriverInfo = async () => {
    try {
      console.log('=== تحميل معلومات السائق ===');
      
      const driverId = await AsyncStorage.getItem('userId');
      if (!driverId) {
        console.log('لم يتم العثور على معرف السائق');
        return;
      }

      console.log('معرف السائق:', driverId);

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('خطأ في تحميل معلومات السائق:', error);
        throw error;
      }

      console.log('تم تحميل معلومات السائق:', data);
      setDriverInfo(data);
      
      // التحقق من حالة السائق
      if (!data.is_active) {
        Alert.alert(
          'تنبيه', 
          'حسابك غير مفعل. يرجى التواصل مع الإدارة لتفعيل الحساب.',
          [{ text: 'حسناً' }]
        );
      }

      if (data.debt_points >= maxDebtPoints) {
        Alert.alert(
          'تنبيه', 
          'لا يمكنك العمل - تجاوزت الحد الأقصى لنقاط الديون',
          [{ text: 'حسناً' }]
        );
      }

    } catch (error) {
      console.error('خطأ في تحميل معلومات السائق:', error);
      Alert.alert('خطأ', 'فشل في تحميل معلومات السائق');
    }
  };

  const loadDriverLocation = async () => {
    try {
      // محاولة الحصول على موقع السائق من AsyncStorage أو GPS
      const savedLocation = await AsyncStorage.getItem('driverLocation');
      if (savedLocation) {
        setDriverLocation(JSON.parse(savedLocation));
      }
    } catch (error) {
      console.error('خطأ في تحميل موقع السائق:', error);
    }
  };

  const loadAvailableOrders = async () => {
    setLoading(true);
    try {
      console.log('=== تحميل الطلبات المتاحة ===');
      
      // التحقق من حالة السائق أولاً
      if (driverInfo && (!driverInfo.is_active || driverInfo.debt_points >= maxDebtPoints)) {
        console.log('السائق غير مؤهل للعمل');
        setOrders([]);
        setLoading(false);
        return;
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
            description,
            category,
            location
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في تحميل الطلبات المتاحة:', error);
        throw new Error('تعذر جلب الطلبات المتاحة: ' + error.message);
      }

      // إضافة معلومات إضافية للطلبات
      const enhancedOrders = (data || []).map(order => ({
        ...order,
        store_category: order.stores?.category || 'أخرى',
        store_location: order.stores?.location,
        is_urgent: order.is_urgent || false,
        distance: driverLocation ? 
          OrderPrioritySystem.calculateDistance(
            driverLocation.latitude,
            driverLocation.longitude,
            order.stores?.location?.latitude || 0,
            order.stores?.location?.longitude || 0
          ) : null
      }));

      console.log('تم تحميل الطلبات المتاحة:', enhancedOrders.length, 'طلب');
      setOrders(enhancedOrders);
    } catch (error) {
      console.error('خطأ في تحميل الطلبات المتاحة:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع في تحميل الطلبات');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadAvailableOrders(),
      loadDriverLocation()
    ]);
    setRefreshing(false);
  };

  const acceptOrder = async (orderId) => {
    try {
      console.log('=== بداية قبول الطلب ===');
      console.log('معرف الطلب:', orderId);
      console.log('معرف السائق:', driverInfo?.id);

      if (!driverInfo?.id) {
        throw new Error('لم يتم العثور على معرف السائق');
      }

      // التحقق من حالة السائق مرة أخرى
      if (!driverInfo.is_active) {
        Alert.alert('خطأ', 'حسابك غير مفعل. لا يمكنك قبول الطلبات.');
        return;
      }

      if (driverInfo.debt_points >= maxDebtPoints) {
        Alert.alert('خطأ', 'لا يمكنك العمل - تجاوزت الحد الأقصى لنقاط الديون');
        return;
      }

      // التحقق من أن الطلب لا يزال متاحاً
      const { data: orderCheck, error: checkError } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (checkError) {
        throw new Error('فشل في التحقق من حالة الطلب');
      }

      if (orderCheck.status !== 'pending') {
        Alert.alert('خطأ', 'هذا الطلب لم يعد متاحاً');
        loadAvailableOrders(); // إعادة تحميل الطلبات
        return;
      }

      // قبول الطلب
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'accepted',
          driver_id: driverInfo.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('خطأ في قبول الطلب:', error);
        throw new Error('فشل في قبول الطلب: ' + error.message);
      }

      console.log('تم قبول الطلب بنجاح');

      // إرسال إشعار للمتجر
      await supabase
        .from('store_notifications')
        .insert({
          store_id: orders.find(o => o.id === orderId)?.store_id,
          title: 'تم قبول طلبك',
          message: `تم قبول طلبك رقم #${orderId} من قبل السائق ${driverInfo.name}`,
          type: 'order'
        });

      Alert.alert('نجح', 'تم قبول الطلب بنجاح');
      loadAvailableOrders(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('خطأ في قبول الطلب:', error);
      Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع في قبول الطلب');
    }
  };

  const getOrderStatusColor = (status) => OrderHelpers.getStatusColor(status);
  const getOrderStatusText = (status) => OrderHelpers.getStatusText(status);
  const formatDate = (dateString) => OrderHelpers.formatOrderTime(dateString);

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>طلب #{item.id}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.priorityInfo}>
          {item.is_urgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={styles.urgentText}>عاجل</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getOrderStatusText(item.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.storeInfo}>
        <Ionicons name="business-outline" size={20} color="#666" />
        <Text style={styles.storeName}>{item.stores?.name || 'متجر غير محدد'}</Text>
        {item.store_category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.store_category}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.detailsTitle}>تفاصيل الطلب:</Text>
        <Text style={styles.detailsText}>{item.description || 'لا يوجد تفاصيل'}</Text>
      </View>

      <View style={styles.addressInfo}>
        <Ionicons name="location-outline" size={20} color="#666" />
        <Text style={styles.addressText}>{item.address || 'عنوان غير محدد'}</Text>
      </View>

      <View style={styles.orderMetrics}>
        <View style={styles.metricItem}>
          <Ionicons name="cash-outline" size={16} color="#4CAF50" />
          <Text style={styles.metricText}>{OrderHelpers.formatAmount(item.total_amount)}</Text>
        </View>
        {item.distance && (
          <View style={styles.metricItem}>
            <Ionicons name="navigate-outline" size={16} color="#2196F3" />
            <Text style={styles.metricText}>{OrderHelpers.formatDistance(item.distance)}</Text>
          </View>
        )}
        {item.priority && (
          <View style={styles.metricItem}>
            <Ionicons name="star" size={16} color="#FF9800" />
            <Text style={styles.metricText}>أولوية: {item.priority}</Text>
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => acceptOrder(item.id)}
        >
          <Ionicons name="checkmark-outline" size={20} color="#fff" />
          <Text style={styles.acceptButtonText}>قبول الطلب</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (settingsLoading || loading) {
    return (
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{marginTop:12}}>جاري تحميل الإعدادات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الطلبات المتاحة</Text>
        <TouchableOpacity onPress={loadAvailableOrders} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {driverInfo && (
        <View style={styles.driverInfoCard}>
          <Text style={styles.driverName}>{driverInfo.name}</Text>
          <Text style={styles.driverStatus}>
            الحالة: {driverInfo.is_active ? 'متصل' : 'غير متصل'}
          </Text>
          <Text style={styles.debtInfo}>
            نقاط الديون: {driverInfo.debt_points || 0} نقطة ({(driverInfo.debt_points || 0) * debtPointValue} دينار)
          </Text>
          {driverInfo.debt_points >= maxDebtPoints && (
            <Text style={styles.warningText}>
              ⚠️ لا يمكنك العمل - تجاوزت الحد الأقصى للنقاط
            </Text>
          )}
        </View>
      )}

      {orderSummary && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>ملخص الطلبات المتاحة</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{orderSummary.totalOrders}</Text>
              <Text style={styles.summaryLabel}>إجمالي الطلبات</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{orderSummary.urgentOrders}</Text>
              <Text style={styles.summaryLabel}>طلبات عاجلة</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{orderSummary.highValueOrders}</Text>
              <Text style={styles.summaryLabel}>طلبات عالية القيمة</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{OrderHelpers.formatAmount(orderSummary.totalValue)}</Text>
              <Text style={styles.summaryLabel}>إجمالي القيمة</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={sortedOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF9800']}
            tintColor="#FF9800"
          />
        }
        ListHeaderComponent={
          sortedOrders.length > 0 && (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>
                الطلبات مرتبة حسب الأولوية (الأعلى أولاً)
              </Text>
            </View>
          )
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>لا توجد طلبات متاحة</Text>
            <Text style={styles.emptySubtitle}>
              جميع الطلبات تم قبولها أو لا توجد طلبات جديدة حالياً
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
            >
              <Ionicons name="refresh-outline" size={20} color="#FF9800" />
              <Text style={styles.refreshButtonText}>تحديث</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  refreshButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
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
    color: '#333',
    marginLeft: 8,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  refreshButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
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
  },
  debtInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
  },
  // الأنماط الجديدة
  priorityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentBadge: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  summaryCard: {
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  listHeader: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
  },
}); 