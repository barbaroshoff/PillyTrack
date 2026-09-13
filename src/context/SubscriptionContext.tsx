import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedicationsCount } from '../db/medications';
import { getActiveCoursesCount } from '../db/courses';

// ─── Лимиты бесплатного тира ───────────────────────────────────────────────
export const FREE_COURSES_LIMIT = 2;
export const FREE_MEDS_LIMIT = 10;

const STORAGE_KEY = '@pillytrack_subscribed';

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

// ─── Types ──────────────────────────────────────────────────────────────────
export type LimitReason = 'courses' | 'medications' | null;

interface LimitCheckResult {
  allowed: boolean;
  reason: LimitReason;
}

interface SubscriptionContextValue {
  isSubscribed: boolean;
  isLoading: boolean;
  checkLimits: () => Promise<LimitCheckResult>;
  purchase: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (RC_ENABLED) {
        // TODO: RevenueCat init + getCustomerInfo
        // Purchases.configure({ apiKey: RC_KEY });
        // const info = await Purchases.getCustomerInfo();
        // setIsSubscribed(!!info.entitlements.active['premium']);
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        setIsSubscribed(stored === 'true');
      }
      setIsLoading(false);
    })();
  }, []);

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

  const purchase = useCallback(async (): Promise<boolean> => {
    if (RC_ENABLED) {
      // TODO: RevenueCat purchase
      // const offerings = await Purchases.getOfferings();
      // const pkg = offerings.current?.availablePackages.find(p => p.packageType === 'MONTHLY');
      // if (!pkg) return false;
      // const { customerInfo } = await Purchases.purchasePackage(pkg);
      // const ok = !!customerInfo.entitlements.active['premium'];
      // if (ok) setIsSubscribed(true);
      // return ok;
      return false;
    } else {
      // Dev-режим: симулируем успешную покупку
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
      setIsSubscribed(true);
      return true;
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (RC_ENABLED) {
      // TODO: RevenueCat restore
      // const info = await Purchases.restorePurchases();
      // const ok = !!info.entitlements.active['premium'];
      // if (ok) setIsSubscribed(true);
      // return ok;
      return false;
    } else {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, isLoading, checkLimits, purchase, restorePurchases }}>
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
