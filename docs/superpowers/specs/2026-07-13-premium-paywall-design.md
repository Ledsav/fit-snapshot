# Local-only positioning + meaningful paywall — Design

Date: 2026-07-13
Status: Approved for implementation

## Problem

Today the app has two disconnected access-control systems:

1. **Firebase/Google Auth** — real, but only gates one feature (GIF generation's cloud-function call). Signing in unlocks nothing else.
2. **"Premium"** — gates everything else (side-by-side/grid/custom comparison, export limits, photo-count limits), but is a bare local `AsyncStorage` boolean. The real "Upgrade" button in `PaywallModal` just calls the same `setTestPremiumStatus(true)` that a "Test Mode" toggle exposes directly in the shipped Settings screen. There is no IAP library in the project at all.

Additionally, `config/features.json` lists a `cloud_backup` feature (disabled, never built) whose copy ("cloud backup", "sync across devices") contradicts a local-only/privacy positioning.

## Goals

1. Retire the unbuilt `cloud_backup` feature and its "cloud backup/sync" copy; reposition unlimited storage as on-device/private.
2. Make the paywall real: integrate RevenueCat for actual App Store/Play Billing purchases.
3. Entangle premium with the account: purchasing requires being signed in, and the entitlement is identified by Firebase UID, so Restore Purchases recovers premium on a new device/reinstall via the same Google account.
4. Remove the "Test Mode" toggle from what ships to users — gate it behind an env flag present only in development/preview EAS build profiles.

## Non-goals

- Removing Firebase Auth. It stays, and gains real purpose (identifying the premium entitlement).
- Removing or reworking GIF generation. It stays as-is — it's transient cloud-function processing of images to produce a GIF, not persistent cloud storage/sync, so it doesn't conflict with the local-only pitch.
- Changing photo storage architecture. Photos remain 100% on-device (`FileSystem` + `AsyncStorage`); no backend for photo data is introduced.
- Building a custom receipt-validation backend. RevenueCat's managed service replaces that need.

## Architecture

### Piece A — Retire `cloud_backup`

- Remove the `cloud_backup` entry from `config/features.json`.
- Remove `Feature.CLOUD_BACKUP` from `constants/Features.ts`.
- Update `unlimitedStorageDesc` copy in `localization/translations.ts` (all 5 locales: en/es/it/de/fr) to describe unlimited *on-device* storage instead of "cloud backup".
- No other files reference `cloud_backup`/`CLOUD_BACKUP` (verified via grep across the repo).

### Piece B — RevenueCat integration

**New service: `services/purchaseService.ts`**

Thin wrapper around `react-native-purchases`, mirroring the existing `authService.ts`/`gifService.ts` pattern (no other file imports the RevenueCat SDK directly):

- `initPurchases(): void` — calls `Purchases.configure()` with the platform API key (`EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`), called once from `app/_layout.tsx` at boot.
- `getOfferings(): Promise<PurchasesOffering | null>` — fetches the current offering; returns `null` on failure (no throw) so callers render an empty/error state instead of crashing.
- `purchasePackage(pkg): Promise<{ success: boolean; error?: string }>`
- `restorePurchases(): Promise<{ success: boolean; error?: string }>`
- `identifyUser(uid: string): Promise<void>` — calls `Purchases.logIn(uid)`.
- `resetUser(): Promise<void>` — calls `Purchases.logOut()`.
- `getCustomerInfo(): Promise<CustomerInfo | null>`
- `onCustomerInfoUpdate(callback): () => void` — subscribes to RevenueCat's listener, returns an unsubscribe function.

**Identity wiring — `context/AuthContext.tsx`**

- On `onAuthStateChange` receiving a signed-in user: `purchaseService.identifyUser(user.uid)`.
- On sign-out: `purchaseService.resetUser()`.

**Premium source of truth — `context/UserContext.tsx`**

- `isPremium`/`subscriptionStatus` are derived from RevenueCat's `CustomerInfo.entitlements.active["premium"]` via `purchaseService.onCustomerInfoUpdate`, not from `featureFlagService`'s persisted `AsyncStorage` subscription flag.
- `featureFlagService` keeps its existing no-arg method signatures (`canAddPhoto()`, `hasFeatureAccess()`, `canMakeComparison()`, `canExport()`, `isPremiumUser()`) — **`PhotoContext.tsx` calls `featureFlagService.canAddPhoto()` directly, bypassing `UserContext`, so those signatures can't change.** Instead, `featureFlagService` gains an in-memory `setPremiumStatus(isPremium: boolean, tier: SubscriptionTier): void` setter (no persistence — RevenueCat's SDK already persists `CustomerInfo` on-device, so duplicating that would just create a second, potentially stale, source of truth). `UserContext`'s customer-info listener calls this setter on every update. `isPremiumUser()` reads this in-memory value (defaulting to `false` before the first resolution) instead of loading/writing its own `SUBSCRIPTION_STATUS` `AsyncStorage` key. The `loadSubscriptionStatus`/`saveSubscriptionStatus`/`updateSubscriptionStatus`/`resetToFreeTier` methods and the `SUBSCRIPTION_STATUS` storage key are removed as dead code.
- `setTestPremiumStatus` becomes a dev-only override (see Piece C) that calls the same in-memory `setPremiumStatus()` setter directly — it's a manual override of the same in-memory value RevenueCat normally drives, not a separate code path.

**Purchase flow — `components/monetization/PaywallModal.tsx`**

- On open, calls `purchaseService.getOfferings()` and renders live packages/prices (replacing the hardcoded `config/pricing.json` display — real per-region store pricing only exists via the SDK).
- If offerings fail to load: inline "can't load plans right now, try again" state, no crash.
- `handlePurchase`: if `useAuth().user` is null, call `signIn()` first (existing flow); once signed in (and thus `purchaseService.identifyUser` has run via `AuthContext`), call `purchaseService.purchasePackage(selectedPackage)`. On success, `UserContext` picks up the new entitlement automatically via the customer-info listener — no manual state flip needed.
- Remove the `setTestPremiumStatus(true)` call from the real purchase path entirely.

**Restore Purchases — `app/(tabs)/settings.tsx`**

- New Settings row calling `purchaseService.restorePurchases()`, required for App Store review compliance on any app selling non-consumable/subscription IAP.

### Piece C — Dev-flag-gated Test Mode

- `eas.json`: add `"env": { "EXPO_PUBLIC_ENABLE_TEST_PREMIUM": "true" }` to the `development` and `preview` build profiles. `production` gets no such key (unset → falsy).
- `settings.tsx`: the "Test Mode" row renders only when `process.env.EXPO_PUBLIC_ENABLE_TEST_PREMIUM === 'true'`.
- `UserContext`: the local dev-override read (see Piece B) is itself gated on the same env check, so the override code path doesn't just hide its button in production — it's inert.
- Local development without EAS (`expo start`) needs the same var in `.env`/`.env.example` for parity; documented in `docs/PREMIUM_SETUP.md`.

## Data flow summary

```
Sign in (Google/Firebase) ──▶ AuthContext.user set
                                  │
                                  ▼
                    purchaseService.identifyUser(uid)
                                  │
                                  ▼
                 RevenueCat resolves entitlements for this uid
                                  │
                                  ▼
        UserContext subscribes to customer-info updates
                                  │
                                  ▼
            featureFlagService.setPremiumStatus(isPremium, tier)
                                  │
                                  ▼
   featureFlagService.hasFeatureAccess(feature) / canAddPhoto() / etc.
        (called from UserContext AND directly from PhotoContext)
```

Usage counters (photo count, daily comparisons, monthly exports) remain a separate, purely local flow untouched by this design — `PhotoContext`/`featureFlagService` as they exist today.

## Error handling

- Offerings fetch failure → inline retry state in paywall, not a crash.
- Purchase failure/cancellation → surfaced via existing `Alert`-based error pattern already used in `settings.tsx`.
- `identifyUser`/`resetUser` failures are logged, non-fatal — auth state and premium resolution are independent enough that a RevenueCat hiccup shouldn't block sign-in/out.
- Restore with no purchases found → clear "no purchases to restore" message, not treated as an error.

## Testing

- Manual QA via `EXPO_PUBLIC_ENABLE_TEST_PREMIUM` dev override to exercise premium-gated UI without needing real store products configured yet.
- Once RevenueCat + store products exist (see `docs/PREMIUM_SETUP.md`), sandbox/license testers exercise the real purchase → restore → cross-device flow.
- No existing automated test suite in the repo to extend (confirmed: no `__tests__`/`*.test.*` files found); manual verification only, consistent with current project practice.

## Manual setup (outside this branch)

Full checklist lives in `docs/PREMIUM_SETUP.md` (written as part of this change) — RevenueCat account creation, App Store Connect + Google Play Console product setup, entitlement/offering mapping, API keys, sandbox testers. Code in this branch is written to work once that setup is complete; until then, the paywall will show its "can't load plans" error state, which is expected.
