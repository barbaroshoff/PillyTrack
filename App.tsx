import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useIntakesStore } from './src/store/intakesStore';
import { initI18n } from './src/i18n';
import {
  setupNotificationCategories,
  handleNotificationResponse,
  markOverdueIntakes,
} from './src/services/notifications';
import { getPendingIntakes } from './src/db/intakes';
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
  const loadToday = useIntakesStore((s) => s.loadToday);
  const appState = useRef(AppState.currentState);
  const { accepted, accept } = useDisclaimerState();

  useEffect(() => {
    initI18n();
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

  return (
    <>
      <RootNavigator />
      {accepted === false && (
        <DisclaimerModal visible onAccept={accept} />
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInit />
    </ThemeProvider>
  );
}
