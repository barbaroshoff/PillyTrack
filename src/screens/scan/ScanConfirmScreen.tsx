import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { useFontScale } from '../../context/FontScaleContext';
import { baseSizes } from '../../theme/typography';
import { useScanFlowStore } from '../../store/scanFlowStore';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface FormValues {
  medicationName: string;
  pillsPerPack: string;
}

export default function ScanConfirmScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const navigation = useNavigation<Nav>();
  const setField = useScanFlowStore((s) => s.setField);
  const photoUri = useScanFlowStore((s) => s.photoUri);
  const storePills = useScanFlowStore((s) => s.pillsPerPack);
  const storeName = useScanFlowStore((s) => s.medicationName);

  const { control, handleSubmit, setValue, watch } = useForm<FormValues>({
    defaultValues: {
      medicationName: storeName,
      pillsPerPack: String(storePills || 30),
    },
  });

  const pills = parseInt(watch('pillsPerPack') || '0', 10) || 0;

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!res.canceled) setField('photoUri', res.assets[0].uri);
  };

  const onSubmit = (data: FormValues) => {
    setField('medicationName', data.medicationName.trim());
    setField('pillsPerPack', parseInt(data.pillsPerPack, 10) || 30);
    navigation.navigate('ScanSchedule');
  };

  const adjust = (delta: number) => {
    const next = Math.max(1, pills + delta);
    setValue('pillsPerPack', String(next));
  };

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

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Фото */}
        <TouchableOpacity
          style={[s.photoBox, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
          onPress={pickPhoto}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={s.photo} resizeMode="cover" />
          ) : (
            <>
              <Text style={{ fontSize: 36 }}>📦</Text>
              <Text style={{ color: colors.textMuted, fontSize: baseSizes.caption * scale, marginTop: 8 }}>
                Добавить фото упаковки
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Название */}
        <Text style={[s.label, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          НАЗВАНИЕ ПРЕПАРАТА
        </Text>
        <Controller
          control={control}
          name="medicationName"
          rules={{ required: true }}
          render={({ field: { onChange, value }, fieldState }) => (
            <TextInput
              style={[
                s.input,
                {
                  color: colors.textPrimary,
                  borderColor: fieldState.error ? colors.danger : colors.border,
                  backgroundColor: colors.cardAlt,
                  fontSize: baseSizes.body * scale,
                },
              ]}
              placeholder="Например, Омепразол"
              placeholderTextColor={colors.textMuted}
              value={value}
              onChangeText={onChange}
              returnKeyType="done"
            />
          )}
        />

        {/* Количество таблеток */}
        <Text style={[s.label, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          ТАБЛЕТОК В УПАКОВКЕ
        </Text>
        <View style={s.stepper}>
          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: colors.accentLight }]}
            onPress={() => adjust(-1)}
          >
            <Text style={[s.stepIcon, { color: colors.accent }]}>−</Text>
          </TouchableOpacity>

          <Controller
            control={control}
            name="pillsPerPack"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[s.stepValue, { color: colors.textPrimary, fontSize: baseSizes.title * scale * 1.2 }]}
                value={value}
                onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                textAlign="center"
              />
            )}
          />

          <TouchableOpacity
            style={[s.stepBtn, { backgroundColor: colors.accentLight }]}
            onPress={() => adjust(1)}
          >
            <Text style={[s.stepIcon, { color: colors.accent }]}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.nextBtn, { backgroundColor: colors.accent }]}
          onPress={handleSubmit(onSubmit)}
        >
          <Text style={[s.nextText, { fontSize: baseSizes.button * scale }]}>Далее</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { padding: 16, gap: 12 },
  photoBox: {
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  label: { fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 8,
  },
  stepBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: { fontSize: 28, lineHeight: 32, fontWeight: '300' },
  stepValue: { width: 80, fontWeight: '700', textAlign: 'center' },
  nextBtn: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextText: { color: '#fff', fontWeight: '600' },
});
