import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';

export default function ErrorScreen({ error, onRetry }) {
  const scheme = useColorScheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: scheme === 'dark' ? '#181818' : '#fff' }
    ]}>
      <View style={[
        styles.content,
        { backgroundColor: scheme === 'dark' ? '#232323' : '#f5f5f5' }
      ]}>
        <Text style={[
          styles.icon,
          { color: scheme === 'dark' ? '#ff6b6b' : '#e74c3c' }
        ]}>
          ⚠️
        </Text>
        
        <Text style={[
          styles.title,
          { color: scheme === 'dark' ? '#fff' : '#333' }
        ]}>
          حدث خطأ في التطبيق
        </Text>
        
        <Text style={[
          styles.message,
          { color: scheme === 'dark' ? '#ccc' : '#666' }
        ]}>
          {error || 'حدث خطأ غير متوقع أثناء تحميل التطبيق'}
        </Text>
        
        {onRetry && (
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: '#FF9800' }
            ]}
            onPress={onRetry}
          >
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        )}
        
        <Text style={[
          styles.hint,
          { color: scheme === 'dark' ? '#888' : '#999' }
        ]}>
          إذا استمرت المشكلة، أعد تشغيل التطبيق
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
