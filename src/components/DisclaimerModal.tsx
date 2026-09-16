import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from './ui/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { radii } from '../theme/layout';

const DISCLAIMER_KEY = '@pilly_disclaimer_accepted';

export function useDisclaimerState() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_KEY).then((v) => setAccepted(v === 'true'));
  }, []);

  const accept = async () => {
    await AsyncStorage.setItem(DISCLAIMER_KEY, 'true');
    setAccepted(true);
  };

  return { accepted, accept };
}

interface Props {
  visible: boolean;
  onAccept: () => void;
}

export default function DisclaimerModal({ visible, onAccept }: Props) {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent>
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]}>
        <View style={s.inner}>
          <View style={[s.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Text style={{ fontSize: 40 }}>💊</Text>
          </View>

          <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale * 1.1 }]}>
            {t('disclaimer_title')}
          </Text>

          <ScrollView style={s.textBox} contentContainerStyle={s.textBoxInner} showsVerticalScrollIndicator={false}>
            <Text style={[s.disclaimerText, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
              {t('disclaimer_subtitle')}
            </Text>

            <View style={[s.warningBox, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
              <Text style={[s.warningTitle, { color: colors.warning, fontSize: baseSizes.body * scale }]}>
                {t('disclaimer_warning_title')}
              </Text>
              <Text style={[s.warningText, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
                {t('disclaimer_warning_body1')}
              </Text>
              <Text style={[s.warningText, { color: colors.textPrimary, fontSize: baseSizes.body * scale, marginTop: 8 }]}>
                {t('disclaimer_warning_body2')}
              </Text>
            </View>

            <Text style={[s.disclaimerText, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
              {t('disclaimer_privacy')}
            </Text>
          </ScrollView>

          <TouchableOpacity
            style={[s.acceptBtn, { backgroundColor: colors.accent }]}
            onPress={onAccept}
          >
            <Text style={[s.acceptText, { fontSize: baseSizes.button * scale }]}>
              {t('disclaimer_btn')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontWeight: '800', textAlign: 'center', lineHeight: 28 },
  textBox: { width: '100%', flexGrow: 0, maxHeight: 320 },
  textBoxInner: { gap: 12 },
  disclaimerText: { lineHeight: 22, textAlign: 'center' },
  warningBox: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    padding: 18,
    gap: 6,
  },
  warningTitle: { fontWeight: '700', marginBottom: 4 },
  warningText: { lineHeight: 22 },
  acceptBtn: {
    width: '100%',
    padding: 17,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: 8,
  },
  acceptText: { color: '#fff', fontWeight: '700' },
});
