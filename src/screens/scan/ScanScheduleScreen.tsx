import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { useScanFlowStore } from '../../store/scanFlowStore';
import { calculateCourse } from '../../services/scheduleEngine';
import { insertMedication } from '../../db/medications';
import { insertCourse } from '../../db/courses';
import { insertIntakeEvents } from '../../db/intakes';
import { useIntakesStore } from '../../store/intakesStore';
import { generateId } from '../../utils/id';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PRESETS = [
  { label: '1 раз', times: 1, times_arr: ['08:00'] },
  { label: '2 раза', times: 2, times_arr: ['08:00', '20:00'] },
  { label: '3 раза', times: 3, times_arr: ['08:00', '14:00', '20:00'] },
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
  const navigation = useNavigation<Nav>();
  const store = useScanFlowStore();
  const loadToday = useIntakesStore((s) => s.loadToday);

  const [timesPerDay, setTimesPerDay] = useState(store.timesPerDay);
  const [customTimes, setCustomTimes] = useState<string[]>(store.customTimes);
  const [isCustom, setIsCustom] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => {
    const times = isCustom ? customTimes.slice(0, timesPerDay) : PRESETS.find(p => p.times === timesPerDay)?.times_arr ?? ['08:00'];
    return calculateCourse({
      courseId: '__preview__',
      pillsPerPack: store.pillsPerPack,
      dosePerDay: store.dosePerDay,
      timesPerDay,
      startDate: new Date(),
      customTimes: times,
    });
  }, [timesPerDay, customTimes, isCustom, store.pillsPerPack, store.dosePerDay]);

  const selectPreset = (p: typeof PRESETS[0]) => {
    setIsCustom(false);
    setTimesPerDay(p.times);
    setCustomTimes(p.times_arr);
  };

  const selectCustom = () => {
    setIsCustom(true);
    if (customTimes.length !== timesPerDay) {
      const defaults = ['08:00', '14:00', '20:00', '22:00'];
      setCustomTimes(defaults.slice(0, timesPerDay));
    }
  };

  const onTimeChange = (idx: number, date?: Date) => {
    setPickerIndex(null);
    if (!date) return;
    const updated = [...customTimes];
    updated[idx] = dateToTime(date);
    setCustomTimes(updated);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const finalTimes = isCustom
        ? customTimes.slice(0, timesPerDay)
        : PRESETS.find(p => p.times === timesPerDay)?.times_arr ?? ['08:00'];

      const medicationId = generateId();
      const courseId = generateId();
      const startDate = new Date();

      await insertMedication({
        id: medicationId,
        name: store.medicationName,
        photo_uri: store.photoUri,
        barcode: store.barcode,
        pills_per_pack: store.pillsPerPack,
      });

      const { durationDays, intakeEvents } = calculateCourse({
        courseId,
        pillsPerPack: store.pillsPerPack,
        dosePerDay: store.dosePerDay,
        timesPerDay,
        startDate,
        customTimes: finalTimes,
      });

      await insertCourse({
        id: courseId,
        medication_id: medicationId,
        times_per_day: timesPerDay,
        custom_times: finalTimes,
        start_date: startDate.toISOString().split('T')[0],
        duration_days: durationDays,
        status: 'active',
      });

      await insertIntakeEvents(
        intakeEvents.map((e) => ({ ...e, id: generateId() })),
      );

      await loadToday();
      navigation.navigate('ScanSuccess');
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить курс');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>Назад</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          Расписание
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          СКОЛЬКО РАЗ В ДЕНЬ
        </Text>

        <View style={s.presetRow}>
          {PRESETS.map((p) => {
            const active = !isCustom && timesPerDay === p.times;
            return (
              <TouchableOpacity
                key={p.times}
                style={[s.presetBtn, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accentLight : colors.cardAlt }]}
                onPress={() => selectPreset(p)}
              >
                <Text style={{ color: active ? colors.accentDark : colors.textPrimary, fontWeight: '600', fontSize: baseSizes.body * scale }}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[s.presetBtn, { borderColor: isCustom ? colors.accent : colors.border, backgroundColor: isCustom ? colors.accentLight : colors.cardAlt }]}
            onPress={selectCustom}
          >
            <Text style={{ color: isCustom ? colors.accentDark : colors.textPrimary, fontWeight: '600', fontSize: baseSizes.body * scale }}>
              Своё
            </Text>
          </TouchableOpacity>
        </View>

        {isCustom && (
          <View style={[s.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
              ВРЕМЯ ПРИЁМА
            </Text>
            {customTimes.slice(0, timesPerDay).map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[s.timeRow, { borderBottomColor: colors.border }]}
                onPress={() => setPickerIndex(i)}
              >
                <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale }}>Приём {i + 1}</Text>
                <Text style={{ color: colors.accent, fontWeight: '700', fontSize: baseSizes.title * scale }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
            {pickerIndex !== null && (
              <DateTimePicker
                mode="time"
                value={timeToDate(customTimes[pickerIndex] ?? '08:00')}
                is24Hour
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => onTimeChange(pickerIndex, date)}
              />
            )}
          </View>
        )}

        {/* Превью курса */}
        <View style={[s.preview, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={[s.previewLabel, { color: colors.accentDark, fontSize: baseSizes.caption * scale }]}>
            РАСЧЁТ КУРСА
          </Text>
          <Text style={[s.previewDays, { color: colors.accentDark, fontSize: baseSizes.title * scale * 1.3 }]}>
            {preview.durationDays} дней
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale }}>
            {store.pillsPerPack} таблеток · {timesPerDay}× в день
          </Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: saving ? colors.textMuted : colors.accent }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={[s.saveBtnText, { fontSize: baseSizes.button * scale }]}>
            {saving ? 'Сохраняем...' : 'Сохранить курс'}
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
  scroll: { padding: 16, gap: 12 },
  sectionLabel: { fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  presetRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  presetBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  preview: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  previewLabel: { fontWeight: '600', letterSpacing: 0.5 },
  previewDays: { fontWeight: '800' },
  saveBtn: { marginTop: 8, padding: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
