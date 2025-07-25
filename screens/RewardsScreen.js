import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { driversAPI } from '../supabase';
import { Ionicons } from '@expo/vector-icons';

export default function RewardsScreen({ navigation }) {
  const driverId = 1; // عدل لاحقاً حسب نظام تسجيل الدخول
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    const { data, error } = await driversAPI.getDriverRewards(driverId);
    if (error) {
      Alert.alert('خطأ', 'تعذر جلب بيانات المكافآت');
      setLoading(false);
      return;
    }
    setRewards(data || []);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={26} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.title}>المكافآت</Text>
          <View style={{width:34}} />
        </View>
        <Text style={styles.info}>هذه المكافآت يضيفها لك الأدمن كمكافأة على الأداء أو الإنجازات.</Text>
        <FlatList
          data={rewards}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.rewardCard}>
              <Text style={styles.rewardTitle}>{item.title}</Text>
              <Text style={styles.rewardAmount}>القيمة: {item.amount} دينار</Text>
              <Text style={styles.rewardDate}>التاريخ: {item.created_at ? item.created_at.substring(0,10) : ''}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingTop: 16 }}
          ListEmptyComponent={<Text style={{textAlign:'center',color:'#888',marginTop:32}}>لا توجد مكافآت حالياً</Text>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  innerContent: { width: '94%', backgroundColor: '#fff', borderRadius: 18, marginTop: 36, padding: 0, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  backButton: { padding: 4 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4CAF50', marginBottom: 0 },
  info: { fontSize: 15, color: '#888', marginBottom: 16, textAlign: 'center', width: '90%', alignSelf: 'center' },
  rewardCard: {
    backgroundColor: '#f1f8e9',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    width: '95%',
    alignSelf: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }
      : { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }),
  },
  rewardTitle: { fontSize: 17, fontWeight: 'bold', color: '#388E3C', marginBottom: 6 },
  rewardAmount: { fontSize: 15, color: '#222', marginBottom: 4 },
  rewardDate: { fontSize: 13, color: '#888' },
}); 