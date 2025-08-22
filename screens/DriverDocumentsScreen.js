import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ScrollView,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabase';
import colors from '../colors';

export default function DriverDocumentsScreen({ navigation, route }) {
  console.log('DriverDocumentsScreen rendered with route.params:', route.params);
  
  const { formData } = route.params || {};
  
  if (!formData) {
    console.error('No formData received in DriverDocumentsScreen');
    Alert.alert('خطأ', 'لم يتم استلام بيانات النموذج، سيتم العودة للصفحة السابقة');
    navigation.goBack();
    return null;
  }
  
  console.log('formData received:', formData);
  
  const [documents, setDocuments] = useState({
    nationalCardFront: null,
    nationalCardBack: null,
    residenceCardFront: null,
    residenceCardBack: null
  });
  const [loading, setLoading] = useState(false);

  // تعطيل رفع Supabase مؤقتاً بسبب مشكلة في Storage
  const uploadToSupabase = async (uri, documentType) => {
    console.log(`تعطيل رفع Supabase مؤقتاً - استخدام Base64 مباشرة`);
    return await convertToBase64(uri);
  };

  const convertToBase64 = async (uri) => {
    try {
      // قراءة الملف كـ base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('خطأ في تحويل الصورة إلى Base64:', error);
      return uri; // إرجاع URI الأصلي كـ fallback
    }
  };

  const pickImage = async (documentType) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إذن الوصول للمعرض لاختيار الصور');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log(`اختيار صورة ${documentType}:`, result.assets[0].uri);
        
        // محاولة رفع الصورة إلى Supabase Storage أولاً
        try {
          const uploadedUrl = await uploadToSupabase(result.assets[0].uri, documentType);
          console.log(`تم رفع ${documentType} بنجاح:`, uploadedUrl.substring(0, 100) + '...');
          
          setDocuments(prev => ({
            ...prev,
            [documentType]: uploadedUrl
          }));
        } catch (uploadError) {
          console.error(`فشل في رفع ${documentType}:`, uploadError);
          // في حالة الفشل، استخدم Base64
          const base64Uri = await convertToBase64(result.assets[0].uri);
          console.log(`تم تحويل ${documentType} إلى Base64:`, base64Uri.substring(0, 100) + '...');
          
          setDocuments(prev => ({
            ...prev,
            [documentType]: base64Uri
          }));
        }
      }
    } catch (error) {
      console.error('خطأ في اختيار الصورة:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  const validateDocuments = () => {
    console.log('Validating documents...');
    console.log('Documents state:', documents);
    
    if (!documents.nationalCardFront) {
      console.log('Validation failed: missing national card front');
      Alert.alert('خطأ', 'يرجى رفع وجه البطاقة الوطنية');
      return false;
    }
    if (!documents.nationalCardBack) {
      console.log('Validation failed: missing national card back');
      Alert.alert('خطأ', 'يرجى رفع ظهر البطاقة الوطنية');
      return false;
    }
    if (!documents.residenceCardFront) {
      console.log('Validation failed: missing residence card front');
      Alert.alert('خطأ', 'يرجى رفع وجه بطاقة السكن');
      return false;
    }
    if (!documents.residenceCardBack) {
      console.log('Validation failed: missing residence card back');
      Alert.alert('خطأ', 'يرجى رفع ظهر بطاقة السكن');
      return false;
    }
    
    console.log('Documents validation passed successfully');
    return true;
  };

  const handleNext = () => {
    console.log('DriverDocumentsScreen handleNext called');
    console.log('documents:', documents);
    
    // طباعة معلومات المستندات للتأكد من حفظها
    console.log('=== معلومات المستندات ===');
    console.log('البطاقة الوطنية (الوجه):', documents.nationalCardFront ? 'تم رفعها' : 'غير موجودة');
    console.log('البطاقة الوطنية (الظهر):', documents.nationalCardBack ? 'تم رفعها' : 'غير موجودة');
    console.log('بطاقة السكن (الوجه):', documents.residenceCardFront ? 'تم رفعها' : 'غير موجودة');
    console.log('بطاقة السكن (الظهر):', documents.residenceCardBack ? 'تم رفعها' : 'غير موجودة');
    
    if (validateDocuments()) {
      console.log('Documents validation passed, navigating to DriverVehicle');
      try {
        navigation.navigate('DriverVehicle', { 
          formData, 
          documents 
        });
        console.log('Navigation to DriverVehicle successful');
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('خطأ', 'حدث خطأ في الانتقال للصفحة التالية');
      }
    } else {
      console.log('Documents validation failed');
    }
  };

  const renderDocumentCard = (title, frontType, backType, icon) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <Ionicons name={icon} size={24} color="#FF9800" />
        <Text style={styles.documentTitle}>{title}</Text>
      </View>
      
      <View style={styles.documentImages}>
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>الوجه</Text>
          {documents[frontType] ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: documents[frontType] }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => pickImage(frontType)}
              >
                <Text style={styles.changeButtonText}>تغيير</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage(frontType)}
            >
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text style={styles.uploadText}>رفع صورة الوجه</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>الظهر</Text>
          {documents[backType] ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: documents[backType] }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.changeButton}
                onPress={() => pickImage(backType)}
              >
                <Text style={styles.changeButtonText}>تغيير</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={() => pickImage(backType)}
            >
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text style={styles.uploadText}>رفع صورة الظهر</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>رفع المستندات</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>معلومات مهمة</Text>
            <Text style={styles.infoText}>
              تأكد من أن الصور واضحة ومقروءة. ستتم مراجعة المستندات من قبل الإدارة.
            </Text>
          </View>
        </View>

        {renderDocumentCard(
          'البطاقة الوطنية',
          'nationalCardFront',
          'nationalCardBack',
          'card-outline'
        )}

        {renderDocumentCard(
          'بطاقة السكن',
          'residenceCardFront',
          'residenceCardBack',
          'home-outline'
        )}

        <View style={styles.requirementsCard}>
          <Text style={styles.requirementsTitle}>متطلبات الصور:</Text>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.requirementText}>صور واضحة ومقروءة</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.requirementText}>جميع البيانات ظاهرة بوضوح</Text>
          </View>
          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.requirementText}>لا توجد ظلال أو انعكاسات</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.nextButton}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#FF9800', '#F57C00']}
            style={styles.gradientButton}
          >
            <Text style={styles.nextButtonText}>التالي</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: colors.secondary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }),
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 8,
  },
  documentImages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  imageLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    minHeight: 120,
  },
  uploadText: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  imagePreview: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  changeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requirementsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
}); 