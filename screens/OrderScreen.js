import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, I18nManager } from 'react-native';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../colors';

export default function OrderScreen() {
  useEffect(() => {
    I18nManager.forceRTL(true);
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>إرسال طلب</Text>
      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="الصنف" placeholderTextColor="#BDBDBD" textAlign="right" />
      </View>
      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="العنوان" placeholderTextColor="#BDBDBD" textAlign="right" />
      </View>
      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="رقم الزبون" placeholderTextColor="#BDBDBD" textAlign="right" keyboardType="phone-pad" />
      </View>
      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="تفاصيل الطلب" placeholderTextColor="#BDBDBD" textAlign="right" multiline numberOfLines={3} />
      </View>
      <TouchableOpacity style={styles.button}>
        <LinearGradient colors={colors.gradient} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.buttonGradient}>
          <Text style={styles.buttonText}>إرسال</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.dark,
    letterSpacing: 1,
  },
  inputBox: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#FF9800',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 17,
    color: colors.dark,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.secondary,
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
}); 