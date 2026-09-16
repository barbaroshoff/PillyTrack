import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Text } from '../../components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { radii, cardShadow } from '../../theme/layout';
import { useScanFlowStore } from '../../store/scanFlowStore';
import { calculateCourse } from '../../services/scheduleEngine';
import type { Frequency } from '../../services/scheduleEngine';
import { insertMedication } from '../../db/medications';
import { scheduleIntakeNotifications, cancelNotificationsForMedication } from '../../services/notifications';
import { insertCourse, updateCourseStatus } from '../../db/courses';
import { insertIntakeEvents, deletePendingIntakesByCourse } from '../../db/intakes';
import { useIntakesStore } from '../../store/intakesStore';
import { generateId } from '../../utils/id';
import type { ScanFlowParamList } from '../../navigation/ScanFlowNavigator';

type Nav = NativeStackNavigationProp<ScanFlowParamList>;

const TIMES_OPTIONS = [1, 2, 3];

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
};

const WEEKDAY_KEYS = [
  { key: 'wd_mon', value: 1 },
  { key: 'wd_tue', value: 2 },
  { key: 'wd_wed', value: 3 },
  { key: 'wd_thu', value: 4 },
  { key: 'wd_fri', value: 5 },
  { key: 'wd_sat', value: 6 },
  { key: 'wd_sun', value: 0 },
];

function timeToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ScanScheduleScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const store = useScanFlowStore();
  const loadToday = useIntakesStore((s) => s.loadToday);

  const [timesPerDay, setTimesPerDay] = useState(store.timesPerDay);
  const [times, setTimes] = useState<string[]>(store.customTimes.length > 0 ? store.customTimes : DEFAULT_TIMES[store.timesPerDay] ?? ['08:00']);
  const [frequency, setFrequency] = useState<Frequency>(store.frequency);
  const [customDays, setCustomDays] = useState<number[]>(store.customDays);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const FREQUENCY_OPTIONS: { value: Frequency; labelKey: string }[] = [
    { value: 'daily', labelKey: 'schedule_freq_daily' },
    { value: 'every_other_day', labelKey: 'schedule_freq_other' },
    { value: 'custom_days', labelKey: 'schedule_freq_custom' },
  ];

  const TIMES_LABELS: Record<number, string> = {
    1: t('schedule_1x'),
    2: t('schedule_2x'),
    3: t('schedule_3x'),
  };

  const currentTimes = times.slice(0, timesPerDay);

  const onChangeTimesPerDay = (n: number) => {
    setTimesPerDay(n);
    const defaults = DEFAULT_TIMES[n] ?? ['08:00'];
    setTimes((prev) => {
      const next = [...prev];
      while (next.length < n) next.push(defaults[next.length] ?? '08:00');
      return next;
    });
  };

  const onTimeChange = (idx: number, date?: Date) => {
    setPickerIndex(null);
    if (!date) return;
    setTimes((prev) => {
      const next = [...prev];
      next[idx] = dateToTime(date);
      return next;
    });
  };

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const preview = useMemo(() => {
    const effectiveDays = frequency === 'custom_days' && customDays.length === 0
      ? [1, 3, 5]
      : customDays;
    return calculateCourse({
      courseId: '__preview__',
      pillsPerPack: store.pillsPerPack,
      dosePerDay: store.dosePerDay,
      timesPerDay,
      startDate: new Date(),
      customTimes: currentTimes,
      frequency,
      customDays: effectiveDays,
    });
  }, [timesPerDay, currentTimes, frequency, customDays, store.pillsPerPack, store.dosePerDay]);

  const save = async () => {
    if (saving) return;
    if (frequency === 'custom_days' && customDays.length === 0) {
      Alert.alert(t('schedule_days_alert_title'), t('schedule_days_alert_body'));
      return;
    }
    setSaving(true);
    try {
      const medicationId = store.existingMedicationId ?? generateId();
      const courseId = generateId();
      const startDate = new Date();

      if (!store.existingMedicationId) {
        await insertMedication({
          id: medicationId,
          name: store.medicationName,
          photo_uri: store.photoUri,
          barcode: store.barcode,
          pills_per_pack: store.pillsPerPack,
        });
      }

      if (store.existingCourseId) {
        await cancelNotificationsForMedication(medicationId);
        await updateCourseStatus(store.existingCourseId, 'completed');
        await deletePendingIntakesByCourse(store.existingCourseId);
      }

      const { durationDays, intakeEvents } = calculateCourse({
        courseId,
        pillsPerPack: store.pillsPerPack,
        dosePerDay: store.dosePerDay,
        timesPerDay,
        startDate,
        customTimes: currentTimes,
        frequency,
        customDays,
      });

      await insertCourse({
        id: courseId,
        medication_id: medicationId,
        times_per_day: timesPerDay,
        custom_times: currentTimes,
        frequency,
        custom_days: customDays,
        start_date: startDate.toISOString().split('T')[0],
        duration_days: durationDays,
        status: 'active',
      });

      const eventsWithIds = intakeEvents.map((e) => ({ ...e, id: generateId() }));
      await insertIntakeEvents(eventsWithIds);
      await scheduleIntakeNotifications(store.medicationName, eventsWithIds);
      await loadToday();
      navigation.navigate('ScanSuccess');
    } catch {
      Alert.alert(t('error'), t('schedule_error'));
      setSaving(false);
    }
  };

  const previewSuffix = frequency === 'every_other_day'
    ? ` · ${t('schedule_preview_other_day')}`
    : frequency === 'custom_days' && customDays.length > 0
    ? ` · ${i18n.t('schedule_preview_custom_days', { n: customDays.length })}`
    : '';

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          {t('schedule_title')}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Сколько раз в день */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          {t('schedule_times_label')}
        </Text>
        <View style={s.optionRow}>
          {TIMES_OPTIONS.map((n) => {
            const active = timesPerDay === n;
            return (
              <TouchableOpacity
                key={n}
                style={[s.optionBtn, {
                  borderColor: active ? colors.accent : 'transparent',
                  backgroundColor: active ? colors.accentLight : colors.cardAlt,
                  flex: 1,
                }]}
                onPress={() => onChangeTimesPerDay(n)}
              >
                <Text style={{ color: active ? colors.accentDark : colors.textPrimary, fontWeight: '600', fontSize: baseSizes.body * scale }}>
                  {TIMES_LABELS[n]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Время приёма */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          {t('schedule_time_label')}
        </Text>
        <View style={[s.card, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}>
          {currentTimes.map((time, i) => (
            <TouchableOpacity
              key={i}
              style={[s.timeRow, { borderBottomColor: colors.border, borderBottomWidth: i < currentTimes.length - 1 ? 1 : 0 }]}
              onPress={() => setPickerIndex(i)}
            >
              <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale }}>
                {i18n.t('schedule_intake_n', { n: i + 1 })}
              </Text>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: baseSizes.title * scale }}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
          {pickerIndex !== null && (
            <DateTimePicker
              mode="time"
              value={timeToDate(times[pickerIndex] ?? '08:00')}
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, date) => onTimeChange(pickerIndex, date)}
            />
          )}
        </View>

        {/* Частота */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          {t('schedule_freq_label')}
        </Text>
        <View style={s.optionRow}>
          {FREQUENCY_OPTIONS.map(({ value, labelKey }) => {
            const active = frequency === value;
            return (
              <TouchableOpacity
                key={value}
                style={[s.optionBtn, {
                  borderColor: active ? colors.accent : 'transparent',
                  backgroundColor: active ? colors.accentLight : colors.cardAlt,
                  flex: 1,
                }]}
                onPress={() => setFrequency(value)}
              >
                <Text style={{ color: active ? colors.accentDark : colors.textPrimary, fontWeight: '600', fontSize: baseSizes.caption * scale, textAlign: 'center' }}>
                  {t(labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Дни недели */}
        {frequency === 'custom_days' && (
          <View style={[s.card, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginBottom: 12 }]}>
              {t('schedule_days_label')}
            </Text>
            <View style={s.daysRow}>
              {WEEKDAY_KEYS.map(({ key, value }) => {
                const active = customDays.includes(value);
                return (
                  <TouchableOpacity
                    key={value}
                    style={[s.dayBtn, {
                      backgroundColor: active ? colors.accent : colors.bg,
                      borderColor: active ? colors.accent : 'transparent',
                    }]}
                    onPress={() => toggleDay(value)}
                  >
                    <Text style={{ color: active ? '#fff' : colors.textSecondary, fontWeight: '600', fontSize: baseSizes.caption * scale }}>
                      {t(key)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {customDays.length === 0 && (
              <Text style={{ color: colors.danger, fontSize: baseSizes.caption * scale, marginTop: 8 }}>
                {t('schedule_days_empty')}
              </Text>
            )}
          </View>
        )}

        {/* Превью курса */}
        <View style={[s.preview, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={[s.previewLabel, { color: colors.accentDark, fontSize: baseSizes.caption * scale }]}>
            {t('schedule_preview_label')}
          </Text>
          <Text style={[s.previewDays, { color: colors.accentDark, fontSize: baseSizes.title * scale * 1.3 }]}>
            {i18n.t('schedule_preview_days', { n: preview.durationDays })}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale, textAlign: 'center' }}>
            {i18n.t('schedule_preview_detail', { pills: store.pillsPerPack, times: timesPerDay })}{previewSuffix}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: saving ? colors.textMuted : colors.accent }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={[s.saveBtnText, { fontSize: baseSizes.button * scale }]}>
            {saving ? t('saving') : t('schedule_save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  title: { fontWeight: '700' },
  scroll: { padding: 20, gap: 16 },
  sectionLabel: { fontWeight: '700', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionBtn: { paddingVertical: 13, paddingHorizontal: 8, borderRadius: radii.sm, borderWidth: 2, alignItems: 'center' },
  card: { borderRadius: radii.lg, padding: 16, ...cardShadow },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
    gap: 4,
  },
  previewLabel: { fontWeight: '700', letterSpacing: 0.5 },
  previewDays: { fontWeight: '800' },
  saveBtn: { padding: 17, borderRadius: radii.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
