import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driversAPI, supportAPI, systemSettingsAPI } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function FinancialAccountsScreen({ navigation }) {
  const { user } = useAuth();
  const [driverId, setDriverId] = useState(null);
  const [debtPoints, setDebtPoints] = useState(0);
  const [debtValue, setDebtValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    const init = async () => {
      // حاول جلب المعرف من سياق الجلسة أولاً ثم من التخزين
      if (user && user.id) {
        setDriverId(user.id);
      } else {
        try {
          const storedId = await AsyncStorage.getItem('userId');
          if (storedId) setDriverId(parseInt(storedId, 10));
        } catch (e) {
          console.error('FinancialAccountsScreen: failed to read userId from AsyncStorage', e);
        }
      }
    };
    init();
  }, []);

  // جلب بيانات الديون متى ما أصبح driverId متوفراً
  useEffect(() => {
    if (driverId) {
      fetchDriverDebt();
    }
  }, [driverId]);

  const fetchDriverDebt = async () => {
    setLoading(true);
    try {
      if (!driverId) {
        console.warn('FinancialAccountsScreen: no driverId available yet');
        setLoading(false);
        return;
      }
      // جلب إعدادات النظام أولاً
      const { data: settings } = await systemSettingsAPI.getSystemSettings();
      const debtPointValue = settings?.debt_point_value || 250;
      // جلب السائق مباشرة بالمعرّف
      console.log('FinancialAccountsScreen: fetching driver with id', driverId);
      const { data: driver, error } = await driversAPI.getDriverById(driverId);
      if (error || !driver) {
        Alert.alert('خطأ', 'تعذر جلب بيانات السائق');
        setLoading(false);
        return;
      }
      setDebtPoints(driver?.debt_points || 0);
      setDebtValue((driver?.debt_points || 0) * debtPointValue);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في جلب البيانات');
    }
    setLoading(false);
  };

  // إزالة خيار تصفير الديون من الواجهة وفق طلبك

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) return;
    setLoading(true);
    const { error } = await supportAPI.sendSupportMessage('driver', driverId, supportMessage.trim(), 'user');
    if (!error) {
      Alert.alert('تم الإرسال', 'تم إرسال رسالتك للدعم الفني بنجاح');
      setSupportMessage('');
      setSupportModalVisible(false);
    } else {
      Alert.alert('خطأ', 'تعذر إرسال الرسالة');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 8}}>
          <Ionicons name="arrow-back" size={26} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.title}>الحسابات المالية</Text>
        <TouchableOpacity onPress={() => setSupportModalVisible(true)} style={{padding: 8}}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#FF9800" />
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>ديونك الحالية بالنقاط:</Text>
        <Text style={styles.value}>{debtPoints || 0} نقطة</Text>
        <Text style={styles.label}>قيمة الديون:</Text>
        <Text style={styles.value}>{debtValue || 0} ألف دينار</Text>
        <Text style={styles.info}>كل نقطة = {debtValue && debtPoints ? Math.round(debtValue / debtPoints) : 250} دينار</Text>
        <Text style={styles.info}>تزداد النقاط فقط عند إكمال الطلب.</Text>
      </View>
      <Text style={styles.supportNote}>لتقليل/تصفير الديون تواصل مع الدعم الفني عبر الأيقونة.</Text>
      <Modal visible={supportModalVisible} transparent animationType="slide" onRequestClose={() => setSupportModalVisible(false)}>
        <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.3)',justifyContent:'center',alignItems:'center'}}>
          <View style={{backgroundColor:'#fff',borderRadius:16,padding:24,width:'85%',maxWidth:400,alignItems:'center'}}>
            <Text style={{fontSize:18,fontWeight:'bold',color:'#FF9800',marginBottom:12}}>الدعم الفني</Text>
            <Text style={{fontSize:15,color:'#444',marginBottom:16,textAlign:'center'}}>يمكنك مراسلة الدعم الفني بخصوص الديون أو أي استفسار آخر.</Text>
            <TextInput
              style={{borderWidth:1,borderColor:'#eee',borderRadius:8,padding:10,width:'100%',marginBottom:16,textAlign:'right'}}
              placeholder="اكتب رسالتك هنا..."
              value={supportMessage}
              onChangeText={setSupportMessage}
              multiline
              numberOfLines={3}
            />
            <View style={{flexDirection:'row',justifyContent:'space-between',width:'100%'}}>
              <Button title="إلغاء" color="#888" onPress={() => setSupportModalVisible(false)} />
              <Button title="إرسال" color="#FF9800" onPress={handleSendSupport} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', paddingTop: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FF9800', marginBottom: 0 },
  card: { backgroundColor: '#f8f8f8', borderRadius: 16, padding: 24, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  label: { fontSize: 16, color: '#444', marginTop: 12 },
  value: { fontSize: 24, fontWeight: 'bold', color: '#2196F3', marginTop: 4 },
  info: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  supportNote: { fontSize: 15, color: '#F44336', marginTop: 24, textAlign: 'center', fontWeight: 'bold' },
  // أزيلت أنماط زر التصفير
}); 