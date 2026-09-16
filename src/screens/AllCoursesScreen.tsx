import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Text } from '../components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { radii, cardShadow } from '../theme/layout';
import { getActiveCoursesWithMedications } from '../db/courses';
import type { CourseWithMedication } from '../db/courses';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AllCoursesScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [courses, setCourses] = useState<CourseWithMedication[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getActiveCoursesWithMedications();
    setCourses(data);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (courses.length === 0) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          {t('courses')}
        </Text>
        <View style={s.center}>
          <View style={[s.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Text style={{ fontSize: 36 }}>💊</Text>
          </View>
          <Text style={[s.emptyTitle, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
            {t('courses_empty_title')}
          </Text>
          <Text style={[s.emptyBody, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
            {t('courses_empty_body')}
          </Text>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('ScanFlow', { screen: 'ScanCamera' })}
          >
            <Text style={[s.addBtnText, { fontSize: baseSizes.button * scale }]}>
              + {t('courses_add')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        {t('courses')}
      </Text>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />}
        renderItem={({ item }) => (
          <CourseCard
            course={item}
            onPress={() => navigation.navigate('MedicationDetails', { medicationId: item.medication_id })}
          />
        )}
      />
    </SafeAreaView>
  );
}

interface CardProps {
  course: CourseWithMedication;
  onPress: () => void;
}

function CourseCard({ course, onPress }: CardProps) {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t, i18n } = useTranslation();
  const nextTime = course.next_intake_at
    ? new Date(course.next_intake_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={s.cardRow}>
        {course.photo_uri ? (
          <Image source={{ uri: course.photo_uri }} style={s.icon} resizeMode="cover" />
        ) : (
          <View style={[s.icon, { backgroundColor: colors.accentLight }]}>
            <Text style={{ fontSize: 24 }}>💊</Text>
          </View>
        )}
        <View style={s.cardInfo}>
          <Text
            style={[s.medName, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}
            numberOfLines={1}
          >
            {course.medication_name}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale }}>
            {i18n.t('course_summary', { n: course.times_per_day, days: course.duration_days })}
          </Text>
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
      </View>

      <View style={[s.nextRow, { borderTopColor: colors.border }]}>
        <Text style={{ color: colors.textMuted, fontSize: baseSizes.caption * scale }}>
          {t('courses_next_intake')}
        </Text>
        <Text
          style={{
            color: nextTime ? colors.accent : colors.textMuted,
            fontSize: baseSizes.caption * scale,
            fontWeight: '600',
          }}
        >
          {nextTime ?? t('courses_no_next')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontWeight: '800', margin: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 14 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontWeight: '800', textAlign: 'center' },
  emptyBody: { textAlign: 'center', lineHeight: 24 },
  addBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: radii.sm },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 20, paddingBottom: 24, gap: 14 },
  card: { borderRadius: radii.lg, ...cardShadow },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  icon: { width: 52, height: 52, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  medName: { fontWeight: '700', marginBottom: 2 },
  nextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
});
