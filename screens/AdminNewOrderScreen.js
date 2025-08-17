import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ordersAPI } from '../supabase';

export default function AdminNewOrderScreen({ navigation }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [extraDetails, setExtraDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!customerName.trim() || !customerPhone.trim() || !pickupAddress.trim() || !deliveryAddress.trim() || !description.trim() || !amount.trim()) {
      Alert.alert('خطأ', 'يرجى تعبئة جميع الحقول');
      return false;
    }
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return false;
    }
    const phoneRegex = /^07[3-9]\d{8}$/;
    if (!phoneRegex.test(customerPhone)) {
      Alert.alert('خطأ', 'يرجى إدخال رقم هاتف عراقي صحيح (مثال: 07801234567)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { error } = await ordersAPI.createOrder({
        store_id: null,
        created_by: 'admin',
        customer_name: customerName,
        customer_phone: customerPhone,
        pickup_address: pickupAddress,
        delivery_address: deliveryAddress,
        items_description: description,
        description: description,
        extra_details: extraDetails,
        total_amount: parseFloat(amount),
        delivery_fee: 0,
        // الطلبات العاجلة معطلة مؤقتاً
        is_urgent: false,
        payment_method: 'cash',
        payment_status: 'pending',
        status: 'pending',
        driver_id: null
      });
      if (error) throw error;
      Alert.alert('نجاح', 'تم رفع الطلب بنجاح وسيظهر للسائقين', [
        { text: 'حسناً', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('خطأ', error.message || 'حدث خطأ أثناء رفع الطلب');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>إضافة طلب جديد (من الإدارة)</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>اسم الزبون *</Text>
        <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="اسم الزبون" textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>رقم هاتف الزبون *</Text>
        <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} placeholder="07801234567" keyboardType="phone-pad" maxLength={11} textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>من العنوان *</Text>
        <TextInput style={styles.input} value={pickupAddress} onChangeText={setPickupAddress} placeholder="مثال: شارع فلسطين، بغداد" textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>إلى العنوان *</Text>
        <TextInput style={styles.input} value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="مثال: حي الجامعة، بغداد" textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>وصف الطلب *</Text>
        <TextInput style={[styles.input, {height: 80}]} value={description} onChangeText={setDescription} placeholder="تفاصيل الطلب" multiline textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>تفاصيل إضافية (اختياري)</Text>
        <TextInput style={[styles.input, {height: 60}]} value={extraDetails} onChangeText={setExtraDetails} placeholder="أي تفاصيل أو ملاحظات إضافية..." multiline textAlign="right" />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>المبلغ (دينار) *</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" textAlign="right" />
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="add-circle-outline" size={20} color="#fff" /><Text style={styles.buttonText}>رفع الطلب</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2196F3', marginBottom: 24, textAlign: 'center' },
  inputGroup: { width: '100%', marginBottom: 16 },
  label: { fontSize: 16, color: '#333', marginBottom: 6, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#f9f9f9', textAlign: 'right' },
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4CAF50', borderRadius: 8, padding: 14, marginTop: 24, width: '100%' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginLeft: 8 },
}); 