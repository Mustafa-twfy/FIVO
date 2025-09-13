import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './SimpleAuthContext';

const Stack = createNativeStackNavigator();

function LoginScreen() {
  const { login } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>توصيل سمسم</Text>
      <Text style={styles.subtitle}>مرحباً بك في التطبيق</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => login({ id: 1, name: 'مستخدم تجريبي' }, 'driver')}
      >
        <Text style={styles.buttonText}>تسجيل الدخول كسائق</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#4CAF50' }]}
        onPress={() => login({ id: 2, name: 'متجر تجريبي' }, 'store')}
      >
        <Text style={styles.buttonText}>تسجيل الدخول كمتجر</Text>
      </TouchableOpacity>
    </View>
  );
}

function DashboardScreen() {
  const { user, userType, logout } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>لوحة التحكم</Text>
      <Text style={styles.subtitle}>
        مرحباً {user?.name || 'مستخدم'}
      </Text>
      <Text style={styles.info}>نوع المستخدم: {userType}</Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#f44336' }]}
        onPress={logout}
      >
        <Text style={styles.buttonText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </View>
  );
}

function AppContent() {
  const { user, userType } = useAuth();
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function SimpleAppWithNavigation() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
