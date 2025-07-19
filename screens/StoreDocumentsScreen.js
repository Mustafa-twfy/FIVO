import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StoreDocumentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.infoText}>
        لم يعد رفع المستندات مطلوبًا للتسجيل كمتجر. إذا وصلت لهذه الصفحة بالخطأ، يرجى العودة.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  infoText: { fontSize: 18, color: '#FF9800', textAlign: 'center', padding: 24 },
}); 