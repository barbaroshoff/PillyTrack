import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { getMedicationById } from '../db/medications';
import { getCourseByMedicationId, insertCourse, updateCourseStatus } from '../db/courses';
import { insertIntakeEvents, deletePendingIntakesByCourse } from '../db/intakes';
import { calculateCourse } from '../services/scheduleEngine';
import { scheduleIntakeNotifications } from '../services/notifications';
import { useScanFlowStore } from '../store/scanFlowStore';
import { useIntakesStore } from '../store/intakesStore';
import { generateId } from '../utils/id';
import type { Medication } from '../db/medications';
import type { Course } from '../db/courses';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'RenewCourse'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

interface FormValues {
  pillsPerPack: string;
}

export default function RenewCourseScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t, i18n } = useTranslation();
  const ti = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const loadToday = useIntakesStore((s) => s.loadToday);
  const setScanField = useScanFlowStore((s) => s.setField);

  const [medication, setMedication] = useState<Medication | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: { pillsPerPack: '30' },
  });

  const pills = parseInt(watch('pillsPerPack') || '0', 10) || 0;

  useEffect(() => {
    (async () => {
      const med = await getMedicationById(params.medicationId);
      setMedication(med);
      if (!med) return;
      const c = await getCourseByMedicationId(med.id);
      setCourse(c);
    })();
  }, [params.medicationId]);

  const adjust = (delta: number) => setValue('pillsPerPack', String(Math.max(1, pills + delta)));

  const onSubmit = async (data: FormValues) => {
    if (!medication || !course || saving) return;
    setSaving(true);
    try {
      const pillsPerPack = parseInt(data.pillsPerPack, 10) || 30;
      await updateCourseStatus(course.id, 'completed');
      await deletePendingIntakesByCourse(course.id);

      const newCourseId = generateId();
      const startDate = new Date();

      const { durationDays, intakeEvents } = calculateCourse({
        courseId: newCourseId,
        pillsPerPack,
        dosePerDay: 1,
        timesPerDay: course.times_per_day,
        startDate,
        customTimes: course.custom_times,
        frequency: course.frequency,
        customDays: course.custom_days,
      });

      await insertCourse({
        id: newCourseId,
        medication_id: medication.id,
        times_per_day: course.times_per_day,
        custom_times: course.custom_times,
        frequency: course.frequency,
        custom_days: course.custom_days,
        start_date: startDate.toISOString().split('T')[0],
        duration_days: durationDays,
        status: 'active',
      });

      const eventsWithIds = intakeEvents.map((e) => ({ ...e, id: generateId() }));
      await insertIntakeEvents(eventsWithIds);
      await scheduleIntakeNotifications(medication.name, eventsWithIds);
      await loadToday();
      setScanField('medicationName', medication.name);
      navigation.navigate('ScanSuccess');
    } catch {
      Alert.alert(t('error'), t('renew_error'));
      setSaving(false);
    }
  };

  if (!medication) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={s.center}>
          <Text style={{ color: colors.textMuted }}>{t('loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          {t('renew_title')}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Карточка препарата (readonly) */}
        <View style={[s.card, { backgroundColor: colors.accentLight, borderColor: colors.border }]}>
          <View style={s.cardRow}>
            <View style={[s.icon, { backgroundColor: colors.accent }]}>
              <Text style={{ fontSize: 22 }}>💊</Text>
            </View>
            <View style={s.cardInfo}>
              <Text style={[s.medName, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
                {medication.name}
              </Text>
              {course && (
                <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale }}>
                  {ti('course_summary_times', { n: course.times_per_day, times: course.custom_times.join(', ') })}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Количество таблеток */}
        <Text style={[s.label, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          {t('renew_pills_label')}
        </Text>

        <View style={s.stepper}>
          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: colors.accentLight }]}
            onPress={() => adjust(-1)}
          >
            <Text style={[s.stepIcon, { color: colors.accent }]}>−</Text>
          </TouchableOpacity>

          <Controller
            control={control}
            name="pillsPerPack"
            render={({ field: { onChange, value } }) => (
              <Text
                style={[s.stepValue, { color: colors.textPrimary, fontSize: baseSizes.title * scale * 1.4 }]}
                onPress={() => {}}
              >
                {value}
              </Text>
            )}
          />

          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: colors.accentLight }]}
            onPress={() => adjust(1)}
          >
            <Text style={[s.stepIcon, { color: colors.accent }]}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.renewBtn, { backgroundColor: saving ? colors.textMuted : colors.accent }]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
        >
          <Text style={[s.renewBtnText, { fontSize: baseSizes.button * scale }]}>
            {saving ? t('saving') : t('renew_btn')}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  medName: { fontWeight: '700', marginBottom: 2 },
  label: { fontWeight: '600', letterSpacing: 0.5 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 },
  stepBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  stepIcon: { fontSize: 32, lineHeight: 36, fontWeight: '300' },
  stepValue: { width: 80, fontWeight: '800', textAlign: 'center' },
  renewBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  renewBtnText: { color: '#fff', fontWeight: '600' },
});
