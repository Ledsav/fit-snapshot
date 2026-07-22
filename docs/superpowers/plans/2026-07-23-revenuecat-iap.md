# RevenueCat In-App Purchases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FitSnapshot's fake premium purchase with real in-app purchases via RevenueCat + Google Play Billing, feeding the existing feature-gating layer unchanged.

**Architecture:** RevenueCat becomes the source of truth for premium status. A new `purchaseService` wraps the RevenueCat SDK and maps its `customerInfo` into the app's existing `UserSubscriptionStatus` shape. `featureFlagService` keeps that status (AsyncStorage demoted to an offline cache); `UserContext` configures RevenueCat on mount, syncs status, and listens for updates. The paywall and settings call the service for purchase/restore.

**Tech Stack:** React Native 0.86 / Expo SDK 57, `react-native-purchases` (RevenueCat), TypeScript, Jest (`jest-expo`).

## Global Constraints

- Platform: **Android only**. Do not add iOS products, keys, or code paths.
- Pricing: Annual **€4.99/yr + 7-day free trial**, Lifetime **€9.99**, **no monthly plan**. Prices are **displayed live** from RevenueCat offerings (`pkg.product.priceString`) — never hardcode price or currency.
- RevenueCat entitlement identifier: exactly `premium`. Offering: the `current`/`default` offering.
- Free photo limit stays **20** (`config/limits.json` → `freeTier.maxPhotos`). Do **not** change gating logic, the `Feature` enum, `FeatureGate`, `PremiumLock`, or limit math.
- `setTestPremiumStatus` remains but stays **`__DEV__`-only** (already gated in settings).
- Env var name: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
- Every new user-facing string must be added to **all 5 locales** in `localization/translations.ts` (en, es, it, de, fr) — translations provided in the relevant tasks.
- Commit style: **no `Co-Authored-By` trailer** (project rule).
- Verify each task with `npx tsc --noEmit` and `npx jest` (the full purchase flow itself is verified on-device by the user, see Manual Actions).

---

## Manual Actions Required From You (Alberto)

These cannot be done in code and must be completed for the feature to work end-to-end. Nothing in Tasks 1–7 requires these to be finished *first* (the code compiles and unit-tests pass without them), but the **on-device purchase test and store release do.**

**A. Create the RevenueCat account & project**
1. Sign up at https://app.revenuecat.com → create a new **Project** ("FitSnapshot").
2. Add an **App** → platform **Google Play** → package name `com.ledsav.fitsnapshot`.
3. Connect Play: upload a **Google Play service-account JSON** with billing permissions (RevenueCat's guide walks through creating it in Google Cloud → IAM → Service Accounts, then granting it in Play Console → Users & permissions).
4. Copy the **Android public SDK key** (starts with `goog_...`).

**B. Create the products in Google Play Console** (needs the $25 developer account — see the launch checklist)
1. Subscription → product id **`fitsnapshot_premium_annual`**, base plan **annual**, price **€4.99/yr**, add an **offer** with a **7-day free trial** (Free trial phase, 1 week).
2. In-app product (one-time) → product id **`fitsnapshot_premium_lifetime`**, price **€9.99**.

**C. Wire products into RevenueCat**
1. **Entitlements** → create `premium`.
2. **Products** → import both Play products.
3. Attach **both** products to the `premium` entitlement.
4. **Offerings** → in the default offering, add an **Annual** package (→ annual sub) and a **Lifetime** package (→ lifetime product).

**D. Add the key to the app**
- Put the key in `.env`: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxx` (Task 1 adds the placeholder line).

**E. Rebuild the dev client**
- `react-native-purchases` is a native module → after Task 1 you must run a new EAS dev build (`eas build --profile development --platform android`) and install it. Metro fast-refresh alone won't pick up the native module.

**F. On-device purchase testing (after Tasks 1–7 + a dev build)**
1. Play Console → create an **Internal testing** track, upload a build, add your Google account as a **license tester** (Play Console → Settings → License testing). Test purchases are **free** and won't charge you.
2. Verify: buy Annual (trial starts), buy Lifetime, **Restore Purchases** on a fresh install, premium features unlock, expiry flips back to free.

**G. Create the `fitsnapshot.help@gmail.com` inbox** (referenced by the privacy policy & Play listing) — unrelated to code but needed before store submission.

---

## File Structure

- **Create** `services/purchaseService.ts` — RevenueCat wrapper + pure `mapCustomerInfoToStatus`.
- **Create** `services/purchaseService.test.ts` — unit tests (SDK mocked).
- **Modify** `services/featureFlagService.ts` — add `syncFromRevenueCat`.
- **Modify** `services/featureFlagService.test.ts` (create if absent) — test the new method.
- **Modify** `context/UserContext.tsx` — configure/sync/listen, expose `restorePurchases`/`purchase`, auth bridge.
- **Modify** `components/monetization/PaywallModal.tsx` — real purchase, live prices, drop monthly, restore link.
- **Modify** `app/(tabs)/settings.tsx` — Restore Purchases action; real Manage Subscription deep link.
- **Modify** `localization/translations.ts` — new keys × 5 locales.
- **Modify** `.env`, `.env.example` — key placeholder.
- **Modify** `config/features.json` — delete dead `limits` block.

---

### Task 1: Install SDK, env wiring, dead-config cleanup

**Files:**
- Modify: `package.json` (via installer)
- Modify: `.env`, `.env.example`
- Modify: `config/features.json` (delete dead `limits` block, lines ~205-217)

**Interfaces:**
- Produces: the `react-native-purchases` dependency and `process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` used by Task 3/5.

- [ ] **Step 1: Install the SDK (Expo-pinned version)**

Run: `npx expo install react-native-purchases`
Expected: adds `react-native-purchases` to `package.json` dependencies with an SDK-57-compatible version, no peer-dep errors.

- [ ] **Step 2: Add the env placeholder**

Append to `.env.example`:
```
# RevenueCat (Google Play) public SDK key — from app.revenuecat.com project settings
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_your_key_here
```
Add the same line to `.env` (real key filled in by you later; a placeholder is fine for compile/tests).

- [ ] **Step 3: Delete the dead limits block in `config/features.json`**

Remove the entire `"limits": { ... }` object (the trailing block after the `features` map) — it is never read; the enforced limits come from `config/limits.json`. Ensure the JSON remains valid (the `features` object becomes the last key).

- [ ] **Step 4: Verify compile**

Run: `npx tsc --noEmit`
Expected: exit 0 (no type errors introduced).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.example config/features.json
git commit -m "chore: add react-native-purchases, env key, drop dead features.json limits block"
```
(Do not commit `.env` — it is gitignored.)

> ⚠️ After this task, a **new dev build** is required before the app runs on device (Manual Action E). Unit tests do not need it.

---

### Task 2: `purchaseService` — pure status mapper (TDD)

**Files:**
- Create: `services/purchaseService.ts`
- Create: `services/purchaseService.test.ts`

**Interfaces:**
- Produces: `mapCustomerInfoToStatus(info: CustomerInfo): UserSubscriptionStatus` — consumed by Task 3 wrapper functions and its own tests. `UserSubscriptionStatus` and `SubscriptionTier` come from `@/constants/Features`.

- [ ] **Step 1: Write the failing test**

Create `services/purchaseService.test.ts`:
```ts
import { mapCustomerInfoToStatus } from './purchaseService';
import { SubscriptionTier } from '@/constants/Features';

// Minimal CustomerInfo factory — only the fields the mapper reads.
const makeInfo = (entitlement: any) =>
  ({ entitlements: { active: entitlement ? { premium: entitlement } : {} } } as any);

describe('mapCustomerInfoToStatus', () => {
  it('returns free when no premium entitlement is active', () => {
    const s = mapCustomerInfoToStatus(makeInfo(null));
    expect(s).toEqual({ tier: SubscriptionTier.FREE, isPremium: false, isLifetime: false });
  });

  it('maps an active subscription (has expirationDate) to premium', () => {
    const s = mapCustomerInfoToStatus(
      makeInfo({ expirationDate: '2027-01-01T00:00:00Z', willRenew: true, originalPurchaseDate: '2026-01-01T00:00:00Z' })
    );
    expect(s.isPremium).toBe(true);
    expect(s.isLifetime).toBe(false);
    expect(s.tier).toBe(SubscriptionTier.PREMIUM);
    expect(s.expiresAt).toBe('2027-01-01T00:00:00Z');
    expect(s.autoRenew).toBe(true);
  });

  it('maps a lifetime entitlement (null expirationDate) to lifetime', () => {
    const s = mapCustomerInfoToStatus(
      makeInfo({ expirationDate: null, willRenew: false, originalPurchaseDate: '2026-01-01T00:00:00Z' })
    );
    expect(s.isPremium).toBe(true);
    expect(s.isLifetime).toBe(true);
    expect(s.tier).toBe(SubscriptionTier.LIFETIME);
    expect(s.expiresAt).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest services/purchaseService.test.ts`
Expected: FAIL — cannot find module `./purchaseService` / `mapCustomerInfoToStatus` is not a function.

- [ ] **Step 3: Write the mapper**

Create `services/purchaseService.ts`:
```ts
/**
 * Purchase Service — RevenueCat wrapper.
 *
 * mapCustomerInfoToStatus is a pure function (unit-tested). The rest are thin
 * async wrappers over the RevenueCat SDK. RevenueCat is the source of truth for
 * premium status; featureFlagService caches the mapped result.
 */
import type { CustomerInfo } from 'react-native-purchases';
import { SubscriptionTier, UserSubscriptionStatus } from '@/constants/Features';

export const ENTITLEMENT_ID = 'premium';

export function mapCustomerInfoToStatus(info: CustomerInfo): UserSubscriptionStatus {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) {
    return { tier: SubscriptionTier.FREE, isPremium: false, isLifetime: false };
  }
  const isLifetime = entitlement.expirationDate == null;
  return {
    tier: isLifetime ? SubscriptionTier.LIFETIME : SubscriptionTier.PREMIUM,
    isPremium: true,
    isLifetime,
    expiresAt: entitlement.expirationDate ?? undefined,
    startedAt: entitlement.originalPurchaseDate ?? undefined,
    autoRenew: entitlement.willRenew,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest services/purchaseService.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add services/purchaseService.ts services/purchaseService.test.ts
git commit -m "feat: add purchaseService.mapCustomerInfoToStatus with tests"
```

---

### Task 3: `purchaseService` — SDK wrapper functions (TDD, SDK mocked)

**Files:**
- Modify: `services/purchaseService.ts`
- Modify: `services/purchaseService.test.ts`

**Interfaces:**
- Consumes: `mapCustomerInfoToStatus` (Task 2).
- Produces (all consumed by Task 5/6/7):
  - `configurePurchases(apiKey: string, appUserID?: string): void`
  - `getDefaultOffering(): Promise<PurchasesOffering | null>`
  - `purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult>` where `PurchaseResult = { status: UserSubscriptionStatus | null; userCancelled: boolean; error?: string }`
  - `restorePurchases(): Promise<UserSubscriptionStatus>`
  - `fetchStatus(): Promise<UserSubscriptionStatus>`
  - `identify(uid: string): Promise<UserSubscriptionStatus>`
  - `resetIdentity(): Promise<UserSubscriptionStatus>`
  - `addStatusListener(cb: (status: UserSubscriptionStatus) => void): () => void`

- [ ] **Step 1: Write the failing tests (mock the SDK)**

Append to `services/purchaseService.test.ts` (add the mock at the very top of the file, above the existing imports):
```ts
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
    logIn: jest.fn(),
    logOut: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
}));
```
Then add these tests (below the mapper describe block):
```ts
import Purchases from 'react-native-purchases';
import { purchasePackage, restorePurchases } from './purchaseService';

const activeSubInfo = {
  entitlements: { active: { premium: { expirationDate: '2027-01-01T00:00:00Z', willRenew: true, originalPurchaseDate: '2026-01-01T00:00:00Z' } } },
} as any;

describe('purchasePackage', () => {
  it('returns mapped status on success', async () => {
    (Purchases.purchasePackage as jest.Mock).mockResolvedValueOnce({ customerInfo: activeSubInfo });
    const r = await purchasePackage({} as any);
    expect(r.userCancelled).toBe(false);
    expect(r.status?.isPremium).toBe(true);
  });

  it('flags user cancellation without an error', async () => {
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({ userCancelled: true });
    const r = await purchasePackage({} as any);
    expect(r.userCancelled).toBe(true);
    expect(r.status).toBeNull();
    expect(r.error).toBeUndefined();
  });

  it('returns an error message on failure', async () => {
    (Purchases.purchasePackage as jest.Mock).mockRejectedValueOnce({ message: 'boom' });
    const r = await purchasePackage({} as any);
    expect(r.userCancelled).toBe(false);
    expect(r.error).toBe('boom');
  });
});

describe('restorePurchases', () => {
  it('maps restored customerInfo to status', async () => {
    (Purchases.restorePurchases as jest.Mock).mockResolvedValueOnce(activeSubInfo);
    const s = await restorePurchases();
    expect(s.isPremium).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest services/purchaseService.test.ts`
Expected: FAIL — `purchasePackage`/`restorePurchases` not exported.

- [ ] **Step 3: Implement the wrapper functions**

Append to `services/purchaseService.ts` (and extend the top import to include the runtime default + value types):
```ts
import Purchases, {
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

export interface PurchaseResult {
  status: UserSubscriptionStatus | null;
  userCancelled: boolean;
  error?: string;
}

export function configurePurchases(apiKey: string, appUserID?: string): void {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }
  Purchases.configure({ apiKey, appUserID: appUserID ?? null });
}

export async function getDefaultOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: mapCustomerInfoToStatus(customerInfo), userCancelled: false };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { status: null, userCancelled: true };
    }
    return { status: null, userCancelled: false, error: e?.message ?? 'Purchase failed' };
  }
}

export async function restorePurchases(): Promise<UserSubscriptionStatus> {
  const info = await Purchases.restorePurchases();
  return mapCustomerInfoToStatus(info);
}

export async function fetchStatus(): Promise<UserSubscriptionStatus> {
  const info = await Purchases.getCustomerInfo();
  return mapCustomerInfoToStatus(info);
}

export async function identify(uid: string): Promise<UserSubscriptionStatus> {
  const { customerInfo } = await Purchases.logIn(uid);
  return mapCustomerInfoToStatus(customerInfo);
}

export async function resetIdentity(): Promise<UserSubscriptionStatus> {
  const info = await Purchases.logOut();
  return mapCustomerInfoToStatus(info);
}

export function addStatusListener(cb: (status: UserSubscriptionStatus) => void): () => void {
  const listener = (info: CustomerInfo) => cb(mapCustomerInfoToStatus(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
```
Note: replace the original `import type { CustomerInfo } from 'react-native-purchases';` line from Task 2 — keep `CustomerInfo` as a type import (it is still used by the mapper and listener). Merge the imports so there is a single import statement for the default plus a `import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';` line.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest services/purchaseService.test.ts`
Expected: PASS (all mapper + wrapper tests).

- [ ] **Step 5: Verify compile**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add services/purchaseService.ts services/purchaseService.test.ts
git commit -m "feat: add RevenueCat SDK wrapper functions to purchaseService"
```

---

### Task 4: `featureFlagService.syncFromRevenueCat` (TDD)

**Files:**
- Modify: `services/featureFlagService.ts`
- Create: `services/featureFlagService.test.ts`

**Interfaces:**
- Consumes: `UserSubscriptionStatus` from `@/constants/Features`.
- Produces: `featureFlagService.syncFromRevenueCat(status: UserSubscriptionStatus): Promise<void>` — consumed by Task 5. Sets in-memory status and persists it to AsyncStorage (as cache).

- [ ] **Step 1: Write the failing test**

Create `services/featureFlagService.test.ts`:
```ts
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
import AsyncStorage from '@react-native-async-storage/async-storage';
import featureFlagService from './featureFlagService';
import { SubscriptionTier } from '@/constants/Features';

describe('syncFromRevenueCat', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await featureFlagService.initialize();
  });

  it('adopts the RevenueCat status and reports premium access', async () => {
    await featureFlagService.syncFromRevenueCat({
      tier: SubscriptionTier.PREMIUM,
      isPremium: true,
      isLifetime: false,
      expiresAt: '2999-01-01T00:00:00Z',
    });
    expect(featureFlagService.isPremiumUser()).toBe(true);
    expect(featureFlagService.getSubscriptionStatus().tier).toBe(SubscriptionTier.PREMIUM);
  });

  it('persists the status to AsyncStorage as cache', async () => {
    await featureFlagService.syncFromRevenueCat({
      tier: SubscriptionTier.LIFETIME, isPremium: true, isLifetime: true,
    });
    const raw = await AsyncStorage.getItem('@fitsnapshot:subscription_status');
    expect(JSON.parse(raw as string).isLifetime).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest services/featureFlagService.test.ts`
Expected: FAIL — `syncFromRevenueCat` is not a function.

- [ ] **Step 3: Implement the method**

In `services/featureFlagService.ts`, add this public method to the `FeatureFlagService` class (place it directly after `updateSubscriptionStatus`, around line 225). It reuses the existing private `saveSubscriptionStatus()`:
```ts
  /**
   * Adopt the subscription status resolved by RevenueCat (the source of truth)
   * and persist it as an offline cache.
   */
  async syncFromRevenueCat(status: UserSubscriptionStatus): Promise<void> {
    this.subscriptionStatus = status;
    await this.saveSubscriptionStatus();
  }
```
Ensure `UserSubscriptionStatus` is imported (it is already imported at the top of the file).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest services/featureFlagService.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add services/featureFlagService.ts services/featureFlagService.test.ts
git commit -m "feat: featureFlagService.syncFromRevenueCat (RevenueCat as source of truth, AsyncStorage as cache)"
```

---

### Task 5: `UserContext` — configure, sync, listen, restore, auth bridge

**Files:**
- Modify: `context/UserContext.tsx`

**Interfaces:**
- Consumes: `configurePurchases`, `fetchStatus`, `addStatusListener`, `restorePurchases`, `identify`, `resetIdentity` (Task 3); `featureFlagService.syncFromRevenueCat` (Task 4); `useAuth()` from `@/context/AuthContext` (provider is nested inside `AuthProvider` per `app/_layout.tsx:76-88` — safe).
- Produces (added to `UserContextType`, consumed by Tasks 6/7):
  - `restorePurchases: () => Promise<{ isPremium: boolean }>`
  - keeps existing `setTestPremiumStatus` (dev-only) and `refreshSubscriptionStatus`.

- [ ] **Step 1: Add imports and the RevenueCat init effect**

At the top of `context/UserContext.tsx`, add:
```tsx
import { useAuth } from '@/context/AuthContext';
import {
  configurePurchases,
  fetchStatus,
  addStatusListener,
  restorePurchases as rcRestore,
  identify,
  resetIdentity,
} from '@/services/purchaseService';

const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
```

Inside `UserProvider`, add the auth hook near the other hooks:
```tsx
  const { user } = useAuth();
```

Replace the existing mount effect + `initializeUserContext` so it configures RevenueCat, syncs, and subscribes. Change `initializeUserContext` to:
```tsx
  const initializeUserContext = async () => {
    setIsLoading(true);
    try {
      // 1. Load cached status first (instant, offline-safe).
      await featureFlagService.initialize();
      await refreshSubscriptionStatus();

      // 2. Configure RevenueCat and adopt the real status.
      if (RC_ANDROID_KEY) {
        configurePurchases(RC_ANDROID_KEY);
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
```

Add a second effect (after the existing mount `useEffect`) that subscribes to live updates:
```tsx
  useEffect(() => {
    if (!RC_ANDROID_KEY) return;
    const unsubscribe = addStatusListener(async (status) => {
      await featureFlagService.syncFromRevenueCat(status);
      await refreshSubscriptionStatus();
    });
    return unsubscribe;
  }, []);
```

- [ ] **Step 2: Add the auth-identity bridge effect**

Add this effect so a signed-in (GIF) user's entitlement follows their account:
```tsx
  useEffect(() => {
    if (!RC_ANDROID_KEY) return;
    (async () => {
      try {
        const status = user?.uid ? await identify(user.uid) : await resetIdentity();
        await featureFlagService.syncFromRevenueCat(status);
        await refreshSubscriptionStatus();
      } catch (e) {
        console.warn('RevenueCat identity sync failed', e);
      }
    })();
  }, [user?.uid]);
```

- [ ] **Step 3: Add `restorePurchases` to the context**

Add the handler inside `UserProvider`:
```tsx
  const restorePurchases = async (): Promise<{ isPremium: boolean }> => {
    const status = await rcRestore();
    await featureFlagService.syncFromRevenueCat(status);
    await refreshSubscriptionStatus();
    return { isPremium: status.isPremium };
  };
```
Add `restorePurchases: () => Promise<{ isPremium: boolean }>;` to the `UserContextType` interface, and include `restorePurchases` in the `value` object.

- [ ] **Step 4: Verify compile + existing suite**

Run: `npx tsc --noEmit`
Expected: exit 0.
Run: `npx jest`
Expected: all existing suites still pass (UserContext has no dedicated test; nothing regresses).

- [ ] **Step 5: Commit**

```bash
git add context/UserContext.tsx
git commit -m "feat: wire RevenueCat into UserContext (configure, live sync, restore, auth identity bridge)"
```

> On-device verification of live purchase/restore is Manual Action F.

---

### Task 6: `PaywallModal` — real purchase, live prices, drop monthly, restore

**Files:**
- Modify: `components/monetization/PaywallModal.tsx`
- Modify: `localization/translations.ts`

**Interfaces:**
- Consumes: `getDefaultOffering`, `purchasePackage` (Task 3); `restorePurchases` from `useUser()` (Task 5).

- [ ] **Step 1: Add the new locale strings (all 5 locales)**

In `localization/translations.ts`, add these keys under the existing `paywall` group for **each** locale (find each locale's `paywall: { ... }` block and add the keys). Values:

| key | en | es | it | de | fr |
|---|---|---|---|---|---|
| `freeTrial` | 7-day free trial | Prueba gratis de 7 días | 7 giorni di prova gratuita | 7 Tage kostenlos testen | Essai gratuit de 7 jours |
| `perYear` | /yr | /año | /anno | /Jahr | /an |
| `restore` | Restore Purchases | Restaurar compras | Ripristina acquisti | Käufe wiederherstellen | Restaurer les achats |
| `restoring` | Restoring… | Restaurando… | Ripristino… | Wird wiederhergestellt… | Restauration… |
| `restoreSuccess` | Purchases restored! | ¡Compras restauradas! | Acquisti ripristinati! | Käufe wiederhergestellt! | Achats restaurés ! |
| `restoreNone` | No purchases to restore. | No hay compras que restaurar. | Nessun acquisto da ripristinare. | Keine Käufe zum Wiederherstellen. | Aucun achat à restaurer. |
| `purchaseError` | Purchase failed. Please try again. | La compra falló. Inténtalo de nuevo. | Acquisto non riuscito. Riprova. | Kauf fehlgeschlagen. Bitte erneut versuchen. | Échec de l'achat. Veuillez réessayer. |

- [ ] **Step 2: Load the offering and replace the plan/state model**

In `PaywallModal.tsx`, add imports:
```tsx
import { getDefaultOffering, purchasePackage } from '@/services/purchaseService';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useEffect } from 'react';
```
Replace `const { setTestPremiumStatus } = useUser();` with:
```tsx
  const { restorePurchases } = useUser();
```
Replace the `selectedPlan` state (and `PricingPlan` type) with package-based state:
```tsx
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getDefaultOffering().then((o) => {
      setOffering(o);
      setSelectedPkg(o?.annual ?? o?.availablePackages?.[0] ?? null);
    });
  }, [visible]);

  const annualPkg = offering?.annual ?? null;
  const lifetimePkg = offering?.lifetime ?? null;
```

- [ ] **Step 3: Replace `handlePurchase` with the real flow**

```tsx
  const handlePurchase = async () => {
    if (!selectedPkg) return;
    setIsProcessing(true);
    try {
      const result = await purchasePackage(selectedPkg);
      if (result.userCancelled) return;
      if (result.status?.isPremium) {
        onClose(); // UserContext listener refreshes premium state automatically
        return;
      }
      alert(result.error ?? t('paywall.purchaseError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const { isPremium } = await restorePurchases();
      alert(isPremium ? t('paywall.restoreSuccess') : t('paywall.restoreNone'));
      if (isPremium) onClose();
    } catch {
      alert(t('paywall.purchaseError'));
    } finally {
      setIsRestoring(false);
    }
  };
```

- [ ] **Step 4: Replace the three `PricingCard`s with two live-priced cards**

Change `PricingCard` to accept a `PurchasesPackage` and compare by package identity. Replace the pricing block (the `{/* Pricing Options */}` `View`, lines ~226-254) so it renders only Annual + Lifetime, using live `priceString`:
```tsx
          <View style={styles.pricingContainer}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {t('paywall.choosePlan')}
            </Text>

            {annualPkg && (
              <PricingCard
                pkg={annualPkg}
                title={t('paywall.annual')}
                subtitle={t('paywall.freeTrial')}
                priceSuffix={t('paywall.perYear')}
                isPopular
              />
            )}
            {lifetimePkg && (
              <PricingCard
                pkg={lifetimePkg}
                title={t('paywall.lifetime')}
                subtitle={t('paywall.oneTimePayment')}
              />
            )}
          </View>
```
Update the `PricingCard` component definition signature and body: accept `{ pkg, title, subtitle, priceSuffix, isPopular }: { pkg: PurchasesPackage; title: string; subtitle: string; priceSuffix?: string; isPopular?: boolean }`; compute `const isSelected = selectedPkg?.identifier === pkg.identifier;`; `onPress={() => setSelectedPkg(pkg)}`; and render the price as `{pkg.product.priceString}{priceSuffix ?? ''}` (remove the old `t('paywall.currency')` + numeric price and the `savings` badge). Delete the now-unused `PricingPlan` type and any `PRICING` import.

- [ ] **Step 5: Add the Restore link in the footer**

Inside the `{/* Footer */}` `View` (after the `cancelAnytime` text), add:
```tsx
            <TouchableOpacity onPress={handleRestore} disabled={isRestoring} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.footerText, { color: theme.primary, fontFamily: fontFamily.body }]}>
                {isRestoring ? t('paywall.restoring') : t('paywall.restore')}
              </Text>
            </TouchableOpacity>
```
Also gate the purchase button so it is disabled when `!selectedPkg`: set `disabled={isProcessing || !selectedPkg}`.

- [ ] **Step 6: Verify compile**

Run: `npx tsc --noEmit`
Expected: exit 0. (If `PRICING`/`getPremiumBenefits` imports are now unused, remove the unused ones; keep `getPremiumBenefits` — the benefits list stays.)

- [ ] **Step 7: Commit**

```bash
git add components/monetization/PaywallModal.tsx localization/translations.ts
git commit -m "feat: paywall real RevenueCat purchase + live localized prices + restore, drop monthly"
```

---

### Task 7: Settings — Restore Purchases + real Manage Subscription

**Files:**
- Modify: `app/(tabs)/settings.tsx`
- Modify: `localization/translations.ts`

**Interfaces:**
- Consumes: `restorePurchases` from `useUser()` (Task 5); `Linking` from `react-native`.

- [ ] **Step 1: Add the locale string (all 5 locales)**

Add under each locale's `settings` group:

| key | en | es | it | de | fr |
|---|---|---|---|---|---|
| `restorePurchases` | Restore Purchases | Restaurar compras | Ripristina acquisti | Käufe wiederherstellen | Restaurer les achats |

- [ ] **Step 2: Pull `restorePurchases` from context and add handlers**

In `settings.tsx`, extend the `useUser()` destructure (line 71):
```tsx
  const { isPremium, subscriptionStatus, featureUsage, setTestPremiumStatus, restorePurchases } = useUser();
```
Add `Linking` to the `react-native` import. Replace `handleManageSubscription` (lines 101-107) to deep-link to the Play subscriptions center, and add a restore handler:
```tsx
  const handleManageSubscription = () => {
    Linking.openURL('https://play.google.com/store/account/subscriptions').catch(() =>
      Alert.alert(t('settings.manageSubscription'), 'Open Google Play to manage your subscription.')
    );
  };

  const handleRestorePress = async () => {
    try {
      const { isPremium: restored } = await restorePurchases();
      Alert.alert(
        t('settings.restorePurchases'),
        restored ? t('paywall.restoreSuccess') : t('paywall.restoreNone')
      );
    } catch {
      Alert.alert(t('settings.restorePurchases'), t('paywall.purchaseError'));
    }
  };
```

- [ ] **Step 3: Render a Restore row**

Immediately after the Premium Section `View` (after line 309, before the `__DEV__` block), add a restore row reusing the existing `settingItem` style:
```tsx
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: theme.cardBackground, borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}
            onPress={handleRestorePress}
          >
            <View style={[styles.iconContainer, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
              <Ionicons name="refresh-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.settingText, { color: theme.text }]}>{t('settings.restorePurchases')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
```

- [ ] **Step 4: Verify compile**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/(tabs)/settings.tsx localization/translations.ts
git commit -m "feat: settings Restore Purchases action + real Manage Subscription deep link"
```

---

## Final verification

- [ ] Run full suite: `npx jest` — all green.
- [ ] `npx tsc --noEmit` — exit 0.
- [ ] Confirm no `setTestPremiumStatus` call remains outside a `__DEV__` guard (`grep -rn setTestPremiumStatus app components` → only the `__DEV__` block in settings).
- [ ] Confirm paywall shows exactly two plans and no hardcoded currency (`grep -n "paywall.currency\|PRICING" components/monetization/PaywallModal.tsx` → no matches).
- [ ] Hand off to user for Manual Actions A–G (dev build + on-device sandbox purchase test).
