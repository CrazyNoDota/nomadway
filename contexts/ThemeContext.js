import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = '@nomadway_theme';

// Theme definitions
export const THEMES = {
    light: {
        mode: 'light',
        colors: {
            primary: '#1a4d3a',
            secondary: '#d4af37',
            background: '#f5f5f5',
            surface: '#ffffff',
            text: '#333333',
            textSecondary: '#666666',
            textMuted: '#8e8e93',
            border: '#e0e0e0',
            error: '#e74c3c',
            success: '#27ae60',
            warning: '#f39c12',
            card: '#ffffff',
            tabBar: '#1a4d3a',
            tabBarInactive: '#8e8e93',
            tabBarActive: '#d4af37',
            headerBackground: '#1a4d3a',
            headerText: '#ffffff',
            inputBackground: '#ffffff',
            inputBorder: '#e0e0e0',
            placeholder: '#8e8e93',
            overlay: 'rgba(0,0,0,0.5)',
        },
    },
    dark: {
        mode: 'dark',
        colors: {
            primary: '#2d6a4f',
            secondary: '#e8c560',
            background: '#121212',
            surface: '#1e1e1e',
            text: '#e0e0e0',
            textSecondary: '#a0a0a0',
            textMuted: '#707070',
            border: '#333333',
            error: '#ff6b6b',
            success: '#4caf50',
            warning: '#ffb74d',
            card: '#252525',
            tabBar: '#1a1a1a',
            tabBarInactive: '#606060',
            tabBarActive: '#e8c560',
            headerBackground: '#1a1a1a',
            headerText: '#ffffff',
            inputBackground: '#2a2a2a',
            inputBorder: '#404040',
            placeholder: '#606060',
            overlay: 'rgba(0,0,0,0.7)',
        },
    },
};

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState('system'); // 'light', 'dark', 'system'
    const [loading, setLoading] = useState(true);

    // Load theme preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (savedTheme) {
                setThemeMode(savedTheme);
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveThemePreference = async (mode) => {
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    // Get current effective theme based on preference and system
    const getEffectiveTheme = useCallback(() => {
        if (themeMode === 'system') {
            return systemColorScheme === 'dark' ? THEMES.dark : THEMES.light;
        }
        return themeMode === 'dark' ? THEMES.dark : THEMES.light;
    }, [themeMode, systemColorScheme]);

    // Set theme mode
    const setTheme = useCallback((mode) => {
        setThemeMode(mode);
        saveThemePreference(mode);
    }, []);

    // Toggle between light and dark
    const toggleTheme = useCallback(() => {
        const currentMode = getEffectiveTheme().mode;
        const newMode = currentMode === 'light' ? 'dark' : 'light';
        setTheme(newMode);
    }, [getEffectiveTheme, setTheme]);

    // Check if dark mode is active
    const isDark = useCallback(() => {
        return getEffectiveTheme().mode === 'dark';
    }, [getEffectiveTheme]);

    const theme = getEffectiveTheme();

    const value = {
        theme,
        themeMode,
        isDark: isDark(),
        colors: theme.colors,
        setTheme,
        toggleTheme,
        loading,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
