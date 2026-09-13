import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fontScales, FontScaleKey } from '../theme';

const STORAGE_KEY = '@pilly_font_scale';

interface FontScaleContextValue {
  fontScale: FontScaleKey;
  setFontScale: (scale: FontScaleKey) => void;
  scale: number;
}

const FontScaleContext = createContext<FontScaleContextValue>({
  fontScale: 'normal',
  setFontScale: () => {},
  scale: 1,
});

export function FontScaleProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<FontScaleKey>('normal');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value && value in fontScales) {
        setFontScaleState(value as FontScaleKey);
      }
    });
  }, []);

  const setFontScale = (scale: FontScaleKey) => {
    setFontScaleState(scale);
    AsyncStorage.setItem(STORAGE_KEY, scale);
  };

  return (
    <FontScaleContext.Provider
      value={{ fontScale, setFontScale, scale: fontScales[fontScale] }}
    >
      {children}
    </FontScaleContext.Provider>
  );
}

export function useFontScale() {
  return useContext(FontScaleContext);
}
