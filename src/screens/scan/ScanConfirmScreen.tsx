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

export default function ScanConfirmScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>Назад</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          Подтвердить
        </Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={s.center}>
        <Text style={{ color: colors.textMuted, fontSize: baseSizes.body * scale }}>
          Форма подтверждения лекарства
        </Text>
        <TouchableOpacity
          style={[s.btn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('ScanSchedule', { medicationId: '__manual__' })}
        >
          <Text style={[s.btnText, { fontSize: baseSizes.button * scale }]}>Далее</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnText: { color: '#fff', fontWeight: '600' },
});
