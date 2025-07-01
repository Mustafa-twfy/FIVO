import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function StoreDocumentsScreen({ navigation, route }) {
  const { formData, storeInfo } = route.params || {};
  
  if (!formData || !storeInfo) {
    Alert.alert('خطأ', 'لم يتم استلام البيانات المطلوبة، سيتم العودة للصفحة السابقة');
    navigation.goBack();
    return null;
  }
  
  const [documents, setDocuments] = useState({
    commercial_license: null,
    tax_card: null,
    municipality_license: null,
  });
  const [loading, setLoading] = useState(false);

  const pickDocument = async (documentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [documentType]: result.assets[0]
        }));
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في اختيار الملف');
    }
  };

  const removeDocument = (documentType) => {
    setDocuments(prev => ({
      ...prev,
      [documentType]: null
    }));
  };

  const handleSubmit = async () => {
    console.log('documents:', documents);
    
    // التحقق من وجود المستندات المطلوبة
    const requiredDocuments = ['commercial_license', 'tax_card'];
    for (const doc of requiredDocuments) {
      if (!documents[doc]) {
        console.log('Validation failed: missing document:', doc);
        Alert.alert('خطأ', `يرجى رفع ${getDocumentLabel(doc)}`);
        return;
      }
    }

    console.log('Documents validation passed');
    setLoading(true);
    try {
      // إنشاء طلب تسجيل جديد مع جميع البيانات
      const { error } = await supabase
        .from('registration_requests')
        .insert([
          {
            email: formData.email,
            password: formData.password,
            user_type: 'store',
            name: storeInfo.storeName,
            phone: storeInfo.phone,
            address: storeInfo.address,
            latitude: storeInfo.latitude,
            longitude: storeInfo.longitude,
            commercial_license: documents.commercial_license?.uri || documents.commercial_license?.name,
            tax_card: documents.tax_card?.uri || documents.tax_card?.name,
            municipality_license: documents.municipality_license?.uri || documents.municipality_license?.name,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Database error:', error);
        Alert.alert('خطأ', 'فشل في إرسال طلب التسجيل');
      } else {
        console.log('Registration request sent successfully');
        Alert.alert('نجح', 'تم إرسال طلب التسجيل بنجاح! سيتم مراجعة طلبك من قبل الإدارة.', [
          {
            text: 'حسناً',
            onPress: () => {
              try {
                navigation.navigate('StorePendingApproval', { formData, storeInfo, documents });
                console.log('Navigation to StorePendingApproval successful');
              } catch (navError) {
                console.error('Navigation error:', navError);
                Alert.alert('خطأ في التنقل', 'حدث خطأ أثناء الانتقال لصفحة انتظار الموافقة');
              }
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentLabel = (documentType) => {
    const labels = {
      commercial_license: 'الرخصة التجارية',
      tax_card: 'البطاقة الضريبية',
      municipality_license: 'رخصة البلدية'
    };
    return labels[documentType] || documentType;
  };

  const renderDocumentItem = (documentType, label, required = false) => (
    <View key={documentType} style={styles.documentItem}>
      <View style={styles.documentHeader}>
        <Text style={styles.documentLabel}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        {documents[documentType] && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeDocument(documentType)}
          >
            <Ionicons name="close-circle" size={24} color="#FF0000" />
          </TouchableOpacity>
        )}
      </View>
      
      {documents[documentType] ? (
        <View style={styles.documentPreview}>
          <Ionicons name="document" size={40} color="#FF9800" />
          <Text style={styles.documentName} numberOfLines={1}>
            {documents[documentType].name}
          </Text>
          <Text style={styles.documentSize}>
            {(documents[documentType].size / 1024 / 1024).toFixed(2)} MB
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={() => pickDocument(documentType)}
        >
          <Ionicons name="cloud-upload-outline" size={32} color="#666" />
          <Text style={styles.uploadText}>اضغط لرفع الملف</Text>
          <Text style={styles.uploadHint}>PDF أو صورة</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>مستندات المتجر</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#FF9800" />
          <Text style={styles.infoText}>
            يرجى رفع المستندات المطلوبة للمراجعة والموافقة على حسابك
          </Text>
        </View>

        <View style={styles.documentsContainer}>
          {renderDocumentItem('commercial_license', 'الرخصة التجارية', true)}
          {renderDocumentItem('tax_card', 'البطاقة الضريبية', true)}
          {renderDocumentItem('municipality_license', 'رخصة البلدية', false)}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'جاري الحفظ...' : 'إرسال المستندات'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    color: '#E65100',
    fontSize: 14,
    lineHeight: 20,
  },
  documentsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  documentItem: {
    marginBottom: 25,
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#FF0000',
  },
  removeButton: {
    padding: 5,
  },
  documentPreview: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  documentName: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  documentSize: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  uploadButton: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 