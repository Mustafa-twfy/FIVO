import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, I18nManager, Image } from 'react-native';
import { useEffect } from 'react';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const orders = [
  {
    id: 62,
    status: 'في انتظار الموافقة',
    area: 'القاهرة',
    address: '',
    deliveryPrice: 100,
    orderPrice: 0,
    customer: 'yahia',
    image: require('../assets/icon.png'), // صورة افتراضية
  },
  {
    id: 104,
    status: 'في انتظار الموافقة',
    area: 'الشعب',
    address: 'منطقة للتايز',
    deliveryPrice: 0,
    orderPrice: 0,
    customer: 'Yehia',
    image: require('../assets/icon.png'), // صورة افتراضية
  },
];

const captainActions = [
  { label: 'طلب كابتن الآن', icon: require('../assets/icon.png') },
  { label: 'طلب كابتن لاحقًا', icon: require('../assets/icon.png') },
  { label: 'طلب كابتن بيانات', icon: require('../assets/icon.png') },
];

export default function OrderListScreen() {
  useEffect(() => {
    I18nManager.forceRTL(true);
  }, []);

  return (
    <View style={styles.screen}>
      {/* الشريط العلوي */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={28} color="#FF9800" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الطلبات</Text>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={26} color="#FF9800" />
        </TouchableOpacity>
      </View>
      {/* بطاقات الكابتن */}
      <View style={styles.captainRow}>
        {captainActions.map((item, idx) => (
          <View key={idx} style={styles.captainCard}>
            <Image resizeMode="contain" source={item.icon} style={styles.captainImg} />
            <Text style={styles.captainLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
      {/* قائمة الطلبات */}
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 30 }}>
        {orders.map(order => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.statusText}>{order.status}</Text>
              <Text style={styles.orderId}>رقم الطلب {order.id}</Text>
            </View>
            <View style={styles.orderBody}>
              <Image resizeMode="contain" source={order.image} style={styles.orderImg} />
              <View style={{ flex: 1 }}>
                <View style={styles.infoRow}>
                  <MaterialIcons name="location-on" size={18} color="#FF9800" />
                  <Text style={styles.infoText}>منطقة التوصيل: {order.area}</Text>
                </View>
                {order.address ? (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="place" size={18} color="#FF9800" />
                    <Text style={styles.infoText}>عنوان التوصيل: {order.address}</Text>
                  </View>
                ) : null}
                <View style={styles.infoRow}>
                  <FontAwesome name="dollar" size={16} color="#FF9800" />
                  <Text style={styles.infoText}>سعر التوصيل: {order.deliveryPrice}.00 دينار</Text>
                </View>
                <View style={styles.infoRow}>
                  <FontAwesome name="dollar" size={16} color="#FF9800" />
                  <Text style={styles.infoText}>سعر الطلب: {order.orderPrice}.00 دينار</Text>
                </View>
                <Text style={styles.customerText}>بيانات العميل: {order.customer}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialIcons name="location-on" size={24} color="#FF9800" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Ionicons name="call" size={22} color="#FF9800" />
              </TouchableOpacity>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn}>
                <LinearGradient colors={["#FFD600", "#FF9800"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGradient}>
                  <Text style={styles.cancelText}>إلغاء الطلب</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.readyBtn}>
                <LinearGradient colors={["#FFD600", "#FF9800"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.btnGradient}>
                  <Text style={styles.readyText}>قيد التجهيز</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 62,
    backgroundColor: '#fff',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#FF9800',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  headerTitle: {
    color: '#222',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  captainRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    width: '96%',
    marginBottom: 15,
    alignSelf: 'center',
  },
  captainCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignItems: 'center',
    padding: 8,
    width: '31%',
    shadowColor: '#FF9800',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  captainImg: {
    width: 60,
    height: 60,
    marginBottom: 6,
  },
  captainLabel: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    marginHorizontal: 10,
    shadowColor: '#FF9800',
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  orderId: {
    color: '#888',
    fontSize: 13,
  },
  orderBody: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderImg: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#222',
    marginRight: 4,
  },
  customerText: {
    fontSize: 13,
    color: '#FF9800',
    marginTop: 4,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 2,
  },
  iconBtn: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    padding: 7,
    marginLeft: 8,
  },
  btnRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    overflow: 'hidden',
  },
  readyBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
    overflow: 'hidden',
  },
  btnGradient: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  cancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  readyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 