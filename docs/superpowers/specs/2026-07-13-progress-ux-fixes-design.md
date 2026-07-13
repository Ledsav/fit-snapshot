# Progress & Gallery UX Fixes — Design

Date: 2026-07-13

## Context

A UX review of the app identified four issues. This spec covers fixing all four:

1. Gallery photo deletion has no confirmation — a single tap permanently destroys progress photos.
2. The progress screen's comparison-mode switcher is five unlabeled icon buttons with tiny lock badges — not self-explanatory.
3. The home screen's "X% active" stat is computed from an undocumented "3 photos/day" assumption and mislabeled.
4. Side-by-side comparison mode is cramped (each photo renders at roughly a sixth of screen width) and offers nothing the slider mode doesn't already show, so it "feels useless."

## 1. Gallery delete confirmation

**File:** `app/(tabs)/gallery.tsx`

- `handleDeletePhoto(id)`: wrap the existing `removePhoto` call in `Alert.alert` using the existing `t("gallery.deletePhoto")` title, a new confirmation body string, Cancel + destructive Delete actions. Only calls `removePhoto` on confirm.
- `handleBulkDelete()`: same pattern, with a new message string that interpolates the selected count (e.g. "Delete 4 photos? This can't be undone.").
- New translation keys (all 5 locales): `gallery.deleteConfirmMessage`, `gallery.deleteBulkConfirmMessage` (with `{count}` placeholder). Cancel action reuses the existing `common.cancel` key — no new key needed for that.

No other behavior changes; `removePhoto`/bulk-delete logic itself is untouched.

## 2. Progress mode switcher relabeling

**File:** `components/progress/PhotoMorph.tsx`

- Replace the current `modeSwitcher` row (5 fixed-width icon-only `TouchableOpacity`s) with a horizontally scrollable `ScrollView` (`horizontal`, `showsHorizontalScrollIndicator={false}`) containing pill buttons: icon + short text label, in this order: Slider, Side-by-side, GIF, Grid, Select photos.
- Keep the existing lock-badge treatment (small lock icon) for whichever of these remain gated after change #5 below (GIF and Select-photos stay gated; Slider/Side-by-side/Grid become free).
- New translation keys: `progress.modeSlider`, `progress.modeSideBySide`, `progress.modeGif`, `progress.modeGrid`, `progress.modeSelect` (all 5 locales).
- No change to the mode content panels themselves except side-by-side (see #4).

## 3. Home "consistency" metric

**Files:** `app/(tabs)/index.tsx`, `components/home/ProgressSummary.tsx`, `localization/translations.ts`

- Rename the `improvement` variable/prop to `consistency` in both files (no formula change — `photos taken ÷ (days × 3)` is a legitimate "did you complete a full 3-pose session" adherence rate, it was just mislabeled as generic "active").
- Change the displayed translation key from `progressSummary.active` to a new `progressSummary.consistency` ("consistency") across all 5 locales, displayed as "X% consistency" instead of "X% active".
- Note: `home.consistency` is a distinct, already-used key (heading for `ConsistencyHeatmap`) — do not reuse it; the new key lives under `progressSummary`.

## 4. Side-by-side redesign

**Files:** `app/(tabs)/progress.tsx`, `components/progress/PhotoMorph.tsx`, `app/_layout.tsx`, `package.json`

**4a. Progress screen restructure (space fix).**
`progress.tsx` currently stacks three full `PhotoMorph` panels (front/side/back) in one scroll view, so any given panel — and thus any given mode — only ever gets a fraction of the screen. Replace this with a Front/Side/Back tab bar at the top of the screen and render a single `PhotoMorph` panel for the active tab. This is the primary fix for "very little space" and benefits all four comparison modes, not just side-by-side.

- New local state `activeType: PhotoType` (default `front`) in `progress.tsx`.
- Simple segmented tab control using existing `t('camera.front')`/`t('camera.side')`/`t('camera.back')` strings (already present) — no new translation keys needed here.
- `PhotoMorph`'s own internal title row (currently `t(progress.${type})`) becomes redundant under the tab bar; remove it from `PhotoMorph` and let the tab bar be the sole indicator of which type is active.

**4b. Synced pinch-zoom/pan (the value-add).**
Add a shared zoom/pan capability to side-by-side mode only, so pinching either photo zooms and pans both photos together to the same relative region — e.g. zoom into the midsection and compare definition on both photos simultaneously. This is what differentiates side-by-side from slider (whole-body wipe) instead of duplicating it.

- Add `GestureHandlerRootView` wrapper around the app root in `app/_layout.tsx` (required once, globally, for `react-native-gesture-handler`).
- Add `react-native-gesture-handler` as an explicit `package.json` dependency (currently only a transitive dependency — pinning it directly avoids breakage if the transitive chain changes).
- New component `components/progress/SyncedZoomPair.tsx`: takes two photo URIs + labels, renders both as `Animated.Image` inside `Gesture.Simultaneous(Gesture.Pinch(), Gesture.Pan())`-driven shared `scale`/`translateX`/`translateY` reanimated values, applied identically to both images via `useAnimatedStyle`. Clamp scale to [1, 4]. Double-tap resets to scale 1. Includes a swap-sides icon button (swaps which photo is left/right) in the corner.
- `PhotoMorph`'s side-by-side mode renders `SyncedZoomPair` instead of the current static two-`Image` row.

## 5. Paywall: ungate side-by-side and grid

**File:** `config/features.json`

- `side_by_side_comparison.requiredTier`: `"premium"` → `"free"`.
- `grid_view_comparison.requiredTier`: `"premium"` → `"free"`.
- GIF generation and custom photo selection (`gif_generation`, `custom_photo_selection`) are untouched — remain premium.
- No code changes needed beyond the config value; `featureFlagService.hasFeatureAccess` already reads this field, and `FeatureGate`/`PhotoMorph`'s inline lock badges already react to `hasFeatureAccess` correctly.

## Out of scope

- `maxComparisonsPerDay` free-tier limit exists in `config/limits.json` and `featureFlagService.canMakeComparison()` but is not wired into any screen. Left untouched — flagged to the user separately, not part of this fix set.
- Full-screen/immersive comparison viewer (user chose the "enhanced inline" option, not this).
- Real IAP wiring for the paywall purchase button (pre-existing stub, unrelated to this work).

## Testing notes

- Manual verification per the project's `verify` skill after implementation (this is a UI-heavy RN app; no existing automated test suite covers these screens based on repo exploration — confirm during implementation and add tests only if a test harness already exists for comparable components).
