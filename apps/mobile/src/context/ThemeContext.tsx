import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  background: string;
  secondaryBackground: string;
  card: string;
  border: string;
  divider: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  error: string;
  success: string;
  statusBar: 'light-content' | 'dark-content';
}

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const lightColors: ThemeColors = {
  background: '#FFFFFF',
  secondaryBackground: '#FAFAFA',
  card: '#FFFFFF',
  border: '#DBDBDB',
  divider: '#EFEFEF',
  text: '#262626',
  textSecondary: '#8E8E8E',
  textMuted: '#C7C7C7',
  accent: '#0095F6',
  error: '#ED4956',
  success: '#10B981',
  statusBar: 'dark-content',
};

const darkColors: ThemeColors = {
  background: '#000000',
  secondaryBackground: '#121212',
  card: '#000000',
  border: '#262626',
  divider: '#262626',
  text: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textMuted: '#737373',
  accent: '#0095F6',
  error: '#ED4956',
  success: '#22C55E',
  statusBar: 'light-content',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@25PageScript:theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setTheme(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeColors, ThemeMode };
