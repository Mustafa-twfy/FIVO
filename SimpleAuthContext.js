import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const login = async (userData, type) => {
    setUser(userData);
    setUserType(type);
  };

  const logout = async () => {
    setUser(null);
    setUserType(null);
  };

  // إيقاف التحميل فوراً
  useEffect(() => {
    setLoading(false);
    setRestoring(false);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userType, 
      loading, 
      restoring, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
