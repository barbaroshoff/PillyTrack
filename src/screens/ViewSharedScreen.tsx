import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text } from '../components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { radii, cardShadow } from '../theme/layout';
import { fetchSharedData } from '../services/shareSync';
import type { ShareSnapshot, SharedCourse } from '../services/shareSync';

export default function ViewSharedScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [snapshot, setSnapshot] = useState<ShareSnapshot | null>(null);

  const load = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setSnapshot(null);
    try {
      const data = await fetchSharedData(code);
      setSnapshot(data);
    } catch (e: any) {
      Alert.alert(
        t('error'),
        e.message === 'CODE_NOT_FOUND' ? t('view_shared_not_found') : t('view_shared_error'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          {t('view_shared_title')}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={{ color: colors.textSecondary, fontSize: baseSizes.body * scale, lineHeight: 22 }}>
          {t('view_shared_hint')}
        </Text>

        <TextInput
          style={[
            s.input,
            {
              color: colors.textPrimary,
              borderColor: colors.border,
              backgroundColor: colors.cardAlt,
              fontSize: baseSizes.title * scale,
            },
          ]}
          placeholder="XXXX-XXXX"
          placeholderTextColor={colors.textMuted}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={load}
        />

        <TouchableOpacity
          style={[s.btn, { backgroundColor: loading ? colors.textMuted : colors.accent }]}
          onPress={load}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[s.btnText, { fontSize: baseSizes.button * scale }]}>{t('view_shared_open')}</Text>
          )}
        </TouchableOpacity>

        {snapshot && (
          <View style={{ gap: 12, marginTop: 8 }}>
            {snapshot.courses.length === 0 ? (
              <Text
                style={{
                  color: colors.textMuted,
                  textAlign: 'center',
                  fontSize: baseSizes.body * scale,
                  marginTop: 16,
                }}
              >
                {t('view_shared_empty')}
              </Text>
            ) : (
              snapshot.courses.map((c, idx) => (
                <SharedCourseCard key={idx} course={c} colors={colors} scale={scale} t={t} i18n={i18n} />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SharedCourseCard({
  course, colors, scale, t, i18n,
}: {
  course: SharedCourse; colors: any; scale: number; t: any; i18n: any;
}) {
  const progress = course.stats.total > 0 ? course.stats.taken / course.stats.total : 0;
  const recent = course.recentIntakes.slice(0, 5);

  return (
    <View style={[s.card, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}>
      <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: baseSizes.body * scale }}>
        💊 {course.medicationName}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 2 }}>
        {i18n.t('course_summary', { n: course.timesPerDay, days: course.durationDays })}
      </Text>

      <View style={[s.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[s.barFill, { backgroundColor: colors.success, width: `${Math.round(progress * 100)}%` }]}
        />
      </View>
      <Text style={{ color: colors.textMuted, fontSize: baseSizes.caption * scale }}>
        {i18n.t('details_progress_text', { taken: course.stats.taken, total: course.stats.total })}
        {' · '}
        {i18n.t('details_missed', { n: course.stats.missed })}
      </Text>

      {recent.length > 0 && (
        <View style={{ marginTop: 8 }}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: baseSizes.caption * scale,
              fontWeight: '600',
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            {t('view_shared_recent_label').toUpperCase()}
          </Text>
          {recent.map((ev, i) => (
            <View
              key={i}
              style={[s.historyRow, { borderBottomColor: colors.border, borderBottomWidth: i < recent.length - 1 ? 1 : 0 }]}
            >
              <Text style={{ fontSize: 14 }}>
                {ev.status === 'taken' ? '✓' : ev.status === 'missed' ? '!' : '○'}
              </Text>
              <Text style={{ color: colors.textPrimary, fontSize: baseSizes.caption * scale, flex: 1 }}>
                {new Date(ev.scheduledAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}
                {'  '}
                {ev.scheduledAt.slice(11, 16)}
              </Text>
              <Text
                style={{
                  color:
                    ev.status === 'taken' ? colors.success : ev.status === 'missed' ? colors.danger : colors.textMuted,
                  fontSize: baseSizes.caption * scale,
                  fontWeight: '600',
                }}
              >
                {ev.status === 'taken' ? t('status_taken') : ev.status === 'missed' ? t('status_missed') : t('status_pending')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontWeight: '700' },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 17,
    textAlign: 'center',
    fontWeight: '700',
    letterSpacing: 2,
  },
  btn: { padding: 17, borderRadius: radii.md, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  card: { borderRadius: radii.lg, padding: 16, ...cardShadow },
  barBg: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 8, marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 3 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
});
