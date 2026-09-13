import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { getMedicationById, deleteMedication } from '../db/medications';
import { getCourseByMedicationId, updateCourseStatus } from '../db/courses';
import { useScanFlowStore } from '../store/scanFlowStore';
import { useIntakesStore } from '../store/intakesStore';
import { cancelNotificationsForMedication } from '../services/notifications';
import { getIntakeStatsByCourse, getRecentIntakesByCourse } from '../db/intakes';
import type { Medication } from '../db/medications';
import type { Course } from '../db/courses';
import type { IntakeEvent, IntakeStats } from '../db/intakes';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationDetails'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MedicationDetailsScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();

  const [medication, setMedication] = useState<Medication | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState<IntakeStats | null>(null);
  const [history, setHistory] = useState<IntakeEvent[]>([]);
  const resetScan = useScanFlowStore((s) => s.reset);
  const setScanField = useScanFlowStore((s) => s.setField);
  const loadToday = useIntakesStore((s) => s.loadToday);

  useEffect(() => {
    (async () => {
      const med = await getMedicationById(params.medicationId);
      setMedication(med);
      if (!med) return;

      const c = await getCourseByMedicationId(med.id);
      setCourse(c);
      if (!c) return;

      const [s, h] = await Promise.all([
        getIntakeStatsByCourse(c.id),
        getRecentIntakesByCourse(c.id, 5),
      ]);
      setStats(s);
      setHistory(h);
    })();
  }, [params.medicationId]);

  if (!medication) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={s.center}>
          <Text style={{ color: colors.textMuted }}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = stats && stats.total > 0 ? stats.taken / stats.total : 0;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>Назад</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Крупная плашка */}
        <View style={[s.banner, { backgroundColor: colors.accentLight }]}>
          <View style={[s.iconCircle, { backgroundColor: colors.accent }]}>
            <Text style={{ fontSize: 36 }}>💊</Text>
          </View>
          <Text style={[s.medName, { color: colors.textPrimary, fontSize: baseSizes.title * scale * 1.1 }]}>
            {medication.name}
          </Text>
          {course && (
            <Text style={{ color: colors.textSecondary, fontSize: baseSizes.body * scale }}>
              {course.times_per_day}× в день · {course.duration_days} дней
            </Text>
          )}
        </View>

        {/* Прогресс-бар */}
        {stats && course && (
          <View style={[s.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={[s.cardLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
              ПРОГРЕСС КУРСА
            </Text>
            <Text style={[s.progressText, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
              {stats.taken} из {stats.total} доз принято
            </Text>
            <View style={[s.barBg, { backgroundColor: colors.border }]}>
              <View
                style={[s.barFill, { backgroundColor: colors.success, width: `${Math.round(progress * 100)}%` }]}
              />
            </View>
            <Text style={{ color: colors.textMuted, fontSize: baseSizes.caption * scale }}>
              {stats.missed} пропущено
            </Text>
          </View>
        )}

        {/* История */}
        {history.length > 0 && (
          <View style={[s.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
            <Text style={[s.cardLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
              ПОСЛЕДНИЕ ПРИЁМЫ
            </Text>
            {history.map((ev) => (
              <View key={ev.id} style={[s.historyRow, { borderBottomColor: colors.border }]}>
                <Text style={{ fontSize: 18 }}>
                  {ev.status === 'taken' ? '✓' : ev.status === 'missed' ? '!' : '○'}
                </Text>
                <View style={s.historyInfo}>
                  <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale }}>
                    {new Date(ev.scheduled_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: baseSizes.caption * scale }}>
                    {ev.scheduled_at.slice(11, 16)}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: baseSizes.caption * scale,
                    fontWeight: '600',
                    color:
                      ev.status === 'taken'
                        ? colors.success
                        : ev.status === 'missed'
                        ? colors.danger
                        : colors.textMuted,
                  }}
                >
                  {ev.status === 'taken' ? 'Принято' : ev.status === 'missed' ? 'Пропущено' : 'Ожидает'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Кнопки */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.accent }]}
            onPress={() =>
              navigation.navigate('RenewCourse', {
                medicationId: medication.id,
                courseId: course?.id,
              })
            }
          >
            <Text style={[s.actionBtnText, { fontSize: baseSizes.button * scale }]}>Продлить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }]}
            onPress={async () => {
              await cancelNotificationsForMedication(medication.id);
              if (course) await updateCourseStatus(course.id, 'completed');
              resetScan();
              setScanField('medicationName', medication.name);
              setScanField('pillsPerPack', medication.pills_per_pack);
              setScanField('existingMedicationId', medication.id);
              navigation.navigate('ScanSchedule');
            }}
          >
            <Text style={[s.actionBtnText, { color: colors.textPrimary, fontSize: baseSizes.button * scale }]}>
              Изменить схему
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger }]}
            onPress={() =>
              Alert.alert(
                'Удалить лекарство?',
                'Будут удалены все курсы и история приёмов. Это действие нельзя отменить.',
                [
                  { text: 'Отмена', style: 'cancel' },
                  {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                      await cancelNotificationsForMedication(medication.id);
                      await deleteMedication(medication.id);
                      await loadToday();
                      navigation.goBack();
                    },
                  },
                ],
              )
            }
          >
            <Text style={[s.actionBtnText, { color: colors.danger, fontSize: baseSizes.button * scale }]}>
              Удалить
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, gap: 12 },
  banner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  medName: { fontWeight: '800', textAlign: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  cardLabel: { fontWeight: '600', letterSpacing: 0.5 },
  progressText: { fontWeight: '600' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  historyInfo: { flex: 1 },
  actions: { gap: 10, marginTop: 8 },
  actionBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontWeight: '600' },
});
