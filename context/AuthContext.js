import React, { createContext, useContext, useState, useEffect } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// السياق الرئيسي للجلسة
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // بيانات المستخدم (object)
  const [userType, setUserType] = useState(null); // نوع المستخدم (driver/store/admin)
  const [userToken, setUserToken] = useState(null); // توكن الجلسة إذا وُجد
  const [sessionExpiry, setSessionExpiry] = useState(null); // تاريخ انتهاء الجلسة
  const [loading, setLoading] = useState(true); // حالة تحميل الجلسة

  // تسجيل الدخول
  // login now accepts optional token (from server) and saves it securely
  const login = async (userData, type, expiryDate, token = null) => {
    // تحديد انتهاء افتراضي إذا لم يُمرر
    let normalizedExpiry = expiryDate;
    if (!normalizedExpiry) {
      const d = new Date();
      d.setDate(d.getDate() + 7); // 7 أيام افتراضيًا
      normalizedExpiry = d.toISOString();
    }

    setUser(userData);
    setUserType(type);
    setSessionExpiry(normalizedExpiry);
    if (token) setUserToken(token);

    // حفظ بيانات الجلسة بشكل مشفر (يشمل التوكن إن وُجد)
    const sessionObj = {
      user: userData,
      userType: type,
      sessionExpiry: normalizedExpiry,
    };
    if (token) sessionObj.token = token;

    await EncryptedStorage.setItem('session', JSON.stringify(sessionObj));

    // حفظ البيانات في AsyncStorage أيضاً للتوافق
    try {
      await AsyncStorage.setItem('userId', userData.id?.toString() || '');
      await AsyncStorage.setItem('userType', type);
      if (token) await AsyncStorage.setItem('userToken', token);
    } catch (e) {
      console.error('خطأ في حفظ AsyncStorage:', e);
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      // حذف البيانات من التخزين المشفر أولاً
      await EncryptedStorage.removeItem('session');
      
      // حذف البيانات من AsyncStorage
      await AsyncStorage.multiRemove([
        'userId', 
        'userType', 
        'userToken', 
        'sessionExpiry', 
        'userEmail'
      ]);
      
      // تصفير حالة المستخدم
      setUser(null);
      setUserType(null);
      setSessionExpiry(null);
      setUserToken(null);
      
      console.log('تم تسجيل الخروج بنجاح');
    } catch (e) {
      console.error('خطأ في تسجيل الخروج:', e);
      // حتى لو حدث خطأ، تصفير الحالة
      setUser(null);
      setUserType(null);
      setSessionExpiry(null);
      setUserToken(null);
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
            { text: 'حسنًا', onPress: async () => await logout() }
          ]
        );
      }
    }
  };

  // تحميل بيانات الجلسة من التخزين المشفر عند بدء التطبيق
  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
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
              if (session.token) setUserToken(session.token);
            } else {
              // الجلسة منتهية الصلاحية - احذفها
              await EncryptedStorage.removeItem('session');
            }
          } else {
            // لا يوجد تاريخ انتهاء - احذف الجلسة
            await EncryptedStorage.removeItem('session');
          }
        }
        // في حالة عدم وجود جلسة مشفرة، حاول استعادة التوكن والنوع من AsyncStorage
        // فقط إذا لم يكن هناك عملية تسجيل خروج جارية
        if (!user && !userType) {
          try {
            const storedToken = await AsyncStorage.getItem('userToken');
            const storedType = await AsyncStorage.getItem('userType');
            const storedId = await AsyncStorage.getItem('userId');
            
            // التحقق من أن البيانات موجودة فعلاً
            if (storedToken && storedType && storedId) {
              setUserToken(storedToken);
              setUserType(storedType);
              setUser({ id: parseInt(storedId, 10) });
            }
          } catch (e) {
            console.error('خطأ في استعادة AsyncStorage أثناء التحميل:', e);
          }
        }
      } catch (e) {
        // تجاهل أي خطأ في التحميل
        console.error('خطأ في تحميل الجلسة:', e);
      } finally {
        setLoading(false);
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
    <AuthContext.Provider value={{ user, userType, sessionExpiry, login, logout, checkSessionExpiry, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// هوك للاستخدام السهل في أي شاشة
export const useAuth = () => useContext(AuthContext); 