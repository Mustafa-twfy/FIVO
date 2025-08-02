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
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../colors';

export default function StoreProfileScreen({ navigation, route }) {
  const { storeId, storeName } = route.params || {};
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    category: '',
    is_active: true
  });

  useEffect(() => {
    loadStoreInfo();
  }, []);

  const loadStoreInfo = async () => {
    setLoading(true);
    try {
      let targetStoreId = storeId;
      
      // إذا لم يتم تمرير storeId، استخدم userId من AsyncStorage (للمتجر نفسه)
      if (!targetStoreId) {
        targetStoreId = await AsyncStorage.getItem('userId');
        if (!targetStoreId) {
          Alert.alert('خطأ', 'لم يتم العثور على معرف المتجر');
          navigation.goBack();
          return;
        }
      } else {
        // إذا تم تمرير storeId، فهذا يعني أن السائق يريد رؤية ملف المتجر
        setIsReadOnly(true);
        setIsEditing(false);
      }

      const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', targetStoreId)
        .single();

      if (error) {
        throw new Error('تعذر جلب بيانات المتجر');
      }

      if (store) {
        setStoreInfo(store);
        setFormData({
          name: store.name || '',
          phone: store.phone || '',
          email: store.email || '',
          address: store.address || '',
          description: store.description || '',
          category: store.category || '',
          is_active: store.is_active || true
        });
      }
    } catch (error) {
      Alert.alert('خطأ', error.message || 'فشل في تحميل بيانات المتجر');
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
      Alert.alert('خطأ', 'يرجى إدخال اسم المتجر');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال رقم الهاتف');
      return;
    }

    if (!formData.address.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان المتجر');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeInfo?.id);

      if (error) {
        Alert.alert('خطأ', 'فشل في حفظ البيانات');
      } else {
        Alert.alert('نجح', 'تم حفظ البيانات بنجاح');
        setIsEditing(false);
        loadStoreInfo(); // إعادة تحميل البيانات
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    setFormData({
      name: storeInfo?.name || '',
      phone: storeInfo?.phone || '',
      email: storeInfo?.email || '',
      address: storeInfo?.address || '',
      description: storeInfo?.description || '',
      category: storeInfo?.category || '',
      is_active: storeInfo?.is_active || true
    });
    setIsEditing(false);
  };

  const toggleActiveStatus = (value) => {
    handleInputChange('is_active', value);
  };

  if (loading) {
    return null;
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
        <Text style={styles.headerTitle}>
          {isReadOnly ? (storeName || 'ملف المتجر') : 'الملف الشخصي'}
        </Text>
        {!isReadOnly && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Ionicons 
              name={isEditing ? "close" : "create-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* صورة الملف الشخصي */}
        <View style={styles.profileImageContainer}>
          <Image 
            source={{ uri: 'https://i.ibb.co/svdQ0fdc/IMG-20250623-233435-969.jpg' }} 
            style={styles.profileImage} 
          />
          <View style={styles.storeTypeBadge}>
            <Ionicons name="storefront" size={16} color="#fff" />
            <Text style={styles.storeTypeText}>متجر</Text>
          </View>
        </View>

        {/* معلومات المتجر */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>معلومات المتجر</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>اسم المتجر *</Text>
            <TextInput
              style={[styles.input, (!isEditing || isReadOnly) && styles.inputDisabled]}
              value={formData.name}
              placeholder="أدخل اسم المتجر"
              onChangeText={(text) => handleInputChange('name', text)}
              editable={isEditing && !isReadOnly}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>رقم الهاتف *</Text>
            <TextInput
              style={[styles.input, (!isEditing || isReadOnly) && styles.inputDisabled]}
              value={formData.phone}
              placeholder="أدخل رقم الهاتف"
              keyboardType="phone-pad"
              onChangeText={(text) => handleInputChange('phone', text)}
              editable={isEditing && !isReadOnly}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formData.email}
              placeholder="البريد الإلكتروني"
              keyboardType="email-address"
              editable={false}
            />
            <Text style={styles.hintText}>لا يمكن تغيير البريد الإلكتروني</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>العنوان *</Text>
            <TextInput
              style={[styles.input, (!isEditing || isReadOnly) && styles.inputDisabled]}
              value={formData.address}
              placeholder="أدخل عنوان المتجر"
              multiline
              numberOfLines={2}
              onChangeText={(text) => handleInputChange('address', text)}
              editable={isEditing && !isReadOnly}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>نوع المتجر</Text>
            <TextInput
              style={[styles.input, (!isEditing || isReadOnly) && styles.inputDisabled]}
              value={formData.category}
              placeholder="مثال: مطعم، صيدلية، محل ملابس"
              onChangeText={(text) => handleInputChange('category', text)}
              editable={isEditing && !isReadOnly}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>وصف المتجر</Text>
            <TextInput
              style={[styles.input, styles.textArea, (!isEditing || isReadOnly) && styles.inputDisabled]}
              value={formData.description}
              placeholder="وصف مختصر عن المتجر والخدمات المقدمة"
              multiline
              numberOfLines={3}
              onChangeText={(text) => handleInputChange('description', text)}
              editable={isEditing && !isReadOnly}
            />
          </View>
        </View>

        {/* إعدادات الحساب */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>إعدادات الحساب</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="radio-outline" size={24} color="#666" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>حالة المتجر</Text>
                <Text style={styles.settingDescription}>
                  {formData.is_active ? 'متاح للطلبات' : 'غير متاح'}
                </Text>
              </View>
            </View>
            <Switch
              value={formData.is_active}
              onValueChange={toggleActiveStatus}
              trackColor={{ false: '#767577', true: '#4CAF50' }}
              thumbColor={formData.is_active ? '#fff' : '#f4f3f4'}
              disabled={!isEditing || isReadOnly}
            />
          </View>
        </View>

        {/* معلومات إضافية */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>معلومات إضافية</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>تاريخ التسجيل</Text>
              <Text style={styles.infoValue}>
                {storeInfo?.created_at ? new Date(storeInfo.created_at).toLocaleDateString('ar-SA') : 'غير محدد'}
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>الموقع</Text>
              <Text style={styles.infoValue}>
                {storeInfo?.latitude && storeInfo?.longitude 
                  ? `${storeInfo.latitude.toFixed(4)}, ${storeInfo.longitude.toFixed(4)}`
                  : 'غير محدد'
                }
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="list-outline" size={20} color="#666" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>إجمالي الطلبات</Text>
              <Text style={styles.infoValue}>{storeInfo?.total_orders || 0} طلب</Text>
            </View>
          </View>
        </View>

        {/* أزرار الإجراءات */}
        {isEditing && !isReadOnly && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={cancelEdit}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={saveProfile}
              disabled={saving}
            >
              <LinearGradient
                colors={['#FF9800', '#F57C00']}
                style={styles.gradientButton}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
                    <Ionicons name="save" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.secondary,
  },
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
  storeTypeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storeTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDisabled: {
    backgroundColor: '#f8f8f8',
    color: '#666',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
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
    marginBottom: 12,
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
}); 