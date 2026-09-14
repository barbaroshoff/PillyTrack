import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useFontScale } from '../context/FontScaleContext';
import { baseSizes } from '../theme/typography';
import {
  useSubscription,
  getPlanPricing,
  FREE_COURSES_LIMIT,
  FREE_MEDS_LIMIT,
} from '../context/SubscriptionContext';
import type { SubscriptionPlan } from '../context/SubscriptionContext';

const PLANS: SubscriptionPlan[] = ['monthly', 'semiannual', 'annual'];

const PLAN_LABEL_KEY: Record<SubscriptionPlan, string> = {
  monthly: 'paywall_plan_monthly',
  semiannual: 'paywall_plan_semiannual',
  annual: 'paywall_plan_annual',
};

export default function PaywallScreen() {
  const { colors } = useTheme();
  const { scale } = useFontScale();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { purchase, restorePurchases } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('annual');

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const ok = await purchase(selectedPlan);
      if (ok) {
        Alert.alert('', t('paywall_success'));
        navigation.goBack();
      } else {
        Alert.alert(t('error'), t('paywall_error'));
      }
    } catch {
      Alert.alert(t('error'), t('paywall_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const ok = await restorePurchases();
      if (ok) {
        Alert.alert('', t('paywall_success'));
        navigation.goBack();
      } else {
        Alert.alert(t('error'), t('paywall_error'));
      }
    } catch {
      Alert.alert(t('error'), t('paywall_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={{ color: colors.textMuted, fontSize: 22 }}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Заголовок */}
        <View style={s.hero}>
          <View style={[s.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Text style={s.iconEmoji}>💊</Text>
          </View>
          <Text style={[s.title, { color: colors.textPrimary, fontSize: baseSizes.title * scale * 1.2 }]}>
            {t('paywall_title')}
          </Text>
          <Text style={[s.subtitle, { color: colors.textSecondary, fontSize: baseSizes.body * scale }]}>
            {t('paywall_subtitle')}
          </Text>
        </View>

        {/* Таблица сравнения */}
        <View style={[s.table, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
          {/* Заголовок таблицы */}
          <View style={[s.tableHeader, { borderBottomColor: colors.border }]}>
            <View style={s.tableFeatureCol} />
            <View style={[s.tableCol, { backgroundColor: colors.bg }]}>
              <Text style={[s.colLabel, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
                {t('paywall_free_label')}
              </Text>
            </View>
            <View style={[s.tableCol, { backgroundColor: colors.accent }]}>
              <Text style={[s.colLabel, { color: '#fff', fontSize: baseSizes.caption * scale }]}>
                {t('paywall_premium_label')} ✦
              </Text>
            </View>
          </View>

          {/* Строки */}
          <FeatureRow
            label="💊 Курсы"
            free={`${FREE_COURSES_LIMIT}`}
            pro={t('paywall_feature_courses_pro')}
            colors={colors}
            scale={scale}
          />
          <FeatureRow
            label="📦 Препараты"
            free={`${FREE_MEDS_LIMIT}`}
            pro={t('paywall_feature_meds_pro')}
            colors={colors}
            scale={scale}
          />
          <FeatureRow
            label="🔔 Уведомления"
            free="✓"
            pro="✓"
            colors={colors}
            scale={scale}
          />
          <FeatureRow
            label="📅 Календарь"
            free="✓"
            pro="✓"
            colors={colors}
            scale={scale}
            last
          />
        </View>

        {/* Выбор тарифа */}
        <View style={s.plans}>
          {PLANS.map((plan) => {
            const pricing = getPlanPricing(plan);
            const active = selectedPlan === plan;
            const isBestValue = plan === 'annual';
            return (
              <TouchableOpacity
                key={plan}
                style={[
                  s.planCard,
                  {
                    backgroundColor: active ? colors.accentLight : colors.cardAlt,
                    borderColor: active ? colors.accent : colors.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedPlan(plan)}
                activeOpacity={0.85}
              >
                {isBestValue && (
                  <View style={[s.bestBadge, { backgroundColor: colors.accent }]}>
                    <Text style={s.bestBadgeText}>{t('paywall_best_value')}</Text>
                  </View>
                )}
                <View style={s.planRow}>
                  <View style={[s.radio, { borderColor: active ? colors.accent : colors.border }]}>
                    {active && <View style={[s.radioDot, { backgroundColor: colors.accent }]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.planLabel, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
                      {t(PLAN_LABEL_KEY[plan])}
                    </Text>
                    {pricing.discount > 0 ? (
                      <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale }}>
                        {t('paywall_per_month_short', { price: `$${pricing.perMonthPrice.toFixed(2)}` })}
                      </Text>
                    ) : (
                      <Text style={{ color: colors.textSecondary, fontSize: baseSizes.caption * scale }}>
                        {t('paywall_price')}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[s.planPrice, { color: colors.textPrimary, fontSize: baseSizes.body * scale }]}>
                      ${pricing.totalPrice.toFixed(2)}
                    </Text>
                    {pricing.discount > 0 && (
                      <View style={[s.saveBadge, { backgroundColor: colors.successLight }]}>
                        <Text style={{ color: colors.success, fontSize: baseSizes.caption * scale, fontWeight: '700' }}>
                          {t('paywall_save_percent', { percent: Math.round(pricing.discount * 100) })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Кнопка подписки */}
        <TouchableOpacity
          style={[s.btn, { backgroundColor: loading ? colors.textMuted : colors.accent }]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[s.btnText, { fontSize: baseSizes.button * scale }]}>
              {t('paywall_btn')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Восстановить / Позже */}
        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} disabled={loading}>
          <Text style={[s.restoreText, { color: colors.accent, fontSize: baseSizes.caption * scale }]}>
            {t('paywall_restore')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.laterBtn} onPress={() => navigation.goBack()}>
          <Text style={[s.laterText, { color: colors.textMuted, fontSize: baseSizes.caption * scale }]}>
            {t('paywall_later')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureRow({
  label, free, pro, colors, scale, last,
}: {
  label: string; free: string; pro: string; colors: any; scale: number; last?: boolean;
}) {
  return (
    <View style={[s.tableRow, { borderBottomColor: colors.border, borderBottomWidth: last ? 0 : 1 }]}>
      <Text style={[s.tableFeatureLabel, { color: colors.textPrimary, fontSize: baseSizes.caption * scale }]}>
        {label}
      </Text>
      <View style={s.tableCol}>
        <Text style={[s.cellText, { color: colors.textSecondary, fontSize: baseSizes.caption * scale }]}>
          {free}
        </Text>
      </View>
      <View style={s.tableCol}>
        <Text style={[s.cellText, { color: colors.accent, fontSize: baseSizes.caption * scale, fontWeight: '700' }]}>
          {pro}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: { position: 'absolute', top: 52, right: 20, zIndex: 10, padding: 8 },
  scroll: { padding: 20, paddingTop: 16, gap: 16, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 8 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 40 },
  title: { fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', lineHeight: 22 },
  table: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1 },
  tableFeatureCol: { flex: 2, padding: 12 },
  tableCol: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 },
  colLabel: { fontWeight: '700', textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  tableFeatureLabel: { flex: 2, paddingHorizontal: 12, paddingVertical: 12 },
  cellText: { textAlign: 'center' },
  plans: { gap: 10 },
  planCard: {
    borderRadius: 16,
    padding: 14,
    paddingTop: 18,
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  planLabel: { fontWeight: '700' },
  planPrice: { fontWeight: '800' },
  saveBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  btn: { padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  restoreBtn: { alignItems: 'center', paddingVertical: 8 },
  restoreText: { textDecorationLine: 'underline' },
  laterBtn: { alignItems: 'center', paddingVertical: 4 },
  laterText: {},
});
