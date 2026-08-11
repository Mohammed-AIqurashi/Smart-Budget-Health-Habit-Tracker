import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !user) {
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }
      // Demo fallback when offline or on static preview host
      const demoUser = {
        id: 'demo-user-1',
        email: email || 'demo@example.com',
        name: email ? email.split('@')[0] : 'Demo User',
        monthlyBudget: 3000,
        calorieGoal: 2200,
        currency: 'SAR',
      };
      localStorage.setItem('accessToken', 'demo-access-token');
      localStorage.setItem('refreshToken', 'demo-refresh-token');
      localStorage.setItem('user', JSON.stringify(demoUser));
      setUser(demoUser);
      return { success: true, user: demoUser };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      if (error.response?.data?.message) {
        return { success: false, message: error.response.data.message };
      }
      // Demo fallback when offline or on static preview host
      const newUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        name: userData.name || (userData.email ? userData.email.split('@')[0] : 'User'),
        monthlyBudget: Number(userData.monthlyBudget) || 3000,
        calorieGoal: Number(userData.calorieGoal) || 2200,
        currency: userData.currency || 'SAR',
      };
      localStorage.setItem('accessToken', 'demo-access-token');
      localStorage.setItem('refreshToken', 'demo-refresh-token');
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true, user: newUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};