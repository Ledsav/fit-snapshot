# Feature Flags & Monetization System

## Overview

FitSnapshot now has a complete feature flag system that enables premium subscriptions and monetization. The system is production-ready and only requires payment provider integration to go live.

## What's Included

### Core Services
- **Feature Flag Service** (`services/featureFlagService.ts`)
  - Manages feature access based on subscription tier
  - Tracks usage limits (photos, comparisons, exports)
  - Supports local + remote configuration
  - Persistent storage with AsyncStorage

- **User Context** (`context/UserContext.tsx`)
  - Global subscription state management
  - React hooks for easy feature checks
  - Automatic state synchronization

### UI Components
- **FeatureGate** (`components/monetization/FeatureGate.tsx`)
  - Wraps premium features
  - Shows upgrade prompts when locked
  - Supports blur preview of content

- **PaywallModal** (`components/monetization/PaywallModal.tsx`)
  - Full-screen upgrade modal
  - Shows premium benefits
  - Displays pricing options
  - Handles purchase flow (mock for now)

- **PremiumBadge** (`components/monetization/PremiumBadge.tsx`)
  - Visual indicators for premium status
  - Multiple sizes and variants

### Configuration
- **Feature Definitions** (`config/features.json`)
  - All feature flags and requirements
  - Easy to enable/disable features
  - Supports remote config URL

- **Constants** (`constants/Features.ts`)
  - TypeScript types and interfaces
  - Feature enums
  - Pricing configuration
  - Free tier limits (50 photos)

## Features Blocked for Free Users

### 1. Storage Limit
- **Free**: 50 photos maximum
- **Premium**: Unlimited photos
- **Location**: Gallery screen, Camera screen
- **Warning**: Shows at 80% (40 photos)
- **Blocking**: Prevents adding photo at limit

### 2. Analytics & Insights
- **Blocked Features**:
  - Weekly Progress Chart
  - Consistency Heatmap
  - Achievement Badges
- **Location**: Home screen
- **Display**: Blurred preview with upgrade prompt

### 3. Advanced Comparisons (Ready to implement)
- Side-by-side comparison view
- Grid view for multiple photos
- Photo morphing animations
- Custom photo selection

### 4. Export Features (Ready to implement)
- Video export
- PDF reports
- Bulk export
- Social sharing

## Testing

### Enable Test Premium
1. Open app → Settings
2. Scroll to "Test Premium (OFF)"
3. Tap to toggle
4. Confirm activation

### Test Premium Features
1. Navigate to Home → All analytics should be visible
2. Go to Gallery → Try adding 51st photo → Should work
3. Settings → Should show "Premium Active" card

### Test Free Tier
1. Settings → Disable test premium
2. Home → Analytics should show blur + upgrade prompt
3. Gallery → Add photos until you hit limit (50)
4. Try to add 51st → Should show paywall

## Integration with Screens

### Home Screen (app/(tabs)/index.tsx)
```typescript
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { Feature } from "@/constants/Features";

// Wrap premium components
<FeatureGate feature={Feature.ACHIEVEMENT_BADGES} showPreview={true}>
  <AchievementBadges photos={photos} currentStreak={streakData.currentStreak} />
</FeatureGate>
```

### Settings Screen (app/(tabs)/settings.tsx)
```typescript
import { useUser } from "@/context/UserContext";

const { isPremium, featureUsage, setTestPremiumStatus } = useUser();

// Shows premium card if active, upgrade card if not
{isPremium ? <PremiumCard /> : <UpgradeCard />}
```

### Gallery Screen (app/(tabs)/gallery.tsx)
```typescript
import { useUser } from "@/context/UserContext";

const { storageUsagePercentage, canAddPhoto } = useUser();

// Storage warnings at 80% and 100%
{storageUsagePercentage >= 80 && <StorageWarning />}

// Check before adding photo
const pickImage = async () => {
  const check = canAddPhoto();
  if (!check.allowed) {
    setIsPaywallVisible(true);
    return;
  }
  // Continue with image picker...
};
```

### Photo Context (context/PhotoContext.tsx)
```typescript
import featureFlagService from "@/services/featureFlagService";

// Check limits before adding
const addPhoto = async (photo: Photo) => {
  const canAdd = featureFlagService.canAddPhoto();
  if (!canAdd.allowed) {
    return { success: false, error: canAdd.reason };
  }
  // Increment counter after adding
  await featureFlagService.incrementPhotoCount();
  // ...
};
```

## React Hooks

### useUser()
```typescript
const {
  isPremium,              // boolean
  isLifetime,             // boolean
  subscriptionStatus,     // SubscriptionTier
  featureUsage,           // { photoCount, comparisonsToday, exportsThisMonth }
  storageUsagePercentage, // 0-100
  hasFeatureAccess,       // (feature: Feature) => boolean
  canAddPhoto,            // () => { allowed, reason?, limit? }
  incrementPhotoCount,    // () => Promise<void>
  refreshSubscriptionStatus, // () => Promise<void>
  setTestPremiumStatus,   // (isPremium: boolean) => Promise<void>
} = useUser();
```

### useIsPremium()
```typescript
const isPremium = useIsPremium();

if (isPremium) {
  // Show premium features
}
```

### useFeatureAccess()
```typescript
const hasAccess = useFeatureAccess(Feature.WEEKLY_PROGRESS_CHART);

if (hasAccess) {
  return <WeeklyProgressChart />;
}
```

### useStorageUsage()
```typescript
const { photoCount, percentage, isPremium } = useStorageUsage();

return (
  <Text>
    {photoCount} / {isPremium ? '∞' : '50'} photos ({percentage}%)
  </Text>
);
```

## Adding New Premium Features

### 1. Define Feature in Constants
Edit `constants/Features.ts`:
```typescript
export enum Feature {
  // Add your new feature
  MY_NEW_FEATURE = 'my_new_feature',
}
```

### 2. Add to Configuration
Edit `config/features.json`:
```json
{
  "features": {
    "my_new_feature": {
      "key": "my_new_feature",
      "category": "analytics",
      "name": "My New Feature",
      "description": "Description of the feature",
      "requiredTier": "premium",
      "enabled": true,
      "betaOnly": false
    }
  }
}
```

### 3. Wrap Component with FeatureGate
```typescript
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { Feature } from "@/constants/Features";

<FeatureGate feature={Feature.MY_NEW_FEATURE} showPreview={true}>
  <MyNewComponent />
</FeatureGate>
```

## Pricing Configuration

Current pricing (can be changed in `constants/Features.ts`):

```typescript
export const PRICING = {
  monthly: {
    price: 6.99,
    priceId: 'monthly_subscription',
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
  },
};
```

## Free Tier Limits

Current limits (can be changed in `constants/Features.ts`):

```typescript
export const FREE_TIER_LIMITS = {
  MAX_PHOTOS: 50,
  MAX_COMPARISONS_PER_DAY: 5,
  MAX_EXPORTS_PER_MONTH: 2,
};
```

## Next Steps for Production

### 1. Choose Payment Provider
- **Recommended**: RevenueCat (easiest, comprehensive)
- **Alternative**: Native IAP with Expo
- **Alternative**: Stripe for web support

### 2. Follow Implementation Guide
See `docs/MONETIZATION_IMPLEMENTATION_GUIDE.md` for detailed instructions on:
- Setting up RevenueCat
- Configuring App Store Connect (iOS)
- Configuring Google Play Console (Android)
- Integrating payment SDK
- Testing with sandbox accounts

### 3. Remove Test Mode
Before production:
```typescript
// In settings.tsx, wrap test mode with __DEV__
{__DEV__ && (
  <TouchableOpacity onPress={handleTestPremiumToggle}>
    <Text>Test Premium</Text>
  </TouchableOpacity>
)}
```

### 4. Add Analytics
Track these events:
- Paywall shown
- Plan selected
- Purchase completed
- Purchase failed
- Feature gate shown
- Upgrade prompted

## Files Created

### Services
- `services/featureFlagService.ts` - Core feature flag logic
- `config/features.json` - Feature configuration

### Context
- `context/UserContext.tsx` - Subscription state management

### Components
- `components/monetization/FeatureGate.tsx` - Feature wrapper
- `components/monetization/PaywallModal.tsx` - Upgrade modal
- `components/monetization/PremiumBadge.tsx` - Premium indicators

### Constants
- `constants/Features.ts` - Types, enums, pricing

### Documentation
- `docs/MONETIZATION_IMPLEMENTATION_GUIDE.md` - Payment integration guide
- `docs/FEATURE_FLAGS_README.md` - This file

## Files Modified

### App Layout
- `app/_layout.tsx` - Added UserProvider

### Screens
- `app/(tabs)/index.tsx` - Added FeatureGates to analytics
- `app/(tabs)/settings.tsx` - Added premium management UI
- `app/(tabs)/gallery.tsx` - Added storage warnings and limits

### Context
- `context/PhotoContext.tsx` - Integrated storage limits

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  App (_layout.tsx)                  │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │            UserProvider                       │ │
│  │  - Subscription Status                        │ │
│  │  - Feature Usage Tracking                     │ │
│  │  - Storage Limits                             │ │
│  └───────────────────────────────────────────────┘ │
│                        │                            │
│  ┌─────────────────────┴──────────────────────┐    │
│  │                                             │    │
│  ▼                    ▼                        ▼    │
│ Home                Gallery                Settings │
│  │                    │                        │    │
│  │ FeatureGates       │ Storage Checks         │    │
│  │ (Analytics)        │ (Photo Limits)         │    │
│  │                    │                        │    │
│  └────────────────────┴────────────────────────┘    │
│                        │                            │
│                        ▼                            │
│         ┌──────────────────────────┐                │
│         │  FeatureFlagService      │                │
│         │  - Feature Access        │                │
│         │  - Usage Tracking        │                │
│         │  - Config Management     │                │
│         └──────────────────────────┘                │
│                        │                            │
│         ┌──────────────┴──────────────┐             │
│         ▼                              ▼             │
│  ┌────────────┐                ┌────────────┐       │
│  │ Local      │                │ Remote     │       │
│  │ Config     │                │ Config     │       │
│  │ (JSON)     │                │ (Future)   │       │
│  └────────────┘                └────────────┘       │
└─────────────────────────────────────────────────────┘
```

## Support

For questions or issues:
1. Check `MONETIZATION_IMPLEMENTATION_GUIDE.md` for payment integration
2. Review code comments in service files
3. Test with test premium toggle first
4. Check browser/metro console for errors

## Summary

✅ Feature flags fully implemented
✅ Premium features gated and functional
✅ Storage limits enforced
✅ UI components ready
✅ Test mode available
✅ Production-ready architecture

⏳ Pending: Payment provider integration (RevenueCat recommended)

Estimated time to go live with real payments: **2 hours**
