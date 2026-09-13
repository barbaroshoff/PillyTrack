import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { useScanFlowStore } from '../../store/scanFlowStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ScanSuccessScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();
  const medicationName = useScanFlowStore((s) => s.medicationName);
  const reset = useScanFlowStore((s) => s.reset);

  useEffect(() => () => { reset(); }, []);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
      <View style={s.center}>
        <View style={[s.circle, { backgroundColor: colors.successLight }]}>
          <Text style={s.emoji}>✓</Text>
        </View>

        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale * 1.15 }]}>
          Готово!
        </Text>
        <Text style={[s.sub, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
          Будем напоминать вовремя
        </Text>
        {medicationName ? (
          <View style={[s.pill, { backgroundColor: colors.accentLight }]}>
            <Text style={{ color: colors.accentDark, fontSize: baseSizes.caption * scale, fontWeight: '600' }}>
              💊 {medicationName}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('Tabs')}
        >
          <Text style={[s.btnText, { fontSize: baseSizes.button * scale }]}>На главную</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: { fontSize: 44 },
  title: { fontWeight: '800', textAlign: 'center' },
  sub: { textAlign: 'center', lineHeight: 24 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  btn: {
    marginTop: 24,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
