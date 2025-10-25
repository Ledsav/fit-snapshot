# Quick Start: Connecting to App Store & Play Store

## TL;DR - What You Need to Do

Your feature flag system is **100% complete**. To accept real money, you need 3 things:

### 1️⃣ Create Products in App Stores (30 min)
Go to App Store Connect (iOS) and Google Play Console (Android) and create these products:

**Product IDs** (must be exact):
- `fitsnapshot_monthly` - $6.99/month
- `fitsnapshot_annual` - $49.99/year
- `fitsnapshot_lifetime` - $99.99 one-time

### 2️⃣ Install Payment SDK (5 min)
```bash
npm install react-native-purchases
```

### 3️⃣ Connect Everything (2 hours)
Use RevenueCat (free service) to connect your app to both stores with one API.

---

## Visual Explanation

### What You Built ✅

```
┌─────────────────────────────────────────┐
│         FitSnapshot App                 │
│                                         │
│  ┌────────────────────────────────┐    │
│  │  Feature Flag System           │    │
│  │  ✅ Blocks premium features    │    │
│  │  ✅ Shows "Upgrade" buttons    │    │
│  │  ✅ Tracks subscription status │    │
│  └────────────────────────────────┘    │
│                                         │
│  User taps "Upgrade to Premium"        │
│           ▼                             │
│  ┌────────────────────────────────┐    │
│  │  PaywallModal                  │    │
│  │  ✅ Shows pricing              │    │
│  │  ✅ Shows benefits             │    │
│  │  ❌ Purchase = MOCK (testing) │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### What You Need to Add ⚠️

```
┌─────────────────────────────────────────┐
│         FitSnapshot App                 │
│                                         │
│  User taps "Purchase" button           │
│           ▼                             │
│  ┌────────────────────────────────┐    │
│  │  RevenueCat SDK                │    │  ← Install this!
│  │  (react-native-purchases)      │    │
│  └────────────────────────────────┘    │
│           │                             │
└───────────┼─────────────────────────────┘
            │
            ├──────────────┬──────────────┐
            ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
    │ RevenueCat  │  │ App Store   │  │ Play Store   │
    │  Service    │  │  Connect    │  │   Console    │
    │  (Free)     │  │  (iOS)      │  │  (Android)   │
    └─────────────┘  └─────────────┘  └──────────────┘
         │                │                  │
         └────────────────┴──────────────────┘
                          │
                          ▼
                  Validates Purchase
                  Returns Success
                          │
                          ▼
              Updates Your Feature Flags
              Premium Features Unlock! ✅
```

---

## Step-by-Step: Make It Real

### Step 1: Create Products in App Store Connect (iOS)

1. Go to https://appstoreconnect.apple.com
2. Click your app → **Features** → **Subscriptions**
3. Create subscription group: "FitSnapshot Premium"
4. Add 3 products:
   ```
   ID: fitsnapshot_monthly
   Price: $6.99
   Duration: 1 month

   ID: fitsnapshot_annual
   Price: $49.99
   Duration: 1 year

   ID: fitsnapshot_lifetime
   Price: $99.99
   Type: Non-consumable
   ```

**Why these exact IDs?** Your `PaywallModal.tsx` will reference them:
```typescript
const PRICING = {
  monthly: {
    priceId: 'monthly_subscription', // Maps to fitsnapshot_monthly
  },
  // ...
};
```

### Step 2: Create Products in Google Play Console (Android)

1. Go to https://play.google.com/console
2. Your app → **Monetize** → **Products**
3. Create same 3 products with same IDs:
   ```
   ID: fitsnapshot_monthly
   Price: $6.99

   ID: fitsnapshot_annual
   Price: $49.99

   ID: fitsnapshot_lifetime
   Price: $99.99
   ```

### Step 3: Set Up RevenueCat (Bridge Between App & Stores)

**Why RevenueCat?**
- Free up to $10k/month revenue
- Handles both iOS and Android with one API
- No backend server needed
- Auto validates receipts
- Beautiful analytics dashboard

**Setup:**
1. Go to https://www.revenuecat.com → Sign up
2. Create project: "FitSnapshot"
3. Add iOS app:
   - Upload your App Store Connect credentials
   - RevenueCat imports your products automatically
4. Add Android app:
   - Upload your Google Play service account JSON
   - RevenueCat imports your products automatically
5. Create entitlement: "premium"
6. Link all products to "premium" entitlement

### Step 4: Install RevenueCat SDK

```bash
cd C:\Users\megaa\OneDrive\Desktop\projects\shape-progress\FitSnapshot
npm install react-native-purchases
```

For Expo:
```bash
npx expo install react-native-purchases
```

### Step 5: Get Your API Keys

In RevenueCat Dashboard:
- Go to **API Keys**
- Copy iOS key: `appl_xxxxxxxxxx`
- Copy Android key: `goog_xxxxxxxxxx`

### Step 6: Add This Code

**Create `services/revenueCatService.ts`:**

```typescript
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';
import featureFlagService from './featureFlagService';

const API_KEY = Platform.select({
  ios: 'appl_YOUR_IOS_KEY_HERE',      // Paste your iOS key
  android: 'goog_YOUR_ANDROID_KEY_HERE', // Paste your Android key
});

class RevenueCatService {
  async initialize() {
    if (!API_KEY) return;

    await Purchases.configure({ apiKey: API_KEY });
    await this.syncSubscriptionStatus();
  }

  async getOfferings() {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || [];
  }

  async purchase(packageToPurchase) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);

      // THIS IS THE KEY CONNECTION!
      // When purchase succeeds, update your feature flags
      const hasPremium = Object.keys(customerInfo.entitlements.active).length > 0;

      if (hasPremium) {
        await featureFlagService.updateSubscriptionStatus({
          tier: 'premium',
          isPremium: true,
          isLifetime: false,
        });
      }

      return true;
    } catch (error) {
      console.error('Purchase error:', error);
      return false;
    }
  }

  async syncSubscriptionStatus() {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasPremium = Object.keys(customerInfo.entitlements.active).length > 0;

    if (hasPremium) {
      await featureFlagService.updateSubscriptionStatus({
        tier: 'premium',
        isPremium: true,
        isLifetime: false,
      });
    } else {
      await featureFlagService.resetToFreeTier();
    }
  }

  async restorePurchases() {
    const customerInfo = await Purchases.restorePurchases();
    await this.syncSubscriptionStatus();
    return true;
  }
}

export default new RevenueCatService();
```

**Update `app/_layout.tsx`:**

```typescript
import revenueCatService from '@/services/revenueCatService';

export default function RootLayout() {
  useEffect(() => {
    // Initialize RevenueCat when app starts
    revenueCatService.initialize();
  }, []);

  // ... rest of your code
}
```

**Update `components/monetization/PaywallModal.tsx`:**

Replace the mock `handlePurchase` function:

```typescript
import revenueCatService from '@/services/revenueCatService';
import { PurchasesPackage } from 'react-native-purchases';

const PaywallModal = ({ visible, onClose }) => {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (visible) {
      loadPackages();
    }
  }, [visible]);

  const loadPackages = async () => {
    const pkgs = await revenueCatService.getOfferings();
    setPackages(pkgs);

    // Default to annual
    const annual = pkgs.find(p => p.identifier === '$rc_annual');
    setSelectedPackage(annual || pkgs[0]);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    try {
      // THIS CALLS THE REAL STORE!
      const success = await revenueCatService.purchase(selectedPackage);

      if (success) {
        // Refresh your app state
        await refreshSubscriptionStatus(); // from useUser()
        Alert.alert('Success!', 'Premium activated!');
        onClose();
      } else {
        Alert.alert('Error', 'Purchase was cancelled or failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
    setIsProcessing(false);
  };

  return (
    <Modal visible={visible}>
      {/* Your existing UI */}
      {packages.map(pkg => (
        <PricingCard
          key={pkg.identifier}
          price={pkg.product.priceString} // Real price from store!
          onPress={() => {
            setSelectedPackage(pkg);
            handlePurchase();
          }}
        />
      ))}
    </Modal>
  );
};
```

---

## Testing

### iOS Test (Using Sandbox)

1. **Build for TestFlight:**
   ```bash
   eas build --platform ios
   ```

2. **Create Sandbox Tester:**
   - App Store Connect → Users and Access → Sandbox Testers
   - Add test email: `test@yourcompany.com`

3. **Install on iPhone:**
   - Upload build to TestFlight
   - Install on device

4. **Test Purchase:**
   - Sign out of App Store on iPhone
   - Open app → Tap "Upgrade to Premium"
   - Sign in with sandbox account when prompted
   - Complete purchase (won't be charged!)
   - Premium features unlock ✅

5. **Verify:**
   - RevenueCat Dashboard → Customers
   - Should see your test user with active subscription

### Android Test (Using Internal Testing)

1. **Build for Play Store:**
   ```bash
   eas build --platform android
   ```

2. **Upload to Internal Testing:**
   - Play Console → Testing → Internal testing
   - Upload AAB
   - Add your email as tester

3. **Install on Android:**
   - Check email for test link
   - Install from Play Store

4. **Test Purchase:**
   - Open app → Tap "Upgrade to Premium"
   - Complete purchase (won't be charged!)
   - Premium features unlock ✅

---

## What Happens When User Buys?

```
1. User taps "Upgrade to Premium" button
   ↓
2. PaywallModal.tsx opens
   ↓
3. Calls revenueCatService.getOfferings()
   ↓
4. RevenueCat fetches products from App Store/Play Store
   ↓
5. Shows real prices: $6.99, $49.99, $99.99
   ↓
6. User selects Annual ($49.99)
   ↓
7. Calls revenueCatService.purchase(annualPackage)
   ↓
8. RevenueCat calls native iOS/Android payment API
   ↓
9. Apple/Google payment sheet appears
   ↓
10. User enters password/Face ID
   ↓
11. Apple/Google processes payment ($49.99 charged)
   ↓
12. Apple/Google sends receipt to RevenueCat
   ↓
13. RevenueCat validates receipt
   ↓
14. RevenueCat returns success to your app
   ↓
15. Your code calls:
    featureFlagService.updateSubscriptionStatus({
      isPremium: true
    })
   ↓
16. useUser() hook updates
   ↓
17. All FeatureGates check premium status
   ↓
18. Premium features unlock!
   ↓
19. User sees:
    - Home: All charts visible
    - Gallery: "∞" storage limit
    - Settings: "Premium Active" badge
```

---

## Production Checklist

Before launching to real users:

### Code
- [ ] Add RevenueCat API keys (Step 6)
- [ ] Remove test premium toggle (or hide with `__DEV__`)
- [ ] Add "Restore Purchases" button in Settings
- [ ] Test both iOS and Android purchases
- [ ] Verify premium features unlock after purchase

### App Stores
- [ ] All products approved (iOS requires review)
- [ ] Pricing set for all countries
- [ ] Add app privacy details about purchases
- [ ] Add subscription terms to app description

### Legal
- [ ] Add Terms of Service URL
- [ ] Add Privacy Policy URL
- [ ] Add subscription terms (auto-renewal, cancellation)

---

## Revenue Breakdown

**When user pays $49.99/year:**

```
$49.99 Total
  ↓
- $15.00 (30%) Apple/Google fee (first year)
  ↓
= $34.99 → You receive

After 1 year:
- $7.50 (15%) Apple/Google fee (reduced!)
  ↓
= $42.49 → You receive
```

**Deposited to your bank:**
- Apple: Monthly payout
- Google: Monthly payout

**RevenueCat cost:**
- Free up to $10,000/month revenue
- 1% above $10k

---

## Common Questions

**Q: Do I need a backend server?**
A: No! RevenueCat handles everything.

**Q: Is RevenueCat free?**
A: Yes, until you make $10k/month.

**Q: What about receipt validation?**
A: RevenueCat does this automatically.

**Q: Can users restore purchases?**
A: Yes, call `revenueCatService.restorePurchases()`

**Q: What if purchase fails?**
A: RevenueCat retries and notifies you. User stays on free tier.

**Q: How do I refund?**
A: Users request refunds directly from Apple/Google, not your app.

**Q: Can I change pricing later?**
A: Yes, update in App Store Connect / Play Console.

---

## Time Estimate

- **App Store setup**: 30 min
- **Play Store setup**: 30 min
- **RevenueCat setup**: 20 min
- **Code changes**: 1-2 hours
- **Testing**: 1 hour

**Total: 3-4 hours to go live!**

---

## Need Help?

**Detailed Guide**: See `APP_STORE_SETUP_GUIDE.md` for complete walkthrough

**RevenueCat Docs**: https://docs.revenuecat.com/docs/reactnative

**Your feature flags are ready.** Just add the payment connection! 🚀
