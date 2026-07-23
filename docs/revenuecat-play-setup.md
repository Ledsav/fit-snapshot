# RevenueCat + Google Play Console — Setup Guide

Step-by-step to make in-app purchases work end-to-end for FitSnapshot (Android).
Follow the phases in order — later phases depend on earlier ones.

**Exact values used by the app (must match everywhere):**
- Package name: `com.ledsav.fitsnapshot`
- Annual subscription product id: `fitsnapshot_premium_annual` (€4.99/yr + 7-day free trial)
- Lifetime one-time product id: `fitsnapshot_premium_lifetime` (€9.99)
- RevenueCat entitlement id: `premium`
- App `.env` key: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_...`

> ⚠️ Two things trip everyone up: (1) you must **upload a signed build to an internal-testing track** before purchases work — products can't be tested against an app Google has never seen. (2) The RevenueCat ↔ Play **service-account permissions can take a few hours (up to ~36h) to propagate.** Do Phase 3 early.

---

## Phase 0 — Accounts (do first)

- [ ] **Google Play Developer account** — https://play.google.com/console → pay the **$25 one-time** fee, complete identity verification. (Verification can take a day or two — start now.)
- [ ] **RevenueCat account** (free) — https://app.revenuecat.com → sign up.

---

## Phase 1 — Create the app in Play Console + upload one build

You need a build on a track before billing works.

- [ ] Play Console → **Create app** → name "FitSnapshot", type App, Free, accept declarations.
- [ ] Build a signed release bundle from your machine:
      `eas build --profile production --platform android` (produces an `.aab`).
- [ ] Play Console → **Testing → Internal testing → Create new release** → upload the `.aab`.
- [ ] Add yourself as a tester: Internal testing → **Testers** → create an email list with your Google account → save. Copy the **opt-in link** (you'll use it to install).
- [ ] Roll out the internal-testing release.

> The build must contain the Play Billing library — the RevenueCat SDK (already installed in the app) pulls it in automatically, so a normal production build is fine.

---

## Phase 2 — Create the two products

**Annual subscription:**
- [ ] Play Console → **Monetize → Products → Subscriptions → Create subscription**.
- [ ] Product ID: `fitsnapshot_premium_annual`. Name: "FitSnapshot Premium (Annual)".
- [ ] Add a **base plan** → type **Auto-renewing**, billing period **Yearly (P1Y)** → set price **€4.99** (Play auto-generates localized prices for other regions).
- [ ] Add an **Offer** on that base plan → phase **Free trial**, length **1 week** → eligibility "New customers" → activate.
- [ ] **Activate** the base plan + offer.

**Lifetime one-time purchase:**
- [ ] Play Console → **Monetize → Products → In-app products → Create product**.
- [ ] Product ID: `fitsnapshot_premium_lifetime`. Name: "FitSnapshot Premium (Lifetime)". Price **€9.99**.
- [ ] **Activate** it.

---

## Phase 3 — Connect Play to RevenueCat (service account) — start early, it propagates slowly

RevenueCat needs read access to your Play purchases via a Google service account.

- [ ] Follow RevenueCat's official guide (it's the authority and has current screenshots):
      https://www.revenuecat.com/docs/getting-started/entitlements/google-play — the "Service Credentials" section. In short:
  - [ ] In **Google Cloud Console** (the project linked to your Play account): enable the **Google Play Android Developer API** and **Pub/Sub API**.
  - [ ] Create a **Service Account** → create a **JSON key** → download it.
  - [ ] In **Play Console → Users and permissions → Invite new user**, invite the service-account email and grant it the account/financial permissions RevenueCat's guide lists (view app info, manage orders & subscriptions, view financial data).
  - [ ] Upload the JSON key into RevenueCat when you add the app (Phase 4).
- [ ] Expect permission propagation delay — if RevenueCat says "credentials not valid yet," wait and re-check later.

---

## Phase 4 — Configure RevenueCat

- [ ] **Create a Project** → "FitSnapshot".
- [ ] **Add app** → platform **Google Play** → app name + package `com.ledsav.fitsnapshot` → upload the service-account JSON from Phase 3.
- [ ] **Product catalog → Products →** import/add both Play products by their exact IDs:
      `fitsnapshot_premium_annual` and `fitsnapshot_premium_lifetime`.
- [ ] **Entitlements → New →** identifier exactly `premium`. Attach **both** products to it.
- [ ] **Offerings → (default offering) → add packages:**
  - [ ] An **Annual** package → attach `fitsnapshot_premium_annual`.
  - [ ] A **Lifetime** package → attach `fitsnapshot_premium_lifetime`.
      (The app reads `offering.annual` and `offering.lifetime`, so use the Annual and Lifetime package types.)
- [ ] **API keys** → copy the **Google Play public SDK key** (starts with `goog_`).

---

## Phase 5 — Put the key in the app + rebuild

- [ ] In `.env` set: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_your_real_key`
- [ ] Rebuild the dev client (the SDK is a native module — Metro reload is not enough):
      `eas build --profile development --platform android` → install the resulting build on your device.

---

## Phase 6 — Test the purchase (free for testers)

- [ ] Play Console → **Setup → License testing** → add your Google account email as a **License tester**. (License testers are charged nothing and can complete real purchase flows.)
- [ ] Make sure that same Google account is on the **Internal testing** testers list (Phase 1) and is the account signed into the Play Store on your test device.
- [ ] Launch the app → open the paywall. You should see **two plans with live prices** (Annual showing the trial, Lifetime).
- [ ] Buy **Annual** → the Google purchase sheet should show "7-day free trial" → complete it → app unlocks Premium; the RevenueCat dashboard shows the transaction and the `premium` entitlement active.
- [ ] Buy **Lifetime** on a fresh test (or after cancelling) → unlocks Premium with no expiry.
- [ ] Test **Restore Purchases** (Settings or paywall) on a fresh install/reinstall → Premium comes back.
- [ ] Confirm free-tier gating still works when not premium (20-photo cap, gated features).

---

## Notes / gotchas

- **Nothing charges you** as a license tester; subscription renewals are also time-accelerated for testers.
- If the paywall shows **no plans**, it means RevenueCat returned no offering — usual causes: products not "Activated" in Play, product IDs mismatched, service-account permissions not propagated yet, or the app build isn't on a track.
- Keep product IDs and the entitlement id **exactly** as written above — the app and RevenueCat dashboard must agree.
- iOS is intentionally out of scope; you only need the Android (`goog_`) key.
