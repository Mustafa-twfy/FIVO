import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Linking,
  Alert,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function StoreMapScreen({ navigation, route }) {
  const { store } = route.params;
  const [region, setRegion] = useState({
    latitude: store.latitude || 24.7136,
    longitude: store.longitude || 46.6753,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (store.latitude && store.longitude) {
      setRegion({
        latitude: store.latitude,
        longitude: store.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [store]);

  const handleCall = () => {
    if (store.phone) {
      Linking.openURL(`tel:${store.phone}`);
    } else {
      Alert.alert('خطأ', 'رقم الهاتف غير متوفر');
    }
  };

  const handleNavigation = () => {
    const url = Platform.OS === 'ios' 
      ? `http://maps.apple.com/?daddr=${store.latitude},${store.longitude}`
      : `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
    
    Linking.openURL(url);
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
            <Text style={styles.webTitle}>خريطة المتجر</Text>
            <Text style={styles.webSubtitle}>
              الموقع: {store.latitude}, {store.longitude}
            </Text>
            <Text style={styles.webMessage}>
              الخرائط متاحة على الأجهزة المحمولة فقط
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <Text style={styles.storePhone}>{store.phone}</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.gradientButton}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>اتصال</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleNavigation}>
              <LinearGradient colors={['#2196F3', '#1976D2']} style={styles.gradientButton}>
                <Ionicons name="navigate" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>تنقل</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
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
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  backButton: {
    padding: 8
  },
  webContainer: {
    flex: 1,
    padding: 20
  },
  webMap: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  webTitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  webSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center'
  },
  webMessage: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center'
  },
  infoCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center'
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center'
  },
  storePhone: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8
  }
}); 