# FitSnapshot Monetization Implementation Guide

## Overview

This guide explains how to implement real monetization for the FitSnapshot app using the feature flag system that has been set up. The current implementation includes mock premium functionality for testing. This guide will show you how to integrate actual payment processing.

---

## What Has Been Implemented

### ✅ Feature Flag System
- **Location**: `services/featureFlagService.ts`
- **Purpose**: Centralized feature access control
- **Features**: Tracks premium status, storage limits, feature usage
- **Testing**: `setTestPremiumStatus()` method for development

### ✅ User Context
- **Location**: `context/UserContext.tsx`
- **Purpose**: React hooks for subscription state management
- **Hooks**: `useUser()`, `useIsPremium()`, `useFeatureAccess()`, `useStorageUsage()`

### ✅ UI Components
- **FeatureGate**: Blocks premium features with upgrade prompts
- **PaywallModal**: Full-screen upgrade UI with pricing
- **PremiumBadge**: Visual indicators for premium features/users
- **Storage warnings**: In gallery screen when approaching limits

### ✅ Configuration
- **Features**: `config/features.json` - Feature definitions
- **Constants**: `constants/Features.ts` - TypeScript types and limits
- **Pricing**: Monthly ($6.99), Annual ($49.99), Lifetime ($99.99)

### ✅ Integration Points
- Home screen: Premium analytics wrapped in FeatureGates
- Gallery: Storage limit enforcement
- Settings: Premium management UI
- Photos: Storage count tracking

---

## Implementation Options

You have three main options for implementing real payments:

### Option 1: RevenueCat (Recommended - Easiest)
### Option 2: Native In-App Purchases (Expo)
### Option 3: Stripe for Cross-Platform

---

## Option 1: RevenueCat Implementation (RECOMMENDED)

RevenueCat is the easiest way to implement subscriptions. It handles receipt validation, cross-platform support, and provides analytics.

### Step 1: Create RevenueCat Account

1. Go to [revenuecat.com](https://www.revenuecat.com)
2. Sign up for a free account (free up to $10k MRR)
3. Create a new project: "FitSnapshot"

### Step 2: Configure App Store Connect (iOS)

1. **Create In-App Purchase Products**:
   - Go to App Store Connect → Your App → Features → In-App Purchases
   - Create 3 subscriptions:
     - `fitsnapshot_monthly` - Monthly Subscription - $6.99/month
     - `fitsnapshot_annual` - Annual Subscription - $49.99/year
     - `fitsnapshot_lifetime` - Non-Renewing Subscription - $99.99

2. **Create Subscription Group**:
   - Name: "FitSnapshot Premium"
   - Add all three products to the group

3. **Shared Secret**:
   - Get your In-App Purchase Shared Secret
   - App Store Connect → Your App → General → App Information → Shared Secret

4. **Add to RevenueCat**:
   - RevenueCat Dashboard → Apps → iOS → Configure
   - Add Bundle ID, Shared Secret

### Step 3: Configure Google Play Console (Android)

1. **Create In-App Products**:
   - Google Play Console → Your App → Monetize → Products
   - Create subscriptions:
     - `fitsnapshot_monthly` - $6.99/month
     - `fitsnapshot_annual` - $49.99/year
     - `fitsnapshot_lifetime` - One-time purchase - $99.99

2. **Service Credentials**:
   - Google Play Console → Setup → API Access
   - Create Service Account
   - Grant "View financial data" permission
   - Download JSON key

3. **Add to RevenueCat**:
   - RevenueCat Dashboard → Apps → Android → Configure
   - Upload Service Account JSON

### Step 4: Install RevenueCat SDK

```bash
npm install react-native-purchases
# or
yarn add react-native-purchases
```

For Expo (managed workflow):
```bash
npx expo install react-native-purchases
```

### Step 5: Create RevenueCat Service

Create `services/revenueCatService.ts`:

```typescript
import Purchases, {
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';
import featureFlagService from './featureFlagService';

const API_KEY = Platform.select({
  ios: 'YOUR_IOS_API_KEY_HERE', // From RevenueCat Dashboard
  android: 'YOUR_ANDROID_API_KEY_HERE', // From RevenueCat Dashboard
});

class RevenueCatService {
  private initialized = false;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized || !API_KEY) return;

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      await Purchases.configure({ apiKey: API_KEY });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.initialized = true;

      // Sync initial status
      await this.syncSubscriptionStatus();
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
    }
  }

  /**
   * Get available subscription packages
   */
  async getOfferings(): Promise<PurchasesPackage[]> {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current?.availablePackages) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return [];
    }
  }

  /**
   * Purchase a package
   */
  async purchase(packageToPurchase: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      await this.updateLocalSubscriptionStatus(customerInfo);
      return true;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('User cancelled purchase');
      } else {
        console.error('Purchase error:', error);
      }
      return false;
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      await this.updateLocalSubscriptionStatus(customerInfo);
      return true;
    } catch (error) {
      console.error('Restore error:', error);
      return false;
    }
  }

  /**
   * Sync subscription status from RevenueCat
   */
  async syncSubscriptionStatus(): Promise<void> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      await this.updateLocalSubscriptionStatus(customerInfo);
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  /**
   * Update local feature flag service with subscription status
   */
  private async updateLocalSubscriptionStatus(customerInfo: CustomerInfo): Promise<void> {
    const entitlements = customerInfo.entitlements.active;
    const hasPremium = Object.keys(entitlements).length > 0;

    if (hasPremium) {
      const premiumEntitlement = entitlements['premium']; // Your entitlement identifier
      const expiresAt = premiumEntitlement?.expirationDate;
      const isLifetime = premiumEntitlement?.productIdentifier === 'fitsnapshot_lifetime';

      await featureFlagService.updateSubscriptionStatus({
        tier: isLifetime ? 'lifetime' : 'premium',
        isPremium: true,
        isLifetime,
        expiresAt: expiresAt || undefined,
        startedAt: premiumEntitlement?.originalPurchaseDate || new Date().toISOString(),
      });
    } else {
      await featureFlagService.resetToFreeTier();
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return Object.keys(customerInfo.entitlements.active).length > 0;
    } catch (error) {
      return false;
    }
  }
}

export default new RevenueCatService();
```

### Step 6: Update PaywallModal to Use RevenueCat

Update `components/monetization/PaywallModal.tsx`:

```typescript
import revenueCatService from '@/services/revenueCatService';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose, source, feature }) => {
  // ... existing code ...
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    const offerings = await revenueCatService.getOfferings();
    setPackages(offerings);
    // Set default to annual package
    const annual = offerings.find(p => p.identifier === 'annual');
    if (annual) setSelectedPackage(annual);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    try {
      const success = await revenueCatService.purchase(selectedPackage);
      if (success) {
        await refreshSubscriptionStatus(); // From UserContext
        Alert.alert('Success', 'Premium activated!');
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update pricing cards to use real packages
  // ...
};
```

### Step 7: Initialize RevenueCat on App Start

Update `app/_layout.tsx`:

```typescript
import revenueCatService from '@/services/revenueCatService';

export default function RootLayout() {
  useEffect(() => {
    // Initialize RevenueCat
    revenueCatService.initialize();
  }, []);

  // ... rest of code
}
```

### Step 8: Configure Entitlements in RevenueCat Dashboard

1. Go to RevenueCat Dashboard → Entitlements
2. Create entitlement: `premium`
3. Attach products:
   - `fitsnapshot_monthly`
   - `fitsnapshot_annual`
   - `fitsnapshot_lifetime`

### Step 9: Testing

**iOS TestFlight**:
1. Add test users in App Store Connect → TestFlight → Testers
2. Use sandbox accounts for testing purchases

**Android Internal Testing**:
1. Add test users in Google Play Console → Testing → Internal Testing
2. Purchases won't be charged in test environment

**RevenueCat Sandbox**:
- RevenueCat automatically detects sandbox environments
- Test purchases appear in Dashboard → Customer Lists

---

## Option 2: Native Expo In-App Purchases

If you don't want to use RevenueCat, you can use Expo's native APIs.

### Step 1: Install Expo IAP

```bash
npx expo install expo-in-app-purchases
```

### Step 2: Create Purchase Service

Create `services/iapService.ts`:

```typescript
import * as InAppPurchases from 'expo-in-app-purchases';
import { Platform } from 'react-native';
import featureFlagService from './featureFlagService';

const PRODUCT_IDS = {
  monthly: 'fitsnapshot_monthly',
  annual: 'fitsnapshot_annual',
  lifetime: 'fitsnapshot_lifetime',
};

class IAPService {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      await InAppPurchases.connectAsync();
      this.initialized = true;

      // Set purchase listener
      InAppPurchases.setPurchaseListener(this.handlePurchase);

      // Restore purchases on start
      await this.restorePurchases();
    } catch (error) {
      console.error('IAP initialization error:', error);
    }
  }

  async getProducts() {
    try {
      const { results } = await InAppPurchases.getProductsAsync(
        Object.values(PRODUCT_IDS)
      );
      return results;
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  }

  async purchase(productId: string) {
    try {
      await InAppPurchases.purchaseItemAsync(productId);
      // Purchase will be handled by listener
    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  }

  private handlePurchase = async ({
    responseCode,
    results,
    errorCode
  }: InAppPurchases.InAppPurchaseResult) => {
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      for (const purchase of results) {
        if (!purchase.acknowledged) {
          await this.processPurchase(purchase);
          await InAppPurchases.finishTransactionAsync(purchase, true);
        }
      }
    }
  };

  private async processPurchase(purchase: InAppPurchases.InAppPurchase) {
    // Update subscription status
    await featureFlagService.updateSubscriptionStatus({
      tier: purchase.productId === PRODUCT_IDS.lifetime ? 'lifetime' : 'premium',
      isPremium: true,
      isLifetime: purchase.productId === PRODUCT_IDS.lifetime,
      startedAt: new Date(purchase.purchaseTime).toISOString(),
    });
  }

  async restorePurchases() {
    try {
      const { results } = await InAppPurchases.getPurchaseHistoryAsync();
      const activePurchases = results.filter(p =>
        p.acknowledged &&
        (p.productId === PRODUCT_IDS.lifetime || new Date(p.expirationTime || 0) > new Date())
      );

      if (activePurchases.length > 0) {
        await this.processPurchase(activePurchases[0]);
      }
    } catch (error) {
      console.error('Restore error:', error);
    }
  }

  disconnect() {
    InAppPurchases.disconnectAsync();
  }
}

export default new IAPService();
```

**Note**: Expo's IAP module is more limited than RevenueCat and requires more manual receipt validation for production.

---

## Option 3: Stripe for Web/Cross-Platform

If you want to support web or use Stripe:

### Setup

```bash
npm install @stripe/stripe-react-native
# or
npx expo install @stripe/stripe-react-native
```

### Backend Required

You'll need a backend server to create payment intents. This is beyond the scope of this guide, but here's the flow:

1. User selects subscription
2. App calls your backend → backend creates Stripe Checkout session
3. App opens Stripe payment sheet
4. On success, backend webhook updates subscription status
5. App polls or listens for status update

---

## Testing Your Implementation

### Test Flow

1. **Free User Experience**:
   - Open app → Navigate to Home
   - Premium features (charts, heatmaps) should show blur with upgrade prompt
   - Try to add 51st photo → Should be blocked with upgrade prompt
   - Settings → Should show "Upgrade to Premium" card

2. **Activate Test Premium** (Development):
   - Settings → Tap "Test Premium (OFF)"
   - Confirm activation
   - All premium features should unlock
   - Storage limit removed (∞)

3. **Purchase Flow**:
   - Deactivate test premium
   - Tap any "Upgrade" button
   - PaywallModal should appear with pricing
   - Select a plan → Tap "Continue to Payment"
   - Complete purchase (sandbox)
   - Premium should activate

4. **Restore Purchases**:
   - Uninstall and reinstall app
   - Settings → Restore Purchases (you'll need to add this button)
   - Premium should reactivate

### Debug Checklist

- [ ] RevenueCat/IAP SDK initialized correctly
- [ ] Products loaded and displayed with correct prices
- [ ] Purchase completes and returns success
- [ ] featureFlagService updates subscription status
- [ ] UI updates to show premium features
- [ ] Storage limit changes from 50 → unlimited
- [ ] Restore purchases works
- [ ] Subscription expiry handled (for testing, set short duration)

---

## Production Considerations

### 1. Remove Test Mode Toggle

Before production, remove the test premium toggle from settings or gate it behind `__DEV__`:

```typescript
{__DEV__ && (
  <TouchableOpacity onPress={handleTestPremiumToggle}>
    <Text>Test Premium</Text>
  </TouchableOpacity>
)}
```

### 2. Receipt Validation

For native IAP (Option 2), implement server-side receipt validation:
- Send receipts to your backend
- Backend validates with Apple/Google
- Backend stores subscription status
- App syncs with backend on launch

### 3. Subscription Management

Add these features to Settings:
- Restore Purchases button
- Manage Subscription (opens App Store/Play Store)
- Contact Support

### 4. Analytics

Track these events:
- Paywall shown
- Plan selected
- Purchase initiated
- Purchase completed
- Purchase failed
- Purchase restored

### 5. A/B Testing

Test different:
- Pricing ($5.99 vs $6.99)
- Free tier limits (30 vs 50 photos)
- Paywall copy
- Upgrade prompt timing

### 6. Customer Support

Prepare for:
- Refund requests
- Subscription issues
- Feature access problems
- Restore purchase failures

---

## Migration Path

### Phase 1: Testing (Current)
- Use test premium toggle
- Validate feature gates work correctly
- Test UI/UX with team

### Phase 2: Beta (Sandbox)
- Integrate RevenueCat or native IAP
- Test with sandbox accounts
- TestFlight/Internal Testing with real users

### Phase 3: Soft Launch
- Launch to limited countries
- Monitor metrics
- Fix issues
- Iterate on pricing/features

### Phase 4: Full Launch
- Roll out globally
- Marketing campaigns
- Monitor conversion rates
- A/B test optimizations

---

## Pricing & Revenue Optimization

### Free Tier Limits

Current: 50 photos
- Consider: 30, 50, or 100
- Test conversion rates at each limit

### Pricing Tiers

Monthly: $6.99
- Test: $4.99, $6.99, $9.99

Annual: $49.99 (40% savings)
- Test: $39.99, $49.99, $59.99

Lifetime: $99.99
- Caution: Can cannibalize recurring revenue
- Consider: $149 or remove entirely

### Promotional Offers

- First month free
- 7-day free trial
- 50% off first year
- Black Friday deals

### Upgrade Prompts

Strategic locations:
- After 10 photos (engagement)
- At 40/50 photos (urgency)
- When viewing blurred premium features (desire)
- After 7 days of use (habit formation)

---

## Troubleshooting

### Purchase Not Activating

1. Check featureFlagService.updateSubscriptionStatus() is called
2. Verify UserContext.refreshSubscriptionStatus() is called
3. Check AsyncStorage for subscription data
4. Verify RevenueCat entitlements are configured correctly

### Products Not Loading

1. Ensure products created in App Store Connect/Play Console
2. Check API keys are correct
3. Verify RevenueCat configuration
4. Check app bundle ID matches store

### Restore Purchases Failing

1. Verify user is signed in with same Apple/Google account
2. Check purchase was completed (not cancelled)
3. Ensure restore code calls IAP restore method
4. Check receipt validation

### Feature Gates Not Working

1. Verify UserProvider wraps entire app
2. Check feature keys match Features.ts
3. Ensure FeatureGate receives correct feature prop
4. Test with `setTestPremiumStatus()` toggle

---

## Support & Resources

### RevenueCat
- Docs: https://docs.revenuecat.com
- React Native: https://docs.revenuecat.com/docs/reactnative
- Dashboard: https://app.revenuecat.com

### Apple
- App Store Connect: https://appstoreconnect.apple.com
- IAP Guide: https://developer.apple.com/in-app-purchase/

### Google
- Play Console: https://play.google.com/console
- Billing Guide: https://developer.android.com/google/play/billing

### Expo
- IAP Docs: https://docs.expo.dev/versions/latest/sdk/in-app-purchases/

---

## Quick Start Checklist

To implement real payments TODAY:

- [ ] 1. Create RevenueCat account (5 min)
- [ ] 2. Configure iOS products in App Store Connect (15 min)
- [ ] 3. Configure Android products in Play Console (15 min)
- [ ] 4. Add products to RevenueCat (5 min)
- [ ] 5. Install `react-native-purchases` (2 min)
- [ ] 6. Copy RevenueCat service code (5 min)
- [ ] 7. Update PaywallModal purchase handler (10 min)
- [ ] 8. Initialize RevenueCat in _layout.tsx (2 min)
- [ ] 9. Test with sandbox account (20 min)
- [ ] 10. Deploy to TestFlight/Internal Testing (30 min)

**Total Time: ~2 hours**

---

## Summary

Your feature flag system is production-ready. The only remaining step is integrating a real payment provider. RevenueCat is recommended for its ease of use and comprehensive feature set.

The current implementation with test mode allows you to:
1. Develop and test all features
2. Demo to stakeholders
3. Validate UI/UX
4. Prepare for real integration

When ready, follow the RevenueCat implementation guide above to go live with real subscriptions.

Good luck with your launch! 🚀
