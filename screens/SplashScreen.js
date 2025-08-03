import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import simsimLogo from '../assets/simsim-logo.png';

export default function SplashScreen() {
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;
  const textPosition = useRef(new Animated.Value(-200)).current; // يبدأ من أعلى الشاشة

  useEffect(() => {
    // تأثير سقوط النص من الأعلى مع ظهور تدريجي
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.elastic(1.2), // تأثير مرن أكثر
        useNativeDriver: true,
      }),
      Animated.timing(textPosition, {
        toValue: 0, // ينتقل إلى المركز
        duration: 1000,
        easing: Easing.out(Easing.back(1.5)), // تأثير ارتداد جميل
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient 
      colors={['#20B2AA', '#48D1CC']} // ألوان زرقاء-خضراء
      style={styles.container} 
      start={{x: 0, y: 0}} 
      end={{x: 1, y: 1}}
    >
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [
                { scale: textScale },
                { translateY: textPosition } // حركة السقوط
              ]
            }
          ]}
        >
          <Image source={simsimLogo} style={styles.logo} />
          <Text style={styles.appName}>سمسم</Text>
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
  textContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
}); 