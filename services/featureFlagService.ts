/**
 * Feature Flag Service
 *
 * Centralized service for managing feature flags and access control.
 * Supports local configuration with remote config fallback.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Feature,
  FeatureCategory,
  FeatureConfig,
  SubscriptionTier,
  UserSubscriptionStatus,
  FeatureUsage,
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
} from '@/constants/Features';
import featureConfigData from '@/config/features.json';

const STORAGE_KEYS = {
  SUBSCRIPTION_STATUS: '@fitsnapshot:subscription_status',
  FEATURE_USAGE: '@fitsnapshot:feature_usage',
  REMOTE_CONFIG: '@fitsnapshot:remote_config',
  LAST_CONFIG_FETCH: '@fitsnapshot:last_config_fetch',
};

class FeatureFlagService {
  private localConfig: typeof featureConfigData = featureConfigData;
  private remoteConfig: typeof featureConfigData | null = null;
  private subscriptionStatus: UserSubscriptionStatus | null = null;
  private featureUsage: FeatureUsage | null = null;

  /**
   * Initialize the service - load saved data
   */
  async initialize(): Promise<void> {
    await Promise.all([
      this.loadSubscriptionStatus(),
      this.loadFeatureUsage(),
      this.loadRemoteConfig(),
    ]);
  }

  /**
   * Get active configuration (remote takes precedence over local)
   */
  private getActiveConfig(): typeof featureConfigData {
    return this.remoteConfig || this.localConfig;
  }

  /**
   * Load subscription status from storage
   */
  private async loadSubscriptionStatus(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATUS);
      if (data) {
        this.subscriptionStatus = JSON.parse(data);
      } else {
        // Default to free tier
        this.subscriptionStatus = {
          tier: SubscriptionTier.FREE,
          isPremium: false,
          isLifetime: false,
        };
      }
    } catch (error) {
      console.error('Error loading subscription status:', error);
      this.subscriptionStatus = {
        tier: SubscriptionTier.FREE,
        isPremium: false,
        isLifetime: false,
      };
    }
  }

  /**
   * Load feature usage tracking from storage
   */
  private async loadFeatureUsage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FEATURE_USAGE);
      if (data) {
        this.featureUsage = JSON.parse(data);
        // Reset counters if date has changed
        this.resetUsageIfNeeded();
      } else {
        this.featureUsage = {
          photoCount: 0,
          comparisonsToday: 0,
          exportsThisMonth: 0,
          lastResetDate: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error loading feature usage:', error);
      this.featureUsage = {
        photoCount: 0,
        comparisonsToday: 0,
        exportsThisMonth: 0,
        lastResetDate: new Date().toISOString(),
      };
    }
  }

  /**
   * Load remote config from storage (if previously fetched)
   */
  private async loadRemoteConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMOTE_CONFIG);
      if (data) {
        this.remoteConfig = JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading remote config:', error);
    }
  }

  /**
   * Fetch remote configuration (placeholder for future implementation)
   */
  async fetchRemoteConfig(): Promise<void> {
    const config = this.getActiveConfig();
    if (!config.remoteConfigUrl) {
      return; // No remote URL configured
    }

    try {
      // TODO: Implement actual API call when backend is ready
      // const response = await fetch(config.remoteConfigUrl);
      // const remoteData = await response.json();
      // this.remoteConfig = remoteData;
      // await AsyncStorage.setItem(STORAGE_KEYS.REMOTE_CONFIG, JSON.stringify(remoteData));
      // await AsyncStorage.setItem(STORAGE_KEYS.LAST_CONFIG_FETCH, new Date().toISOString());
      console.log('Remote config fetch not yet implemented');
    } catch (error) {
      console.error('Error fetching remote config:', error);
    }
  }

  /**
   * Reset daily/monthly usage counters if needed
   */
  private resetUsageIfNeeded(): void {
    if (!this.featureUsage) return;

    const lastReset = new Date(this.featureUsage.lastResetDate);
    const now = new Date();

    // Reset daily counters
    if (lastReset.toDateString() !== now.toDateString()) {
      this.featureUsage.comparisonsToday = 0;
    }

    // Reset monthly counters
    if (
      lastReset.getMonth() !== now.getMonth() ||
      lastReset.getFullYear() !== now.getFullYear()
    ) {
      this.featureUsage.exportsThisMonth = 0;
    }

    this.featureUsage.lastResetDate = now.toISOString();
    this.saveFeatureUsage();
  }

  /**
   * Save subscription status to storage
   */
  private async saveSubscriptionStatus(): Promise<void> {
    try {
      if (this.subscriptionStatus) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SUBSCRIPTION_STATUS,
          JSON.stringify(this.subscriptionStatus)
        );
      }
    } catch (error) {
      console.error('Error saving subscription status:', error);
    }
  }

  /**
   * Save feature usage to storage
   */
  private async saveFeatureUsage(): Promise<void> {
    try {
      if (this.featureUsage) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.FEATURE_USAGE,
          JSON.stringify(this.featureUsage)
        );
      }
    } catch (error) {
      console.error('Error saving feature usage:', error);
    }
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): UserSubscriptionStatus {
    return (
      this.subscriptionStatus || {
        tier: SubscriptionTier.FREE,
        isPremium: false,
        isLifetime: false,
      }
    );
  }

  /**
   * Update subscription status (will be called by payment service)
   */
  async updateSubscriptionStatus(
    status: Partial<UserSubscriptionStatus>
  ): Promise<void> {
    this.subscriptionStatus = {
      ...this.getSubscriptionStatus(),
      ...status,
    };
    await this.saveSubscriptionStatus();
  }

  /**
   * Adopt the subscription status resolved by RevenueCat (the source of truth)
   * and persist it as an offline cache.
   */
  async syncFromRevenueCat(status: UserSubscriptionStatus): Promise<void> {
    this.subscriptionStatus = status;
    await this.saveSubscriptionStatus();
  }

  /**
   * Check if user has premium access
   */
  isPremiumUser(): boolean {
    const status = this.getSubscriptionStatus();

    // Check if subscription is active
    if (status.isLifetime) return true;
    if (!status.isPremium) return false;

    // Check expiration date
    if (status.expiresAt) {
      const expiryDate = new Date(status.expiresAt);
      return expiryDate > new Date();
    }

    return status.isPremium;
  }

  /**
   * Check if a specific feature is available to the user
   */
  hasFeatureAccess(featureKey: Feature): boolean {
    const config = this.getActiveConfig();
    const feature = config.features[featureKey];

    if (!feature) {
      console.warn(`Feature not found: ${featureKey}`);
      return false;
    }

    // Check if feature is enabled globally
    if (!feature.enabled) return false;

    // Check if feature requires premium
    if (feature.requiredTier === 'premium') {
      return this.isPremiumUser();
    }

    // Free tier features are always accessible
    return true;
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(featureKey: Feature): FeatureConfig | null {
    const config = this.getActiveConfig();
    const feature = config.features[featureKey];

    if (!feature) return null;

    return feature as FeatureConfig;
  }

  /**
   * Get all features by category
   */
  getFeaturesByCategory(category: FeatureCategory): FeatureConfig[] {
    const config = this.getActiveConfig();
    return Object.values(config.features)
      .filter((f) => f.category === category)
      .map((f) => f as FeatureConfig);
  }

  /**
   * Get current feature usage
   */
  getFeatureUsage(): FeatureUsage {
    return (
      this.featureUsage || {
        photoCount: 0,
        comparisonsToday: 0,
        exportsThisMonth: 0,
        lastResetDate: new Date().toISOString(),
      }
    );
  }

  /**
   * Check if user can add more photos
   */
  canAddPhoto(): { allowed: boolean; reason?: string; limit?: number } {
    if (this.isPremiumUser()) {
      return { allowed: true };
    }

    const usage = this.getFeatureUsage();
    const limit = FREE_TIER_LIMITS.MAX_PHOTOS;

    if (usage.photoCount >= limit) {
      return {
        allowed: false,
        reason: `You've reached the free tier limit of ${limit} photos. Upgrade to Premium for unlimited storage.`,
        limit,
      };
    }

    return { allowed: true, limit };
  }

  /**
   * Increment photo count
   */
  async incrementPhotoCount(): Promise<void> {
    if (!this.featureUsage) return;

    this.featureUsage.photoCount += 1;
    await this.saveFeatureUsage();
  }

  /**
   * Decrement photo count (when photo is deleted)
   */
  async decrementPhotoCount(): Promise<void> {
    if (!this.featureUsage) return;

    this.featureUsage.photoCount = Math.max(0, this.featureUsage.photoCount - 1);
    await this.saveFeatureUsage();
  }

  /**
   * Check if user can make a comparison
   */
  canMakeComparison(): { allowed: boolean; reason?: string; limit?: number } {
    if (this.isPremiumUser()) {
      return { allowed: true };
    }

    const usage = this.getFeatureUsage();
    const limit = FREE_TIER_LIMITS.MAX_COMPARISONS_PER_DAY;

    if (usage.comparisonsToday >= limit) {
      return {
        allowed: false,
        reason: `You've used all ${limit} comparisons for today. Upgrade to Premium for unlimited comparisons.`,
        limit,
      };
    }

    return { allowed: true, limit };
  }

  /**
   * Increment comparison count
   */
  async incrementComparisonCount(): Promise<void> {
    if (!this.featureUsage) return;

    this.featureUsage.comparisonsToday += 1;
    await this.saveFeatureUsage();
  }

  /**
   * Check if user can export
   */
  canExport(): { allowed: boolean; reason?: string; limit?: number } {
    if (this.isPremiumUser()) {
      return { allowed: true };
    }

    const usage = this.getFeatureUsage();
    const limit = FREE_TIER_LIMITS.MAX_EXPORTS_PER_MONTH;

    if (usage.exportsThisMonth >= limit) {
      return {
        allowed: false,
        reason: `You've used all ${limit} exports for this month. Upgrade to Premium for unlimited exports.`,
        limit,
      };
    }

    return { allowed: true, limit };
  }

  /**
   * Increment export count
   */
  async incrementExportCount(): Promise<void> {
    if (!this.featureUsage) return;

    this.featureUsage.exportsThisMonth += 1;
    await this.saveFeatureUsage();
  }

  /**
   * Get storage usage percentage (for free users)
   */
  getStorageUsagePercentage(): number {
    if (this.isPremiumUser()) return 0; // Unlimited

    const usage = this.getFeatureUsage();
    const limit = FREE_TIER_LIMITS.MAX_PHOTOS;
    return Math.round((usage.photoCount / limit) * 100);
  }

  /**
   * Reset to free tier (for testing or subscription cancellation)
   */
  async resetToFreeTier(): Promise<void> {
    this.subscriptionStatus = {
      tier: SubscriptionTier.FREE,
      isPremium: false,
      isLifetime: false,
    };
    await this.saveSubscriptionStatus();
  }

  /**
   * Set premium status (for testing - will be replaced by actual purchase flow)
   */
  async setTestPremiumStatus(isPremium: boolean): Promise<void> {
    if (isPremium) {
      await this.updateSubscriptionStatus({
        tier: SubscriptionTier.PREMIUM,
        isPremium: true,
        isLifetime: false,
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        autoRenew: true,
      });
    } else {
      await this.resetToFreeTier();
    }
  }
}

// Export singleton instance
export default new FeatureFlagService();
