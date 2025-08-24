import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  componentDidCatch(error, info) {
    // Log the error for debugging (will appear in device logs / crash reporting)
    try { console.error('ErrorBoundary caught:', error, info); } catch (_) {}
    this.setState({ error, info });
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>عذرًا، حدث خطأ في التطبيق</Text>
          <Text style={styles.message}>نقوم بجمع المعلومات لإصلاحه. يمكنك إعادة فتح التطبيق لاحقًا.</Text>
          <ScrollView style={styles.details}>
            <Text style={styles.stack}>{String(error)}</Text>
            {info && <Text style={styles.stack}>{String(info.componentStack)}</Text>}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#333' },
  message: { fontSize: 14, color: '#666', marginBottom: 12, textAlign: 'center' },
  details: { maxHeight: 200, width: '100%', marginTop: 8 },
  stack: { fontSize: 12, color: '#999' }
});
