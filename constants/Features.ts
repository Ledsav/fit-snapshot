/**
 * Feature Flag System for FitSnapshot
 *
 * This file defines all feature flags and subscription tiers for the app.
 * Used to control access to premium features and implement monetization.
 */

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

// Feature Limits
export const FREE_TIER_LIMITS = {
  MAX_PHOTOS: 50,
  MAX_COMPARISONS_PER_DAY: 5,
  MAX_EXPORTS_PER_MONTH: 2,
};

export const PREMIUM_TIER_LIMITS = {
  MAX_PHOTOS: -1, // Unlimited
  MAX_COMPARISONS_PER_DAY: -1, // Unlimited
  MAX_EXPORTS_PER_MONTH: -1, // Unlimited
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

// Pricing Configuration
export const PRICING = {
  monthly: {
    price: 6.99,
    priceId: 'monthly_subscription', // Will be replaced with actual store IDs
    savings: 0,
  },
  annual: {
    price: 49.99,
    priceId: 'annual_subscription',
    savings: 40, // 40% savings
    monthlyEquivalent: 4.16,
  },
  lifetime: {
    price: 99.99,
    priceId: 'lifetime_purchase',
    savings: 0,
  },
};
