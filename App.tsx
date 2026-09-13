import { useEffect } from 'react';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useIntakesStore } from './src/store/intakesStore';

function AppInit() {
  const loadToday = useIntakesStore((s) => s.loadToday);
  useEffect(() => { loadToday(); }, [loadToday]);
  return <RootNavigator />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInit />
    </ThemeProvider>
  );
}
