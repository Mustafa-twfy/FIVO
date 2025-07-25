import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driversAPI } from '../supabase';
import colors from '../colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorMessage from '../components/ErrorMessage';
import isEqual from 'lodash.isequal';

export default function DriverNotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverId, setDriverId] = useState(null);
  const [itemLoading, setItemLoading] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIdAndNotifications = async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const id = await AsyncStorage.getItem('userId');
        if (!id) throw new Error('لم يتم العثور على معرف السائق');
        setDriverId(id);
        const { data, error } = await driversAPI.getDriverNotifications(id);
        if (error) throw new Error('تعذر جلب الإشعارات');
        if (!isEqual(notifications, data)) {
          setNotifications(data || []);
        }
      } catch (error) {
        setError(error.message || 'حدث خطأ غير متوقع في تحميل الإشعارات');
      }
      if (!silent) setLoading(false);
    };
    fetchIdAndNotifications();

    // تحديث الإشعارات كل 10 ثواني مع مقارنة ذكية (تحديث صامت)
    const interval = setInterval(() => {
      fetchIdAndNotifications(true); // silent
    }, 10000);
    return () => clearInterval(interval);
  }, [notifications]);

  if (error) {
    return <ErrorMessage message={error} suggestion="يرجى التحقق من اتصالك بالإنترنت أو إعادة المحاولة." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 8}}>
          <Ionicons name="arrow-back" size={26} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.title}>الإشعارات</Text>
        <View style={{width:34}} />
      </View>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => (
          <View style={styles.notificationCard}>
            <Ionicons name="notifications-outline" size={24} color="#2196F3" style={{marginBottom:6}} />
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.message}</Text>
            <Text style={styles.notificationDate}>
              {item.created_at ? new Date(item.created_at).toLocaleString('ar-IQ') : ''}
            </Text>
            {itemLoading[item.id] && (
              <ActivityIndicator size="small" color="#2196F3" style={{ marginLeft: 8 }} />
            )}
          </View>
        )}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        ListEmptyComponent={<Text style={{textAlign:'center',color:'#888',marginTop:32}}>لا توجد إشعارات حالياً</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.secondary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: colors.secondary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginBottom: 0 },
  notificationCard: { backgroundColor: colors.primary, borderRadius: 14, padding: 18, marginBottom: 14, width: '90%', alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1, alignItems: 'flex-start' },
  notificationTitle: { fontSize: 17, fontWeight: 'bold', color: colors.secondary, marginBottom: 6 },
  notificationBody: { fontSize: 15, color: colors.secondary, marginBottom: 4 },
  notificationDate: { fontSize: 13, color: '#888', alignSelf: 'flex-end' },
}); 