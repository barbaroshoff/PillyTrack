import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import type { IntakeEvent } from '../../db/intakes';

interface Props {
  intake: IntakeEvent;
  onTaken: () => void;
  onSkipped: () => void;
}

const STATUS_CONFIG = {
  pending: { bg: 'warningLight', border: 'warning', label: 'Ожидает', labelColor: 'warning' },
  taken: { bg: 'successLight', border: 'success', label: 'Принято', labelColor: 'success' },
  missed: { bg: 'dangerLight', border: 'danger', label: 'Пропущено', labelColor: 'danger' },
} as const;

export default function IntakeCard({ intake, onTaken, onSkipped }: Props) {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const cfg = STATUS_CONFIG[intake.status];

  const time = new Date(intake.scheduled_at).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

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
            {cfg.label}
          </Text>
        </View>
      </View>

      {intake.status === 'pending' && (
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.success }]}
            onPress={onTaken}
          >
            <Text style={[s.actionText, { fontSize: baseSizes.button * scale }]}>Принял</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.dangerLight, borderWidth: 1, borderColor: colors.danger }]}
            onPress={onSkipped}
          >
            <Text style={[s.actionText, { color: colors.danger, fontSize: baseSizes.button * scale }]}>
              Пропустил
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
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: '600' },
});
