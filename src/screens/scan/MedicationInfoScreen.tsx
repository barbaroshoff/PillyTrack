import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { useScanFlowStore } from '../../store/scanFlowStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicationInfo'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function MedicationInfoScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const { info, photoUri } = params;

  const [name, setName] = useState(info.name);
  const [pills, setPills] = useState(String(info.pillsCount ?? 30));
  const setField = useScanFlowStore((s) => s.setField);

  const adjustPills = (delta: number) => {
    setPills(String(Math.max(1, (parseInt(pills, 10) || 0) + delta)));
  };

  const proceed = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Введите название', 'Название препарата не может быть пустым');
      return;
    }
    setField('medicationName', trimmedName);
    setField('pillsPerPack', parseInt(pills, 10) || 30);
    setField('photoUri', photoUri);
    navigation.navigate('ScanSchedule');
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>Назад</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          Препарат найден
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Баннер с фото и названием */}
        <View style={[s.banner, { backgroundColor: colors.accentLight }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.photo} resizeMode="cover" />
          ) : (
            <View style={[s.iconCircle, { backgroundColor: colors.accent }]}>
              <Text style={{ fontSize: 36 }}>💊</Text>
            </View>
          )}
          <TextInput
            style={[
              s.nameInput,
              {
                color: colors.textPrimary,
                fontSize: baseSizes.title * scale,
                borderColor: colors.accent + '60',
              },
            ]}
            value={name}
            onChangeText={setName}
            multiline
            textAlign="center"
          />
          <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale }}>
            Нажмите на название чтобы изменить
          </Text>
        </View>

        {/* Карточки с информацией */}
        <InfoCard title="ОПИСАНИЕ" text={info.description} colors={colors} scale={scale} />
        <InfoCard title="💊 ДОЗИРОВКА" text={info.dosage} colors={colors} scale={scale} />
        <InfoCard title="⚠️ ПРОТИВОПОКАЗАНИЯ" text={info.contraindications} colors={colors} scale={scale} />
        <InfoCard title="ℹ️ ПОБОЧНЫЕ ЭФФЕКТЫ" text={info.sideEffects} colors={colors} scale={scale} />

        {/* Количество таблеток */}
        <View style={[s.pillsCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Text style={[s.cardLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
            ТАБЛЕТОК В УПАКОВКЕ
          </Text>
          <View style={s.stepper}>
            <TouchableOpacity
              style={[s.stepBtn, { backgroundColor: colors.accentLight }]}
              onPress={() => adjustPills(-1)}
            >
              <Text style={[s.stepIcon, { color: colors.accent }]}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={[s.stepValue, { color: colors.textPrimary, fontSize: baseSizes.title * scale * 1.2 }]}
              value={pills}
              onChangeText={(v) => setPills(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={[s.stepBtn, { backgroundColor: colors.accentLight }]}
              onPress={() => adjustPills(1)}
            >
              <Text style={[s.stepIcon, { color: colors.accent }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Дисклеймер */}
        <View style={[s.disclaimer, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
          <Text style={{ color: colors.warning, fontSize: baseSizes.caption * scale, lineHeight: 18 }}>
            ⚠️ Информация предоставлена AI и может содержать неточности. Всегда следуйте инструкции врача.
          </Text>
        </View>

        <TouchableOpacity style={[s.nextBtn, { backgroundColor: colors.accent }]} onPress={proceed}>
          <Text style={[s.nextText, { fontSize: baseSizes.button * scale }]}>Настроить расписание →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({
  title,
  text,
  colors,
  scale,
}: {
  title: string;
  text: string;
  colors: any;
  scale: number;
}) {
  return (
    <View style={[s.infoCard, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
      <Text style={[s.cardLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
        {title}
      </Text>
      <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale, lineHeight: 22 }}>
        {text}
      </Text>
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
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  banner: { borderRadius: 20, padding: 20, alignItems: 'center', gap: 10, marginBottom: 4 },
  photo: { width: 120, height: 120, borderRadius: 16, marginBottom: 4 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameInput: {
    fontWeight: '800',
    textAlign: 'center',
    borderBottomWidth: 1.5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    width: '100%',
  },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  pillsCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  cardLabel: { fontWeight: '600', letterSpacing: 0.5 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: { fontSize: 28, lineHeight: 32, fontWeight: '300' },
  stepValue: { width: 80, fontWeight: '700', textAlign: 'center' },
  disclaimer: { borderRadius: 12, borderWidth: 1, padding: 12 },
  nextBtn: { marginTop: 8, padding: 16, borderRadius: 14, alignItems: 'center' },
  nextText: { color: '#fff', fontWeight: '600' },
});
