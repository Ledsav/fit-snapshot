# RevenueCat In-App Purchases — Design Spec

**Date:** 2026-07-23
**Status:** Approved (brainstorming), pending implementation plan
**Platform:** Android only (iOS out of scope)

## Problem

FitSnapshot's entire freemium model is built and wired, but the purchase itself is fake.
`components/monetization/PaywallModal.tsx` `handlePurchase()` waits 1 second and calls
`setTestPremiumStatus(true)`. Premium status lives in plain AsyncStorage
(`services/featureFlagService.ts`) with no receipt validation — trivially bypassable,
does not survive reinstall, and has no real payment path. There is no IAP SDK in the project.

## Goal

Replace the fake purchase with **real in-app purchases via RevenueCat + Google Play Billing**,
feeding the *existing* feature-gating layer unchanged. Make RevenueCat the source of truth for
premium status so it can no longer be bypassed.

**This project does not redesign gating.** The free/premium split, `FeatureGate`, `PremiumLock`,
limit logic (`canAddPhoto`/`canMakeComparison`/`canExport`), and the `Feature` enum all stay as-is.

## Decisions (locked during brainstorming)

- **Pricing (Budget hybrid):** Annual **€4.99/yr with a 7-day free trial** (hero) + **Lifetime €9.99**
  one-time. **No monthly plan.** Prices are easy to change later; buyers are grandfathered.
- **Prices shown live** from RevenueCat offerings (`pkg.product.priceString`) — localized by Google
  automatically. Stop hardcoding `$`/prices from `config/pricing.json`.
- **Free photo limit = 20** (final). Delete the dead `limits.free.maxPhotos: 50` block in
  `config/features.json` (never read by any code; the enforced value comes from
  `config/limits.json` → `freeTier.maxPhotos = 20`).
- **Identity/restore:** purchases require **no sign-in** (anonymous RevenueCat ID; purchase tied to
  the Google Play account). A **Restore Purchases** button is provided (Google requires it); on
  Android restore works off the Play account. When a user signs in for GIF (Firebase), link with
  `Purchases.logIn(firebaseUid)`; `Purchases.logOut()` on sign-out.
- **AsyncStorage demoted to an offline cache.** RevenueCat `customerInfo` is the source of truth.
- **`setTestPremiumStatus` kept but `__DEV__`-only** for UI testing without Play setup.

## Architecture / data flow

```
Google Play Billing  ──►  RevenueCat  ──►  services/purchaseService.ts (NEW)
                                              │  (maps customerInfo → UserSubscriptionStatus)
                                              ▼
                    services/featureFlagService.ts  (AsyncStorage = offline cache, not truth)
                                              │
                                              ▼
                    context/UserContext.tsx  ──►  FeatureGate / PremiumLock / PaywallModal / limits
```

- **Launch sequence:** read cached status (instant, offline-safe) → configure RevenueCat → fetch
  `customerInfo` → `syncFromRevenueCat(status)` → subscribe to `addCustomerInfoUpdateListener` so
  purchases, renewals, expiries, and restores update the app automatically.
- **Security:** premium state is validated server-side by RevenueCat against Google receipts.
  AsyncStorage tampering is corrected on the next sync. (Server-side checks on the GIF backend are
  out of scope; that backend already rate-limits independently.)

## Components

### New: `services/purchaseService.ts`
Thin wrapper over `react-native-purchases`. Pure, testable mapping logic separated from SDK calls.
- `configure(apiKey: string, appUserID?: string): Promise<void>`
- `getOfferings(): Promise<PurchasesOffering | null>` (the `default` offering)
- `purchasePackage(pkg): Promise<UserSubscriptionStatus>` (returns mapped status; rethrows/flags
  user-cancellation distinctly)
- `restorePurchases(): Promise<UserSubscriptionStatus>`
- `logIn(uid) / logOut()`
- `getCustomerInfo(): Promise<UserSubscriptionStatus>`
- `mapCustomerInfoToStatus(customerInfo): UserSubscriptionStatus` — **pure function, unit-tested.**
  - `premium` entitlement active → `isPremium: true`
  - entitlement `expirationDate == null` while active → `isLifetime: true` (lifetime purchase)
  - `expiresAt = entitlement.expirationDate` for subscriptions
  - no active entitlement → free-tier default

### Changed: `services/featureFlagService.ts`
- Add `syncFromRevenueCat(status: UserSubscriptionStatus)` → sets `subscriptionStatus` + persists to
  AsyncStorage as cache.
- AsyncStorage load on init remains (fast offline start) but is understood as cache.
- **No changes** to `canAddPhoto`/`canMakeComparison`/`canExport`/`hasFeatureAccess`/limits.

### Changed: `context/UserContext.tsx`
- On mount: configure RevenueCat, fetch + sync status, register the customer-info update listener
  (cleaned up on unmount).
- Bridge to `AuthContext`: effect on `useAuth().user` → `logIn(uid)` / `logOut()`.
- `refreshSubscriptionStatus` pulls from RevenueCat (falls back to cache on network failure).
- Expose `restorePurchases()` and `purchase(pkg)` (or the paywall calls purchaseService directly and
  relies on the listener to refresh context — implementer picks the cleaner wiring).

### Changed: `components/monetization/PaywallModal.tsx`
- `handlePurchase` → real `purchaseService.purchasePackage(selectedPkg)`. Remove fake
  `setTimeout` + `setTestPremiumStatus(true)` + `alert`.
- **Remove the monthly `PricingCard`.** Show Annual (hero, "7-day free trial, then <price>/yr") +
  Lifetime.
- Prices/labels come from the RevenueCat offering packages, not `config/pricing.json`.
- Error handling: silently dismiss on user-cancellation; show an error message otherwise.
- Add a **Restore Purchases** text link.

### Changed: `app/(tabs)/settings.tsx`
- Add a **Restore Purchases** action (Google requirement). Keep the existing `__DEV__` test toggle.

### Cleanup
- Delete dead `limits` block (or just the `50`) from `config/features.json`.

## Store & dashboard setup (user-performed prerequisite)
A separate step-by-step checklist will be produced. Summary:
- **Play Console:** subscription `fitsnapshot_premium_annual` (€4.99/yr + 7-day free-trial offer);
  one-time product `fitsnapshot_premium_lifetime` (€9.99).
- **RevenueCat:** entitlement `premium`; `default` offering with an Annual package + a Lifetime
  package; both products attached to `premium`; Play service-account credentials connected.
- **`.env`:** `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=<public SDK key>`.

## Testing

- **Automated (in this project):** jest unit tests for `mapCustomerInfoToStatus` with the SDK mocked
  — cases: annual-active, lifetime-active (null expiry), expired subscription, no entitlement.
  Follows the existing `services/*.test.ts` pattern (`@react-native-async-storage` mock style).
- **On-device (deferred to user, like the camera QA):** real sandbox purchases via a Play
  **internal-testing** track + license testers (test purchases are free). Requires the products to
  exist first. The `__DEV__` toggle covers UI testing before that.

## Non-goals

- iOS (no build, no App Store products).
- Features flagged `enabled: false` (`cloud_backup`, `video_export`, `pdf_reports`,
  `custom_categories`, `custom_reminders`, `premium_themes`, `custom_watermarks`, `progress_insights`).
- Ads (the `ad_free` entitlement is moot — no ads exist).
- Server-side entitlement verification on the GIF Cloud Function.
- Any change to the free/premium split beyond the 20-photo limit confirmation.

## Dependencies / risks

- `react-native-purchases` requires a **dev build** (already in use via `expo-dev-client`).
  Autolinks on Android; no Expo config plugin needed. Verify no peer-dep conflict on RN 0.86 /
  Expo SDK 57 at install time.
- Full purchase flow cannot be verified in this sandbox (no device, no Play products) — same
  deferral model as the vision-camera work.
