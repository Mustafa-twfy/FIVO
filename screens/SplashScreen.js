import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../colors';
import fivoLogo from '../assets/fivo-logo.png';

const DOTS_COUNT = 3;

export default function SplashScreen() {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const bikePosition = useRef(new Animated.Value(-100)).current;
  const activeDotIndex = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // تسلسل الحركات
    const animationSequence = async () => {
      // ظهور الشعار مع تكبير
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // تأخير قليل ثم ظهور النقاط
      setTimeout(() => {
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 400);

      // حركة الدراجة النارية
      setTimeout(() => {
        Animated.timing(bikePosition, {
          toValue: 0,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 600);

      // حركة النقاط النشطة
      const dotAnimation = () => {
        Animated.timing(activeDotIndex, {
          toValue: DOTS_COUNT - 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }).start(() => {
          activeDotIndex.setValue(0);
          dotAnimation();
        });
      };

      setTimeout(dotAnimation, 1000);
    };

    animationSequence();
  }, []);

  const getActiveDot = () => {
    return Math.floor(activeDotIndex._value);
  };

  return (
    <LinearGradient 
      colors={colors.successGradient} 
      style={styles.container} 
      start={{x: 0, y: 0}} 
      end={{x: 1, y: 1}}
    >
      <View style={styles.content}>
        {/* الشعار المتحرك */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image source={fivoLogo} style={styles.logo} />
          </View>
          <Text style={styles.appName}>توصيل بلس</Text>
          <Text style={styles.tagline}>خدمة التوصيل الأسرع والأفضل</Text>
        </Animated.View>

        {/* النقاط المتحركة */}
        <Animated.View 
          style={[
            styles.dotsContainer,
            { opacity: dotsOpacity }
          ]}
        >
          <View style={styles.dotsRow}>
            {[...Array(DOTS_COUNT)].map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot, 
                  idx === getActiveDot() && styles.activeDot
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* الدراجة النارية المتحركة */}
        <Animated.View 
          style={[
            styles.bikeContainer,
            {
              transform: [{ translateX: bikePosition }]
            }
          ]}
        >
          <Ionicons name="bicycle" size={40} color={colors.textOnPrimary} />
          {/* <Text style={styles.loadingText}>جاري التحميل...</Text> */}
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: colors.textOnPrimary,
    opacity: 0.9,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dotsContainer: {
    marginBottom: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: colors.textOnPrimary,
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  bikeContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textOnPrimary,
    marginTop: 12,
    opacity: 0.8,
    fontWeight: '500',
  },
}); 