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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driversAPI } from '../supabase';
import { supabase } from '../supabase';
import colors from '../colors';
import { systemSettingsAPI } from '../supabase';
import driverIcon from '../assets/driver-icon.png';

export default function DriversScreen({ navigation }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsDriver, setDetailsDriver] = useState(null);
  const [debtPointValue, setDebtPointValue] = useState(250);
  const [maxDebtPoints, setMaxDebtPoints] = useState(20);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
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

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*');
      if (error) throw new Error('تعذر جلب السائقين');
      
      // جلب عدد الإشعارات غير المقروءة لكل سائق
      const driversWithNotifications = await Promise.all(
        (data || []).map(async (driver) => {
          try {
            const { count: unreadCount, error: notificationsError } = await supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('driver_id', driver.id)
              .eq('is_read', false);
              
            if (notificationsError) {
              console.error(`Error fetching notifications for driver ${driver.id}:`, notificationsError);
              return { ...driver, unread_notifications: 0 };
            }
            
            return { ...driver, unread_notifications: unreadCount || 0 };
          } catch (error) {
            console.error(`Error processing driver ${driver.id}:`, error);
            return { ...driver, unread_notifications: 0 };
          }
        })
      );
      
      setDrivers(driversWithNotifications);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل السائقين');
    }
    setLoading(false);
  };

  const openModal = (driver, type) => {
    setSelectedDriver(driver);
    setModalType(type);
    setModalVisible(true);
    setInputValue('');
    setInputValue2('');
  };

  const handleAction = async () => {
    if (!selectedDriver) return;

    try {
      let result;
      switch (modalType) {
        case 'debt':
          result = await driversAPI.updateDriverDebt(selectedDriver.id, parseFloat(inputValue));
          break;
        case 'clear_debt':
          result = await driversAPI.clearDriverDebt(selectedDriver.id);
          break;
        case 'work_hours':
          result = await driversAPI.updateWorkHours(selectedDriver.id, inputValue, inputValue2);
          break;
        case 'fine':
          result = await driversAPI.fineDriver(selectedDriver.id, parseFloat(inputValue), inputValue2);
          break;
        case 'suspend':
          result = await driversAPI.suspendDriver(selectedDriver.id, inputValue);
          break;
        case 'unsuspend':
          result = await driversAPI.unsuspendDriver(selectedDriver.id);
          break;
        case 'notification':
          result = await driversAPI.sendNotification(selectedDriver.id, inputValue, inputValue2);
          break;
      }

      if (result?.error) {
        Alert.alert('خطأ', 'فشل في تنفيذ العملية');
      } else {
        Alert.alert('نجح', 'تم تنفيذ العملية بنجاح');
        loadDrivers(); // إعادة تحميل البيانات
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
    setModalVisible(false);
  };

  const getModalContent = () => {
    switch (modalType) {
      case 'debt':
        return {
          title: 'تعديل نقاط الديون',
          placeholder: `عدد النقاط الجديد (كل نقطة = ${debtPointValue} دينار)`,
          placeholder2: '',
          showSecondInput: false
        };
      case 'clear_debt':
        return {
          title: 'تصفية ديون السائق',
          placeholder: 'هل أنت متأكد من تصفية جميع النقاط؟',
          placeholder2: '',
          showSecondInput: false
        };
      case 'work_hours':
        return {
          title: 'تعديل وقت الدوام',
          placeholder: 'وقت البداية (مثال: 12:00)',
          placeholder2: 'وقت النهاية (مثال: 24:00)',
          showSecondInput: true
        };
      case 'fine':
        return {
          title: 'تغريم السائق',
          placeholder: `عدد نقاط الغرامة (كل نقطة = ${debtPointValue} دينار)`,
          placeholder2: 'سبب الغرامة',
          showSecondInput: true
        };
      case 'suspend':
        return {
          title: 'إيقاف السائق',
          placeholder: 'سبب الإيقاف',
          placeholder2: '',
          showSecondInput: false
        };
      case 'unsuspend':
        return {
          title: 'إلغاء إيقاف السائق',
          placeholder: 'هل أنت متأكد من إلغاء الإيقاف؟',
          placeholder2: '',
          showSecondInput: false
        };
      case 'notification':
        return {
          title: 'إرسال إشعار',
          placeholder: 'عنوان الإشعار',
          placeholder2: 'محتوى الإشعار',
          showSecondInput: true
        };
      default:
        return { title: '', placeholder: '', placeholder2: '', showSecondInput: false };
    }
  };

  const modalContent = getModalContent();

  const deleteDriver = async (driver) => {
    console.log('=== بداية عملية حذف السائق ===');
    console.log('تفاصيل السائق:', {
      id: driver.id,
      email: driver.email,
      name: driver.name
    });
    
    try {
      // حذف من جدول drivers
      console.log('حذف من جدول drivers...');
      const { error: deleteDriverError } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driver.id);
      
      if (deleteDriverError) {
        console.error('❌ خطأ في حذف من جدول drivers:', deleteDriverError);
        console.error('تفاصيل الخطأ:', {
          code: deleteDriverError.code,
          message: deleteDriverError.message,
          details: deleteDriverError.details,
          hint: deleteDriverError.hint
        });
        throw new Error('فشل في حذف السائق من جدول drivers: ' + deleteDriverError.message);
      }
      
      console.log('✅ تم حذف من جدول drivers بنجاح');
      
      // حذف من جدول registration_requests إذا كان موجود
      console.log('حذف من جدول registration_requests...');
      const { error: deleteRequestError } = await supabase
        .from('registration_requests')
        .delete()
        .eq('email', driver.email);
      
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
      
      console.log('=== انتهاء عملية حذف السائق بنجاح ===');
      
      Alert.alert('تم الحذف', 'تم حذف السائق من النظام بنجاح');
      loadDrivers(); // إعادة تحميل البيانات
    } catch (error) {
      console.error('=== خطأ في عملية حذف السائق ===');
      console.error('نوع الخطأ:', error.constructor.name);
      console.error('رسالة الخطأ:', error.message);
      console.error('تفاصيل الخطأ:', error);
      Alert.alert('خطأ', error.message || 'فشل في حذف السائق');
    }
  };

  const confirmDeleteDriver = (driver) => {
    setDriverToDelete(driver);
    setShowDeleteDialog(true);
  };

  if (settingsLoading || loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
                 <View style={styles.headerContent}>
           <Image source={driverIcon} style={styles.headerLogo} />
           <Text style={styles.headerTitle}>إدارة السائقين</Text>
         </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => {
              console.log('=== اختبار زر الحذف ===');
              if (drivers.length > 0) {
                console.log('اختبار حذف السائق الأول:', drivers[0]);
                confirmDeleteDriver(drivers[0]);
              } else {
                Alert.alert('اختبار', 'لا يوجد سائقين للاختبار');
              }
            }} 
            style={styles.testButton}
          >
            <Ionicons name="bug-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={loadDrivers} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionsHeader}>
        <View style={styles.pointsInfo}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.pointsInfoText}>
            نظام النقاط: كل نقطة = {debtPointValue} دينار • الحد الأقصى = {maxDebtPoints} نقطة
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => openModal(null, 'add_driver')}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.secondary} />
          <Text style={styles.addButtonText}>إضافة سائق</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
                 {drivers.length === 0 ? (
           <View style={styles.emptyContainer}>
             <Image source={driverIcon} style={styles.emptyIcon} />
             <Text style={styles.emptyText}>لا يوجد سائقين مسجلين</Text>
           </View>
        ) : (
          drivers.map((driver) => (
            <View key={driver.id} style={[styles.driverCard, driver.is_suspended && styles.suspendedCard]}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver.name || 'غير محدد'}</Text>
                <Text style={styles.driverEmail}>{driver.email}</Text>
                <Text style={styles.driverPhone}>{driver.phone || 'غير محدد'}</Text>
                <View style={styles.vehicleInfo}>
                  <Ionicons name="bicycle" size={16} color={colors.primary} />
                  <Text style={styles.vehicleType}>{driver.vehicle_type || 'غير محدد'}</Text>
                </View>
                <View style={styles.driverStats}>
                  <Text style={styles.debtText}>
                    النقاط: {driver.debt_points || 0} نقطة ({(driver.debt_points || 0) * debtPointValue} دينار)
                  </Text>
                  <Text style={styles.workHoursText}>
                    الدوام: {driver.work_start_time || 'غير محدد'} - {driver.work_end_time || 'غير محدد'}
                  </Text>
                  {driver.debt_points >= maxDebtPoints && (
                    <Text style={styles.warningText}>⚠️ لا يمكن العمل - تجاوز الحد الأقصى</Text>
                  )}
                </View>
                {driver.is_suspended && (
                  <View style={styles.suspendedBadge}>
                    <Text style={styles.suspendedText}>موقوف</Text>
                  </View>
                )}
                {!driver.can_work && driver.debt_points >= maxDebtPoints && (
                  <View style={styles.debtBadge}>
                    <Text style={styles.debtBadgeText}>ديون عالية</Text>
                  </View>
                )}
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openModal(driver, 'debt')}
                >
                  <Ionicons name="card-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>تعديل نقاط</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openModal(driver, 'clear_debt')}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>تصفية النقاط</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openModal(driver, 'work_hours')}
                >
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>وقت الدوام</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openModal(driver, 'fine')}
                >
                  <Ionicons name="warning-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>إضافة نقاط</Text>
                </TouchableOpacity>

                {driver.is_suspended ? (
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => openModal(driver, 'unsuspend')}
                  >
                    <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.actionText}>إلغاء إيقاف</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => openModal(driver, 'suspend')}
                  >
                    <Ionicons name="pause-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.actionText}>إيقاف</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => openModal(driver, 'notification')}
                >
                  <View style={{position: 'relative'}}>
                    <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                    {driver.unread_notifications > 0 && (
                      <View style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        backgroundColor: '#FF4444',
                        borderRadius: 8,
                        minWidth: 14,
                        height: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.primary
                      }}>
                        <Text style={{
                          color: colors.primary,
                          fontSize: 8,
                          fontWeight: 'bold'
                        }}>
                          {driver.unread_notifications > 9 ? '9+' : driver.unread_notifications}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.actionText}>إشعار</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => confirmDeleteDriver(driver)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>حذف</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => { setDetailsDriver(driver); setDetailsModalVisible(true); }}
                >
                  <Ionicons name="eye-outline" size={20} color={colors.primary} />
                  <Text style={styles.actionText}>تفاصيل</Text>
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
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>تأكيد الحذف</Text>
            <Text style={styles.deleteModalDescription}>
              هل أنت متأكد من حذف السائق "{driverToDelete?.name || driverToDelete?.email}"? سيتم حذفه نهائياً من النظام.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity 
                style={[styles.deleteModalButton, styles.cancelButton]} 
                onPress={() => setShowDeleteDialog(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.deleteModalButton, styles.confirmButton]} 
                onPress={() => {
                  setShowDeleteDialog(false);
                  if (driverToDelete) deleteDriver(driverToDelete);
                }}
              >
                <Text style={styles.confirmButtonText}>حذف</Text>
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
            <Text style={styles.modalTitle}>تفاصيل السائق</Text>
            {detailsDriver && (
              <ScrollView style={{maxHeight: 400}}>
                <Text style={styles.detailText}>الاسم: {detailsDriver.name}</Text>
                <Text style={styles.detailText}>البريد الإلكتروني: {detailsDriver.email}</Text>
                <Text style={styles.detailText}>الهاتف: {detailsDriver.phone}</Text>
                <Text style={styles.detailText}>نوع المركبة: {detailsDriver.vehicle_type || 'غير محدد'}</Text>
                <Text style={styles.detailText}>رقم المركبة: {detailsDriver.vehicle_number || 'غير محدد'}</Text>
                <Text style={styles.detailText}>النقاط: {detailsDriver.debt_points || 0}</Text>
                <Text style={styles.detailText}>الديون: {(detailsDriver.debt_points || 0) * debtPointValue} دينار</Text>
                <Text style={styles.detailText}>الحالة: {detailsDriver.is_active ? 'مفعل' : 'غير مفعل'}</Text>
                <Text style={styles.detailText}>الإيقاف: {detailsDriver.is_suspended ? 'موقوف' : 'نشط'}</Text>
                <Text style={styles.detailText}>وقت الدوام: {detailsDriver.work_start_time || 'غير محدد'} - {detailsDriver.work_end_time || 'غير محدد'}</Text>
                <Text style={styles.detailText}>تاريخ التسجيل: {detailsDriver.created_at ? new Date(detailsDriver.created_at).toLocaleString('ar-IQ') : 'غير محدد'}</Text>
                {detailsDriver.national_card_front && <Text style={styles.detailText}>صورة البطاقة الوطنية (الوجه):</Text>}
                {detailsDriver.national_card_front && <Image source={{uri: detailsDriver.national_card_front}} style={{width: '100%', height: 120, borderRadius: 12, marginBottom: 8}} />}
                {detailsDriver.national_card_back && <Text style={styles.detailText}>صورة البطاقة الوطنية (الظهر):</Text>}
                {detailsDriver.national_card_back && <Image source={{uri: detailsDriver.national_card_back}} style={{width: '100%', height: 120, borderRadius: 12, marginBottom: 8}} />}
                {detailsDriver.residence_card_front && <Text style={styles.detailText}>صورة بطاقة السكن (الوجه):</Text>}
                {detailsDriver.residence_card_front && <Image source={{uri: detailsDriver.residence_card_front}} style={{width: '100%', height: 120, borderRadius: 12, marginBottom: 8}} />}
                {detailsDriver.residence_card_back && <Text style={styles.detailText}>صورة بطاقة السكن (الظهر):</Text>}
                {detailsDriver.residence_card_back && <Image source={{uri: detailsDriver.residence_card_back}} style={{width: '100%', height: 120, borderRadius: 12, marginBottom: 8}} />}
              </ScrollView>
            )}
            <TouchableOpacity style={[styles.modalButton, {marginTop: 18, backgroundColor: colors.primary}]} onPress={() => setDetailsModalVisible(false)}>
              <Text style={[styles.actionText, {color: colors.secondary, textAlign: 'center', fontWeight: 'bold'}]}>إغلاق</Text>
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
    backgroundColor: colors.secondary,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerLogo: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 12,
    borderRadius: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
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
    color: colors.dark,
    marginTop: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  driverCard: {
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
  suspendedCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  driverInfo: {
    marginBottom: 16,
  },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: 4,
  },
  driverEmail: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 8,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: colors.dark,
    marginLeft: 8,
  },
  driverStats: {
    marginTop: 8,
  },
  debtText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  workHoursText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 4,
  },
  suspendedBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  suspendedText: {
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
  warningText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  debtBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  debtBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsInfoText: {
    fontSize: 14,
    color: colors.dark,
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginLeft: 8,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteModalDescription: {
    fontSize: 14,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 8,
  },
}); 