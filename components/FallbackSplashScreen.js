import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function FallbackSplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>توصيل سمسم</Text>
      <ActivityIndicator size="large" color="#FF9800" style={styles.loader} />
      <Text style={styles.subtitle}>جاري تحميل التطبيق...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
});
