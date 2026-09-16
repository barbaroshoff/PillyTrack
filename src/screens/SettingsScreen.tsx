import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import type { ThemeMode } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes, fontScales } from '../theme/typography';
import { setLanguage, getLanguage } from '../i18n';
import { useSubscription } from '../context/SubscriptionContext';
import { getAutoExportEnabled, setAutoExportEnabled } from '../services/autoExport';
import { shareIntakeHistoryPdf, getLastExportInfo, buildReportLabels } from '../services/pdfExport';
import type { LastExportInfo } from '../services/pdfExport';
import type { FontScaleKey } from '../theme';
import type { AppLanguage } from '../i18n';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PLAN_LABEL_KEY: Record<string, string> = {
  monthly: 'paywall_plan_monthly',
  semiannual: 'paywall_plan_semiannual',
  annual: 'paywall_plan_annual',
};

const LANGUAGES: { code: AppLanguage; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'el', label: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
  { code: 'bg', label: 'Български', flag: '🇧🇬' },
  { code: 'da', label: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', label: 'Suomi', flag: '🇫🇮' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
];

const FONT_PRESETS: { key: FontScaleKey; labelKey: string; aaSize: number }[] = [
  { key: 'normal', labelKey: 'settings_font_normal', aaSize: 20 },
  { key: 'large', labelKey: 'settings_font_large', aaSize: 23 },
  { key: 'xlarge', labelKey: 'settings_font_xlarge', aaSize: 26 },
];

const THEME_OPTIONS: { key: ThemeMode; labelKey: string; icon: string }[] = [
  { key: 'system', labelKey: 'settings_theme_system', icon: '⚙️' },
  { key: 'light', labelKey: 'settings_theme_light', icon: '☀️' },
  { key: 'dark', labelKey: 'settings_theme_dark', icon: '🌙' },
];

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { scale, fontScale, setFontScale } = useFontScale();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { isSubscribed, subscriptionInfo } = useSubscription();
  const [langExpanded, setLangExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [autoExportOn, setAutoExportOn] = useState(false);
  const [lastExport, setLastExport] = useState<LastExportInfo | null>(null);

  const refreshExportState = useCallback(async () => {
    const [enabled, last] = await Promise.all([getAutoExportEnabled(), getLastExportInfo()]);
    setAutoExportOn(enabled);
    setLastExport(last);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshExportState();
    }, [refreshExportState]),
  );

  const handleExportPdf = async () => {
    if (!isSubscribed) {
      navigation.navigate('Paywall');
      return;
    }
    setExporting(true);
    try {
      await shareIntakeHistoryPdf(buildReportLabels(t, i18n.language));
      await refreshExportState();
    } catch {
      Alert.alert(t('error'), t('export_pdf_error'));
    } finally {
      setExporting(false);
    }
  };

  const handleToggleAutoExport = async (value: boolean) => {
    if (!isSubscribed) {
      navigation.navigate('Paywall');
      return;
    }
    setAutoExportOn(value);
    await setAutoExportEnabled(value);
  };

  const currentLang = getLanguage();
  const currentLangInfo = LANGUAGES.find((l) => l.code === currentLang);

  const changeLang = async (lang: AppLanguage) => {
    await setLanguage(lang);
    await i18n.changeLanguage(lang);
    setLangExpanded(false);
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <Text style={[s.heading, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
        {t('settings')}
      </Text>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Тема оформления */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          {t('settings_theme').toUpperCase()}
        </Text>
        <View style={s.fontRow}>
          {THEME_OPTIONS.map(({ key, labelKey, icon }) => {
            const active = themeMode === key;
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
                onPress={() => setThemeMode(key)}
              >
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{icon}</Text>
                <Text
                  style={{
                    fontSize: baseSizes.caption * scale,
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

        {/* Подписка */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
          {t('settings_subscription').toUpperCase()}
        </Text>
        <TouchableOpacity
          style={[
            s.subCard,
            {
              backgroundColor: isSubscribed ? colors.accentLight : colors.cardAlt,
              borderColor: isSubscribed ? colors.accent : colors.border,
            },
          ]}
          onPress={() => navigation.navigate('Paywall')}
          activeOpacity={0.85}
        >
          <View style={{ flex: 1 }}>
            {isSubscribed && subscriptionInfo ? (
              <>
                <Text style={{ color: colors.accentDark, fontSize: baseSizes.body * scale, fontWeight: '700' }}>
                  💎 {t('paywall_premium_label')} · {t(PLAN_LABEL_KEY[subscriptionInfo.plan] ?? 'paywall_plan_monthly')}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 4 }}>
                  {t('settings_subscription_active', {
                    date: new Date(subscriptionInfo.expiresAt).toLocaleDateString(i18n.language, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                  })}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale, fontWeight: '700' }}>
                  {t('settings_subscription_none')}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 4 }}>
                  {t('settings_subscription_get')}
                </Text>
              </>
            )}
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
        </TouchableOpacity>

        {/* Размер шрифта */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
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
        <TouchableOpacity
          style={[s.settingsRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
          onPress={() => setLangExpanded((v) => !v)}
        >
          <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale }}>
            {t('settings_language')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: colors.textSecondary, fontSize: baseSizes.body * scale }}>
              {currentLangInfo ? `${currentLangInfo.flag} ${currentLangInfo.label}` : ''}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>{langExpanded ? '⌃' : '›'}</Text>
          </View>
        </TouchableOpacity>

        {langExpanded && (
          <View style={[s.langGrid, { marginTop: 10 }]}>
            {LANGUAGES.map(({ code, label, flag }) => {
              const active = currentLang === code;
              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    s.langBtn,
                    {
                      backgroundColor: active ? colors.accent : colors.cardAlt,
                      borderColor: active ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => changeLang(code)}
                >
                  <Text style={{ fontSize: 22 }}>{flag}</Text>
                  <Text
                    style={{
                      color: active ? '#fff' : colors.textPrimary,
                      fontWeight: '600',
                      fontSize: baseSizes.caption * scale,
                      marginTop: 4,
                      textAlign: 'center',
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Уведомления */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
          {t('settings_notifications').toUpperCase()}
        </Text>
        <SettingsRow
          label={t('settings_notifications')}
          colors={colors}
          scale={scale}
          onPress={() => Linking.openSettings()}
        />

        {/* Общий доступ */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
          {t('settings_share').toUpperCase()}
        </Text>
        <SettingsRow
          label={`✦ ${t('settings_share_owner')}`}
          colors={colors}
          scale={scale}
          onPress={() => navigation.navigate(isSubscribed ? 'Share' : 'Paywall')}
        />
        <View style={{ height: 8 }} />
        <SettingsRow
          label={t('settings_share_viewer')}
          colors={colors}
          scale={scale}
          onPress={() => navigation.navigate('ViewShared')}
        />

        {/* Экспорт */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 24 }]}>
          {t('settings_export').toUpperCase()}
        </Text>
        <TouchableOpacity
          style={[s.settingsRow, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
          onPress={handleExportPdf}
          disabled={exporting}
        >
          <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale }}>
            ✦ {t('settings_export_pdf')}
          </Text>
          {exporting ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 8 }} />

        <View
          style={[
            s.settingsRow,
            { backgroundColor: colors.cardAlt, borderColor: colors.border, alignItems: 'flex-start' },
          ]}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ color: colors.textPrimary, fontSize: baseSizes.body * scale }}>
              ✦ {t('settings_auto_export')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale, marginTop: 4 }}>
              {t('settings_auto_export_desc')}
            </Text>
          </View>
          <Switch
            value={autoExportOn}
            onValueChange={handleToggleAutoExport}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>

        <Text
          style={{
            color: colors.textMuted,
            fontSize: baseSizes.caption * scale,
            marginTop: 8,
            paddingHorizontal: 4,
          }}
        >
          {lastExport
            ? t('settings_last_export', {
                date: new Date(lastExport.at).toLocaleString(i18n.language),
                filename: lastExport.filename,
              })
            : t('settings_last_export_none')}
        </Text>

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
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 8,
  },
  fontRow: { flexDirection: 'row', gap: 10 },
  fontCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  langBtn: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '22%',
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
