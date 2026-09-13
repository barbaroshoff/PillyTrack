import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ScanSuccessScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
      <View style={s.center}>
        <View style={[s.circle, { backgroundColor: colors.successLight }]}>
          <Text style={{ fontSize: 40 }}>✓</Text>
        </View>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          Курс добавлен!
        </Text>
        <Text style={[s.body, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
          Напоминания настроены
        </Text>
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
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontWeight: '700', textAlign: 'center' },
  body: { textAlign: 'center' },
  btn: {
    marginTop: 16,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
