import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { useTodayIntakes, useMarkIntake } from '../store/intakesStore';
import IntakeCard from '../components/ui/IntakeCard';

export default function TodayScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t } = useTranslation();
  const intakes = useTodayIntakes();
  const markIntake = useMarkIntake();

  const allDone = intakes.length > 0 && intakes.every((i) => i.status === 'taken');
  const empty = intakes.length === 0;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        {t('today')}
      </Text>

      {empty && <EmptyState colors={colors} scale={scale} t={t} />}
      {allDone && !empty && <AllDoneState colors={colors} scale={scale} t={t} />}
      {!empty && !allDone && (
        <FlatList
          data={intakes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <IntakeCard
              intake={item}
              onTaken={() => markIntake(item.id, 'taken')}
              onSkipped={() => markIntake(item.id, 'missed')}
            />
          )}
        />
      )}

    </SafeAreaView>
  );
}

function EmptyState({ colors, scale, t }: { colors: any; scale: number; t: any }) {
  return (
    <View style={s.center}>
      <View style={[s.iconCircle, { backgroundColor: colors.accentLight }]}>
        <Text style={{ fontSize: 32 }}>💊</Text>
      </View>
      <Text style={[s.stateTitle, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        {t('today_empty_title')}
      </Text>
      <Text style={[s.stateBody, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
        {t('today_empty_body')}
      </Text>
    </View>
  );
}

function AllDoneState({ colors, scale, t }: { colors: any; scale: number; t: any }) {
  return (
    <View style={s.center}>
      <View style={[s.iconCircle, { backgroundColor: colors.successLight }]}>
        <Text style={{ fontSize: 32 }}>✓</Text>
      </View>
      <Text style={[s.stateTitle, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        {t('today_done_title')}
      </Text>
      <Text style={[s.stateBody, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
        {t('today_done_body')}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontWeight: '700', margin: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: { fontWeight: '700', textAlign: 'center' },
  stateBody: { textAlign: 'center', lineHeight: 22 },
});
