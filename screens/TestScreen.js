import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TestScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const addTestResult = (test, result, details = '') => {
    setTestResults(prev => [...prev, { test, result, details, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addTestResult('بداية الاختبار', 'info', 'بدء اختبار قاعدة البيانات...');
      
      // اختبار الاتصال الأساسي
      const { data, error } = await supabase
        .from('drivers')
        .select('count')
        .limit(1);
      
      if (error) {
        addTestResult('الاتصال بقاعدة البيانات', 'error', error.message);
      } else {
        addTestResult('الاتصال بقاعدة البيانات', 'success', 'تم الاتصال بنجاح');
      }
      
      // اختبار الجداول
      const tables = ['drivers', 'stores', 'orders', 'registration_requests'];
      
      for (const table of tables) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (tableError) {
            addTestResult(`جدول ${table}`, 'error', tableError.message);
          } else {
            addTestResult(`جدول ${table}`, 'success', `تم العثور على ${tableData?.length || 0} سجل`);
          }
        } catch (err) {
          addTestResult(`جدول ${table}`, 'error', err.message);
        }
      }
      
      // اختبار AsyncStorage
      try {
        await AsyncStorage.setItem('test', 'test_value');
        const testValue = await AsyncStorage.getItem('test');
        await AsyncStorage.removeItem('test');
        
        if (testValue === 'test_value') {
          addTestResult('AsyncStorage', 'success', 'يعمل بشكل صحيح');
        } else {
          addTestResult('AsyncStorage', 'error', 'لا يعمل بشكل صحيح');
        }
      } catch (err) {
        addTestResult('AsyncStorage', 'error', err.message);
      }
      
      // اختبار البيانات التجريبية
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .limit(5);
      
      if (driversError) {
        addTestResult('البيانات التجريبية - السائقين', 'error', driversError.message);
      } else {
        addTestResult('البيانات التجريبية - السائقين', 'success', `تم العثور على ${drivers?.length || 0} سائق`);
      }
      
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('*')
        .limit(5);
      
      if (storesError) {
        addTestResult('البيانات التجريبية - المتاجر', 'error', storesError.message);
      } else {
        addTestResult('البيانات التجريبية - المتاجر', 'success', `تم العثور على ${stores?.length || 0} متجر`);
      }
      
      addTestResult('انتهاء الاختبار', 'info', 'تم الانتهاء من جميع الاختبارات');
      
    } catch (error) {
      addTestResult('خطأ عام', 'error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    setLoading(true);
    
    try {
      addTestResult('إنشاء البيانات التجريبية', 'info', 'جاري إنشاء البيانات...');
      
      // إنشاء سائقين تجريبيين
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .upsert([
          {
            email: 'driver1@tawseel.com',
            password: 'password123',
            name: 'أحمد محمد',
            phone: '+966501234567',
            vehicle_type: 'سيارة نقل صغيرة',
            status: 'approved',
            is_active: true
          },
          {
            email: 'driver2@tawseel.com',
            password: 'password123',
            name: 'محمد علي',
            phone: '+966502345678',
            vehicle_type: 'دراجة نارية',
            status: 'approved',
            is_active: true
          }
        ], { onConflict: 'email' });
      
      if (driversError) {
        addTestResult('إنشاء السائقين', 'error', driversError.message);
      } else {
        addTestResult('إنشاء السائقين', 'success', 'تم إنشاء السائقين بنجاح');
      }
      
      // إنشاء متاجر تجريبية
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .upsert([
          {
            email: 'store1@tawseel.com',
            password: 'password123',
            name: 'مطعم الشرق',
            phone: '+966504567890',
            address: 'شارع الملك فهد، الرياض',
            category: 'مطاعم',
            is_active: true
          },
          {
            email: 'store2@tawseel.com',
            password: 'password123',
            name: 'صيدلية النور',
            phone: '+966505678901',
            address: 'شارع التحلية، جدة',
            category: 'صيدليات',
            is_active: true
          }
        ], { onConflict: 'email' });
      
      if (storesError) {
        addTestResult('إنشاء المتاجر', 'error', storesError.message);
      } else {
        addTestResult('إنشاء المتاجر', 'success', 'تم إنشاء المتاجر بنجاح');
      }
      
      // إنشاء طلب تسجيل معلق
      const { data: request, error: requestError } = await supabase
        .from('registration_requests')
        .upsert([
          {
            email: 'nmcmilli07@gmail.com',
            password: 'password123',
            name: 'سائق تجريبي',
            phone: '+966501234567',
            user_type: 'driver',
            status: 'pending'
          }
        ], { onConflict: 'email' });
      
      if (requestError) {
        addTestResult('إنشاء طلب التسجيل', 'error', requestError.message);
      } else {
        addTestResult('إنشاء طلب التسجيل', 'success', 'تم إنشاء طلب التسجيل بنجاح');
      }
      
      addTestResult('انتهاء إنشاء البيانات', 'success', 'تم إنشاء جميع البيانات التجريبية');
      
    } catch (error) {
      addTestResult('خطأ في إنشاء البيانات', 'error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      addTestResult('مسح البيانات المحفوظة', 'success', 'تم مسح جميع البيانات المحفوظة');
      Alert.alert('تم المسح', 'تم مسح جميع البيانات المحفوظة بنجاح');
    } catch (error) {
      addTestResult('مسح البيانات المحفوظة', 'error', error.message);
    }
  };

  const getStatusColor = (result) => {
    switch (result) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (result) => {
    switch (result) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'info': return 'information-circle';
      default: return 'help-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>شاشة الاختبار</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={testDatabaseConnection}
            disabled={loading}
          >
            <Ionicons name="bug-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>اختبار قاعدة البيانات</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={createSampleData}
            disabled={loading}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>إنشاء بيانات تجريبية</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearStorage}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>مسح البيانات المحفوظة</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF9800" />
            <Text style={styles.loadingText}>جاري الاختبار...</Text>
          </View>
        )}

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>نتائج الاختبار:</Text>
          
          {testResults.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <Ionicons 
                name={getStatusIcon(result.result)} 
                size={20} 
                color={getStatusColor(result.result)} 
              />
              <View style={styles.resultContent}>
                <Text style={styles.resultTest}>{result.test}</Text>
                <Text style={styles.resultDetails}>{result.details}</Text>
                <Text style={styles.resultTime}>{result.timestamp}</Text>
              </View>
            </View>
          ))}
        </View>
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  buttonsContainer: {
    marginBottom: 20,
  },
  testButton: {
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultContent: {
    flex: 1,
    marginLeft: 12,
  },
  resultTest: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resultDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
}); 