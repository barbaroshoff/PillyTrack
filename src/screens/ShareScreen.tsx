import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share as RNShare,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import { useSubscription } from '../context/SubscriptionContext';
import { getCurrentShareIdentity, syncShare, regenerateCode } from '../services/shareSync';
import type { ShareIdentity } from '../services/shareIdentity';

export default function ShareScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t, i18n } = useTranslation();
  const ti = (key: string, opts?: Record<string, unknown>) => i18n.t(key, opts);
  const navigation = useNavigation();
  const { isSubscribed } = useSubscription();
  const [identity, setIdentity] = useState<ShareIdentity | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isSubscribed) {
      navigation.goBack();
      return;
    }
    getCurrentShareIdentity().then(setIdentity);
  }, [isSubscribed, navigation]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const next = await syncShare();
      setIdentity(next);
    } catch (e: any) {
      Alert.alert(t('error'), e.message || t('share_sync_error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleRegenerate = () => {
    Alert.alert(t('share_regenerate_title'), t('share_regenerate_body'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('share_regenerate_confirm'),
        style: 'destructive',
        onPress: async () => {
          const next = await regenerateCode();
          setIdentity(next);
        },
      },
    ]);
  };

  const handleShareNative = () => {
    if (!identity) return;
    RNShare.share({ message: ti('share_invite_message', { code: identity.code }) as string }).catch(() => {});
  };

  if (!isSubscribed || !identity) {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={s.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.accent, fontSize: baseSizes.body * scale }}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale }]}>
          {t('share_title')}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={{ color: colors.textSecondary, fontSize: baseSizes.body * scale, lineHeight: 22 }}>
          {t('share_explainer')}
        </Text>

        <View style={[s.codeCard, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text
            style={{
              color: colors.accentDark,
              fontSize: baseSizes.caption * scale,
              fontWeight: '600',
              letterSpacing: 0.5,
            }}
          >
            {t('share_code_label').toUpperCase()}
          </Text>
          <Text style={[s.code, { color: colors.accentDark, fontSize: baseSizes.title * scale * 1.5 }]}>
            {identity.code}
          </Text>
        </View>

        <TouchableOpacity style={[s.btn, { backgroundColor: colors.accent }]} onPress={handleShareNative}>
          <Text style={[s.btnText, { fontSize: baseSizes.button * scale }]}>{t('share_send')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.btn,
            { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border },
          ]}
          onPress={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={[s.btnText, { color: colors.textPrimary, fontSize: baseSizes.button * scale }]}>
              {t('share_sync_now')}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: colors.textMuted, fontSize: baseSizes.caption * scale, textAlign: 'center' }}>
          {identity.lastSyncedAt
            ? ti('share_last_synced', {
                date: new Date(identity.lastSyncedAt).toLocaleString(i18n.language, {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              })
            : t('share_never_synced')}
        </Text>

        <TouchableOpacity style={s.regenBtn} onPress={handleRegenerate}>
          <Text style={{ color: colors.danger, fontSize: baseSizes.caption * scale }}>
            {t('share_regenerate_btn')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  title: { fontWeight: '700' },
  scroll: { padding: 20, gap: 14 },
  codeCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  code: { fontWeight: '800', letterSpacing: 2 },
  btn: { padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  regenBtn: { alignItems: 'center', paddingVertical: 8, marginTop: 8 },
});
