/**
 * User Context
 *
 * Manages user subscription status and feature access throughout the app.
 * Provides hooks for checking premium status and feature availability.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Feature,
  UserSubscriptionStatus,
  FeatureUsage,
  SubscriptionTier,
} from '@/constants/Features';
import featureFlagService from '@/services/featureFlagService';

interface UserContextType {
  // Subscription Status
  subscriptionStatus: UserSubscriptionStatus;
  isPremium: boolean;
  isLifetime: boolean;

  // Feature Access
  hasFeatureAccess: (feature: Feature) => boolean;
  canAddPhoto: () => { allowed: boolean; reason?: string; limit?: number };
  canMakeComparison: () => { allowed: boolean; reason?: string; limit?: number };
  canExport: () => { allowed: boolean; reason?: string; limit?: number };

  // Usage Tracking
  featureUsage: FeatureUsage;
  storageUsagePercentage: number;

  // Actions
  incrementPhotoCount: () => Promise<void>;
  decrementPhotoCount: () => Promise<void>;
  incrementComparisonCount: () => Promise<void>;
  incrementExportCount: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;

  // Testing (remove in production or gate behind dev mode)
  setTestPremiumStatus: (isPremium: boolean) => Promise<void>;

  // Loading state
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus>({
    tier: SubscriptionTier.FREE,
    isPremium: false,
    isLifetime: false,
  });
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage>({
    photoCount: 0,
    comparisonsToday: 0,
    exportsThisMonth: 0,
    lastResetDate: new Date().toISOString(),
  });
  const [storageUsagePercentage, setStorageUsagePercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize service on mount
  useEffect(() => {
    initializeUserContext();
  }, []);

  const initializeUserContext = async () => {
    setIsLoading(true);
    try {
      await featureFlagService.initialize();
      await refreshSubscriptionStatus();
    } catch (error) {
      console.error('Error initializing user context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      const status = featureFlagService.getSubscriptionStatus();
      const usage = featureFlagService.getFeatureUsage();
      const storagePercentage = featureFlagService.getStorageUsagePercentage();

      setSubscriptionStatus(status);
      setFeatureUsage(usage);
      setStorageUsagePercentage(storagePercentage);
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    }
  };

  const hasFeatureAccess = (feature: Feature): boolean => {
    return featureFlagService.hasFeatureAccess(feature);
  };

  const canAddPhoto = () => {
    return featureFlagService.canAddPhoto();
  };

  const canMakeComparison = () => {
    return featureFlagService.canMakeComparison();
  };

  const canExport = () => {
    return featureFlagService.canExport();
  };

  const incrementPhotoCount = async () => {
    await featureFlagService.incrementPhotoCount();
    await refreshSubscriptionStatus();
  };

  const decrementPhotoCount = async () => {
    await featureFlagService.decrementPhotoCount();
    await refreshSubscriptionStatus();
  };

  const incrementComparisonCount = async () => {
    await featureFlagService.incrementComparisonCount();
    await refreshSubscriptionStatus();
  };

  const incrementExportCount = async () => {
    await featureFlagService.incrementExportCount();
    await refreshSubscriptionStatus();
  };

  const setTestPremiumStatus = async (isPremium: boolean) => {
    await featureFlagService.setTestPremiumStatus(isPremium);
    await refreshSubscriptionStatus();
  };

  const value: UserContextType = {
    subscriptionStatus,
    isPremium: subscriptionStatus.isPremium,
    isLifetime: subscriptionStatus.isLifetime,
    hasFeatureAccess,
    canAddPhoto,
    canMakeComparison,
    canExport,
    featureUsage,
    storageUsagePercentage,
    incrementPhotoCount,
    decrementPhotoCount,
    incrementComparisonCount,
    incrementExportCount,
    refreshSubscriptionStatus,
    setTestPremiumStatus,
    isLoading,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

/**
 * Hook to access user context
 */
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

/**
 * Hook to check if user is premium
 */
export const useIsPremium = (): boolean => {
  const { isPremium } = useUser();
  return isPremium;
};

/**
 * Hook to check feature access
 */
export const useFeatureAccess = (feature: Feature): boolean => {
  const { hasFeatureAccess } = useUser();
  return hasFeatureAccess(feature);
};

/**
 * Hook to get storage usage
 */
export const useStorageUsage = () => {
  const { featureUsage, storageUsagePercentage, isPremium } = useUser();
  return {
    photoCount: featureUsage.photoCount,
    percentage: storageUsagePercentage,
    isPremium,
  };
};
