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
import pt from '../locales/pt.json';
import nl from '../locales/nl.json';
import tr from '../locales/tr.json';
import ro from '../locales/ro.json';
import el from '../locales/el.json';
import cs from '../locales/cs.json';
import sv from '../locales/sv.json';
import hu from '../locales/hu.json';
import bg from '../locales/bg.json';
import da from '../locales/da.json';
import fi from '../locales/fi.json';
import sk from '../locales/sk.json';

const LANG_KEY = '@pilly_language';

export type AppLanguage =
  | 'ru' | 'en' | 'es' | 'fr' | 'de' | 'it' | 'pl' | 'uk'
  | 'pt' | 'nl' | 'tr' | 'ro' | 'el' | 'cs' | 'sv' | 'hu' | 'bg' | 'da' | 'fi' | 'sk';

const SUPPORTED: AppLanguage[] = [
  'ru', 'en', 'es', 'fr', 'de', 'it', 'pl', 'uk',
  'pt', 'nl', 'tr', 'ro', 'el', 'cs', 'sv', 'hu', 'bg', 'da', 'fi', 'sk',
];

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
      pt: { translation: pt },
      nl: { translation: nl },
      tr: { translation: tr },
      ro: { translation: ro },
      el: { translation: el },
      cs: { translation: cs },
      sv: { translation: sv },
      hu: { translation: hu },
      bg: { translation: bg },
      da: { translation: da },
      fi: { translation: fi },
      sk: { translation: sk },
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
