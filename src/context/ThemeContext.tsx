import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme';
import { FontScaleProvider, useFontScale } from './FontScaleContext';
import type { FontScaleKey } from '../theme';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = '@pilly_theme_mode';

interface ThemeContextValue {
  colors: typeof lightColors;
  fontScale: FontScaleKey;
  scale: number;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  fontScale: 'normal',
  scale: 1,
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: false,
});

function ThemeInner({ children }: { children: React.ReactNode }) {
  const { fontScale, scale } = useFontScale();
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value === 'light' || value === 'dark' || value === 'system') {
        setThemeModeState(value);
      }
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(STORAGE_KEY, mode);
  };

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ colors, fontScale, scale, themeMode, setThemeMode, isDark }),
    [colors, fontScale, scale, themeMode, isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <FontScaleProvider>
      <ThemeInner>{children}</ThemeInner>
    </FontScaleProvider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
