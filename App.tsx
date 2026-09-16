import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import {
  useFonts,
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SubscriptionProvider, useSubscription } from './src/context/SubscriptionContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useIntakesStore } from './src/store/intakesStore';
import { initI18n } from './src/i18n';
import {
  setupNotificationCategories,
  handleNotificationResponse,
  markOverdueIntakes,
} from './src/services/notifications';
import { getPendingIntakes } from './src/db/intakes';
import { runAutoExportIfDue } from './src/services/autoExport';
import { buildReportLabels } from './src/services/pdfExport';
import DisclaimerModal, { useDisclaimerState } from './src/components/DisclaimerModal';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function AppInit() {
  const { isDark } = useTheme();
  const { isSubscribed, isLoading: subLoading } = useSubscription();
  const { t, i18n } = useTranslation();
  const loadToday = useIntakesStore((s) => s.loadToday);
  const appState = useRef(AppState.currentState);
  const { accepted, accept } = useDisclaimerState();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
    setupNotificationCategories();
    loadToday();

    const notifSub = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    const appStateSub = AppState.addEventListener('change', async (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const pending = await getPendingIntakes();
        const markedIds = await markOverdueIntakes(pending);
        if (markedIds.length > 0) await loadToday();
      }
      appState.current = next;
    });

    return () => {
      notifSub.remove();
      appStateSub.remove();
    };
  }, [loadToday]);

  useEffect(() => {
    if (!i18nReady || subLoading) return;
    runAutoExportIfDue(isSubscribed, buildReportLabels(t, i18n.language));
  }, [i18nReady, subLoading, isSubscribed, t, i18n.language]);

  if (!i18nReady) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
      {accepted === false && (
        <DisclaimerModal visible onAccept={accept} />
      )}
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <SubscriptionProvider>
        <AppInit />
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
