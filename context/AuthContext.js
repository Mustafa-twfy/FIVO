import React, { createContext, useContext, useState, useEffect } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// السياق الرئيسي للجلسة
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // بيانات المستخدم (object)
  const [userType, setUserType] = useState(null); // نوع المستخدم (driver/store/admin)
  const [sessionExpiry, setSessionExpiry] = useState(null); // تاريخ انتهاء الجلسة

  // تسجيل الدخول
  const login = async (userData, type, expiryDate) => {
    setUser(userData);
    setUserType(type);
    setSessionExpiry(expiryDate || null);
    // حفظ بيانات الجلسة بشكل مشفر
    await EncryptedStorage.setItem('session', JSON.stringify({
      user: userData,
      userType: type,
      sessionExpiry: expiryDate || null
    }));
    // حفظ البيانات في AsyncStorage أيضاً للتوافق
    try {
      await AsyncStorage.setItem('userId', userData.id?.toString() || '');
      await AsyncStorage.setItem('userType', type);
    } catch (e) {
      console.error('خطأ في حفظ AsyncStorage:', e);
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    setUser(null);
    setUserType(null);
    setSessionExpiry(null);
    await EncryptedStorage.removeItem('session');
    // حذف البيانات من AsyncStorage أيضاً للتوافق
    try {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userType');
    } catch (e) {
      console.error('خطأ في حذف AsyncStorage:', e);
    }
  };

  // تحقق من صلاحية الجلسة
  const checkSessionExpiry = () => {
    if (sessionExpiry) {
      const now = new Date();
      const expiry = new Date(sessionExpiry);
      if (now > expiry) {
        Alert.alert(
          'انتهت صلاحية الجلسة',
          'انتهت صلاحية الجلسة الخاصة بك. يرجى تسجيل الدخول مجددًا.',
          [
            { text: 'حسنًا', onPress: () => logout() }
          ]
        );
      }
    }
  };

  // تحميل بيانات الجلسة من التخزين المشفر عند بدء التطبيق
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionStr = await EncryptedStorage.getItem('session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          // تحقق من صلاحية الجلسة قبل تحميلها
          if (session.sessionExpiry) {
            const now = new Date();
            const expiry = new Date(session.sessionExpiry);
            if (now < expiry) {
              // الجلسة صالحة
              setUser(session.user);
              setUserType(session.userType);
              setSessionExpiry(session.sessionExpiry);
            } else {
              // الجلسة منتهية الصلاحية - احذفها
              await EncryptedStorage.removeItem('session');
            }
          } else {
            // لا يوجد تاريخ انتهاء - احذف الجلسة
            await EncryptedStorage.removeItem('session');
          }
        }
      } catch (e) {
        // تجاهل أي خطأ في التحميل
        console.error('خطأ في تحميل الجلسة:', e);
      }
    };
    loadSession();
  }, []);

  // تحقق تلقائي عند كل تحميل
  useEffect(() => {
    checkSessionExpiry();
    // eslint-disable-next-line
  }, [sessionExpiry]);

  return (
    <AuthContext.Provider value={{ user, userType, sessionExpiry, login, logout, checkSessionExpiry }}>
      {children}
    </AuthContext.Provider>
  );
};

// هوك للاستخدام السهل في أي شاشة
export const useAuth = () => useContext(AuthContext); 