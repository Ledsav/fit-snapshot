import { mapCustomerInfoToStatus } from './purchaseService';
import { SubscriptionTier } from '@/constants/Features';

// Minimal CustomerInfo factory — only the fields the mapper reads.
const makeInfo = (entitlement: any) =>
  ({ entitlements: { active: entitlement ? { premium: entitlement } : {} } } as any);

describe('mapCustomerInfoToStatus', () => {
  it('returns free when no premium entitlement is active', () => {
    const s = mapCustomerInfoToStatus(makeInfo(null));
    expect(s).toEqual({ tier: SubscriptionTier.FREE, isPremium: false, isLifetime: false });
  });

  it('maps an active subscription (has expirationDate) to premium', () => {
    const s = mapCustomerInfoToStatus(
      makeInfo({ expirationDate: '2027-01-01T00:00:00Z', willRenew: true, originalPurchaseDate: '2026-01-01T00:00:00Z' })
    );
    expect(s.isPremium).toBe(true);
    expect(s.isLifetime).toBe(false);
    expect(s.tier).toBe(SubscriptionTier.PREMIUM);
    expect(s.expiresAt).toBe('2027-01-01T00:00:00Z');
    expect(s.autoRenew).toBe(true);
  });

  it('maps a lifetime entitlement (null expirationDate) to lifetime', () => {
    const s = mapCustomerInfoToStatus(
      makeInfo({ expirationDate: null, willRenew: false, originalPurchaseDate: '2026-01-01T00:00:00Z' })
    );
    expect(s.isPremium).toBe(true);
    expect(s.isLifetime).toBe(true);
    expect(s.tier).toBe(SubscriptionTier.LIFETIME);
    expect(s.expiresAt).toBeUndefined();
  });
});
