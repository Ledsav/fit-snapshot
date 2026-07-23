/**
 * Purchase Service — RevenueCat wrapper.
 *
 * mapCustomerInfoToStatus is a pure function (unit-tested). The rest are thin
 * async wrappers over the RevenueCat SDK. RevenueCat is the source of truth for
 * premium status; featureFlagService caches the mapped result.
 */
import type { CustomerInfo } from 'react-native-purchases';
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
