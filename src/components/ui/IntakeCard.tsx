import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from './AppText';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { radii, cardShadow, timeOfDay } from '../../theme/layout';
import type { IntakeEvent } from '../../db/intakes';

interface Props {
  intake: IntakeEvent;
  onTaken: () => void;
  onSkipped: () => void;
  onDelete: () => void;
}

const TIME_ICON = { morning: '🌅', midday: '☀️', evening: '🌙' } as const;

export default function IntakeCard({ intake, onTaken, onSkipped, onDelete }: Props) {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t } = useTranslation();
  const bucket = timeOfDay(intake.scheduled_at);
  const bucketColorLight = colors[`${bucket}Light` as const];

  const time = new Date(intake.scheduled_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[s.card, { backgroundColor: colors.cardBg, shadowColor: colors.textPrimary }]}>
      <View style={s.row}>
        <View style={[s.pill, { backgroundColor: bucketColorLight }]}>
          <Text style={{ fontSize: 22 }}>{TIME_ICON[bucket]}</Text>
        </View>

        <View style={s.info}>
          <Text style={[s.name, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
            {intake.medication_name ?? intake.course_id}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 2 }}>
            {time}
          </Text>
        </View>

        {intake.status === 'taken' && (
          <View style={[s.statusCircle, { backgroundColor: colors.success }]}>
            <Text style={{ fontSize: 16, color: '#fff', fontWeight: '700' }}>✓</Text>
          </View>
        )}
        {intake.status === 'missed' && (
          <View style={[s.statusCircle, { backgroundColor: colors.dangerLight }]}>
            <Text style={{ fontSize: 15, color: colors.danger, fontWeight: '700' }}>✕</Text>
          </View>
        )}

        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() =>
            Alert.alert(t('intake_delete_title'), t('intake_delete_body'), [
              { text: t('cancel'), style: 'cancel' },
              { text: t('delete'), style: 'destructive', onPress: onDelete },
            ])
          }
          hitSlop={6}
        >
          <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {intake.status === 'pending' && (
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.success }]}
            onPress={onTaken}
            activeOpacity={0.85}
          >
            <Text style={[s.actionText, { fontSize: baseSizes.button * scale }]}>✓ {t('taken')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.cardAlt }]}
            onPress={onSkipped}
            activeOpacity={0.85}
          >
            <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: baseSizes.button * scale }}>
              {t('skipped')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {intake.status === 'missed' && (
        <Text style={{ color: colors.danger, fontSize: baseSizes.caption * scale, marginTop: 10 }}>
          {t('status_missed')}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 14,
    ...cardShadow,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pill: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontWeight: '700' },
  statusCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: { padding: 6, marginLeft: 6 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '700' },
});
