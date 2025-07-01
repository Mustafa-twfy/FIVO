import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../colors';
import fivoLogo from '../assets/fivo-logo.png';

const DOTS_COUNT = 5;

export default function SplashScreen() {
  // يمكنك التحكم في أي نقطة نشطة (مثلاً متحركة) لاحقاً
  const activeDot = 2;

  return (
    <LinearGradient colors={colors.gradient} style={styles.container} start={{x:0, y:0}} end={{x:0, y:1}}>
      <View style={styles.centerBox}>
        <Image source={fivoLogo} style={{ width: 180, height: 180, resizeMode: 'contain', marginBottom: 30, borderRadius: 90, borderWidth: 3, borderColor: '#fff', backgroundColor: '#fff' }} />
      </View>
      <View style={styles.dotsRow}>
        {[...Array(DOTS_COUNT)].map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, idx === activeDot && styles.activeDot]}
          />
        ))}
        <Ionicons name="bicycle" size={32} color={colors.secondary} style={styles.bikeIcon} />
      </View>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  scooterImg: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
    borderRadius: 32,
    backgroundColor: '#fff',
    shadowColor: '#FF9800',
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginHorizontal: 7,
    opacity: 0.5,
  },
  activeDot: {
    backgroundColor: '#FF9800',
    opacity: 1,
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  bikeIcon: {
    marginLeft: 16,
    marginTop: -4,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginTop: 20,
  },
}); 