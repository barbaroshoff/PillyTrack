import React, { createContext, useContext } from 'react';
import { colors } from '../theme';
import { FontScaleProvider, useFontScale } from './FontScaleContext';
import type { FontScaleKey } from '../theme';

interface ThemeContextValue {
  colors: typeof colors;
  fontScale: FontScaleKey;
  scale: number;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors,
  fontScale: 'normal',
  scale: 1,
});

function ThemeInner({ children }: { children: React.ReactNode }) {
  const { fontScale, scale } = useFontScale();

  return (
    <ThemeContext.Provider value={{ colors, fontScale, scale }}>
      {children}
    </ThemeContext.Provider>
  );
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
