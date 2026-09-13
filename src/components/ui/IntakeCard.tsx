import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import type { IntakeEvent } from '../../db/intakes';

interface Props {
  intake: IntakeEvent;
  onTaken: () => void;
  onSkipped: () => void;
  onDelete: () => void;
}

const STATUS_COLORS = {
  pending: { bg: 'warningLight', border: 'warning', labelColor: 'warning' },
  taken: { bg: 'successLight', border: 'success', labelColor: 'success' },
  missed: { bg: 'dangerLight', border: 'danger', labelColor: 'danger' },
} as const;

export default function IntakeCard({ intake, onTaken, onSkipped, onDelete }: Props) {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t } = useTranslation();
  const cfg = STATUS_COLORS[intake.status];

  const time = new Date(intake.scheduled_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusLabel =
    intake.status === 'taken'
      ? t('status_taken')
      : intake.status === 'missed'
      ? t('status_missed')
      : t('status_pending');

  const cardBg = colors[cfg.bg as keyof typeof colors] as string;
  const borderColor = intake.status === 'missed'
    ? (colors[cfg.border as keyof typeof colors] as string)
    : colors.border;

  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: cardBg,
          borderColor,
          borderWidth: intake.status === 'missed' ? 1.5 : 1,
        },
      ]}
    >
      <View style={s.row}>
        <View style={[s.pill, { backgroundColor: colors.accentLight }]}>
          <Text style={{ fontSize: 20 }}>💊</Text>
        </View>

        <View style={s.info}>
          <Text style={[s.name, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
            {intake.medication_name ?? intake.course_id}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale }}>
            {time}
          </Text>
        </View>

        <View
          style={[
            s.badge,
            { backgroundColor: colors[cfg.bg as keyof typeof colors] as string },
          ]}
        >
          <Text
            style={{
              color: colors[cfg.labelColor as keyof typeof colors] as string,
              fontSize: baseSizes.caption * scale,
              fontWeight: '600',
            }}
          >
            {statusLabel}
          </Text>
        </View>

        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() =>
            Alert.alert(t('intake_delete_title'), t('intake_delete_body'), [
              { text: t('cancel'), style: 'cancel' },
              { text: t('delete'), style: 'destructive', onPress: onDelete },
            ])
          }
        >
          <Text style={{ color: colors.textMuted, fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {intake.status === 'pending' && (
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.success }]}
            onPress={onTaken}
          >
            <Text style={[s.actionText, { fontSize: baseSizes.button * scale }]}>{t('taken')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger }]}
            onPress={onSkipped}
          >
            <Text style={[s.actionText, { color: colors.danger, fontSize: baseSizes.button * scale }]}>
              {t('skipped')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontWeight: '600', marginBottom: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  deleteBtn: { padding: 6, marginLeft: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },
});
