import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useUser } from '../UserProvider.jsx'; // 引入 UserProvider

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 初始值为 false
  const { setUserInfo } = useUser(); // 使用 UserProvider 的 setUserInfo

  const checkAuth = (authenticated) => {
    setIsAuthenticated(authenticated);
  };

  // 退出登录方法
  const logout = async () => {
    try {
      // 发送请求到后端，清除 cookie
      await axios.post('http://114.212.97.42:8000/user/SignOut/', null, {
        withCredentials: true, // 确保发送 cookie
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }

    // 清空 localStorage 中的 access_token
    localStorage.removeItem('access_token');

    // 清空 UserProvider 中的用户信息
    setUserInfo(null);

    // 设置认证状态为 false
    setIsAuthenticated(false);

    // 刷新页面
    window.location.reload();
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const accessToken = localStorage.getItem('access_token');
  
      if (accessToken) {
        try {
          const response = await axios.get('http://114.212.97.42:8000/user/check-auth/', {
            withCredentials: true,
          });
  
          const userdata = response.data.user;
          setUserInfo(userdata); // 同步更新 UserProvider 中的 userInfo
          setIsAuthenticated(true);
        } catch (error) {
          setUserInfo(null); // 清空 UserProvider 中的用户信息
          setIsAuthenticated(false);
        }
      } else {
        setUserInfo(null);
        setIsAuthenticated(false);
      }
    };
  
    fetchUserInfo();
  }, [setUserInfo]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);