import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const simsimLogo = { uri: 'https://i.ibb.co/Myy7sCzX/Picsart-25-07-31-16-12-30-512.jpg' };

export default function SplashScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // تأثير ظهور اللوقو مع دوران وتكبير
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotation, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      // بعد ظهور اللوقو، يظهر النص
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.elastic(1.1),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const spin = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient 
      colors={['#00C897', '#00A884']} // ألوان خضراء منسقة مع التطبيق
      style={styles.container} 
      start={{x: 0, y: 0}} 
      end={{x: 1, y: 1}}
    >
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { rotate: spin }
              ]
            }
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image source={simsimLogo} style={styles.logo} />
          </View>
        </Animated.View>
        
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ scale: textScale }]
            }
          ]}
        >
          <Text style={styles.appName}>سمسم</Text>
          <Text style={styles.tagline}>توصيل سريع وآمن</Text>
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
    marginBottom: 30,
  },
  logoWrapper: {
    width: 180,
    height: 180,
    borderRadius: 90, // دائري تماماً
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  logo: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    borderRadius: 70, // دائري للصورة أيضاً
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 