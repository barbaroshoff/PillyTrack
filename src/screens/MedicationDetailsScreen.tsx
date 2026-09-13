import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';

export default function MedicationDetailsScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
      <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        Детали лекарства
      </Text>
      <View style={s.center}>
        <Text style={{ color: colors.textMuted, fontSize: baseSizes.body * scale }}>
          В разработке
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontWeight: '700', margin: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
