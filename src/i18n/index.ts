import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ru from '../locales/ru.json';
import en from '../locales/en.json';

const LANG_KEY = '@pilly_language';

export type AppLanguage = 'ru' | 'en';

export async function initI18n(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANG_KEY);
  const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'ru';
  const lng: AppLanguage = (stored as AppLanguage) ?? (deviceLang === 'ru' ? 'ru' : 'en');

  await i18n.use(initReactI18next).init({
    resources: { ru: { translation: ru }, en: { translation: en } },
    lng,
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
  });
}

export async function setLanguage(lang: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(LANG_KEY, lang);
  await i18n.changeLanguage(lang);
}

export function getLanguage(): AppLanguage {
  return (i18n.language as AppLanguage) ?? 'ru';
}

export default i18n;
