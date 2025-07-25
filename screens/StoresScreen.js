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
  Button,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storesAPI } from '../supabase';
import { supabase } from '../supabase';
import colors from '../colors';

export default function StoresScreen({ navigation }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [storeOrders, setStoreOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*');
      if (error) throw new Error('تعذر جلب المتاجر');
      setStores(data || []);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل المتاجر');
    }
    setLoading(false);
  };

  const loadStoreOrders = async (storeId) => {
    try {
      const { data, error } = await storesAPI.getStoreOrders(storeId);
      if (error) throw new Error('تعذر جلب طلبات المتجر');
      setStoreOrders(data || []);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل طلبات المتجر');
    }
  };

  const openModal = (store, type) => {
    setSelectedStore(store);
    setModalType(type);
    setModalVisible(true);
    setInputValue('');
    setInputValue2('');
  };

  const handleAction = async () => {
    if (!selectedStore) return;

    try {
      let result;
      switch (modalType) {
        case 'toggle_status':
          result = await storesAPI.toggleStoreStatus(selectedStore.id, !selectedStore.is_active);
          break;
        case 'notification':
          result = await storesAPI.sendStoreNotification(selectedStore.id, inputValue, inputValue2);
          break;
      }

      if (result?.error) {
        Alert.alert('خطأ', 'فشل في تنفيذ العملية');
      } else {
        Alert.alert('نجح', 'تم تنفيذ العملية بنجاح');
        loadStores(); // إعادة تحميل البيانات
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
    setModalVisible(false);
  };

  const getModalContent = () => {
    switch (modalType) {
      case 'toggle_status':
        return {
          title: selectedStore?.is_active ? 'إلغاء تفعيل المتجر' : 'تفعيل المتجر',
          placeholder: selectedStore?.is_active ? 'هل أنت متأكد من إلغاء تفعيل المتجر؟' : 'هل أنت متأكد من تفعيل المتجر؟',
          placeholder2: '',
          showSecondInput: false
        };
      case 'notification':
        return {
          title: 'إرسال إشعار للمتجر',
          placeholder: 'عنوان الإشعار',
          placeholder2: 'محتوى الإشعار',
          showSecondInput: true
        };
      default:
        return { title: '', placeholder: '', placeholder2: '', showSecondInput: false };
    }
  };

  const modalContent = getModalContent();

  const deleteStore = async (store) => {
    console.log('=== بداية عملية حذف المتجر ===');
    console.log('تفاصيل المتجر:', {
      id: store.id,
      email: store.email,
      name: store.name
    });
    
    try {
      // حذف من جدول stores
      console.log('حذف من جدول stores...');
      const { error: deleteStoreError } = await supabase
        .from('stores')
        .delete()
        .eq('id', store.id);
      
      if (deleteStoreError) {
        console.error('❌ خطأ في حذف من جدول stores:', deleteStoreError);
        console.error('تفاصيل الخطأ:', {
          code: deleteStoreError.code,
          message: deleteStoreError.message,
          details: deleteStoreError.details,
          hint: deleteStoreError.hint
        });
        throw new Error('فشل في حذف المتجر من جدول stores: ' + deleteStoreError.message);
      }
      
      console.log('✅ تم حذف من جدول stores بنجاح');
      
      // حذف من جدول registration_requests إذا كان موجود
      console.log('حذف من جدول registration_requests...');
      const { error: deleteRequestError } = await supabase
        .from('registration_requests')
        .delete()
        .eq('email', store.email);
      
      if (deleteRequestError) {
        console.error('❌ خطأ في حذف من جدول registration_requests:', deleteRequestError);
        console.error('تفاصيل الخطأ:', {
          code: deleteRequestError.code,
          message: deleteRequestError.message,
          details: deleteRequestError.details,
          hint: deleteRequestError.hint
        });
      } else {
        console.log('✅ تم حذف من جدول registration_requests بنجاح');
      }
      
      console.log('=== انتهاء عملية حذف المتجر بنجاح ===');
      
      Alert.alert('تم الحذف', 'تم حذف المتجر من النظام بنجاح');
      loadStores(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('=== خطأ في عملية حذف المتجر ===');
      console.error('نوع الخطأ:', error.constructor.name);
      console.error('رسالة الخطأ:', error.message);
      console.error('تفاصيل الخطأ:', error);
      Alert.alert('خطأ', error.message || 'فشل في حذف المتجر');
    }
  };

  const confirmDeleteStore = (store) => {
    setStoreToDelete(store);
    setShowDeleteDialog(true);
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'pending': return colors.primary;
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
    return null;
  }

  if (showOrders && selectedStore) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowOrders(false)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>طلبات {selectedStore.name}</Text>
          <TouchableOpacity onPress={() => loadStoreOrders(selectedStore.id)} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {storeOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={64} color={colors.dark} />
              <Text style={styles.emptyText}>لا توجد طلبات لهذا المتجر</Text>
            </View>
          ) : (
            storeOrders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>طلب #{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getOrderStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{getOrderStatusText(order.status)}</Text>
                  </View>
                </View>
                <Text style={styles.orderDetails}>{order.description || 'لا يوجد تفاصيل'}</Text>
                <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString('en-GB')}</Text>
                <Text style={styles.orderAmount}>المبلغ: {order.amount || 0} ألف دينار</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('AdminDashboardScreen')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة المتاجر</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => {
              console.log('=== اختبار زر الحذف (متاجر) ===');
              if (stores.length > 0) {
                console.log('اختبار حذف المتجر الأول:', stores[0]);
                confirmDeleteStore(stores[0]);
              } else {
                Alert.alert('اختبار', 'لا يوجد متاجر للاختبار');
              }
            }} 
            style={styles.testButton}
          >
            <Ionicons name="bug-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadStores} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="storefront-outline" size={64} color={colors.dark} />
            <Text style={styles.emptyText}>لا يوجد متاجر مسجلة</Text>
          </View>
        ) : (
          stores.map((store) => (
            <View key={store.id} style={[styles.storeCard, !store.is_active && styles.inactiveCard]}>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeEmail}>{store.email}</Text>
                <Text style={styles.storePhone}>{store.phone}</Text>
                <Text style={styles.storeAddress}>{store.address || 'لا يوجد عنوان'}</Text>
                <View style={styles.storeStats}>
                  <Text style={styles.storeStatus}>
                    الحالة: {store.is_active ? 'مفعل' : 'غير مفعل'}
                  </Text>
                  <Text style={styles.storeOrders}>
                    عدد الطلبات: {store.total_orders || 0}
                  </Text>
                </View>
                {!store.is_active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>غير مفعل</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => {
                    setSelectedStore(store);
                    loadStoreOrders(store.id);
                    setShowOrders(true);
                  }}
                >
                  <Ionicons name="list-outline" size={20} color={colors.info} />
                  <Text style={styles.actionText}>الطلبات</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openModal(store, 'toggle_status')}
                >
                  <Ionicons 
                    name={store.is_active ? "pause-circle-outline" : "play-circle-outline"} 
                    size={20} 
                    color={store.is_active ? colors.danger : colors.success} 
                  />
                  <Text style={styles.actionText}>
                    {store.is_active ? 'إلغاء التفعيل' : 'تفعيل'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openModal(store, 'notification')}
                >
                  <Ionicons name="notifications-outline" size={20} color={colors.secondary} />
                  <Text style={styles.actionText}>إشعار</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => confirmDeleteStore(store)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  <Text style={styles.actionText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
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
            />

            {modalContent.showSecondInput && (
              <TextInput
                style={styles.modalInput}
                placeholder={modalContent.placeholder2}
                value={inputValue2}
                onChangeText={setInputValue2}
                textAlign="right"
                multiline={modalType === 'notification'}
              />
            )}

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

      <Modal
        animationType="slide"
        transparent={true}
        visible={showDeleteDialog}
        onRequestClose={() => setShowDeleteDialog(false)}
      >
        <View style={styles.deleteDialogOverlay}>
          <View style={styles.deleteDialogContent}>
            <Text style={styles.deleteDialogTitle}>تأكيد الحذف</Text>
            <Text style={styles.deleteDialogDescription}>
              هل أنت متأكد من حذف المتجر "{storeToDelete?.name || storeToDelete?.email}"? سيتم حذفه نهائياً من النظام.
            </Text>
            <View style={styles.deleteDialogButtons}>
              <TouchableOpacity 
                style={styles.deleteDialogButton}
                onPress={() => setShowDeleteDialog(false)}
              >
                <Text style={styles.deleteDialogButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteDialogButton}
                onPress={() => {
                  setShowDeleteDialog(false);
                  if (storeToDelete) deleteStore(storeToDelete);
                }}
              >
                <Text style={styles.deleteDialogButtonText}>حذف</Text>
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
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testButton: {
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
  storeCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
  },
  inactiveCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  storeInfo: {
    marginBottom: 16,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  storeEmail: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 2,
  },
  storePhone: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 2,
  },
  storeAddress: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 8,
  },
  storeStats: {
    marginTop: 8,
  },
  storeStatus: {
    fontSize: 14,
    color: colors.success,
    fontWeight: 'bold',
  },
  storeOrders: {
    fontSize: 14,
    color: colors.info,
    marginTop: 4,
  },
  inactiveBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  inactiveText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
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
  orderCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }),
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
  orderDetails: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 12,
    color: colors.dark,
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
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
    borderColor: colors.dark,
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
  deleteDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteDialogContent: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  deleteDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteDialogDescription: {
    fontSize: 14,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteDialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  deleteDialogButtonText: {
    color: colors.secondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 