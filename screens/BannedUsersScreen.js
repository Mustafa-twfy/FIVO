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
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bannedUsersAPI } from '../supabase';
import colors from '../colors';

export default function BannedUsersScreen({ navigation }) {
  const [bannedUsers, setBannedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [inputValue2, setInputValue2] = useState('');

  useEffect(() => {
    loadBannedUsers();
  }, []);

  const loadBannedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await bannedUsersAPI.getBannedUsers();
      if (error) throw new Error('تعذر جلب المحظورين');
      setBannedUsers(data || []);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل المحظورين');
    }
    setLoading(false);
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
    setInputValue('');
    setInputValue2('');
  };

  const handleAction = async () => {
    try {
      let result;
      switch (modalType) {
        case 'ban_user':
          result = await bannedUsersAPI.banUser(inputValue, inputValue2, 'سبب الحظر');
          break;
        case 'unban_user':
          result = await bannedUsersAPI.unbanUser(inputValue);
          break;
      }

      if (result?.error) {
        Alert.alert('خطأ', 'فشل في تنفيذ العملية');
      } else {
        Alert.alert('نجح', 'تم تنفيذ العملية بنجاح');
        loadBannedUsers(); // إعادة تحميل البيانات
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
    setModalVisible(false);
  };

  const getModalContent = () => {
    switch (modalType) {
      case 'ban_user':
        return {
          title: 'حظر مستخدم جديد',
          placeholder: 'معرف المستخدم (ID)',
          placeholder2: 'نوع المستخدم (driver/store)',
          showSecondInput: true
        };
      case 'unban_user':
        return {
          title: 'فك حظر مستخدم',
          placeholder: 'معرف المستخدم (ID)',
          placeholder2: '',
          showSecondInput: false
        };
      default:
        return { title: '', placeholder: '', placeholder2: '', showSecondInput: false };
    }
  };

  const modalContent = getModalContent();

  const getUserTypeText = (userType) => {
    switch (userType) {
      case 'driver': return 'سائق';
      case 'store': return 'متجر';
      default: return 'غير محدد';
    }
  };

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AdminDashboardScreen')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>قائمة المحظورين</Text>
        <TouchableOpacity onPress={loadBannedUsers} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actionsHeader}>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => openModal('ban_user')}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.secondary} />
          <Text style={styles.addButtonText}>حظر مستخدم جديد</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {bannedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={64} color={colors.secondary} />
            <Text style={styles.emptyText}>لا يوجد مستخدمين محظورين</Text>
          </View>
        ) : (
          bannedUsers.map((bannedUser) => (
            <View key={bannedUser.id} style={styles.bannedCard}>
              <View style={styles.bannedInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userId}>المستخدم #{bannedUser.user_id}</Text>
                  <View style={styles.userTypeBadge}>
                    <Text style={styles.userTypeText}>
                      {getUserTypeText(bannedUser.user_type)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.banReason}>سبب الحظر: {bannedUser.reason || 'غير محدد'}</Text>
                <Text style={styles.banDate}>
                  تاريخ الحظر: {new Date(bannedUser.banned_at).toLocaleDateString('ar-SA')}
                </Text>
              </View>

              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.unbanButton} 
                  onPress={() => {
                    setInputValue(bannedUser.user_id);
                    openModal('unban_user');
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.unbanButtonText}>فك الحظر</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  refreshButton: {
    padding: 8,
  },
  actionsHeader: {
    padding: 16,
    backgroundColor: colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
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
  bannedCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  bannedInfo: {
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  userTypeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  banReason: {
    fontSize: 14,
    color: colors.dark,
    marginBottom: 4,
  },
  banDate: {
    fontSize: 12,
    color: colors.dark,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  unbanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  unbanButtonText: {
    fontSize: 14,
    color: colors.primary,
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
}); 