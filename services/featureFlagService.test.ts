jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
import AsyncStorage from '@react-native-async-storage/async-storage';
import featureFlagService from './featureFlagService';
import { SubscriptionTier } from '@/constants/Features';

describe('syncFromRevenueCat', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await featureFlagService.initialize();
  });

  it('adopts the RevenueCat status and reports premium access', async () => {
    await featureFlagService.syncFromRevenueCat({
      tier: SubscriptionTier.PREMIUM,
      isPremium: true,
      isLifetime: false,
      expiresAt: '2999-01-01T00:00:00Z',
    });
    expect(featureFlagService.isPremiumUser()).toBe(true);
    expect(featureFlagService.getSubscriptionStatus().tier).toBe(SubscriptionTier.PREMIUM);
  });

  it('persists the status to AsyncStorage as cache', async () => {
    await featureFlagService.syncFromRevenueCat({
      tier: SubscriptionTier.LIFETIME, isPremium: true, isLifetime: true,
    });
    const raw = await AsyncStorage.getItem('@fitsnapshot:subscription_status');
    expect(JSON.parse(raw as string).isLifetime).toBe(true);
  });
});
