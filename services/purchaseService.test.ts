jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    isAnonymous: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));

import Purchases from 'react-native-purchases';
import { mapCustomerInfoToStatus, purchasePackage, restorePurchases, resetIdentity } from './purchaseService';
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

const activeSubInfo = {
  entitlements: { active: { premium: { expirationDate: '2027-01-01T00:00:00Z', willRenew: true, originalPurchaseDate: '2026-01-01T00:00:00Z' } } },
} as any;

describe('purchasePackage', () => {
  it('returns mapped status on success', async () => {
    (Purchases.purchasePackage as jest.Mock).mockResolvedValueOnce({ customerInfo: activeSubInfo });
    const r = await purchasePackage({} as any);
    expect(r.userCancelled).toBe(false);
    expect(r.status?.isPremium).toBe(true);
  });

  it('flags user cancellation without an error', async () => {
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({ userCancelled: true });
    const r = await purchasePackage({} as any);
    expect(r.userCancelled).toBe(true);
    expect(r.status).toBeNull();
    expect(r.error).toBeUndefined();
  });

  it('returns an error message on failure', async () => {
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({ message: 'boom' });
    const r = await purchasePackage({} as any);
    expect(r.userCancelled).toBe(false);
    expect(r.error).toBe('boom');
  });
});

describe('restorePurchases', () => {
  it('maps restored customerInfo to status', async () => {
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce(activeSubInfo);
    const s = await restorePurchases();
    expect(s.isPremium).toBe(true);
  });
});

describe('resetIdentity', () => {
  it('does NOT call logOut when the user is already anonymous', async () => {
    (Purchases.isAnonymous as jest.Mock).mockResolvedValueOnce(true);
    (Purchases.getCustomerInfo as jest.Mock).mockResolvedValueOnce(makeInfo(null));
    const s = await resetIdentity();
    expect(Purchases.logOut).not.toHaveBeenCalled();
    expect(s.isPremium).toBe(false);
  });

  it('calls logOut when the user is identified', async () => {
    (Purchases.isAnonymous as jest.Mock).mockResolvedValueOnce(false);
    (Purchases.logOut as jest.Mock).mockResolvedValueOnce(makeInfo(null));
    const s = await resetIdentity();
    expect(Purchases.logOut).toHaveBeenCalled();
    expect(s.isPremium).toBe(false);
  });
});
