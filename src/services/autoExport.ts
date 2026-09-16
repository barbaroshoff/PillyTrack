import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveIntakeHistoryPdfToDevice } from './pdfExport';
import type { ReportLabels } from './pdfExport';

const ENABLED_KEY = '@pilly_auto_export_enabled';
const LAST_RUN_MONTH_KEY = '@pilly_auto_export_last_month';

export async function getAutoExportEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
}

export async function setAutoExportEnabled(value: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, value ? 'true' : 'false');
}

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Runs once a month, only while the user holds an active subscription and has the toggle on. */
export async function runAutoExportIfDue(isSubscribed: boolean, labels: ReportLabels): Promise<void> {
  if (!isSubscribed) return;
  if (!(await getAutoExportEnabled())) return;

  const monthKey = currentMonthKey();
  const lastRunMonth = await AsyncStorage.getItem(LAST_RUN_MONTH_KEY);
  if (lastRunMonth === monthKey) return;

  await saveIntakeHistoryPdfToDevice(labels, `PillyTrack-${monthKey}.pdf`);
  await AsyncStorage.setItem(LAST_RUN_MONTH_KEY, monthKey);
}
