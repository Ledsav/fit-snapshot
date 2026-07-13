# Making the paywall real: manual setup checklist

This is everything that has to happen **outside this repo** — in your RevenueCat, Apple, and Google dashboards — before real purchases will work. The code in this branch is written to work once this checklist is done. Until then, the paywall will show a "can't load plans right now" state, which is expected — it's not a bug, it just has nothing to fetch yet.

Do these roughly in order; later steps depend on earlier ones.

## 1. Apple: App Store Connect

1. Enroll in the Apple Developer Program if you haven't (developer.apple.com, $99/yr).
2. Create the app record in App Store Connect if it doesn't exist yet (bundle ID must match `app.json`'s iOS bundle identifier).
3. Agree to the "Paid Applications" agreement under Agreements, Tax, and Banking — **IAP products can't be created until this is signed**, and it requires banking/tax info.
4. Under the app → Features → In-App Purchases, create three products:
   - Auto-renewable subscription: **monthly** (matches `config/pricing.json`'s `monthly.priceId`)
   - Auto-renewable subscription: **annual** (matches `annual.priceId`)
   - Non-consumable: **lifetime** (matches `lifetime.priceId`)
   - For the two subscriptions, put them in the same Subscription Group so a user can only hold one at a time.
5. Add sandbox testers under Users and Access → Sandbox → Testers (use throwaway emails, not your real Apple ID) — you'll sign into these on a test device to make free test purchases.

## 2. Google: Play Console

1. Create the app in Play Console if it doesn't exist (package name must match `app.json`'s Android package).
2. Complete the app's store listing and content rating enough to enable Monetization setup (Play requires a minimally-complete listing before Billing products can go live, even in internal testing).
3. Under Monetize → Products, create matching products:
   - Subscription: **monthly**
   - Subscription: **annual**
   - In-app product (one-time): **lifetime**
4. Add license testers under Setup → License testing (their Google accounts can make test purchases that don't charge real money).
5. Upload at least one build to an internal testing track — Play requires this before Billing products are purchasable, even by testers.

## 3. RevenueCat

1. Create a free account at revenuecat.com.
2. Create a Project, then add two Apps within it: one iOS, one Android.
3. Connect each app to its store:
   - iOS: provide your App Store Connect API key (Users and Access → Keys → App Store Connect API in Apple's dashboard).
   - Android: provide a Google Play service account JSON with access to your app (Play Console → Setup → API access).
4. Import/create Products in RevenueCat matching the store products from steps 1–2 (RevenueCat can often detect them automatically once the store connections above are set up).
5. Create an Entitlement named exactly `premium`. Attach all three products to it.
6. Create an Offering (e.g. `default`) containing three Packages — monthly, annual, lifetime — each pointing at its product. Mark it the current offering.
7. Under Project Settings → API Keys, copy the **public** SDK keys for iOS and Android (not the secret key).

## 4. Wire the keys into this repo

Add to `.env` (and your EAS secrets for non-local builds):

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=<public iOS key from RevenueCat>
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=<public Android key from RevenueCat>
```

`.env.example` documents these placeholders; fill in `.env` locally and add the same two as EAS secrets (`eas secret:create`) for preview/production builds.

## 5. Test before shipping

- Because `react-native-purchases` is a native module, you need an EAS **development or preview build** (custom dev client) — it will not work in plain Expo Go.
- On iOS: sign into a sandbox tester account on the device (Settings → App Store → Sandbox Account), then purchase in the app — no real charge.
- On Android: sign into a license tester's Google account on the device, install the internal-testing build, purchase in the app — no real charge.
- Verify: purchase succeeds → premium features unlock → force-quit and reopen → still premium → sign out → sign back in (or reinstall + sign in) → tap Restore Purchases → premium comes back.
- Only after this works on both platforms should you submit the app for review with IAP enabled.

## Reference: what the app expects

- Entitlement identifier: **`premium`** (exact string, case-sensitive — the app checks `customerInfo.entitlements.active["premium"]`).
- Three products/packages: monthly subscription, annual subscription, lifetime non-consumable.
- Purchases are identified by Firebase UID (`Purchases.logIn(firebaseUid)`), so a user must be signed in with Google before purchasing — this is intentional, see the design doc at `docs/superpowers/specs/2026-07-13-premium-paywall-design.md`.
