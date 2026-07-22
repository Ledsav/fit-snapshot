# Interaction Overhaul — Sub-project C: Screen Composition & Control Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Recompose the screens now that the primitives (A) and comparison surface (B) are done — Home gets labeled zones + a consolidated premium group + streak context, Camera's three floating control clusters become one bottom bar, Gallery separates browsing from managing (no destructive delete on every thumbnail), Settings loses the dev toggle, and B's carried-forward chrome is finished. Per `docs/superpowers/specs/2026-07-22-interaction-overhaul-design.md` (Sub-project C).

**Architecture:** Mostly composition/layout of existing components (Home reorders + labels its sections and collapses three `FeatureGate`s into one `PremiumLock` group; Camera moves controls into one bar; Gallery removes the always-on delete affordance and leans on the existing selection mode). One small data addition: a persisted `bestStreak` so the streak has real context. Depends on A + B.

**Tech Stack:** Expo 57 / React Native 0.86 / React 19, jest-expo + react-test-renderer.

## Global Constraints

- Reuse tokens only (`Colors`/`withOpacity`/`overlayOpacity`, `fontFamily`, `preciseType`, `spacing`, `borderRadius`). No token value changes.
- **No raw `fontSize`/`letterSpacing` literal where a `preciseType` token matches. No hardcoded hex. No `theme.x + 'NN'` opacity-string hacks — use `withOpacity(theme.x, overlayOpacity.Y)`.** Brass = actionable/selected only; steel = hairlines; ember = streak/achievement milestones only; filled icons only for streak/achievement, outline elsewhere.
- **Any icon-rendering component test must `jest.mock("@expo/vector-icons", () => ({ Ionicons: (p:any)=>null }))`** (established in A).
- **Presentation-only unless a task explicitly adds logic.** Only Task 2 (bestStreak) changes data/logic; every other task changes layout/style/composition, keeping capture, gallery import/GIF/selection, settings handlers, and streak behavior otherwise intact.
- `app/(tabs)/gallery.tsx` and `localization/translations.ts` carry unrelated pre-existing uncommitted WIP. Any task touching them MUST stash/restore that WIP around its own commit (procedure proven across prior sub-projects: `git stash push -m <tag> -- <file>` → verify clean → edit → tsc → commit → `git stash pop` → verify no conflict; STOP + report BLOCKED on conflict).
- Verify each task with `npx tsc --noEmit`; run `npx jest` for tasks with tests / that touch shared logic. Full suite must exit 0.
- Visual work — the final task is mandatory manual QA (deferred to the user; no simulator here).

---

## File structure

Modified:
- `services/streakService.ts` (+ new `services/streakService.test.ts`) — add persisted `bestStreak` (Task 2)
- `components/home/StreakBadge.tsx` — surface best-streak context (Task 2)
- `app/(tabs)/index.tsx` — labeled zones + consolidated PRO group + streak wiring (Tasks 1, 2)
- `app/(tabs)/camera.tsx` — one bottom control bar (Task 3)
- `app/(tabs)/gallery.tsx` — remove always-on delete; browse/manage split; control-bar restyle (Task 4, WIP-stash)
- `app/(tabs)/settings.tsx` — gate dev toggle behind `__DEV__`; kill `theme.x+'NN'` hacks (Task 5)
- `components/progress/SyncedZoomPair.tsx` — flat-language chrome (Task 6)
- `localization/translations.ts` — remove orphaned `progress.modeSelect`; add `home.streakBest` (Tasks 2, 6, WIP-stash)

---

### Task 1: Home — labeled zones & one consolidated PRO group

**Files:** Modify `app/(tabs)/index.tsx`

**Interfaces:** No prop change to `HomeScreen`. The three separate premium `FeatureGate` blocks (achievements/chart/heatmap) collapse into ONE labeled `PRO` zone; the reminder/strip/streak/latest sections get grouping labels. All existing data derivations (`totalDays`/`consistency`/`weeklyPhotoCount`/`streakData`) unchanged.

**Design:** Section order becomes — hero (comparison, if any) → `THIS WEEK` (instrument strip) → next-photo reminder (the one loud CTA) → streak → `LATEST` (photo) → `PRO` (one group) → `TIPS`. Each zone gets a small mono `sectionLabel` header (the existing `styles.sectionTitle` pattern). Today the three FeatureGates each render their own `PremiumLock` row with the same generic "Premium Feature" text; consolidate them under one `PRO` label so they read as a group, and give each a real label via `customMessage`.

- [ ] **Step 1: Add a `THIS WEEK` label above the instrument strip**

Find the instrument-strip section:
```tsx
          {/* Instrument strip — precision readout, replaces ProgressSummary */}
          <View style={styles.section}>
            <InstrumentStrip
```
Replace the opening with:
```tsx
          {/* This week — instrument readout */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
              {t("home.thisWeek") || "This Week"}
            </Text>
            <InstrumentStrip
```
(Add a `home.thisWeek` key in Task 6's i18n pass, or use the `||` fallback now — the fallback keeps it working; the key is added in Task 6.)

- [ ] **Step 2: Consolidate the three premium FeatureGates into one PRO group**

Replace the three separate `FeatureGate` blocks (Achievements, Weekly Chart, Consistency Heatmap) with a single labeled group:
```tsx
          {/* Pro — premium insights, one quiet group */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
              {t("home.pro") || "Pro"}
            </Text>
            <View style={styles.proGroup}>
              <FeatureGate
                feature={Feature.ACHIEVEMENT_BADGES}
                customMessage={t("home.achievements")}
                compact
              >
                <AchievementBadges photos={photos} currentStreak={streakData.currentStreak} />
              </FeatureGate>
              <FeatureGate
                feature={Feature.WEEKLY_PROGRESS_CHART}
                customMessage={t("home.weeklyActivity")}
                compact
              >
                <WeeklyProgressChart photos={photos} />
              </FeatureGate>
              <FeatureGate
                feature={Feature.CONSISTENCY_HEATMAP}
                customMessage={t("home.consistency")}
                compact
              >
                <ConsistencyHeatmap photos={photos} />
              </FeatureGate>
            </View>
          </View>
```
Add the `proGroup` style: `proGroup: { gap: spacing.sm }`. `t("home.achievements")`, `t("home.weeklyActivity")`, `t("home.consistency")` already exist (used elsewhere). When a user HAS premium, each `FeatureGate` renders its real child widget (achievements/chart/heatmap) stacked under the PRO label — acceptable; when free, three compact `PremiumLock` rows read as one Pro group instead of three full-width interruptions mid-scroll.

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit` — no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: Home labeled zones and one consolidated Pro group"
```

---

### Task 2: Streak context (bestStreak) — data + surface

**Files:** Modify `services/streakService.ts`, create `services/streakService.test.ts`, modify `components/home/StreakBadge.tsx`, modify `app/(tabs)/index.tsx`.

**Interfaces:**
- Produces: `StreakData` gains `bestStreak: number`. `StreakService.updateStreak`/`getStreakData` persist and return it (`bestStreak = max(previousBest, currentStreak)`). `StreakBadge` gains an optional `best?: number` prop and, when `best > 0` and `best >= streak`, shows a mono "· BEST N" context suffix. `HomeScreen` passes `streakData.bestStreak` to `StreakBadge`.
- Backward compatible: `getStreakData` defaults missing/undefined persisted best to `0` (older installs migrate silently).

- [ ] **Step 1: Write the failing streak-service test**

Create `services/streakService.test.ts`:
```ts
import { StreakService } from "./streakService";

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
  getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
}));

const photo = (date: string) => ({ id: date, uri: "x", date, type: "front" as any });

describe("StreakService bestStreak", () => {
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

  it("defaults bestStreak to 0 when nothing is stored", async () => {
    const d = await StreakService.getStreakData();
    expect(d.bestStreak).toBe(0);
  });

  it("raises bestStreak to the highest currentStreak seen and never lowers it", async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const iso = (offset: number) => {
      const dt = new Date(today); dt.setDate(dt.getDate() - offset); return dt.toISOString();
    };
    // first photo → current 1, best 1
    let d = await StreakService.updateStreak(photo(iso(0)));
    expect(d.currentStreak).toBe(1);
    expect(d.bestStreak).toBe(1);
    // simulate a stored higher best surviving a reset
    await StreakService.saveStreakData({ currentStreak: 5, lastPhotoDate: iso(0), bestStreak: 5 });
    const after = await StreakService.getStreakData();
    expect(after.bestStreak).toBe(5);
  });
});
```

- [ ] **Step 2: Run it — RED**

Run: `npx jest services/streakService.test.ts`
Expected: FAIL — `bestStreak` is not on `StreakData` / not returned.

- [ ] **Step 3: Add `bestStreak` to the service**

In `services/streakService.ts`:
- Add `bestStreak: number;` to the `StreakData` interface.
- Add a `BEST_STREAK_KEY = "fitness_tracker_best_streak"`.
- In `saveStreakData`, also persist `streakData.bestStreak` (`await AsyncStorage.setItem(BEST_STREAK_KEY, String(streakData.bestStreak))`).
- In `getStreakData`, read it: `const bestString = await AsyncStorage.getItem(BEST_STREAK_KEY);` and return `bestStreak: bestString ? parseInt(bestString, 10) : 0`. Every existing `return`/catch path must include `bestStreak` (default 0).
- In `updateStreak`, after computing `updatedStreak`'s `currentStreak`, set its `bestStreak = Math.max(previousBest, updatedStreak.currentStreak)` where `previousBest` comes from `getStreakData()` (already called in that function; reuse or fetch). Ensure every `updatedStreak = {...}` literal includes `bestStreak`.

Keep all existing streak math unchanged — only add the best-tracking alongside it.

- [ ] **Step 4: Run it — GREEN**

Run: `npx jest services/streakService.test.ts` — PASS, exit 0.

- [ ] **Step 5: Surface it in `StreakBadge`**

In `components/home/StreakBadge.tsx`, add an optional prop `best?: number`. When `best && best > 0`, render an extra mono context `Text` after the label: `· BEST {best}` (or localized `home.streakBest`), in `theme.milestone` (ember, consistent with the badge) at `preciseType.statLabel`. Keep the existing flame + count + label; this is an additive suffix. (Test: extend `StreakBadge.test.tsx` if present, or add a case asserting the best suffix renders when `best` is passed — with the `@expo/vector-icons` mock.)

- [ ] **Step 6: Wire it in Home**

In `app/(tabs)/index.tsx`, the `StreakData` state initializer `{ currentStreak: 0, lastPhotoDate: null }` must add `bestStreak: 0` (TS requires it now). Pass `best={streakData.bestStreak}` to `<StreakBadge>`. Optionally group the streak under the existing flow (it already sits in its own `styles.section`).

- [ ] **Step 7: Verify + commit**

Run: `npx tsc --noEmit` and `npx jest` — clean, exit 0.

```bash
git add services/streakService.ts services/streakService.test.ts components/home/StreakBadge.tsx "app/(tabs)/index.tsx"
git commit -m "feat: track and surface best streak for streak context"
```

---

### Task 3: Camera — consolidate three control clusters into one bottom bar

**Files:** Modify `app/(tabs)/camera.tsx`

**Interfaces:** No behavior change to `CameraScreen`. Presentation/layout only — the capture, flash, zoom, timer, flip, and import HANDLERS (`toggleFlash`, `zoomIn`/`zoomOut`, `toggleTimer`/`startTimer`/`cancelTimer`, `toggleCameraFacing`, `takePicture`, `pickImage`) stay byte-stable; only where their buttons live changes.

**Design:** Today the viewfinder has three floating clusters crowding the top/sides: `renderOverlaySelector()` (angle, top-left), `controlsContainer` (flash + zoom in/out, top-right), and `renderTimerControls()` (timer toggle + durations, mid-left) — plus the `bottomControlsContainer` (flip / shutter / import). Consolidate so **only the angle selector stays at the top**, and flash + timer + flip + import live in **one bottom control bar** arranged around the brass shutter. Zoom stays available via the existing pinch gesture (the pinch `GestureDetector` already works), so the +/− zoom buttons can be dropped (pinch is the primary zoom); if you prefer to keep them, fold them into the bottom bar — but dropping them in favor of pinch is the cleaner consolidation and is the recommended approach. The timer's duration picker (3/5/10s), when the timer toggle is on, appears as a small inline row just above the bottom bar rather than a separate mid-screen column.

Concretely:
- Remove the `<View style={styles.controlsContainer}>` (flash + zoom) block and the `{renderTimerControls()}` call from their current positions.
- Keep `{renderOverlaySelector()}` at the top.
- Rebuild `bottomControlsContainer` as a single row: **flash toggle · timer toggle · [shutter] · flip · import**, with the shutter centered and brass-ringed (already brass). Flash/timer are small translucent icon buttons matching flip/import; the timer-duration row renders above the bar only when `isTimerEnabled`.
- The `isTimerRunning` countdown UI stays as-is (it replaces the shutter during countdown).
- Reuse the existing style values where possible; add a `topBar`/`bottomBar` layout as needed. Keep all controls translucent-on-camera (this is the one screen where translucent-over-photo chrome is correct).

Because this is a layout rearrangement in a large hardware screen, do it incrementally with a `npx tsc --noEmit` after each structural edit, and keep every `onPress` wired to its original handler. If any part proves entangled, migrate what's safe, keep the rest, and report DONE_WITH_CONCERNS.

- [ ] **Step 1** — Move flash + timer into the bottom bar; drop the +/− zoom buttons (pinch remains). Rebuild `bottomControlsContainer` as the single control row described above. Remove `controlsContainer` and the top-position `renderTimerControls()`; render the timer-duration row (from `renderTimerControls`, minus its absolute positioning) above the bottom bar when `isTimerEnabled`.
- [ ] **Step 2** — Remove now-unused styles (`controlsContainer`, `timerControls` absolute positioning, `controlButton` if unused) — grep-confirm zero references first. Keep `zoomIn`/`zoomOut` handlers only if still referenced; if the buttons are dropped and the handlers become unused, remove them too (grep first).
- [ ] **Step 3** — `npx tsc --noEmit` clean; `npx jest` full suite exit 0.
- [ ] **Step 4** — Commit: `git add "app/(tabs)/camera.tsx" && git commit -m "refactor: consolidate camera controls into one bottom bar"`

---

### Task 4: Gallery — clean browse, delete only in manage mode

**Files:** Modify `app/(tabs)/gallery.tsx` (has unrelated WIP — use the stash procedure).

**Interfaces:** No prop change. Removes the always-visible per-thumbnail delete-X (the data-loss hazard) so browsing is clean; deletion happens through the EXISTING selection mode (`selectionMode`/bulk-delete/select-all already implemented). Also restyles the view-mode toggle + selection button + banners to the flat language and kills the `theme.x + 'NN'` opacity hacks in this file.

**Preserve byte-stable:** the selection/bulk-delete/import/GIF/paywall logic. Only the always-on delete affordance is removed and chrome restyled.

- [ ] **Step 1 — stash the WIP:** `git stash push -m C-gallery-wip -- "app/(tabs)/gallery.tsx"`, verify clean.
- [ ] **Step 2 — remove the always-on delete-X** from `renderItem` and `renderGifItem`: delete the `{!selectionMode && (<TouchableOpacity style={[styles.deleteButton...]} onPress={... handleDeletePhoto/handleDeleteGif ...}>...)}` block in each. (The bulk-delete path in selection mode remains the way to delete. GIF deletion: if GIFs have no selection-mode path, keep a delete affordance for GIFs but only inside `selectionMode`, OR leave the GIF delete as-is if removing it would strand GIF deletion — CHECK: confirm whether selection mode covers GIFs; if not, gate the GIF delete behind `selectionMode` rather than removing it, so GIFs remain deletable.)
- [ ] **Step 3 — restyle the control bar chrome:** convert the `viewModeButton`/`selectionButton` active-state to the flat convention (active = brass; inactive = hairline via `withOpacity(theme.secondary, overlayOpacity.light)`), and replace the `theme.warning + '20'` / `theme.error + '20'` / `theme.primary + '20'` opacity-string hacks in the storage banners with `withOpacity(...)`. Mono labels via `preciseType` where a token matches.
- [ ] **Step 4 — remove any now-unused styles** (`deleteButton` if fully unreferenced after Step 2 — CHECK it isn't still used by a gated GIF delete) — grep first.
- [ ] **Step 5 — verify:** `npx tsc --noEmit` clean, `npx jest` exit 0.
- [ ] **Step 6 — commit** (gallery.tsx only): `git commit -m "feat: Gallery clean browse; delete only via selection mode"`.
- [ ] **Step 7 — `git stash pop`**, verify the WIP restored (no conflict markers; STOP + report BLOCKED on conflict).

---

### Task 5: Settings — remove the dev toggle from production; kill opacity hacks

**Files:** Modify `app/(tabs)/settings.tsx`

**Interfaces:** No behavior change for real users. The "Test Premium" developer toggle is gated behind `__DEV__` so it never ships in production builds. Remaining `theme.x + 'NN'` opacity-string hacks in the account + test-mode blocks are converted to `withOpacity`.

- [ ] **Step 1 — gate the dev toggle.** Wrap the entire "Test Mode Toggle (for development)" `<View style={styles.section}>…</View>` block in `{__DEV__ && ( … )}` so it renders only in development:
```tsx
        {/* Test Mode Toggle (development only) */}
        {__DEV__ && (
          <View style={styles.section}>
            {/* …existing test-premium TouchableOpacity… */}
          </View>
        )}
```
(`__DEV__` is a RN global — `true` in dev, `false`/stripped in production. `handleTestPremiumToggle` and `setTestPremiumStatus` stay; they're just unreachable in prod.)

- [ ] **Step 2 — kill the opacity-string hacks** in this file: replace `theme.primary + '40'`, `theme.primary + '20'`, `theme.warning + '20'` (account card icon/border, test-toggle icon/border) with `withOpacity(theme.primary, overlayOpacity.light)` / `withOpacity(theme.primary, overlayOpacity.subtle)` / `withOpacity(theme.warning, overlayOpacity.subtle)` respectively (pick the `overlayOpacity` step matching the old alpha: `'20'`≈subtle 0.15/light 0.25, `'40'`≈medium 0.4). `withOpacity`/`overlayOpacity` are already imported.

- [ ] **Step 3 — verify:** `npx tsc --noEmit` clean; `npx jest` exit 0.

- [ ] **Step 4 — commit:** `git add "app/(tabs)/settings.tsx" && git commit -m "fix: gate dev Test-Premium toggle behind __DEV__; use withOpacity in Settings"`

---

### Task 6: Carried-forward cleanup (SyncedZoomPair chrome; orphaned i18n key; new i18n keys)

**Files:** Modify `components/progress/SyncedZoomPair.tsx`, `localization/translations.ts` (WIP-stash).

- [ ] **Step 1 — SyncedZoomPair chrome:** migrate its labels/borders to the flat language (mono `preciseType` labels; hairline `withOpacity(theme.secondary, overlayOpacity.light)` borders replacing brass borders; no hex/raw-font-literals). **Do NOT change its synced zoom/pan gesture logic** — presentation only. If it uses the `Button`/label pattern for its swap/reset controls, use the shared `Button` primitive; otherwise restyle in place.
- [ ] **Step 2 — i18n (stash `localization/translations.ts` first):** `git stash push -m C-i18n-wip -- localization/translations.ts`, verify clean. Then:
  - Remove the orphaned `progress.modeSelect` key (interface + all 5 locales) — it's no longer referenced after B restructured the switcher (grep-confirm zero references in `.tsx` first).
  - Add `home.thisWeek` ("This Week") and `home.pro` ("Pro") and `home.streakBest` ("Best") used by Tasks 1–2, to the interface + all 5 locales (en/es/it/de/fr — translate naturally). Update Tasks 1–2's `|| "…"` fallbacks are harmless to leave.
  - `npx tsc --noEmit` (TS fails if any locale is missing a required key — the safety net).
- [ ] **Step 3 — verify + commit** (SyncedZoomPair.tsx + translations.ts): `git commit -m "chore: finish SyncedZoomPair chrome; tidy Home/Progress i18n keys"`.
- [ ] **Step 4 — `git stash pop`**, verify WIP restored (STOP + report BLOCKED on conflict).

Note: if grep shows `progress.modeSelect` is still referenced anywhere, do NOT remove it — report that and leave it. The i18n additions are the priority; the removal is optional cleanup.

---

### Task 7: Manual visual QA

No automated test confirms composition *reads* right. Do not report Sub-project C complete without this.

**Files:** none.

- [ ] **Step 1: Start the app** (project `run` skill / `npx expo start`), check both themes.
- [ ] **Step 2: Home** — labeled zones (`THIS WEEK` / `LATEST` / `PRO` / `TIPS`) give the scroll rhythm; the three premium features read as ONE quiet Pro group (free account) rather than three full cards mid-scroll; the streak shows "· BEST N" context; the reminder is the one loud CTA up top.
- [ ] **Step 3: Camera** — only the angle selector is at the top; flash/timer/flip/import sit in one bottom bar around the brass shutter; pinch-to-zoom still works; timer duration picker appears above the bar when the timer is on; capture/flip/import all still function.
- [ ] **Step 4: Gallery** — browse mode shows clean matted thumbnails with NO delete-X; tapping the select toggle enters manage mode with checkable tiles + bulk delete; a stray tap while browsing can't delete a photo. GIFs still deletable (via selection/gated path).
- [ ] **Step 5: Settings** — in a production build the Test-Premium toggle is GONE (in dev it still shows); rows are consistent hairlines; the premium/upgrade card uses the shared Button.
- [ ] **Step 6: Progress side-by-side** — the side-by-side (`SyncedZoomPair`) view now matches the flat language.
- [ ] **Step 7: Report** results for triage; then Sub-projects A+B+C together are ready for the final whole-branch review.
