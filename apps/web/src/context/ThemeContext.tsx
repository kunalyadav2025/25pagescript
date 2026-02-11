'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ThemeMode, ThemeColors } from '@25pagescript/shared';
import { lightColors, darkColors } from '@25pagescript/shared';

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '25pagescript_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Load saved theme on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      } else {
        // Check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
        }
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return;

    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode);
  };

  const colors = theme === 'light' ? lightColors : darkColors;

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

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
