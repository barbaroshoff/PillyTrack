import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedicationsCount } from '../db/medications';
import { getActiveCoursesCount } from '../db/courses';

// ─── Лимиты бесплатного тира ───────────────────────────────────────────────
export const FREE_COURSES_LIMIT = 2;
export const FREE_MEDS_LIMIT = 10;

const STORAGE_KEY = '@pillytrack_subscription';

// ─── RevenueCat (подключается при development build) ───────────────────────
// Когда будете делать production build:
//   1. npx expo install react-native-purchases
//   2. Раскомментировать import ниже
//   3. Добавить ключи в .env: EXPO_PUBLIC_RC_IOS_KEY, EXPO_PUBLIC_RC_ANDROID_KEY
//   4. Удалить mock-логику из purchase() и restorePurchases()
//
// import Purchases, { LOG_LEVEL } from 'react-native-purchases';
// const RC_KEY = Platform.OS === 'ios'
//   ? process.env.EXPO_PUBLIC_RC_IOS_KEY ?? ''
//   : process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';
// const RC_ENABLED = RC_KEY.length > 0;

const RC_ENABLED = false; // ← поменять на true после подключения RevenueCat

// ─── Тарифы ─────────────────────────────────────────────────────────────────
export type SubscriptionPlan = 'monthly' | 'semiannual' | 'annual';

export const MONTHLY_PRICE = 1.99;

const PLAN_MONTHS: Record<SubscriptionPlan, number> = {
  monthly: 1,
  semiannual: 6,
  annual: 12,
};

// Скидка от базовой месячной цены — чем длиннее срок, тем выгоднее
const PLAN_DISCOUNT: Record<SubscriptionPlan, number> = {
  monthly: 0,
  semiannual: 0.15,
  annual: 0.2,
};

export interface PlanPricing {
  months: number;
  discount: number;
  totalPrice: number;
  perMonthPrice: number;
}

export function getPlanPricing(plan: SubscriptionPlan): PlanPricing {
  const months = PLAN_MONTHS[plan];
  const discount = PLAN_DISCOUNT[plan];
  const totalPrice = MONTHLY_PRICE * months * (1 - discount);
  return { months, discount, totalPrice, perMonthPrice: totalPrice / months };
}

// ─── Types ──────────────────────────────────────────────────────────────────
export type LimitReason = 'courses' | 'medications' | null;

interface LimitCheckResult {
  allowed: boolean;
  reason: LimitReason;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  expiresAt: string; // ISO date
}

interface StoredSubscription {
  plan: SubscriptionPlan;
  expiresAt: string;
}

interface SubscriptionContextValue {
  isSubscribed: boolean;
  isLoading: boolean;
  subscriptionInfo: SubscriptionInfo | null;
  checkLimits: () => Promise<LimitCheckResult>;
  purchase: (plan: SubscriptionPlan) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyStored = useCallback((stored: StoredSubscription | null) => {
    if (stored && new Date(stored.expiresAt).getTime() > Date.now()) {
      setIsSubscribed(true);
      setSubscriptionInfo({ plan: stored.plan, expiresAt: stored.expiresAt });
    } else {
      setIsSubscribed(false);
      setSubscriptionInfo(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      if (RC_ENABLED) {
        // TODO: RevenueCat init + getCustomerInfo
        // Purchases.configure({ apiKey: RC_KEY });
        // const info = await Purchases.getCustomerInfo();
        // const entitlement = info.entitlements.active['premium'];
        // setIsSubscribed(!!entitlement);
        // if (entitlement?.expirationDate) {
        //   setSubscriptionInfo({ plan: 'monthly', expiresAt: entitlement.expirationDate });
        // }
      } else {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        applyStored(raw ? (JSON.parse(raw) as StoredSubscription) : null);
      }
      setIsLoading(false);
    })();
  }, [applyStored]);

  const checkLimits = useCallback(async (): Promise<LimitCheckResult> => {
    if (isSubscribed) return { allowed: true, reason: null };
    const [coursesCount, medsCount] = await Promise.all([
      getActiveCoursesCount(),
      getMedicationsCount(),
    ]);
    if (coursesCount >= FREE_COURSES_LIMIT) return { allowed: false, reason: 'courses' };
    if (medsCount >= FREE_MEDS_LIMIT) return { allowed: false, reason: 'medications' };
    return { allowed: true, reason: null };
  }, [isSubscribed]);

  const purchase = useCallback(async (plan: SubscriptionPlan): Promise<boolean> => {
    if (RC_ENABLED) {
      // TODO: RevenueCat purchase
      // const offerings = await Purchases.getOfferings();
      // const pkg = offerings.current?.availablePackages.find(p => p.identifier === plan);
      // if (!pkg) return false;
      // const { customerInfo } = await Purchases.purchasePackage(pkg);
      // const entitlement = customerInfo.entitlements.active['premium'];
      // const ok = !!entitlement;
      // if (ok) applyStored({ plan, expiresAt: entitlement.expirationDate ?? '' });
      // return ok;
      return false;
    } else {
      // Dev-режим: симулируем успешную покупку
      const expiresAt = addMonths(new Date(), PLAN_MONTHS[plan]).toISOString();
      const stored: StoredSubscription = { plan, expiresAt };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      applyStored(stored);
      return true;
    }
  }, [applyStored]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (RC_ENABLED) {
      // TODO: RevenueCat restore
      // const info = await Purchases.restorePurchases();
      // const entitlement = info.entitlements.active['premium'];
      // const ok = !!entitlement;
      // if (ok) applyStored({ plan: 'monthly', expiresAt: entitlement.expirationDate ?? '' });
      // return ok;
      return false;
    } else {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as StoredSubscription) : null;
      applyStored(stored);
      return !!stored && new Date(stored.expiresAt).getTime() > Date.now();
    }
  }, [applyStored]);

  return (
    <SubscriptionContext.Provider
      value={{ isSubscribed, isLoading, subscriptionInfo, checkLimits, purchase, restorePurchases }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used inside SubscriptionProvider');
  return ctx;
}
