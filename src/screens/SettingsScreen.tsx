import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import type { FontScaleKey } from '../theme';

const SCALE_LABELS: Record<FontScaleKey, string> = {
  normal: 'Обычный',
  large: 'Крупный',
  xlarge: 'Очень крупный',
};

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { scale, fontScale, setFontScale } = useFontScale();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        Настройки
      </Text>

      <View style={[s.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
        <Text style={[s.label, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          РАЗМЕР ШРИФТА
        </Text>
        <View style={s.row}>
          {(Object.keys(SCALE_LABELS) as FontScaleKey[]).map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                s.pill,
                {
                  backgroundColor: fontScale === key ? colors.accent : colors.bg,
                  borderColor: fontScale === key ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setFontScale(key)}
            >
              <Text
                style={{
                  color: fontScale === key ? '#fff' : colors.textPrimary,
                  fontSize: baseSizes.body * scale,
                  fontWeight: '500',
                }}
              >
                {SCALE_LABELS[key]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontWeight: '700', margin: 20 },
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: { fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});
