import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ru from '../locales/ru.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import it from '../locales/it.json';
import pl from '../locales/pl.json';
import uk from '../locales/uk.json';

const LANG_KEY = '@pilly_language';

export type AppLanguage = 'ru' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pl' | 'uk';

const SUPPORTED: AppLanguage[] = ['ru', 'en', 'es', 'fr', 'de', 'it', 'pl', 'uk'];

export async function initI18n(): Promise<void> {
  const stored = await AsyncStorage.getItem(LANG_KEY);
  const deviceLang = (Localization.getLocales()[0]?.languageCode ?? 'ru') as AppLanguage;
  const lng: AppLanguage = (stored as AppLanguage) ?? (SUPPORTED.includes(deviceLang) ? deviceLang : 'en');

  await i18n.use(initReactI18next).init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      it: { translation: it },
      pl: { translation: pl },
      uk: { translation: uk },
    },
    lng,
    fallbackLng: 'en',
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
