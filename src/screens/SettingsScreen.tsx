import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes, fontScales } from '../theme/typography';
import { setLanguage, getLanguage } from '../i18n';
import type { FontScaleKey } from '../theme';
import type { AppLanguage } from '../i18n';

const FONT_PRESETS: { key: FontScaleKey; labelKey: string; aaSize: number }[] = [
  { key: 'normal', labelKey: 'settings_font_normal', aaSize: 20 },
  { key: 'large', labelKey: 'settings_font_large', aaSize: 23 },
  { key: 'xlarge', labelKey: 'settings_font_xlarge', aaSize: 26 },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { scale, fontScale, setFontScale } = useFontScale();
  const { t, i18n } = useTranslation();

  const currentLang = getLanguage();

  const changeLang = async (lang: AppLanguage) => {
    await setLanguage(lang);
    await i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        {t('settings')}
      </Text>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Размер шрифта */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          {t('settings_font_size').toUpperCase()}
        </Text>
        <View style={s.fontRow}>
          {FONT_PRESETS.map(({ key, labelKey, aaSize }) => {
            const active = fontScale === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  s.fontCard,
                  {
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accentLight : colors.cardAlt,
                    flex: 1,
                  },
                ]}
                onPress={() => setFontScale(key)}
              >
                <Text
                  style={{
                    fontSize: aaSize,
                    fontWeight: '700',
                    color: active ? colors.accentDark : colors.textPrimary,
                    marginBottom: 6,
                  }}
                >
                  Аа
                </Text>
                <Text
                  style={{
                    fontSize: baseSizes.caption,
                    color: active ? colors.accentDark : colors.textSecondary,
                    fontWeight: active ? '600' : '400',
                    textAlign: 'center',
                  }}
                >
                  {t(labelKey)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Язык */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
          {t('settings_language').toUpperCase()}
        </Text>
        <View style={s.langRow}>
          {(['ru', 'en'] as AppLanguage[]).map((lang) => {
            const active = currentLang === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[
                  s.langBtn,
                  {
                    backgroundColor: active ? colors.accent : colors.cardAlt,
                    borderColor: active ? colors.accent : colors.border,
                    flex: 1,
                  },
                ]}
                onPress={() => changeLang(lang)}
              >
                <Text
                  style={{
                    color: active ? '#fff' : colors.textPrimary,
                    fontWeight: '700',
                    fontSize: baseSizes.body * scale,
                  }}
                >
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Уведомления */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
          {t('settings_notifications').toUpperCase()}
        </Text>
        <SettingsRow
          label={t('settings_notifications')}
          colors={colors}
          scale={scale}
          onPress={() => {}}
        />

        {/* О приложении */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
          {t('settings_about').toUpperCase()}
        </Text>
        <View style={[s.card, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          <Text style={{ color: colors.textSecondary, fontSize: baseSizes.body * scale, lineHeight: 22 }}>
            {t('settings_about_storage')}
          </Text>
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.row}>
            <Text style={{ color: colors.textSecondary, fontSize: baseSizes.body * scale }}>
              {t('settings_about_version')}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: baseSizes.body * scale }}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({ label, colors, scale, onPress }: { label: string; colors: any; scale: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.settingsRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale }}>{label}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontWeight: '700', margin: 20 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionLabel: { fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  fontRow: { flexDirection: 'row', gap: 10 },
  fontCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  langRow: { flexDirection: 'row', gap: 10 },
  langBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  divider: { height: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
});
