import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ErrorMessage({ message = 'حدث خطأ غير متوقع', suggestion = 'يرجى التحقق من اتصالك بالإنترنت أو إعادة المحاولة.', style }) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="alert-circle" size={32} color="#F44336" style={{ marginBottom: 6 }} />
      <Text style={styles.title}>عذرًا!</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.suggestion}>{suggestion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff0f0',
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 4,
  },
  message: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  suggestion: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
}); 