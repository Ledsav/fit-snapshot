/**
 * User Context
 *
 * Manages user subscription status and feature access throughout the app.
 * Provides hooks for checking premium status and feature availability.
 */

import {
    Feature,
    FeatureUsage,
    SubscriptionTier,
    UserSubscriptionStatus,
} from '@/constants/Features';
import { useAuth } from '@/context/AuthContext';
import featureFlagService from '@/services/featureFlagService';
import {
    addStatusListener,
    configurePurchases,
    fetchStatus,
    identify,
    resetIdentity,
    restorePurchases as rcRestore,
} from '@/services/purchaseService';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

interface UserContextType {
  
  subscriptionStatus: UserSubscriptionStatus;
  isPremium: boolean;
  isLifetime: boolean;

  
  hasFeatureAccess: (feature: Feature) => boolean;
  canAddPhoto: () => { allowed: boolean; reason?: string; limit?: number };
  canMakeComparison: () => { allowed: boolean; reason?: string; limit?: number };
  canExport: () => { allowed: boolean; reason?: string; limit?: number };

  
  featureUsage: FeatureUsage;
  storageUsagePercentage: number;

  
  incrementPhotoCount: () => Promise<void>;
  decrementPhotoCount: () => Promise<void>;
  incrementComparisonCount: () => Promise<void>;
  incrementExportCount: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;


  setTestPremiumStatus: (isPremium: boolean) => Promise<void>;


  restorePurchases: () => Promise<{ isPremium: boolean }>;


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
  const [isConfigured, setIsConfigured] = useState(false);
  const { user } = useAuth();


  useEffect(() => {
    initializeUserContext();
  }, []);

  const initializeUserContext = async () => {
    setIsLoading(true);
    try {
      // 1. Load cached status first (instant, offline-safe).
      await featureFlagService.initialize();
      await refreshSubscriptionStatus();

      // 2. Configure RevenueCat and adopt the real status.
      if (RC_ANDROID_KEY) {
        configurePurchases(RC_ANDROID_KEY);
        setIsConfigured(true);
        try {
          const status = await fetchStatus();
          await featureFlagService.syncFromRevenueCat(status);
          await refreshSubscriptionStatus();
        } catch (e) {
          console.warn('RevenueCat fetch failed, using cached status', e);
        }
      }
    } catch (error) {
      console.error('Error initializing user context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!RC_ANDROID_KEY || !isConfigured) return;
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = addStatusListener(async (status) => {
        await featureFlagService.syncFromRevenueCat(status);
        await refreshSubscriptionStatus();
      });
    } catch (e) {
      console.warn('RevenueCat status listener registration failed', e);
    }
    return unsubscribe;
  }, [isConfigured]);

  useEffect(() => {
    if (!RC_ANDROID_KEY || !isConfigured) return;
    (async () => {
      try {
        const status = user?.uid ? await identify(user.uid) : await resetIdentity();
        await featureFlagService.syncFromRevenueCat(status);
        await refreshSubscriptionStatus();
      } catch (e) {
        console.warn('RevenueCat identity sync failed', e);
      }
    })();
  }, [user?.uid, isConfigured]);

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

  const restorePurchases = async (): Promise<{ isPremium: boolean }> => {
    const status = await rcRestore();
    await featureFlagService.syncFromRevenueCat(status);
    await refreshSubscriptionStatus();
    return { isPremium: status.isPremium };
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
    restorePurchases,
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
