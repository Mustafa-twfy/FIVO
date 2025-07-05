import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { supabase } from '../supabase';

// استيراد الخريطة فقط على الأجهزة المحمولة
let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
    // استخدام import ديناميكي
    import('react-native-maps').then(Maps => {
      MapView = Maps.default;
      Marker = Maps.Marker;
    }).catch(error => {
      console.log('react-native-maps غير متوفر على هذه المنصة');
    });
  } catch (error) {
    console.log('react-native-maps غير متوفر على هذه المنصة');
  }
}

export default function StoreLocationScreen({ navigation, route }) {
  const { formData, storeInfo } = route.params || {};
  
  if (!formData || !storeInfo) {
    console.error('Missing formData or storeInfo in StoreLocationScreen');
    Alert.alert('خطأ', 'لم يتم استلام البيانات المطلوبة، سيتم العودة للصفحة السابقة');
    navigation.goBack();
    return null;
  }
  
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('إذن الموقع مطلوب', 'نحتاج إلى إذن الموقع لتحديد موقع المتجر');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setLocation(currentLocation.coords);
      setRegion(newRegion);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('خطأ', 'فشل في تحديد الموقع');
    }
  };

  const handleLocationSelect = (event) => {
    if (Platform.OS === 'web') {
      // على الويب، نستخدم موقع افتراضي
      const newLocation = {
        latitude: 24.7136,
        longitude: 46.6753,
      };
      setLocation(newLocation);
      setRegion({
        ...region,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });
    } else {
      const newLocation = event.nativeEvent.coordinate;
      setLocation(newLocation);
      setRegion({
        ...region,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });
    }
  };

  const handleNext = async () => {
    if (!location) {
      Alert.alert('خطأ', 'يرجى تحديد موقع المتجر');
      return;
    }

    setLoading(true);
    try {
      // إنشاء طلب تسجيل جديد مع الموقع
      const { error } = await supabase
        .from('registration_requests')
        .insert([
          {
            email: formData.email,
            password: formData.password,
            user_type: 'store',
            name: storeInfo.name,
            phone: storeInfo.phone,
            address: storeInfo.address,
            latitude: location.latitude,
            longitude: location.longitude,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) {
        console.error('Error creating registration request:', error);
        Alert.alert('خطأ', 'فشل في إرسال طلب التسجيل: ' + error.message);
      } else {
        Alert.alert('نجح', 'تم إرسال طلب التسجيل بنجاح! سيتم مراجعة طلبك من قبل الإدارة.', [
          {
            text: 'حسناً',
            onPress: () => navigation.replace('UnifiedPendingApproval', { 
              email: formData.email, 
              user_type: 'store', 
              password: formData.password 
            })
          }
        ]);
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال طلب التسجيل');
    } finally {
      setLoading(false);
    }
  };

  // عرض واجهة بديلة على الويب
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FF9800" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>موقع المتجر</Text>
          <View style={{width: 24}} />
        </View>

        <View style={styles.webContainer}>
          <View style={styles.webMap}>
            <Ionicons name="map-outline" size={80} color="#FF9800" />
            <Text style={styles.webTitle}>تحديد موقع المتجر</Text>
            <Text style={styles.webSubtitle}>
              الموقع المحدد: {location ? `${location.latitude}, ${location.longitude}` : 'لم يتم التحديد بعد'}
            </Text>
            <Text style={styles.webMessage}>
              الخرائط متاحة على الأجهزة المحمولة فقط
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>معلومات مهمة</Text>
            <Text style={styles.infoText}>
              سيتم تحديد موقع المتجر تلقائياً عند استخدام التطبيق على الهاتف المحمول.
            </Text>
          </View>

          <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={loading}>
            <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.gradientButton}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>إرسال طلب التسجيل</Text>
                  <Ionicons name="send" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webMapPlaceholder}>
          <Ionicons name="map-outline" size={60} color="#ccc" />
          <Text style={styles.webMapText}>الخريطة غير متاحة على الويب</Text>
          <Text style={styles.webMapSubtext}>يرجى استخدام التطبيق على الهاتف</Text>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        region={region}
        onPress={handleLocationSelect}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {location && (
          <Marker
            coordinate={location}
            title="موقع المتجر"
            description="اضغط لتحديد الموقع"
          />
        )}
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (navigation.canGoBack()) { navigation.goBack(); } }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>موقع المتجر</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="location" size={80} color="#FF9800" />
          <Text style={styles.logoText}>توصيل بلس</Text>
          <Text style={styles.subtitle}>حدد موقع متجرك</Text>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.sectionTitle}>البحث عن العنوان</Text>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="أدخل عنوان المتجر"
              value={location ? `${location.latitude}, ${location.longitude}` : ''}
              multiline
            />
            <TouchableOpacity onPress={handleNext} style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>اختر الموقع على الخريطة</Text>
          <View style={styles.mapWrapper}>
            {renderMap()}
          </View>
        </View>

        <View style={styles.locationInfo}>
          <Text style={styles.sectionTitle}>معلومات الموقع</Text>
          {location ? (
            <View style={styles.coordinatesContainer}>
              <View style={styles.coordinateItem}>
                <Ionicons name="location-outline" size={20} color="#FF9800" />
                <Text style={styles.coordinateText}>
                  خط العرض: {location.latitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.coordinateItem}>
                <Ionicons name="location-outline" size={20} color="#FF9800" />
                <Text style={styles.coordinateText}>
                  خط الطول: {location.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noLocationText}>لم يتم اختيار موقع بعد</Text>
          )}
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>تعليمات:</Text>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.instructionText}>اضغط على الخريطة لتحديد موقع متجرك</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.instructionText}>أو اكتب العنوان في حقل البحث</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.instructionText}>تأكد من دقة الموقع لسهولة الوصول</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleNext}
          disabled={!location || loading}
        >
          <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.gradientButton}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>إرسال طلب التسجيل</Text>
                <Ionicons name="send" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  backButton: {
    padding: 8
  },
  content: {
    flexGrow: 1,
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 14,
    textAlign: 'right'
  },
  searchButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8
  },
  mapContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  mapWrapper: {
    borderRadius: 8,
    overflow: 'hidden'
  },
  map: {
    height: 300,
    width: '100%'
  },
  webMapPlaceholder: {
    height: 300,
    width: '100%',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8
  },
  webMapText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: 'bold'
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4
  },
  locationInfo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  coordinatesContainer: {
    gap: 8
  },
  coordinateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  coordinateText: {
    fontSize: 14,
    color: '#333'
  },
  noLocationText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    flex: 1
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  webMap: {
    alignItems: 'center',
    marginBottom: 20
  },
  webTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  webSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10
  },
  webMessage: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  infoText: {
    fontSize: 14,
    color: '#666'
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8
  }
}); 