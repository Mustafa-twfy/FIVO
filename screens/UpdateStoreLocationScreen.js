import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
const storeIcon = { uri: 'https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg' };

// استيراد الخريطة فقط على الأجهزة المحمولة
let MapView, Marker;
if (Platform.OS !== 'web') {
  try {
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

export default function UpdateStoreLocationScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const [region, setRegion] = useState({
    latitude: 24.7136,
    longitude: 46.6753,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    loadStoreInfo();
    getCurrentLocation();
  }, []);

  const loadStoreInfo = async () => {
    try {
      const storeId = await AsyncStorage.getItem('userId');
      if (storeId) {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();
        
        if (!error && data) {
          setStoreInfo(data);
          // إذا كان المتجر لديه موقع محفوظ، استخدمه
          if (data.latitude && data.longitude) {
            setLocation({ latitude: data.latitude, longitude: data.longitude });
            setRegion({
              latitude: data.latitude,
              longitude: data.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        }
      }
    } catch (error) {
      console.error('خطأ في تحميل معلومات المتجر:', error);
    }
  };

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

  const handleSaveLocation = async () => {
    if (!location) {
      Alert.alert('خطأ', 'يرجى تحديد موقع المتجر');
      return;
    }

    if (!storeInfo?.id) {
      Alert.alert('خطأ', 'لم يتم العثور على معلومات المتجر');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeInfo.id);

      if (error) {
        console.error('Error updating store location:', error);
        Alert.alert('خطأ', 'فشل في تحديث موقع المتجر: ' + error.message);
      } else {
        Alert.alert('نجح', 'تم تحديث موقع المتجر بنجاح!', [
          {
            text: 'حسناً',
            onPress: () => navigation.goBack()
          }
        ]);
      }
    } catch (error) {
      console.error('Error in handleSaveLocation:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث موقع المتجر');
    } finally {
      setSaving(false);
    }
  };

  // عرض واجهة بديلة على الويب
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FF9800" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تحديث موقع المتجر</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.webContainer}>
          <View style={styles.webMap}>
            <Ionicons name="map-outline" size={80} color="#FF9800" />
            <Text style={styles.webTitle}>تحديث موقع المتجر</Text>
            <Text style={styles.webSubtitle}>
              الموقع الحالي: {storeInfo?.latitude && storeInfo?.longitude 
                ? `${storeInfo.latitude}, ${storeInfo.longitude}` 
                : 'غير محدد'}
            </Text>
            <Text style={styles.webMessage}>
              الخرائط متاحة على الأجهزة المحمولة فقط
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>معلومات مهمة</Text>
            <Text style={styles.infoText}>
              سيتم تحديث موقع المتجر تلقائياً عند استخدام التطبيق على الهاتف المحمول.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.saveButton} 
            onPress={handleSaveLocation}
            disabled={saving}
          >
            <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.gradientButton}>
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>حفظ الموقع</Text>
                  <Ionicons name="save" size={20} color="#fff" />
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تحديث موقع المتجر</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={storeIcon} style={{ width: 80, height: 80, resizeMode: 'contain', marginBottom: 10 }} />
          <Text style={styles.logoText}>تحديث الموقع</Text>
          <Text style={styles.subtitle}>حدد موقع متجرك الجديد</Text>
        </View>

        <View style={styles.mapContainer}>
          <Text style={styles.sectionTitle}>اختر الموقع على الخريطة</Text>
          <View style={styles.mapWrapper}>
            {renderMap()}
          </View>
        </View>

        <View style={styles.infoContainer}>
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
            <Text style={styles.instructionText}>تأكد من دقة الموقع لسهولة الوصول</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.instructionText}>سيتم حفظ الموقع الجديد فوراً</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSaveLocation}
          disabled={!location || saving}
        >
          <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.gradientButton}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>حفظ الموقع</Text>
                <Ionicons name="save" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FF9800', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  content: { flex: 1, padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#FF9800', marginTop: 10 },
  subtitle: { fontSize: 16, color: '#666', marginTop: 5 },
  mapContainer: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  mapWrapper: { height: 300, borderRadius: 12, overflow: 'hidden' },
  map: { flex: 1 },
  webMapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  webMapText: { fontSize: 16, color: '#666', marginTop: 12 },
  webMapSubtext: { fontSize: 14, color: '#999', marginTop: 4 },
  infoContainer: { marginBottom: 20 },
  coordinatesContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  coordinateItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  coordinateText: { fontSize: 14, color: '#333', marginLeft: 8 },
  noLocationText: { fontSize: 14, color: '#999', textAlign: 'center', fontStyle: 'italic' },
  instructionsContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 24 },
  instructionsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  instructionItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  instructionText: { fontSize: 14, color: '#666', marginLeft: 8 },
  saveButton: { borderRadius: 12, overflow: 'hidden' },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 24 },
  saveButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginRight: 8 },
  webContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  webMap: { alignItems: 'center', marginBottom: 30 },
  webTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 8 },
  webSubtitle: { fontSize: 16, color: '#666', marginBottom: 8 },
  webMessage: { fontSize: 14, color: '#999', textAlign: 'center' },
  infoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 30 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#666', lineHeight: 20 },
}); 