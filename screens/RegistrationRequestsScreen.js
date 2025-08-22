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
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { registrationRequestsAPI } from '../supabase';
import { supabase } from '../supabase';
import colors from '../colors';

export default function RegistrationRequestsScreen({ navigation }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState(null);

  useEffect(() => {
    loadRegistrationRequests();
  }, []);

  const loadRegistrationRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registration_requests')
        .select('*')
        .eq('status', 'pending');
      if (error) throw new Error('تعذر جلب طلبات التسجيل');
      setRequests(data || []);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل طلبات التسجيل');
    }
    setLoading(false);
  };

  const approveRequest = async (request) => {
    try {
      let insertResult;
      
      if (request.user_type === 'driver') {
        insertResult = await supabase.from('drivers').insert({
          email: request.email,
          password: request.password,
          name: request.name,
          phone: request.phone,
          vehicle_type: request.vehicle_type,
          national_card_front: request.national_card_front,
          national_card_back: request.national_card_back,
          residence_card_front: request.residence_card_front,
          residence_card_back: request.residence_card_back,
          status: 'approved',
          is_active: true,
          created_at: new Date().toISOString()
        });
      } else if (request.user_type === 'store') {
        insertResult = await supabase.from('stores').insert({
          email: request.email,
          password: request.password,
          name: request.name,
          phone: request.phone,
          address: request.address,
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
      
      if (insertResult?.error) {
        throw new Error('فشل في إنشاء الحساب في النظام: ' + insertResult.error.message);
      }
      
      const { error: updateError } = await supabase
        .from('registration_requests')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString() 
        })
        .eq('id', request.id);
      
      if (updateError) {
        throw new Error('فشل في تحديث حالة الطلب: ' + updateError.message);
      }
      
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في الموافقة على الطلب');
    }
  };

  const rejectRequest = async (request) => {
    try {
      if (request.user_type === 'driver') {
        await supabase
          .from('drivers')
          .delete()
          .eq('email', request.email);
      } else if (request.user_type === 'store') {
        await supabase
          .from('stores')
          .delete()
          .eq('email', request.email);
      }

      const { error } = await supabase
        .from('registration_requests')
        .update({ 
          status: 'rejected', 
          rejected_at: new Date().toISOString() 
        })
        .eq('id', request.id);
      
      if (error) {
        throw new Error('فشل في تحديث حالة الطلب: ' + error.message);
      }
      
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في رفض الطلب');
    }
  };

  const openModal = (request, type) => {
    setSelectedRequest(request);
    setModalType(type);
    setModalVisible(true);
    setInputValue('');
    setInputValue2('');
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      let result;
      switch (modalType) {
        case 'approve_driver':
          result = await registrationRequestsAPI.approveDriverRequest(
            selectedRequest.id, 
            inputValue, 
            inputValue2
          );
          break;
        case 'reject':
          result = await registrationRequestsAPI.rejectRequest(
            selectedRequest.id, 
            inputValue
          );
          break;
      }

      if (result?.error) {
        Alert.alert('خطأ', 'فشل في تنفيذ العملية');
      } else {
        Alert.alert('نجح', 'تم تنفيذ العملية بنجاح');
        loadRegistrationRequests();
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
    setModalVisible(false);
  };

  const getModalContent = () => {
    switch (modalType) {
      case 'approve_driver':
        return {
          title: 'قبول طلب تسجيل سائق',
          placeholder: 'وقت بداية العمل (مثال: 12:00)',
          placeholder2: 'وقت نهاية العمل (مثال: 24:00)',
          showSecondInput: true
        };
      case 'reject':
        return {
          title: 'رفض طلب التسجيل',
          placeholder: 'سبب الرفض',
          placeholder2: '',
          showSecondInput: false
        };
      default:
        return { title: '', placeholder: '', placeholder2: '', showSecondInput: false };
    }
  };

  const modalContent = getModalContent();

  const getRequestTypeText = (requestType) => {
    switch (requestType) {
      case 'driver': return 'سائق';
      case 'store': return 'متجر';
      default: return 'غير محدد';
    }
  };

  const getRequestTypeColor = (requestType) => {
    switch (requestType) {
      case 'driver': return '#2196F3';
      case 'store': return '#FF9800';
      default: return '#666';
    }
  };

  const showDetails = (request) => {
    console.log('=== عرض تفاصيل الطلب ===');
    console.log('معرف الطلب:', request.id);
    console.log('البريد الإلكتروني:', request.email);
    console.log('الاسم:', request.name);
    console.log('نوع المستخدم:', request.user_type);
    console.log('--- المستندات ---');
    console.log('البطاقة الوطنية (الوجه):', request.national_card_front ? 'موجودة' : 'مفقودة');
    console.log('البطاقة الوطنية (الظهر):', request.national_card_back ? 'موجودة' : 'مفقودة');
    console.log('بطاقة السكن (الوجه):', request.residence_card_front ? 'موجودة' : 'مفقودة');
    console.log('بطاقة السكن (الظهر):', request.residence_card_back ? 'موجودة' : 'مفقودة');
    if (request.national_card_front) {
      console.log('رابط البطاقة الوطنية (الوجه):', request.national_card_front.substring(0, 100) + '...');
    }
    if (request.national_card_back) {
      console.log('رابط البطاقة الوطنية (الظهر):', request.national_card_back.substring(0, 100) + '...');
    }
    if (request.residence_card_front) {
      console.log('رابط بطاقة السكن (الوجه):', request.residence_card_front.substring(0, 100) + '...');
    }
    if (request.residence_card_back) {
      console.log('رابط بطاقة السكن (الظهر):', request.residence_card_back.substring(0, 100) + '...');
    }
    console.log('=======================');
    
    setDetailsRequest(request);
    setDetailsModalVisible(true);
  };

  const renderRequestItem = (item) => (
    <View style={styles.requestCard} key={item.id}>
      <View style={styles.requestHeader}>
                        <Ionicons name={item.user_type === 'driver' ? 'bicycle' : 'storefront-outline'} size={32} color={item.user_type === 'driver' ? '#2196F3' : '#FF9800'} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.userName}>{item.name || 'غير محدد'}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userType}>{item.user_type === 'driver' ? 'سائق' : 'متجر'}</Text>
          <Text style={styles.requestDate}>{new Date(item.created_at).toLocaleDateString('ar-SA')}</Text>
        </View>
        <TouchableOpacity style={styles.eyeBtn} onPress={() => showDetails(item)}>
          <Ionicons name="eye" size={26} color="#888" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.requestDetails}>
        {item.phone && <Text style={styles.detailText}>الهاتف: {item.phone}</Text>}
        {item.address && <Text style={styles.detailText}>العنوان: {item.address}</Text>}
        {item.vehicle_type && <Text style={styles.detailText}>نوع المركبة: {item.vehicle_type}</Text>}
        {item.user_type === 'driver' && item.vehicle_type && (
          <View style={styles.driverBadge}>
                            <Ionicons name="bicycle" size={16} color="#2196F3" />
            <Text style={styles.driverBadgeText}>{item.vehicle_type}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.approveBtn} onPress={() => approveRequest(item)}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.actionText}>موافقة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectRequest(item)}>
          <Ionicons name="close-circle" size={22} color="#fff" />
          <Text style={styles.actionText}>رفض</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const testDatabaseConnection = async () => {
    try {
      const { data: testData, error: testError } = await supabase
        .from('registration_requests')
        .select('count')
        .limit(1);
      
      if (testError) {
        Alert.alert('خطأ', 'فشل في الاتصال بقاعدة البيانات: ' + testError.message);
        return;
      }
      
      const { data: allRequests, error: requestsError } = await supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (requestsError) {
      } else {
        console.log('إجمالي عدد الطلبات:', allRequests?.length || 0);
        
        if (allRequests && allRequests.length > 0) {
          console.log('تفاصيل الطلبات:');
          allRequests.forEach((request, index) => {
            console.log(`طلب ${index + 1}:`, {
              id: request.id,
              email: request.email,
              user_type: request.user_type,
              status: request.status,
              created_at: request.created_at
            });
          });
        }
      }
      
      const { data: allDrivers, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (driversError) {
      } else {
        console.log('عدد السائقين:', allDrivers?.length || 0);
      }
      
      const { data: allStores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (storesError) {
      } else {
        console.log('عدد المتاجر:', allStores?.length || 0);
      }
      
      Alert.alert('نجح', 'تم اختبار قاعدة البيانات بنجاح. راجع Console للتفاصيل.');
      
    } catch (error) {
      Alert.alert('خطأ', 'فشل في اختبار قاعدة البيانات: ' + error.message);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AdminDashboard')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلبات التسجيل</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={testDatabaseConnection} style={styles.testButton}>
            <Ionicons name="bug-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadRegistrationRequests} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد طلبات تسجيل جديدة</Text>
          </View>
        ) : (
          requests.map(renderRequestItem)
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
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <Text style={styles.modalTitle}>تفاصيل الطلب</Text>
            {detailsRequest && (
              <ScrollView style={{maxHeight: 400}}>
                <Text style={styles.detailText}>البريد الإلكتروني: {detailsRequest.email}</Text>
                {detailsRequest.name && <Text style={styles.detailText}>الاسم: {detailsRequest.name}</Text>}
                {detailsRequest.user_type && <Text style={styles.detailText}>النوع: {detailsRequest.user_type === 'driver' ? 'سائق' : 'متجر'}</Text>}
                {detailsRequest.phone && <Text style={styles.detailText}>الهاتف: {detailsRequest.phone}</Text>}
                {detailsRequest.address && <Text style={styles.detailText}>العنوان: {detailsRequest.address}</Text>}
                {detailsRequest.vehicle_type && <Text style={styles.detailText}>نوع المركبة: {detailsRequest.vehicle_type}</Text>}
                {detailsRequest.vehicle_number && <Text style={styles.detailText}>رقم المركبة: {detailsRequest.vehicle_number}</Text>}
                <Text style={styles.detailText}>صورة البطاقة الوطنية (الوجه):</Text>
                {detailsRequest.national_card_front ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{uri: detailsRequest.national_card_front}} 
                      style={styles.docImage} 
                      onError={(e) => console.log('خطأ في تحميل البطاقة الوطنية (الوجه):', e.nativeEvent.error)} 
                    />
                    <TouchableOpacity 
                      style={styles.viewFullImageButton}
                      onPress={() => {
                        // يمكن إضافة عرض الصورة كاملة الشاشة هنا
                        console.log('عرض الصورة كاملة:', detailsRequest.national_card_front);
                      }}
                    >
                      <Text style={styles.viewFullImageText}>عرض كامل</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.detailText, {color: 'red'}]}>❌ لا توجد صورة للبطاقة الوطنية (الوجه)</Text>
                )}
                <Text style={styles.detailText}>صورة البطاقة الوطنية (الظهر):</Text>
                {detailsRequest.national_card_back ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{uri: detailsRequest.national_card_back}} 
                      style={styles.docImage} 
                      onError={(e) => console.log('خطأ في تحميل البطاقة الوطنية (الظهر):', e.nativeEvent.error)} 
                    />
                    <Text style={styles.imageStatus}>✅ تم رفع الصورة</Text>
                  </View>
                ) : (
                  <Text style={[styles.detailText, {color: 'red'}]}>❌ لا توجد صورة للبطاقة الوطنية (الظهر)</Text>
                )}
                <Text style={styles.detailText}>صورة بطاقة السكن (الوجه):</Text>
                {detailsRequest.residence_card_front ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{uri: detailsRequest.residence_card_front}} 
                      style={styles.docImage} 
                      onError={(e) => console.log('خطأ في تحميل بطاقة السكن (الوجه):', e.nativeEvent.error)} 
                    />
                    <Text style={styles.imageStatus}>✅ تم رفع الصورة</Text>
                  </View>
                ) : (
                  <Text style={[styles.detailText, {color: 'red'}]}>❌ لا توجد صورة لبطاقة السكن (الوجه)</Text>
                )}
                <Text style={styles.detailText}>صورة بطاقة السكن (الظهر):</Text>
                {detailsRequest.residence_card_back ? (
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{uri: detailsRequest.residence_card_back}} 
                      style={styles.docImage} 
                      onError={(e) => console.log('خطأ في تحميل بطاقة السكن (الظهر):', e.nativeEvent.error)} 
                    />
                    <Text style={styles.imageStatus}>✅ تم رفع الصورة</Text>
                  </View>
                ) : (
                  <Text style={[styles.detailText, {color: 'red'}]}>❌ لا توجد صورة لبطاقة السكن (الظهر)</Text>
                )}
                <Text style={styles.detailText}>تاريخ الطلب: {new Date(detailsRequest.created_at).toLocaleString('ar-SA')}</Text>
              </ScrollView>
            )}
            <TouchableOpacity style={[styles.modalButton, {marginTop: 18}]} onPress={() => setDetailsModalVisible(false)}>
              <Text style={styles.actionText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
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
    color: '#666',
    marginTop: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userType: {
    fontSize: 12,
    color: '#666',
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    flex: 1,
    marginLeft: 8,
    justifyContent: 'center',
  },
  approveButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#f5f5f5',
  },
  confirmButton: {
    backgroundColor: '#FF9800',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 18, textAlign: 'center' },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F44336', paddingVertical: 8, paddingHorizontal: 18, borderRadius: 8 },
  actionText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 16 },
  eyeBtn: { marginLeft: 'auto', padding: 4 },
  docImage: { width: 120, height: 80, borderRadius: 8, marginVertical: 6, alignSelf: 'center' },
  imageContainer: { alignItems: 'center', marginVertical: 6 },
  imageStatus: { 
    color: '#4CAF50', 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginTop: 4 
  },
  imageContainer: { alignItems: 'center', marginVertical: 6 },
  viewFullImageButton: { 
    backgroundColor: colors.primary, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    marginTop: 8 
  },
  viewFullImageText: { 
    color: '#fff', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  driverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  driverBadgeText: {
    fontSize: 12,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: 'bold',
  },
}); 