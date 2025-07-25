import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driversAPI, supportAPI } from '../supabase';

export default function FinancialAccountsScreen({ navigation }) {
  const driverId = 1; // عدل لاحقاً حسب نظام تسجيل الدخول
  const [debtPoints, setDebtPoints] = useState(0);
  const [debtValue, setDebtValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  useEffect(() => {
    fetchDriverDebt();
  }, []);

  const fetchDriverDebt = async () => {
    setLoading(true);
    const { data, error } = await driversAPI.getAllDrivers();
    if (error || !data) {
      Alert.alert('خطأ', 'تعذر جلب بيانات السائق');
      setLoading(false);
      return;
    }
    const driver = data.find(d => d.id === driverId);
    setDebtPoints(driver?.debt_points || 0);
    setDebtValue((driver?.debt_points || 0) * 15);
    setLoading(false);
  };

  const handleClearDebt = async () => {
    setLoading(true);
    const { error } = await driversAPI.clearDriverDebt(driverId);
    if (error) {
      Alert.alert('خطأ', 'تعذر تصفير الحساب');
    } else {
      setDebtPoints(0);
      setDebtValue(0);
      Alert.alert('تم', 'تم تصفير الحساب بنجاح');
    }
    setLoading(false);
  };

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

  if (loading) {
    return null;
  }

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
        <Text style={styles.value}>{debtPoints} نقطة</Text>
        <Text style={styles.label}>قيمة الديون:</Text>
        <Text style={styles.value}>{debtValue} ألف دينار</Text>
        <Text style={styles.info}>كل نقطة = 15 ألف دينار</Text>
        <Text style={styles.info}>تزداد النقاط عند أخذ كل طلب جديد.</Text>
        {debtPoints > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClearDebt}>
            <Text style={styles.clearButtonText}>تصفير الحساب</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.supportNote}>لتصفير حسابك يمكنك الضغط على الزر أعلاه أو مراسلة الدعم الفني عبر الأيقونة.</Text>
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
  clearButton: { marginTop: 18, backgroundColor: '#FF9800', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 32 },
  clearButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
}); 