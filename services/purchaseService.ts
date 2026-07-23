/**
 * Purchase Service — RevenueCat wrapper.
 *
 * mapCustomerInfoToStatus is a pure function (unit-tested). The rest are thin
 * async wrappers over the RevenueCat SDK. RevenueCat is the source of truth for
 * premium status; featureFlagService caches the mapped result.
 */
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { SubscriptionTier, UserSubscriptionStatus } from '@/constants/Features';

export const ENTITLEMENT_ID = 'premium';

export function mapCustomerInfoToStatus(info: CustomerInfo): UserSubscriptionStatus {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) {
    return { tier: SubscriptionTier.FREE, isPremium: false, isLifetime: false };
  }
  const isLifetime = entitlement.expirationDate == null;
  return {
    tier: isLifetime ? SubscriptionTier.LIFETIME : SubscriptionTier.PREMIUM,
    isPremium: true,
    isLifetime,
    expiresAt: entitlement.expirationDate ?? undefined,
    startedAt: entitlement.originalPurchaseDate ?? undefined,
    autoRenew: entitlement.willRenew,
  };
}

export interface PurchaseResult {
  status: UserSubscriptionStatus | null;
  userCancelled: boolean;
  error?: string;
}

export function configurePurchases(apiKey: string, appUserID?: string): void {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey, appUserID: appUserID ?? null });
}

export async function getDefaultOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: mapCustomerInfoToStatus(customerInfo), userCancelled: false };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { status: null, userCancelled: true };
    }
    return { status: null, userCancelled: false, error: e?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<UserSubscriptionStatus> {
  const info = await Purchases.restorePurchases();
  return mapCustomerInfoToStatus(info);
}

export async function fetchStatus(): Promise<UserSubscriptionStatus> {
  const info = await Purchases.getCustomerInfo();
  return mapCustomerInfoToStatus(info);
}

export async function identify(uid: string): Promise<UserSubscriptionStatus> {
  const { customerInfo } = await Purchases.logIn(uid);
  return mapCustomerInfoToStatus(customerInfo);
}

export async function resetIdentity(): Promise<UserSubscriptionStatus> {
  // RevenueCat throws if logOut is called while already anonymous (the common
  // case on a signed-out cold start). Only log out a genuinely identified user.
  if (await Purchases.isAnonymous()) {
    return fetchStatus();
  }
  const info = await Purchases.logOut();
  return mapCustomerInfoToStatus(info);
}

export function addStatusListener(cb: (status: UserSubscriptionStatus) => void): () => void {
  const listener = (info: CustomerInfo) => cb(mapCustomerInfoToStatus(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
