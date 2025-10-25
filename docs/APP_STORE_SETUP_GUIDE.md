# App Store & Play Store Setup for Monetization

## Overview

This guide explains **exactly** how the feature flag system connects to App Store (iOS) and Play Store (Android) for real monetization. The connection happens through **In-App Purchases (IAP)** that you configure in each store.

---

## The Big Picture: How It All Connects

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR APP (FitSnapshot)                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Your Code (Already Implemented)                         │  │
│  │  - FeatureGate blocks features                           │  │
│  │  - PaywallModal shows upgrade button                     │  │
│  │  - featureFlagService tracks premium status             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
│                            ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Payment SDK (YOU NEED TO ADD THIS)                     │  │
│  │  - RevenueCat (recommended)                             │  │
│  │  OR Expo In-App Purchases                               │  │
│  │  OR @stripe/stripe-react-native                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  App Store Connect (iOS)               │
        │  - You create subscription products    │
        │  - Apple handles payment processing    │
        │  - Returns receipt to verify purchase  │
        └────────────────────────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │  Google Play Console (Android)         │
        │  - You create subscription products    │
        │  - Google handles payment processing   │
        │  - Returns receipt to verify purchase  │
        └────────────────────────────────────────┘
```

---

## Step-by-Step: Complete Setup Process

### PHASE 1: Create Products in App Stores (No Coding)

#### iOS - App Store Connect Setup

**1. Sign in to App Store Connect**
- Go to: https://appstoreconnect.apple.com
- Sign in with your Apple Developer account ($99/year required)

**2. Select Your App**
- Click on your app (FitSnapshot)
- If app doesn't exist, create it:
  - Click "+" → "New App"
  - Platform: iOS
  - Name: FitSnapshot
  - Primary Language: English
  - Bundle ID: com.yourcompany.fitsnapshot (must match your app)
  - SKU: fitsnapshot-ios
  - User Access: Full Access

**3. Create Subscription Group**
- Go to: **Features** → **Subscriptions**
- Click "+" to create new subscription group
- Name: "FitSnapshot Premium"
- Reference Name: premium_subscriptions

**4. Create Monthly Subscription**
- Inside the subscription group, click "+"
- **Product ID**: `fitsnapshot_monthly` (IMPORTANT: exact name)
- **Reference Name**: Monthly Subscription
- **Subscription Duration**: 1 Month
- Click "Create"

- **Subscription Pricing**:
  - Click "Add Pricing"
  - Select countries (or "All Countries")
  - Price: $6.99 USD
  - Click "Next" → "Add"

- **Subscription Localizations**:
  - Display Name: Premium Monthly
  - Description: Unlock unlimited photos, advanced analytics, and premium features

**5. Create Annual Subscription**
- Click "+" again in subscription group
- **Product ID**: `fitsnapshot_annual`
- **Reference Name**: Annual Subscription
- **Subscription Duration**: 1 Year
- **Price**: $49.99 USD
- **Display Name**: Premium Annual
- **Description**: Save 40%! Unlock all premium features with annual billing

**6. Create Lifetime Purchase** (Non-Consumable)
- Go to: **Features** → **In-App Purchases**
- Click "+"
- **Type**: Non-Consumable
- **Product ID**: `fitsnapshot_lifetime`
- **Reference Name**: Lifetime Access
- **Price**: $99.99 USD
- **Display Name**: Premium Lifetime
- **Description**: One-time payment for lifetime access to all premium features

**7. Get Shared Secret** (Required for receipt validation)
- Go to: **Users and Access** → **Shared Secret** (under App-Specific Shared Secret)
- Click "Generate" if not exists
- Copy the secret (you'll need this later)

**8. Create Sandbox Test Account**
- Go to: **Users and Access** → **Sandbox Testers**
- Click "+" to add tester
- Email: test@yourcompany.com (can be fake, but must be unique)
- Password: TestPassword123!
- First/Last Name: Test User
- This account is used to test purchases without real money

---

#### Android - Google Play Console Setup

**1. Sign in to Google Play Console**
- Go to: https://play.google.com/console
- Sign in with your Google account
- One-time registration fee: $25

**2. Select Your App**
- Click on your app (FitSnapshot)
- If app doesn't exist, create it:
  - Click "Create app"
  - Name: FitSnapshot
  - Default language: English
  - App/Game: App
  - Free/Paid: Free (with in-app purchases)

**3. Enable In-App Products**
- Sidebar: **Monetize** → **Products** → **In-app products**
- Click "Create product"

**4. Create Monthly Subscription**
- Click "Create subscription"
- **Product ID**: `fitsnapshot_monthly` (same as iOS)
- **Name**: Premium Monthly
- **Description**: Unlock unlimited photos, advanced analytics, and premium features
- **Status**: Active
- **Base plan**:
  - Billing period: Monthly (every 1 month)
  - Price: $6.99 USD
  - Free trial: 7 days (optional)
- Click "Save" → "Activate"

**5. Create Annual Subscription**
- Click "Create subscription"
- **Product ID**: `fitsnapshot_annual`
- **Name**: Premium Annual
- **Description**: Save 40%! Unlock all premium features with annual billing
- **Billing period**: Yearly (every 1 year)
- **Price**: $49.99 USD
- Click "Save" → "Activate"

**6. Create Lifetime Purchase**
- Go to: **In-app products** (not subscriptions)
- Click "Create product"
- **Product ID**: `fitsnapshot_lifetime`
- **Name**: Premium Lifetime
- **Description**: One-time payment for lifetime access
- **Status**: Active
- **Price**: $99.99 USD
- Click "Save" → "Activate"

**7. Set Up License Testing**
- Sidebar: **Setup** → **License testing**
- Add your email to "License testers"
- This allows you to test purchases without charges

**8. Create Service Account** (Required for API access)
- Go to: **Setup** → **API access**
- Click "Create new service account"
- Follow link to Google Cloud Console
- Create service account:
  - Name: FitSnapshot IAP Service
  - Role: Service Account User
- Click "Create key" → JSON
- Download the JSON file (you'll need this later)
- Back in Play Console, grant access to service account:
  - Role: Admin (View financial data)

---

### PHASE 2: Connect Stores to Your App (Coding Required)

Now you need to install a payment SDK that connects to these store products.

#### Option A: RevenueCat (RECOMMENDED - Easiest)

**Why RevenueCat?**
- Handles both iOS and Android with one SDK
- Automatic receipt validation
- No backend server needed
- Beautiful dashboard for analytics
- Free up to $10k monthly revenue

**Setup Steps:**

**1. Create RevenueCat Account**
- Go to: https://www.revenuecat.com
- Sign up (free)
- Create new project: "FitSnapshot"

**2. Add iOS App to RevenueCat**
- Dashboard → **Apps** → Add iOS app
- **App Name**: FitSnapshot iOS
- **Bundle ID**: com.yourcompany.fitsnapshot (must match App Store)
- **App Store Connect API Key**:
  - Option A: Upload App-Specific Shared Secret (from Step 7 above)
  - Option B: Create API key in App Store Connect (more secure)

**3. Add Android App to RevenueCat**
- Dashboard → **Apps** → Add Android app
- **App Name**: FitSnapshot Android
- **Package Name**: com.yourcompany.fitsnapshot (must match Play Store)
- **Service Account Credentials**: Upload JSON from Android Step 8

**4. Create Entitlement**
- Dashboard → **Entitlements** → Create entitlement
- **Identifier**: `premium` (this is the access key)
- **Description**: Access to all premium features

**5. Link Products to Entitlement**
- Dashboard → **Products** → Add products
- Click "Import from App Store Connect" (imports your iOS products)
- Click "Import from Google Play" (imports your Android products)
- For each product:
  - iOS: fitsnapshot_monthly, fitsnapshot_annual, fitsnapshot_lifetime
  - Android: fitsnapshot_monthly, fitsnapshot_annual, fitsnapshot_lifetime
- Attach all products to "premium" entitlement

**6. Create Offering**
- Dashboard → **Offerings** → Create offering
- **Identifier**: `default`
- Add packages:
  - Package: Monthly → Product: fitsnapshot_monthly
  - Package: Annual → Product: fitsnapshot_annual
  - Package: Lifetime → Product: fitsnapshot_lifetime
- Make this offering current

**7. Install RevenueCat in Your App**

```bash
npm install react-native-purchases
# or
npx expo install react-native-purchases
```

**8. Get API Keys**
- Dashboard → **API Keys**
- Copy your iOS API key
- Copy your Android API key

**9. Update Your Code**

Create `services/revenueCatService.ts` (full code in MONETIZATION_IMPLEMENTATION_GUIDE.md):

```typescript
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEY = Platform.select({
  ios: 'appl_xxxxxxxxxxxxxxxxx', // Your iOS key from RevenueCat
  android: 'goog_xxxxxxxxxxxxxxxxx', // Your Android key from RevenueCat
});

class RevenueCatService {
  async initialize() {
    await Purchases.configure({ apiKey: API_KEY });
    await this.syncSubscriptionStatus();
  }

  async purchase(packageToPurchase) {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    // Update your featureFlagService here
    await this.updateLocalSubscriptionStatus(customerInfo);
  }

  async syncSubscriptionStatus() {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasPremium = Object.keys(customerInfo.entitlements.active).length > 0;

    if (hasPremium) {
      // User has active subscription!
      await featureFlagService.updateSubscriptionStatus({
        tier: 'premium',
        isPremium: true,
        // ... other details
      });
    } else {
      // User is free tier
      await featureFlagService.resetToFreeTier();
    }
  }
}

export default new RevenueCatService();
```

**10. Initialize RevenueCat on App Start**

In `app/_layout.tsx`:

```typescript
import revenueCatService from '@/services/revenueCatService';

export default function RootLayout() {
  useEffect(() => {
    revenueCatService.initialize();
  }, []);
  // ... rest of code
}
```

**11. Update PaywallModal to Use Real Purchases**

In `components/monetization/PaywallModal.tsx`:

```typescript
import revenueCatService from '@/services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';

const PaywallModal = ({ visible, onClose }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    const offerings = await revenueCatService.getOfferings();
    setPackages(offerings);
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const success = await revenueCatService.purchase(selectedPackage);
      if (success) {
        Alert.alert('Success!', 'Premium activated!');
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    }
    setLoading(false);
  };

  // Show actual prices from packages
  return (
    <Modal visible={visible}>
      {packages.map(pkg => (
        <PricingCard
          key={pkg.identifier}
          title={pkg.packageType}
          price={pkg.product.priceString} // Real price from store!
          onPress={() => handlePurchase(pkg)}
        />
      ))}
    </Modal>
  );
};
```

---

#### Option B: Native Expo In-App Purchases (More Work)

If you don't want to use RevenueCat:

```bash
npx expo install expo-in-app-purchases
```

You'll need to:
1. Manually call iOS/Android IAP APIs
2. Handle receipt validation yourself
3. Manage subscription state manually
4. Build backend for receipt validation (recommended for production)

See full code in MONETIZATION_IMPLEMENTATION_GUIDE.md.

---

### PHASE 3: Testing Purchases

#### iOS Testing

**1. Sign Out of App Store**
- iPhone Settings → App Store → Sign Out

**2. Build for TestFlight**
```bash
eas build --platform ios
```

**3. Install on Device via TestFlight**
- Upload build to App Store Connect
- Add build to TestFlight
- Install on your iPhone

**4. Test Purchase**
- Open app
- Tap "Upgrade to Premium"
- Select a plan
- App Store payment sheet appears
- Sign in with **sandbox test account** (from iOS Step 8)
- Password will be asked repeatedly (sandbox behavior)
- Complete purchase
- Premium should activate!

**5. Verify in RevenueCat Dashboard**
- Go to RevenueCat → Customer Lists
- You should see your test user
- Shows active subscription

**6. Test Restore Purchases**
- Uninstall app
- Reinstall from TestFlight
- Open app (should be free tier)
- Add "Restore Purchases" button in Settings:

```typescript
const handleRestorePurchases = async () => {
  await revenueCatService.restorePurchases();
  Alert.alert('Restored!', 'Your purchases have been restored.');
};
```

- Tap "Restore Purchases"
- Premium should reactivate!

---

#### Android Testing

**1. Build for Internal Testing**
```bash
eas build --platform android
```

**2. Upload to Play Console**
- Go to Play Console → Testing → Internal testing
- Create new release
- Upload AAB file
- Add your email as tester

**3. Install on Android Device**
- Open email → Click test link
- Install from Play Store

**4. Test Purchase**
- Open app
- Tap "Upgrade to Premium"
- Google Play payment sheet appears
- Sign in with your test account (from Android Step 7)
- Complete purchase (won't be charged)
- Premium activates!

**5. Verify Purchase**
- Play Console → Monetization → Orders
- Should see test order
- RevenueCat Dashboard → Customer Lists
- Should see Android test user

---

### PHASE 4: The Complete Flow (What Happens Behind the Scenes)

**User Flow:**
```
1. User opens app
   → RevenueCat SDK initializes
   → Checks for active subscriptions
   → Updates featureFlagService
   → UI shows free or premium state

2. User taps "Upgrade to Premium"
   → PaywallModal opens
   → Loads packages from RevenueCat
   → Shows real prices from App Store/Play Store

3. User selects "Annual - $49.99"
   → App calls revenueCatService.purchase()
   → RevenueCat calls App Store/Play Store API
   → Native payment sheet appears

4. User completes payment
   → Apple/Google processes payment
   → Apple/Google sends receipt to RevenueCat
   → RevenueCat validates receipt
   → RevenueCat returns success to app
   → App calls featureFlagService.updateSubscriptionStatus()
   → Premium features unlock!

5. User closes app, opens next day
   → RevenueCat checks subscription status
   → Still active → Premium features available

6. User cancels subscription (in App Store settings)
   → Subscription continues until end of period
   → RevenueCat detects expiration
   → featureFlagService updates to free tier
   → Premium features lock
```

---

### PHASE 5: Production Checklist

Before launching to real users:

**Code Changes:**
- [ ] Remove or hide test premium toggle:
  ```typescript
  {__DEV__ && <TestPremiumToggle />}
  ```
- [ ] Add "Restore Purchases" button in Settings
- [ ] Add error handling for failed purchases
- [ ] Add loading states during purchase
- [ ] Test all feature gates work correctly

**App Store Connect:**
- [ ] Subscriptions approved by Apple (submit for review)
- [ ] Set up introductory offers (7-day free trial)
- [ ] Configure pricing for all countries
- [ ] Add subscription screenshots
- [ ] Fill out app privacy details (purchases)

**Google Play Console:**
- [ ] Subscriptions active
- [ ] Set up free trial period
- [ ] Configure pricing for all countries
- [ ] Add IAP declaration in app content

**RevenueCat:**
- [ ] Verify entitlements configured correctly
- [ ] Test both iOS and Android purchases
- [ ] Set up webhooks (optional, for backend sync)
- [ ] Configure email notifications

**Legal:**
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add subscription terms (auto-renewal, cancellation)
- [ ] Add these links to app and store listings

**Analytics:**
- [ ] Track paywall views
- [ ] Track purchase completions
- [ ] Track purchase failures
- [ ] Track revenue (RevenueCat dashboard provides this)

---

## Money Flow (Where Does the Money Go?)

```
User pays $6.99 → Apple/Google takes 30% ($2.10)
                → RevenueCat takes 0% (free tier) or 1% (if > $10k MRR)
                → You get ~$4.89

After 1 year of subscription:
                → Apple/Google takes 15% ($1.05) - reduced rate!
                → You get ~$5.94

Revenue deposited to your bank account:
- Apple: Monthly, via bank transfer (configured in App Store Connect)
- Google: Monthly, via bank transfer (configured in Play Console)
```

---

## Common Issues & Solutions

### "Products not loading"
- **Cause**: Bundle ID mismatch or products not synced
- **Fix**:
  - Verify Bundle ID in Xcode matches App Store Connect
  - Wait 2-4 hours after creating products
  - Check RevenueCat product import worked

### "Purchase fails immediately"
- **Cause**: Not signed in with test account
- **Fix**: Sign out of App Store, sign in with sandbox tester

### "Receipt invalid"
- **Cause**: Using production receipt in sandbox
- **Fix**: RevenueCat automatically detects environment

### "Subscription doesn't activate"
- **Cause**: featureFlagService not updated
- **Fix**: Check `updateLocalSubscriptionStatus()` is called

### "User charged twice"
- **Cause**: Calling purchase API twice
- **Fix**: Add loading state, disable button during purchase

---

## Summary: The Complete Connection

**What you built:**
- Feature flag system that checks if user is premium
- UI that prompts users to upgrade

**What you need to add:**
- Payment SDK (RevenueCat recommended)
- Initialize SDK on app start
- Call SDK when user taps "Purchase"
- Update featureFlagService when purchase succeeds

**What Apple/Google provides:**
- Payment processing (credit cards, Apple Pay, etc.)
- Subscription management
- Receipt validation
- Automatic billing

**What RevenueCat provides:**
- Bridge between your app and App Store/Play Store
- Cross-platform SDK (one API for both platforms)
- Receipt validation
- Subscription status tracking
- Analytics dashboard

**Total setup time:**
- App Store Connect setup: 30 minutes
- Google Play Console setup: 30 minutes
- RevenueCat setup: 20 minutes
- Code integration: 1-2 hours
- Testing: 1 hour
- **Total: 3-4 hours**

---

## Quick Start Commands

```bash
# Install RevenueCat
npm install react-native-purchases

# Build for iOS TestFlight
eas build --platform ios --profile preview

# Build for Android Internal Testing
eas build --platform android --profile preview

# Or both
eas build --platform all --profile preview
```

---

## Need Help?

**RevenueCat Docs**: https://docs.revenuecat.com/docs/reactnative
**Apple IAP Guide**: https://developer.apple.com/in-app-purchase/
**Google Play Billing**: https://developer.android.com/google/play/billing

Your feature flag system is ready. You just need to connect it to the payment providers! 🚀
