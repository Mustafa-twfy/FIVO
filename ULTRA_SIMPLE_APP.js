import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UltraSimpleApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>توصيل سمسم</Text>
      <Text style={styles.subtitle}>التطبيق يعمل بنجاح! 🎉</Text>
      <Text style={styles.info}>
        تم حل مشكلة الشاشة البيضاء
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
