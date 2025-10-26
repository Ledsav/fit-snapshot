/**
 * Feature Flag System for FitSnapshot
 *
 * This file defines all feature flags and subscription tiers for the app.
 * Used to control access to premium features and implement monetization.
 */

import limitsConfig from '@/config/limits.json';
import pricingConfig from '@/config/pricing.json';

// Subscription Tiers
export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  LIFETIME = 'lifetime',
}

// Feature Categories
export enum FeatureCategory {
  STORAGE = 'storage',
  ANALYTICS = 'analytics',
  COMPARISONS = 'comparisons',
  EXPORT = 'export',
  CUSTOMIZATION = 'customization',
  EXPERIENCE = 'experience',
}

// Feature Keys - All available features in the app
export enum Feature {
  // Storage Features
  UNLIMITED_PHOTOS = 'unlimited_photos',
  CLOUD_BACKUP = 'cloud_backup',

  // Analytics Features
  WEEKLY_PROGRESS_CHART = 'weekly_progress_chart',
  CONSISTENCY_HEATMAP = 'consistency_heatmap',
  ACHIEVEMENT_BADGES = 'achievement_badges',
  PROGRESS_INSIGHTS = 'progress_insights',

  // Comparison Features
  SIDE_BY_SIDE_COMPARISON = 'side_by_side_comparison',
  GRID_VIEW_COMPARISON = 'grid_view_comparison',
  PHOTO_MORPHING = 'photo_morphing',
  CUSTOM_PHOTO_SELECTION = 'custom_photo_selection',

  // Export Features
  VIDEO_EXPORT = 'video_export',
  PDF_REPORTS = 'pdf_reports',
  BULK_EXPORT = 'bulk_export',
  SOCIAL_SHARING = 'social_sharing',
  GIF_GENERATION = 'gif_generation',

  // Customization Features
  CUSTOM_CATEGORIES = 'custom_categories',
  CUSTOM_REMINDERS = 'custom_reminders',
  PREMIUM_THEMES = 'premium_themes',
  CUSTOM_WATERMARKS = 'custom_watermarks',

  // Experience Features
  AD_FREE = 'ad_free',
  PRIORITY_SUPPORT = 'priority_support',
  EARLY_ACCESS = 'early_access',
}

// Feature Limits - Loaded from config/limits.json
// You can easily modify limits by editing config/limits.json
export const FREE_TIER_LIMITS = {
  MAX_PHOTOS: limitsConfig.freeTier.maxPhotos,
  MAX_COMPARISONS_PER_DAY: limitsConfig.freeTier.maxComparisonsPerDay,
  MAX_EXPORTS_PER_MONTH: limitsConfig.freeTier.maxExportsPerMonth,
};

export const PREMIUM_TIER_LIMITS = {
  MAX_PHOTOS: limitsConfig.premiumTier.maxPhotos,
  MAX_COMPARISONS_PER_DAY: limitsConfig.premiumTier.maxComparisonsPerDay,
  MAX_EXPORTS_PER_MONTH: limitsConfig.premiumTier.maxExportsPerMonth,
};

// Feature Configuration Interface
export interface FeatureConfig {
  key: Feature;
  category: FeatureCategory;
  name: string;
  description: string;
  requiredTier: SubscriptionTier;
  enabled: boolean;
  betaOnly?: boolean;
}

// User Subscription Status Interface
export interface UserSubscriptionStatus {
  tier: SubscriptionTier;
  isPremium: boolean;
  isLifetime: boolean;
  expiresAt?: string; // ISO date string
  startedAt?: string; // ISO date string
  autoRenew?: boolean;
}

// Feature Usage Tracking Interface
export interface FeatureUsage {
  photoCount: number;
  comparisonsToday: number;
  exportsThisMonth: number;
  lastResetDate: string;
}

// Premium Benefits for UI Display
// Note: This is a factory function that takes a translation function
// to support internationalization
export const getPremiumBenefits = (t: (key: string) => string) => [
  {
    icon: 'cloud-upload-outline' as const,
    title: t('premiumBenefits.unlimitedStorageTitle'),
    description: t('premiumBenefits.unlimitedStorageDesc'),
  },
  {
    icon: 'analytics-outline' as const,
    title: t('premiumBenefits.advancedAnalyticsTitle'),
    description: t('premiumBenefits.advancedAnalyticsDesc'),
  },
  {
    icon: 'images-outline' as const,
    title: t('premiumBenefits.advancedComparisonsTitle'),
    description: t('premiumBenefits.advancedComparisonsDesc'),
  },
  {
    icon: 'download-outline' as const,
    title: t('premiumBenefits.exportShareTitle'),
    description: t('premiumBenefits.exportShareDesc'),
  },
  {
    icon: 'color-palette-outline' as const,
    title: t('premiumBenefits.premiumThemesTitle'),
    description: t('premiumBenefits.premiumThemesDesc'),
  },
  {
    icon: 'flash-off-outline' as const,
    title: t('premiumBenefits.adFreeTitle'),
    description: t('premiumBenefits.adFreeDesc'),
  },
];

// Backward compatibility: Keep PREMIUM_BENEFITS for any code that uses it directly
export const PREMIUM_BENEFITS = [
  {
    icon: 'cloud-upload-outline' as const,
    title: 'Unlimited Photo Storage',
    description: 'Store unlimited progress photos with cloud backup',
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Advanced Analytics',
    description: 'Track your progress with detailed charts and insights',
  },
  {
    icon: 'images-outline' as const,
    title: 'Advanced Comparisons',
    description: 'Side-by-side, grid view, and photo morphing',
  },
  {
    icon: 'download-outline' as const,
    title: 'Export & Share',
    description: 'Create videos, PDFs, and share your transformation',
  },
  {
    icon: 'color-palette-outline' as const,
    title: 'Premium Themes',
    description: 'Customize your experience with exclusive themes',
  },
  {
    icon: 'flash-off-outline' as const,
    title: 'Ad-Free Experience',
    description: 'Enjoy the app without any advertisements',
  },
];

// Pricing Configuration - Loaded from config/pricing.json
// You can easily modify pricing by editing config/pricing.json
export const PRICING = {
  monthly: {
    price: pricingConfig.monthly.price,
    priceId: pricingConfig.monthly.priceId,
    savings: pricingConfig.monthly.savings,
  },
  annual: {
    price: pricingConfig.annual.price,
    priceId: pricingConfig.annual.priceId,
    savings: pricingConfig.annual.savings,
    monthlyEquivalent: pricingConfig.annual.monthlyEquivalent,
  },
  lifetime: {
    price: pricingConfig.lifetime.price,
    priceId: pricingConfig.lifetime.priceId,
    savings: pricingConfig.lifetime.savings,
  },
};
