import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase, driversAPI } from '../supabase';
import colors from '../colors';

export default function DriverProfileScreen({ navigation }) {
  const driverId = 1; // عدل لاحقاً حسب نظام تسجيل الدخول
  const [driverInfo, setDriverInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_number: '',
    vehicle_type: '',
    license_number: '',
    is_active: false
  });

  useEffect(() => {
    loadDriverInfo();
  }, []);

  const loadDriverInfo = async () => {
    setLoading(true);
    try {
      const { data: drivers, error } = await driversAPI.getAllDrivers();
      if (error || !drivers) throw new Error('تعذر جلب بيانات السائق');
      const driver = drivers.find(d => d.id === driverId);
      setDriverInfo(driver);
      setFormData({
        name: driver?.name || '',
        phone: driver?.phone || '',
        email: driver?.email || '',
        vehicle_number: driver?.vehicle_number || '',
        vehicle_type: driver?.vehicle_type || '',
        license_number: driver?.license_number || '',
        is_active: driver?.is_active || false
      });
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل بيانات السائق');
    }
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم السائق');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          vehicle_number: formData.vehicle_number.trim(),
          vehicle_type: formData.vehicle_type.trim(),
          license_number: formData.license_number.trim(),
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverInfo?.id);

      if (error) {
        Alert.alert('خطأ', 'فشل في حفظ البيانات');
      } else {
        Alert.alert('نجح', 'تم حفظ البيانات بنجاح');
        setIsEditing(false);
        loadDriverInfo(); // إعادة تحميل البيانات
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    setFormData({
      name: driverInfo?.name || '',
      phone: driverInfo?.phone || '',
      email: driverInfo?.email || '',
      vehicle_number: driverInfo?.vehicle_number || '',
      vehicle_type: driverInfo?.vehicle_type || '',
      license_number: driverInfo?.license_number || '',
      is_active: driverInfo?.is_active || false
    });
    setIsEditing(false);
  };

  const toggleOnlineStatus = (value) => {
    handleInputChange('is_active', value);
  };

  const maxDebtPoints = 40; // حد الديون الأقصى من إعدادات النظام
  const isBlocked = driverInfo?.is_suspended || (driverInfo?.debt_points >= maxDebtPoints);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* صورة الملف الشخصي */}
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: 'https://i.ibb.co/svdQ0fdc/IMG-20250623-233435-969.jpg' }} 
            style={styles.profileImage} 
          />
        </View>

        {/* معلومات السائق */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>معلومات السائق</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>اسم السائق</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.name || '---'}
              placeholder="أدخل اسم السائق"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم الهاتف</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.phone || '---'}
              placeholder="أدخل رقم الهاتف"
              keyboardType="phone-pad"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.email || '---'}
              placeholder="أدخل البريد الإلكتروني"
              keyboardType="email-address"
              editable={false}
            />
          </View>
        </View>

        {/* معلومات المركبة */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>معلومات المركبة</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نوع المركبة</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.vehicle_type || '---'}
              placeholder="نوع المركبة"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم المركبة</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.vehicle_number || '---'}
              placeholder="أدخل رقم المركبة"
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم الرخصة</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.license_number || '---'}
              placeholder="أدخل رقم الرخصة"
              editable={false}
            />
          </View>

          <View style={styles.vehicleInfoCard}>
            <Ionicons name="bicycle" size={24} color="#2196F3" />
            <Text style={styles.vehicleInfoText}>{formData.vehicle_type || 'غير محدد'}</Text>
          </View>
        </View>

        {/* إعدادات الحساب */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>إعدادات الحساب</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="radio-outline" size={24} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>حالة العمل</Text>
                <Text style={styles.settingDescription}>
                  {formData.is_active ? 'متاح للعمل' : 'غير متاح'}
                </Text>
              </View>
            </View>
            <Switch
              value={formData.is_active}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={formData.is_active ? '#fff' : '#f4f3f4'}
              disabled={!isEditing}
            />
          </View>
        </View>

        {/* معلومات إضافية */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>معلومات إضافية</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>تاريخ الانضمام</Text>
              <Text style={styles.infoValue}>
                {driverInfo?.created_at ? new Date(driverInfo.created_at).toLocaleDateString('en-GB') : 'غير محدد'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>آخر تحديث</Text>
              <Text style={styles.infoValue}>
                {driverInfo?.updated_at ? new Date(driverInfo.updated_at).toLocaleDateString('en-GB') : 'غير محدد'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>معلومات الديون</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>نقاط الديون:</Text>
            <Text style={styles.infoValue}>{driverInfo?.debt_points || 0} نقطة</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>إجمالي الديون:</Text>
            <Text style={styles.infoValue}>{(driverInfo?.debt_points || 0) * 250} دينار</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>الحد الأقصى:</Text>
            <Text style={styles.infoValue}>40 نقطة</Text>
          </View>
          {isBlocked && (
            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={20} color="#F44336" />
              <Text style={styles.warningText}>تم إيقافك مؤقتًا بسبب تجاوز حد الديون. يرجى تصفير الديون للعودة للعمل.</Text>
            </View>
          )}
          {driverInfo?.debt_points >= 30 && driverInfo?.debt_points < 40 && (
            <View style={styles.alertRow}>
              <Ionicons name="alert-circle-outline" size={20} color="#FF9800" />
              <Text style={styles.alertText}>تحذير: اقتربت من الحد الأقصى</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingBottom: 20, paddingHorizontal: 16, backgroundColor: colors.secondary },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primary },
  content: { flex: 1, padding: 20, backgroundColor: colors.secondary },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF9800',
  },
  infoContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputDisabled: {
    backgroundColor: '#f8f8f8',
    color: '#666',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  infoSection: {
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#FF9800',
  },
  vehicleInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  vehicleInfoText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  backButton: {
    padding: 8,
  },
}); 