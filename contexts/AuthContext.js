import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { navigationRef } from '../utils/navigationRef';

// Derive API base URL similar to communityApi so physical devices resolve the host correctly
function getApiBaseUrl() {
  // Environment variable wins
  if (process.env.EXPO_PUBLIC_API_URL) {
    return `${process.env.EXPO_PUBLIC_API_URL}/api`;
  }

  // Infer from Expo bundler host (covers physical devices on LAN)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostname = hostUri.split(':')[0];
    return `http://${hostname}:3000/api`;
  }

  // Emulator/simulator fallbacks
  if (__DEV__) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api'
      : 'http://localhost:3000/api';
  }

  // Production API
  return 'https://api.nomadway.kz/api';
}

const API_URL = getApiBaseUrl();
console.log('Auth API Base URL:', API_URL);

const AuthContext = createContext(undefined);

// Token storage keys
const TOKEN_KEY = 'nomadway_access_token';
const REFRESH_TOKEN_KEY = 'nomadway_refresh_token';
const USER_KEY = 'nomadway_user';

// Secure storage helpers
const storage = {
  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Navigate to auth if not logged in
  const requireAuth = useCallback(() => {
    if (!isAuthenticated && navigationRef.isReady()) {
      navigationRef.navigate('Auth');
      return false;
    }
    return isAuthenticated;
  }, [isAuthenticated]);

  // Initialize auth state from storage
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedRefresh, storedUser] = await Promise.all([
          storage.getItem(TOKEN_KEY),
          storage.getItem(REFRESH_TOKEN_KEY),
          storage.getItem(USER_KEY),
        ]);

        if (storedToken && storedUser) {
          setAccessToken(storedToken);
          setRefreshToken(storedRefresh);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          
          // Verify token is still valid
          await verifyToken(storedToken);
        }
      } catch (error) {
        console.error('Error loading stored auth:', error);
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Clear all auth data
  const clearAuth = async () => {
    await Promise.all([
      storage.removeItem(TOKEN_KEY),
      storage.removeItem(REFRESH_TOKEN_KEY),
      storage.removeItem(USER_KEY),
    ]);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Verify token with server
  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        await storage.setItem(USER_KEY, JSON.stringify(data.user));
        return true;
      } else if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        return refreshed;
      }
      return false;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    try {
      const storedRefresh = await storage.getItem(REFRESH_TOKEN_KEY);
      if (!storedRefresh) {
        await clearAuth();
        return false;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefresh }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        await Promise.all([
          storage.setItem(TOKEN_KEY, data.accessToken),
          storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken),
        ]);
        return true;
      } else {
        await clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      await clearAuth();
      return false;
    }
  };

  // Register new user
  const register = async (email, password, fullName) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || data?.error || 'Registration failed';
        throw new Error(msg);
      }

      // Store tokens and user
      await Promise.all([
        storage.setItem(TOKEN_KEY, data.accessToken),
        storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken),
        storage.setItem(USER_KEY, JSON.stringify(data.user)),
      ]);

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      setIsAuthenticated(true);

      // Route to Profile tab after successful register
      if (navigationRef.isReady()) {
        navigationRef.navigate('Home', { screen: 'Profile' });
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || data?.error || 'Login failed';
        throw new Error(msg);
      }

      // Store tokens and user
      await Promise.all([
        storage.setItem(TOKEN_KEY, data.accessToken),
        storage.setItem(REFRESH_TOKEN_KEY, data.refreshToken),
        storage.setItem(USER_KEY, JSON.stringify(data.user)),
      ]);

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      setIsAuthenticated(true);

      // Route to Profile tab after successful login
      if (navigationRef.isReady()) {
        navigationRef.navigate('Home', { screen: 'Profile' });
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuth();
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || data?.error || 'Profile update failed';
        throw new Error(msg);
      }

      const updatedUser = { ...user, ...data.user };
      setUser(updatedUser);
      await storage.setItem(USER_KEY, JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Request password reset
  const forgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || data?.error || 'Failed to send reset email';
        throw new Error(msg);
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Reset password with token
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || data?.error || 'Password reset failed';
        throw new Error(msg);
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Authenticated fetch helper
  const authFetch = useCallback(async (url, options = {}) => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    };

    let response = await fetch(url.startsWith('http') ? url : `${API_URL}${url}`, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        const newToken = await storage.getItem(TOKEN_KEY);
        response = await fetch(url.startsWith('http') ? url : `${API_URL}${url}`, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      } else {
        // Session expired - logout user
        await clearAuth();
        throw new Error('Session expired');
      }
    }

    return response;
  }, [accessToken]);

  // Upload avatar
  const uploadAvatar = async (imageUri) => {
    try {
      const formData = new FormData();
      
      // Get file info
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      formData.append('avatar', {
        uri: imageUri,
        name: `avatar.${fileType}`,
        type: `image/${fileType}`,
      });

      const response = await authFetch('/upload/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data?.error?.message || data?.error || 'Avatar upload failed';
        throw new Error(msg);
      }

      // Update local user state
      const updatedUser = { ...user, avatarUrl: data.avatarUrl };
      setUser(updatedUser);
      await storage.setItem(USER_KEY, JSON.stringify(updatedUser));

      return { success: true, avatarUrl: data.avatarUrl };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    isAdmin: user?.role === 'ADMIN',
    register,
    login,
    logout,
    updateProfile,
    forgotPassword,
    resetPassword,
    authFetch,
    uploadAvatar,
    refreshAccessToken,
    requireAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
