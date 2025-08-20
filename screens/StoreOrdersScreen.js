import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, ordersAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';
import ErrorMessage from '../components/ErrorMessage';
const storeIcon = { uri: 'https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg' };

export default function StoreOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [storeInfo, setStoreInfo] = useState(null);
  const [itemLoading, setItemLoading] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStoreInfo();
    loadOrders();

    // تحديث الطلبات كل 15 ثانية
    const interval = setInterval(() => {
      loadOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadStoreInfo = async () => {
    try {
      const storeId = await AsyncStorage.getItem('userId');
      if (!storeId) {
        return;
      }

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) {
        throw error;
      }

      setStoreInfo(data);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل معلومات المتجر');
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const storeId = await AsyncStorage.getItem('userId');
      if (!storeId) {
        throw new Error('لم يتم العثور على معرف المتجر');
      }

      const { data, error } = await ordersAPI.getStoreOrders(storeId);

      if (error) {
        throw new Error('تعذر جلب الطلبات: ' + error.message);
      }

      setOrders(data || []);
    } catch (error) {
      setError(error.message || 'حدث خطأ غير متوقع في تحميل الطلبات');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const openModal = (order, type) => {
    setSelectedOrder(order);
    setModalType(type);
    setModalVisible(true);
    setInputValue('');
  };

  const handleAction = async () => {
    if (!selectedOrder) return;

    try {
      let result;
      switch (modalType) {
        case 'update_status':
          result = await supabase
            .from('orders')
            .update({ status: inputValue })
            .eq('id', selectedOrder.id);
          break;
        case 'add_note':
          result = await supabase
            .from('orders')
            .update({ notes: inputValue })
            .eq('id', selectedOrder.id);
          break;
        case 'cancel_order':
          result = await supabase
            .from('orders')
            .update({ 
              status: 'cancelled',
              cancelled_at: new Date().toISOString()
            })
            .eq('id', selectedOrder.id);
          break;
      }

      if (result?.error) {
        throw new Error('فشل في تنفيذ العملية: ' + result.error.message);
      }

      // إرسال إشعار للسائق إذا كان الطلب ملغي
      if (modalType === 'cancel_order' && selectedOrder.driver_id) {
        await supabase
          .from('notifications')
          .insert({
            driver_id: selectedOrder.driver_id,
            title: 'تم إلغاء الطلب',
            message: `تم إلغاء الطلب رقم #${selectedOrder.id} من قبل المتجر`,
            type: 'order'
          });
      }

      Alert.alert('نجح', 'تم تنفيذ العملية بنجاح');
      loadOrders(); // إعادة تحميل البيانات
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ غير متوقع في تنفيذ العملية');
    }
    setModalVisible(false);
  };

  const getModalContent = () => {
    switch (modalType) {
      case 'update_status':
        return {
          title: 'تحديث حالة الطلب',
          placeholder: 'الحالة الجديدة (pending/accepted/completed/cancelled)',
          showSecondInput: false
        };
      case 'add_note':
        return {
          title: 'إضافة ملاحظة',
          placeholder: 'الملاحظة',
          showSecondInput: false
        };
      case 'cancel_order':
        return {
          title: 'إلغاء الطلب',
          placeholder: 'سبب الإلغاء (اختياري)',
          showSecondInput: false
        };
      default:
        return { title: '', placeholder: '', showSecondInput: false };
    }
  };

  const modalContent = getModalContent();

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'accepted': return colors.success;
      case 'completed': return colors.info;
      case 'cancelled': return colors.danger;
      default: return colors.dark;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
      </View>
    );
  }
  if (error) {
    return <ErrorMessage message={error} suggestion="يرجى التحقق من اتصالك بالإنترنت أو إعادة المحاولة." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboardScreen')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Image source={storeIcon} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>إدارة الطلبات</Text>
        </View>
        <TouchableOpacity onPress={loadOrders} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={colors.dark} />
            <Text style={styles.emptyText}>لا توجد طلبات</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <View style={styles.orderHeaderCustom}>
                  <Text style={styles.statusTextCustom}>{getOrderStatusText(item.status)}</Text>
                  <Text style={styles.orderIdCustom}>رقم الطلب {item.id}</Text>
                </View>
                <View style={styles.orderBodyCustom}>
                  <View style={styles.orderImgPlaceholder} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.infoRowCustom}>
                      <Ionicons name="location-outline" size={18} color={colors.primary} />
                      <Text style={styles.infoTextCustom}>
                        منطقة التوصيل: {(item.delivery_address || item.pickup_address || 'غير محدد').toString().split('،')[0]}
                      </Text>
                    </View>
                    <View style={styles.infoRowCustom}>
                      <Ionicons name="cash-outline" size={16} color={colors.primary} />
                      <Text style={styles.infoTextCustom}>سعر الطلب: {(item.total_amount || 0)} دينار</Text>
                    </View>
                    <View style={styles.infoRowCustom}>
                      <Ionicons name="cash-outline" size={16} color={colors.success} />
                      <Text style={styles.infoTextCustom}>سعر التوصيل: {(item.delivery_fee || 0)} دينار</Text>
                    </View>
                    <Text style={styles.customerTextCustom}>تفاصيل الطلب: {item.description}</Text>
                  </View>
                </View>
                <View style={styles.btnRowCustom}>
                  <TouchableOpacity style={styles.cancelBtnCustom}>
                    <Text style={styles.cancelTextCustom}>إلغاء الطلب</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.readyBtnCustom}>
                    <Text style={styles.readyTextCustom}>قيد التجهيز</Text>
                  </TouchableOpacity>
                </View>
                {itemLoading[item.id] && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
          />
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={modalContent.placeholder}
              value={inputValue}
              onChangeText={setInputValue}
              textAlign="right"
              multiline={modalType === 'add_note'}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleAction}
              >
                <Text style={styles.confirmButtonText}>تأكيد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, backgroundColor: colors.secondary },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  headerLogo: { width: 40, height: 40, resizeMode: 'contain', marginRight: 8, borderRadius: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  content: { flex: 1, padding: 20, backgroundColor: colors.secondary },
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
  backButton: {
    padding: 8,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: colors.dark,
    marginTop: 16,
  },
  orderCard: {
    backgroundColor: colors.secondary,
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
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginBottom: 16,
  },
  orderDetails: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderNotes: {
    fontSize: 12,
    color: colors.dark,
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '48%',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: colors.dark,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    color: colors.dark,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: colors.secondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderCardCustom: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    marginHorizontal: 10,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }
      : { shadowColor: colors.primary, shadowOpacity: 0.09, shadowRadius: 8, elevation: 3 }),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderHeaderCustom: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTextCustom: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  orderIdCustom: {
    color: colors.dark,
    fontWeight: 'bold',
    fontSize: 15,
  },
  orderBodyCustom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderImgPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#eee',
    borderRadius: 12,
    marginLeft: 10,
  },
  infoRowCustom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoTextCustom: {
    fontSize: 14,
    color: colors.dark,
    marginRight: 4,
  },
  customerTextCustom: {
    fontSize: 13,
    color: colors.dark,
    marginTop: 4,
  },
  btnRowCustom: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelBtnCustom: {
    flex: 1,
    marginLeft: 6,
    backgroundColor: colors.cancelled,
    borderRadius: 8,
  },
  readyBtnCustom: {
    flex: 1,
    marginRight: 6,
    backgroundColor: colors.accepted,
    borderRadius: 8,
  },
  cancelTextCustom: {
    color: colors.secondary,
    textAlign: 'center',
    padding: 8,
    fontWeight: 'bold',
  },
  readyTextCustom: {
    color: colors.secondary,
    textAlign: 'center',
    padding: 8,
    fontWeight: 'bold',
  },
  orderItem: {
    backgroundColor: colors.secondary,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    marginHorizontal: 10,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }
      : { shadowColor: colors.primary, shadowOpacity: 0.09, shadowRadius: 8, elevation: 3 }),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
}); 