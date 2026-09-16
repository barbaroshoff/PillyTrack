import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIntakeHistory } from '../db/intakes';
import type { IntakeEvent } from '../db/intakes';

const LAST_EXPORT_KEY = '@pilly_last_export';

export interface ReportLabels {
  title: string;
  generatedLabel: string;
  columns: { date: string; time: string; medication: string; status: string };
  statusLabels: { taken: string; missed: string; pending: string };
  emptyLabel: string;
  locale: string;
}

export interface LastExportInfo {
  at: string;
  filename: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function statusText(status: IntakeEvent['status'], labels: ReportLabels): string {
  if (status === 'taken') return labels.statusLabels.taken;
  if (status === 'missed') return labels.statusLabels.missed;
  return labels.statusLabels.pending;
}

function statusColor(status: IntakeEvent['status']): string {
  if (status === 'taken') return '#2FA36B';
  if (status === 'missed') return '#DD5652';
  return '#DB8F2A';
}

function buildReportHtml(events: IntakeEvent[], labels: ReportLabels): string {
  const rows = events
    .map((e) => {
      const dt = new Date(e.scheduled_at);
      const date = dt.toLocaleDateString(labels.locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = e.scheduled_at.slice(11, 16);
      return `<tr>
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(time)}</td>
        <td>${escapeHtml(e.medication_name ?? '—')}</td>
        <td style="color:${statusColor(e.status)};font-weight:600;">${escapeHtml(statusText(e.status, labels))}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Roboto, Helvetica, Arial, sans-serif; color: #1C1F26; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #6B7684; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; padding: 8px; border-bottom: 2px solid #1C1F26; }
  td { padding: 8px; border-bottom: 1px solid #E4E9F0; }
  .empty { color: #9AA3AF; font-size: 13px; padding: 24px 0; text-align: center; }
</style>
</head>
<body>
  <h1>${escapeHtml(labels.title)}</h1>
  <div class="meta">${escapeHtml(labels.generatedLabel)}</div>
  ${
    events.length === 0
      ? `<div class="empty">${escapeHtml(labels.emptyLabel)}</div>`
      : `<table>
          <thead><tr>
            <th>${escapeHtml(labels.columns.date)}</th>
            <th>${escapeHtml(labels.columns.time)}</th>
            <th>${escapeHtml(labels.columns.medication)}</th>
            <th>${escapeHtml(labels.columns.status)}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`
  }
</body>
</html>`;
}

async function generatePdf(labels: ReportLabels): Promise<string> {
  const events = await getIntakeHistory();
  const html = buildReportHtml(events, labels);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

async function recordLastExport(filename: string): Promise<void> {
  const info: LastExportInfo = { at: new Date().toISOString(), filename };
  await AsyncStorage.setItem(LAST_EXPORT_KEY, JSON.stringify(info));
}

export async function getLastExportInfo(): Promise<LastExportInfo | null> {
  const raw = await AsyncStorage.getItem(LAST_EXPORT_KEY);
  return raw ? (JSON.parse(raw) as LastExportInfo) : null;
}

export async function shareIntakeHistoryPdf(labels: ReportLabels): Promise<void> {
  const uri = await generatePdf(labels);
  // Record the export as soon as the PDF exists — what the user does with the
  // share sheet afterwards (dismiss it, cancel, pick nothing) shouldn't undo it.
  await recordLastExport(`PillyTrack-${new Date().toISOString().slice(0, 10)}.pdf`);
  try {
    const available = await Sharing.isAvailableAsync();
    if (available) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    }
  } catch {
    // Share sheet dismissed/cancelled — the PDF itself was still generated fine.
  }
}

export async function saveIntakeHistoryPdfToDevice(labels: ReportLabels, filename: string): Promise<string> {
  const uri = await generatePdf(labels);
  const source = new File(uri);
  const dest = new File(Paths.document, filename);
  await source.copy(dest, { overwrite: true });
  await recordLastExport(filename);
  return dest.uri;
}

export function buildReportLabels(
  t: (key: string, options?: Record<string, unknown>) => string,
  language: string,
): ReportLabels {
  return {
    title: t('export_pdf_title'),
    generatedLabel: t('export_pdf_generated', { date: new Date().toLocaleString(language) }),
    columns: {
      date: t('export_pdf_col_date'),
      time: t('export_pdf_col_time'),
      medication: t('export_pdf_col_medication'),
      status: t('export_pdf_col_status'),
    },
    statusLabels: {
      taken: t('status_taken'),
      missed: t('status_missed'),
      pending: t('status_pending'),
    },
    emptyLabel: t('export_pdf_empty'),
    locale: language,
  };
}
