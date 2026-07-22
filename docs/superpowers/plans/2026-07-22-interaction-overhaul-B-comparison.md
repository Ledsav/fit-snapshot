# Interaction Overhaul — Sub-project B: The Comparison Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One shared before/after wipe-reveal slider used by both Home and Progress, and a restructured Progress screen where the slider is primary, the other comparison views are labeled secondary actions, and "change photos" is its own action — per `docs/superpowers/specs/2026-07-22-interaction-overhaul-design.md` (Sub-project B).

**Architecture:** Add one `BeforeAfterSlider` component (owns its drag + width measurement, reports position via `onValueChange`). Migrate Home's `MiniComparisonPreview` and Progress's `PhotoMorph` slider mode onto it — eliminating the two divergent copies. Then restructure `PhotoMorph`'s mode switcher (slider primary, secondary VIEW group, distinct CHANGE action) and migrate its remaining old chrome to the flat instrument language. Depends on Sub-project A (uses its `Button`/`PremiumLock`/`FeatureGate` for locked views).

**Tech Stack:** Expo 57 / React Native 0.86 / React 19, jest-expo + react-test-renderer.

## Global Constraints

- Reuse tokens only (`Colors`/`withOpacity`/`overlayOpacity`, `fontFamily`, `preciseType`, `spacing`, `borderRadius`). No token value changes.
- **No raw `fontSize`/`letterSpacing` literal where a `preciseType` token matches.** No hardcoded hex. Brass = actionable/selected only; steel = hairlines; ember = milestones only.
- **Every icon-rendering component test must `jest.mock("@expo/vector-icons", () => ({ Ionicons: (p:any)=>null }))`** — the async font loader otherwise fires a setState after teardown and fails isolated runs (established in Sub-project A).
- **`PhotoMorph.tsx` is the largest, most feature-dense file in the app.** Every task touching it is presentation-only: the PanResponder→state math for the *removed* slider is replaced by `BeforeAfterSlider`, but all other logic — GIF generation (`createBeforeAfterGif`), media-library saves, auth/token flow, feature-access checks (`hasFeatureAccess`), custom photo selection state, and the `extractPhoto` decision — must stay behaviorally identical. When in doubt, keep the logic and change only the JSX/styles around it.
- Verify each task with `npx tsc --noEmit`; run `npx jest` for tasks with tests. Full suite must exit 0.
- Do NOT touch `app/(tabs)/gallery.tsx`, `localization/translations.ts` (unrelated WIP — untouched in this sub-project), or `app.json`.
- This is visual/interaction work — the final task is mandatory manual QA (deferred to the user; no simulator here).

---

## File structure

New files:
- `components/progress/BeforeAfterSlider.tsx` + `.test.tsx` — the shared wipe-reveal slider

Modified files:
- `components/home/MiniComparisonPreview.tsx` — use `BeforeAfterSlider` (Home)
- `components/progress/PhotoMorph.tsx` — slider mode → `BeforeAfterSlider` (T3); mode-switcher restructure (T4); chrome migration (T5)

Untouched: `app/(tabs)/progress.tsx` (its angle tabs were already restyled in the prior rollout; the CHANGE action added in T4 lives inside PhotoMorph's own header, not the screen shell — confirm during T4 whether the screen shell needs the CHANGE affordance or PhotoMorph owns it; per this plan PhotoMorph owns it).

---

### Task 1: Build the shared `BeforeAfterSlider`

**Files:**
- Create: `components/progress/BeforeAfterSlider.tsx`
- Create: `components/progress/BeforeAfterSlider.test.tsx`

**Interfaces:**
- Consumes: `useTheme()`, `Colors`/`withOpacity`/`overlayOpacity`, `spacing`/`borderRadius`/`fontFamily`/`preciseType`.
- Produces: `BeforeAfterSlider` with props `{ beforeUri: string; afterUri: string; beforeLabel: string; afterLabel: string; onValueChange?: (value: number) => void; style?: ViewStyle }`. `value` reported by `onValueChange` is **after-ness 0–100** (higher = more of the "after" photo revealed), matching PhotoMorph's existing `sliderValue` semantics. The component owns its own drag gesture and width measurement; wrap it in a `ContactSheetFrame` at the call site for the mat/caption. Consumed by Tasks 2 and 3.

- [ ] **Step 1: Write the failing test**

Create `components/progress/BeforeAfterSlider.test.tsx`:

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import { BeforeAfterSlider } from "./BeforeAfterSlider";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

describe("BeforeAfterSlider", () => {
  it("renders both labels and both photo sources", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BeforeAfterSlider
          beforeUri="file://before.jpg"
          afterUri="file://after.jpg"
          beforeLabel="Before"
          afterLabel="After"
        />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("BEFORE");
    expect(json).toContain("AFTER");
    expect(json).toContain("file://before.jpg");
    expect(json).toContain("file://after.jpg");
  });

  it("accepts an onValueChange callback and an onLayout without firing spuriously", () => {
    const onValueChange = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <BeforeAfterSlider
          beforeUri="a"
          afterUri="b"
          beforeLabel="Before"
          afterLabel="After"
          onValueChange={onValueChange}
        />
      );
    });
    // The container measures itself via onLayout; feeding a layout must not
    // by itself invoke onValueChange (that only happens on a real drag).
    const container = tree!.root.findAll((n) => typeof n.props.onLayout === "function")[0];
    expect(container).toBeTruthy();
    act(() => container.props.onLayout({ nativeEvent: { layout: { width: 200 } } }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
```

Note: RN's PanResponder handlers are attached via the `panHandlers` spread and go through the responder system, not plain props — they're awkward to invoke through `react-test-renderer`. So the drag math itself is verified in the Task 6 manual QA, not here; the first test is the real behavioral assertion (labels + both sources render), and the second is a mount/wiring smoke check.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/progress/BeforeAfterSlider.test.tsx`
Expected: FAIL — cannot find module `./BeforeAfterSlider`.

- [ ] **Step 3: Implement the component**

Create `components/progress/BeforeAfterSlider.tsx`:

```tsx
import React, { useRef, useState } from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  PanResponder,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, borderRadius, fontFamily, preciseType } from "@/constants/DesignSystem";

interface BeforeAfterSliderProps {
  beforeUri: string;
  afterUri: string;
  beforeLabel: string;
  afterLabel: string;
  onValueChange?: (value: number) => void; // after-ness 0..100
  style?: ViewStyle;
}

const KNOB = 30;

// Shared before/after wipe-reveal slider. A draggable divider splits the
// "before" photo (left) from the "after" photo (right) — clearer than an
// opacity crossfade. It measures its own width and owns its drag gesture.
// Wrap it in a ContactSheetFrame at the call site for the mat + caption.
export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUri,
  afterUri,
  beforeLabel,
  afterLabel,
  onValueChange,
  style,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const [width, setWidth] = useState(0);
  const [after, setAfter] = useState(50); // after-ness: higher = more "after" shown
  const widthRef = useRef(0);

  const setFromX = (x: number) => {
    const w = widthRef.current;
    if (w <= 0) return;
    let dividerPct = (x / w) * 100; // divider position from the left
    dividerPct = Math.max(0, Math.min(100, dividerPct));
    const afterness = 100 - dividerPct; // left of divider = before, right = after
    setAfter(afterness);
    onValueChange?.(afterness);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => setFromX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => setFromX(evt.nativeEvent.locationX),
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  };

  const dividerLeft = `${100 - after}%`; // before occupies the left portion

  return (
    <View style={[styles.container, style]} onLayout={onLayout} {...panResponder.panHandlers}>
      {/* base layer: after photo (revealed on the right) */}
      <Image source={{ uri: afterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {/* overlay: before photo, clipped to the left portion */}
      <View style={[styles.beforeClip, { width: dividerLeft }]}>
        <Image
          source={{ uri: beforeUri }}
          style={{ width: width || undefined, height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <View style={styles.labels} pointerEvents="none">
        <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy) }]}>
          <Text style={[preciseType.caption, styles.labelText, { fontFamily: fontFamily.mono }]}>
            {beforeLabel.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy) }]}>
          <Text style={[preciseType.caption, styles.labelText, { fontFamily: fontFamily.mono }]}>
            {afterLabel.toUpperCase()}
          </Text>
        </View>
      </View>

      <View
        pointerEvents="none"
        style={[styles.divider, { left: dividerLeft, backgroundColor: theme.primary }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.knob,
          { left: dividerLeft, backgroundColor: theme.background, borderColor: theme.primary },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  beforeClip: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  labels: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderRadius: 4,
  },
  labelText: {
    color: "white",
  },
  divider: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
  },
  knob: {
    position: "absolute",
    top: "50%",
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    borderWidth: 2,
    marginLeft: -KNOB / 2,
    marginTop: -KNOB / 2,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/progress/BeforeAfterSlider.test.tsx`
Expected: PASS (2 tests), exit 0, output pristine.

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit` — no errors.

```bash
git add components/progress/BeforeAfterSlider.tsx components/progress/BeforeAfterSlider.test.tsx
git commit -m "feat: add shared BeforeAfterSlider wipe-reveal component"
```

---

### Task 2: Migrate Home's `MiniComparisonPreview` to `BeforeAfterSlider`

**Files:**
- Modify: `components/home/MiniComparisonPreview.tsx`

**Interfaces:**
- Consumes: `BeforeAfterSlider` (Task 1). Unchanged props (`{ photos: Photo[] }`), unchanged usage in `app/(tabs)/index.tsx`.

- [ ] **Step 1: Replace the full contents of `components/home/MiniComparisonPreview.tsx`**

```tsx
import Colors from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Photo } from "@/services/photoStorage";
import { getBestComparisonPair } from "@/utils/photoUtils";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { ContactSheetFrame } from "./ContactSheetFrame";
import { BeforeAfterSlider } from "@/components/progress/BeforeAfterSlider";

type MiniComparisonPreviewProps = {
  photos: Photo[];
};

// The screen's thesis: the before/after photos themselves, framed like
// negatives on a light table. Uses the shared BeforeAfterSlider so Home and
// Progress render the exact same comparison interaction.
export const MiniComparisonPreview: React.FC<MiniComparisonPreviewProps> = ({ photos }) => {
  // useTheme() keeps this subtree reactive to theme changes even though the
  // frame/slider own their own colors.
  useTheme();
  const { t } = useLocalization();
  const router = useRouter();

  const comparisonPair = getBestComparisonPair(photos);
  if (!comparisonPair) {
    return null;
  }

  const { type, oldest: oldestPhoto, newest: newestPhoto } = comparisonPair;
  const caption = `${new Date(oldestPhoto.date).toLocaleDateString()} → ${new Date(newestPhoto.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`;

  return (
    <TouchableOpacity onPress={() => router.push("/(tabs)/progress")} activeOpacity={0.95}>
      <ContactSheetFrame caption={caption}>
        <BeforeAfterSlider
          beforeUri={oldestPhoto.uri}
          afterUri={newestPhoto.uri}
          beforeLabel={t("common.before")}
          afterLabel={t("common.after")}
        />
      </ContactSheetFrame>
    </TouchableOpacity>
  );
};
```

Note: this deletes the entire local slider implementation (PanResponder, `pan`, `sliderValue`, `Dimensions`, `Animated`, all the `styles`). `useTheme()` is called (without binding) purely so the component re-renders on theme change, consistent with the codebase's pattern; if the reviewer/tsc prefers, it can be removed entirely since `Colors` is no longer read here — if removed, also drop the `Colors`/`useTheme` imports. Prefer removing them for cleanliness: final imports need only `useLocalization`, `useRouter`, `React`, `TouchableOpacity`, `ContactSheetFrame`, `BeforeAfterSlider`, `Photo`, `getBestComparisonPair`. Use that lean version.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit` — no errors. Confirm no unused imports remain (remove `Colors`/`useTheme` if not referenced).

- [ ] **Step 3: Commit**

```bash
git add components/home/MiniComparisonPreview.tsx
git commit -m "refactor: Home comparison uses the shared BeforeAfterSlider"
```

---

### Task 3: PhotoMorph slider mode → `BeforeAfterSlider`

**Files:**
- Modify: `components/progress/PhotoMorph.tsx`

**Interfaces:**
- Consumes: `BeforeAfterSlider` (Task 1), `ContactSheetFrame` from `@/components/home/ContactSheetFrame`.
- Produces: no prop/behavior change to `PhotoMorph`. Only the `comparisonMode === 'slider'` render block changes.

**Preserve byte-stable:** `sliderValue` state (still used by `extractPhoto`), `extractPhoto` itself, the `oldestPhoto`/`newestPhoto` derivation, and every other mode. This task removes only the slider mode's inline two-image crossfade + the custom slider track/thumb; the `pan`/`panResponder`/`SLIDER_WIDTH`/`THUMB_*` machinery becomes dead once the slider mode no longer uses it — remove those too, but ONLY after confirming (grep) they are not referenced by any other mode.

- [ ] **Step 1: Add imports**

Add near PhotoMorph's other imports:
```tsx
import { BeforeAfterSlider } from "@/components/progress/BeforeAfterSlider";
import { ContactSheetFrame } from "@/components/home/ContactSheetFrame";
```

- [ ] **Step 2: Replace the slider-mode render block**

Find the `{comparisonMode === 'slider' && ( ... )}` block (the `<>` fragment containing `styles.imageContainer` with the two crossfade `Image`s, `photoLabels`, `extractButton`, and the `sliderWrapper`/`sliderContainer`/`sliderTrack`/`sliderProgress`/`sliderThumb`/`sliderLabels`). Replace the whole block with:

```tsx
      {comparisonMode === 'slider' && (
        <ContactSheetFrame caption={`${new Date(oldestPhoto.date).toLocaleDateString()} → ${new Date(newestPhoto.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`}>
          <View style={styles.sliderStage}>
            <BeforeAfterSlider
              beforeUri={photo1.uri}
              afterUri={photo2.uri}
              beforeLabel={t("common.before")}
              afterLabel={t("common.after")}
              onValueChange={setSliderValue}
            />
            <TouchableOpacity
              style={[styles.extractButton, { backgroundColor: theme.primary }]}
              onPress={extractPhoto}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
            </TouchableOpacity>
          </View>
        </ContactSheetFrame>
      )}
```

Notes:
- `type` here is the `PhotoMorphProps.type` prop (the angle) — confirm it's in scope in the render (it is: `PhotoMorph` receives `type`). If the caption's `t(\`camera.${type}\`)` duplicates a value already computed elsewhere, reuse that variable instead.
- `photo1`/`photo2` are the already-derived comparison photos (do not change their derivation).
- `onValueChange={setSliderValue}` keeps `extractPhoto`'s `sliderValue > 50 ? newest : oldest` decision working exactly as before.

- [ ] **Step 3: Remove the now-dead slider styles and gesture machinery**

Confirm via grep that `pan`, `panResponder`, `SLIDER_WIDTH`, `THUMB_SIZE`, `THUMB_RADIUS`, and the styles `imageContainer` (if only used by slider + single-photo — CHECK: the single-photo branch at `photos.length === 1` also uses `imageContainer`/`image`/`photoLabels`/`extractButton`; those are migrated in Task 5, so KEEP `imageContainer`/`image`/`photoLabels`/`extractButton` for now), `sliderWrapper`, `sliderContainer`, `sliderTrack`, `sliderProgress`, `sliderThumb`, `sliderThumbInner`, `sliderLabels`, `overlayImage` are no longer referenced anywhere after Step 2. Remove exactly the ones with zero remaining references. Add the new style:
```tsx
  sliderStage: {
    position: "relative",
  },
```
(and keep `extractButton` as-is; it's reused by the single-photo branch and now the slider stage.)

**If `pan`/`panResponder`/`SLIDER_WIDTH`/`THUMB_*` are only referenced by the removed slider block, delete them and the `Animated`/`PanResponder`/`Dimensions` imports if those become unused.** Verify with `npx tsc --noEmit` (unused locals won't fail tsc here, so also grep to confirm true deadness before deleting).

- [ ] **Step 4: Verify compilation and full suite**

Run: `npx tsc --noEmit` — no errors.
Run: `npx jest` — full suite exits 0.

- [ ] **Step 5: Commit**

```bash
git add components/progress/PhotoMorph.tsx
git commit -m "refactor: PhotoMorph slider mode uses the shared BeforeAfterSlider"
```

---

### Task 4: PhotoMorph — restructure the mode switcher

**Files:**
- Modify: `components/progress/PhotoMorph.tsx`

**Interfaces:**
- Consumes: existing `comparisonMode` state, `hasFeatureAccess`, `FeatureGate`/paywall behavior from Sub-project A.
- Produces: no prop change. The single horizontal mode-pill `ScrollView` (with `slider`/`sideBySide`/`gif`/`grid`/`select`) is replaced by: (a) slider as the always-default primary surface, (b) a labeled `VIEW` secondary action group for `sideBySide`/`grid`/`gif`, (c) a distinct `CHANGE` action for photo selection (was `select`).

**Preserve byte-stable:** all mode-switch handlers' underlying effects — `setComparisonMode(...)`, `setIsSelectingPhotos(true)`, and the `hasFeatureAccess`-gated behavior. The restructure is about grouping/labeling and making locked taps open the paywall (via the shared pattern), NOT about changing what each action does. **Critically: a locked secondary view must open the paywall on tap, never silently no-op** (the current `() => hasAccess && setMode()` pattern is the dead-tap bug — replace it so a locked tap sets a paywall-visible state or routes through `FeatureGate`/`PremiumLock`).

- [ ] **Step 1: Replace the mode-switcher `ScrollView` block**

Find the `<ScrollView horizontal ... style={styles.modeSwitcher}>` block containing the `[{key:'slider'...}, ...].map(...)` mode pills. Replace it with a structure that renders:
  1. A small `VIEW` group label (mono, `preciseType.statLabel` or `sectionLabel`, `theme.secondary`).
  2. A row of secondary-view buttons for `slider`, `sideBySide`, `grid`, `gif` — each a hairline pill; the active one filled brass; locked ones (`!hasFeatureAccess(...)`) show a `PRO` affordance and, on tap, set a local `paywallVisible` state (add `const [paywallVisible, setPaywallVisible] = useState(false)`) instead of no-op.
  3. The `CHANGE` action rendered separately (e.g. a top-right text action in PhotoMorph's header row, near the existing time-difference chip) that calls `hasCustomSelectionAccess ? setIsSelectingPhotos(true) : setPaywallVisible(true)`.

Concretely, replace the mode-switcher block with:

```tsx
      <Text style={[styles.groupLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
        {t("progress.view") || "VIEW"}
      </Text>
      <View style={styles.viewGroup}>
        {([
          { key: 'slider' as const, label: t('progress.modeSlider'), locked: false },
          { key: 'sideBySide' as const, label: t('progress.modeSideBySide'), locked: !hasSideBySideAccess },
          { key: 'grid' as const, label: t('progress.modeGrid'), locked: !hasGridViewAccess },
          { key: 'gif' as const, label: t('progress.modeGif'), locked: !hasGifAccess },
        ]).map((v) => {
          const active = comparisonMode === v.key;
          return (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.viewChip,
                active
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.transparent, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
              ]}
              onPress={() => (v.locked ? setPaywallVisible(true) : setComparisonMode(v.key))}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  preciseType.badgeLabel,
                  styles.viewChipText,
                  { color: active ? theme.background : theme.text, fontFamily: fontFamily.mono },
                ]}
              >
                {v.label.toUpperCase()}
              </Text>
              {v.locked && (
                <Text style={[preciseType.statLabel, { color: theme.primary, fontFamily: fontFamily.mono, marginLeft: spacing.xs }]}>
                  PRO
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
```

And add a `PaywallModal` mount near the end of PhotoMorph's returned tree (import `PaywallModal from "@/components/monetization/PaywallModal"` if not present):
```tsx
      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        source="progress_view"
      />
```

- [ ] **Step 2: Add the `CHANGE` action to the header row**

Find PhotoMorph's header row (the `headerRow`/`headerRowSingle` `View` containing the time-difference chip). Add, before or after the chip, a text action:
```tsx
        <TouchableOpacity
          onPress={() => (hasCustomSelectionAccess ? setIsSelectingPhotos(true) : setPaywallVisible(true))}
          activeOpacity={0.7}
        >
          <Text style={[preciseType.badgeLabel, { color: theme.primary, fontFamily: fontFamily.mono }]}>
            {(t("progress.change") || "Change") + " ›"}
          </Text>
        </TouchableOpacity>
```
Remove the old `select` entry from the mode list (done in Step 1 — it's no longer in the `.map`). The `isSelectingPhotos` selection screen and its `FeatureGate` wrapper stay exactly as they are.

- [ ] **Step 3: Add the new styles**

```tsx
  groupLabel: {
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  viewGroup: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  viewChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  viewChipText: {},
```
Remove the now-unused `modeSwitcher`/`modeSwitcherContent`/`modePill`/`modePillText`/`modeButtonContent`/`lockIcon` styles (confirm zero references first).

- [ ] **Step 4: Add the translation keys used above**

`t("progress.view")`, `t("progress.change")` are new. Add `view` and `change` to the `progress` block of `TranslationKeys` and all 5 locales (en: "View"/"Change", es: "Vista"/"Cambiar", it: "Vista"/"Cambia", de: "Ansicht"/"Ändern", fr: "Vue"/"Changer").

**`localization/translations.ts` carries unrelated WIP** — use the stash procedure: `git stash push -m B-t4-wip -- localization/translations.ts`, verify clean, add the keys, `tsc`, commit with the PhotoMorph change, then `git stash pop` and verify (STOP + report BLOCKED on conflict). The `||` fallbacks in the code above mean the app still works if a key is missing, but add them for completeness.

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit` and `npx jest` — clean, exit 0.

```bash
git add components/progress/PhotoMorph.tsx localization/translations.ts
git commit -m "feat: restructure PhotoMorph switcher (slider primary, VIEW group, CHANGE action)"
```
(then `git stash pop` per Step 4)

---

### Task 5: PhotoMorph — migrate remaining chrome to the flat language

**Files:**
- Modify: `components/progress/PhotoMorph.tsx`

**Interfaces:** no prop/behavior change. Presentation only.

**Preserve byte-stable:** GIF generation/save/auth logic, media-library calls, feature gating, photo-selection logic. Only colors/borders/shadows/typography change.

- [ ] **Step 1: Single-photo branch** (`photos.length === 1`) — replace its `imageContainer` (3px brass border + heavy shadow) with a `ContactSheetFrame` wrapping the `Image`, caption = the photo's date + angle (mono). Keep the extract button. Migrate `singlePhotoChip`/`singlePhotoHint` text to `preciseType` tokens + `theme.secondary`.

- [ ] **Step 2: Time-difference chip** (`timeDifferenceChip`) — convert from a brass rounded pill to a plain mono caption in `theme.secondary` (it's data, not an action), OR keep as a subtle hairline chip; remove the filled-brass background (brass is for actions). Use `preciseType.badgeLabel`.

- [ ] **Step 3: Grid mode** (`gridPhoto`/`gridImage`/`gridLabel`/`gridDateText`) — replace 2px brass borders + `theme.text + 'B3'` label backgrounds with hairline `withOpacity(theme.secondary, overlayOpacity.light)` borders and mono captions; no hardcoded opacity-hex strings.

- [ ] **Step 4: GIF result + message cards** (`gifResultContainer`/`gifImage`/`gifMessageCard`/`gifGenerateButton`/etc.) — remove drop shadows (`elevation`/`shadow*`), replace the brass/gradient treatments with flat mat cards (`theme.cardBackground` + hairline border), and convert the generate/download/clear buttons to the shared `Button` primitive (`variant="primary"`/`"ghost"`) where they are text+icon buttons. Keep all the GIF generation/save handlers wired to the same callbacks.

- [ ] **Step 5: Side-by-side** — `SyncedZoomPair` is a separate component; if it renders old-style chrome, restyle only its labels to mono/`preciseType` here or note it for a follow-up. Do not change its zoom/pan logic.

- [ ] **Step 6: Sweep** — no hardcoded hex, no `theme.x + 'NN'` opacity strings, no raw font literals where a `preciseType` token matches, no leftover `elevation`/`shadow*` on these surfaces. Remove any styles left unreferenced after the migration.

- [ ] **Step 7: Verify and commit**

Run: `npx tsc --noEmit` and `npx jest` — clean, exit 0.

```bash
git add components/progress/PhotoMorph.tsx
git commit -m "style: migrate PhotoMorph chrome (single/grid/gif/time-chip) to the flat language"
```

Note: Task 5 is deliberately the least prescriptive because it spans many small regions of a 1200-line file; the implementer reads each region and applies the flat-language conventions already established across the app (hairline borders, mat cards, mono `preciseType` text, `Button` primitive, no shadows, no hex). If any single region turns out large or risky, the implementer should report DONE_WITH_CONCERNS and it can be split.

---

### Task 6: Manual visual QA

No automated test confirms the comparison *feels* right (especially the drag). Do not report Sub-project B complete without this.

**Files:** none.

- [ ] **Step 1: Start the app** (project `run` skill / `npx expo start`).

- [ ] **Step 2: Home comparison** — with ≥2 same-angle photos, the Home hero shows the wipe slider inside the contact-sheet frame; drag the divider — before (left) / after (right) split moves smoothly, labels read correctly. Confirm it looks identical to Progress's slider (same component).

- [ ] **Step 3: Progress slider** — the primary surface is the wipe slider in a mat frame (no 3px brass border, no shadow); dragging works; the extract/download button still saves the correct photo (drag mostly-after then extract → saves the newest; mostly-before → oldest).

- [ ] **Step 4: Progress VIEW group + CHANGE** — slider/side-by-side/grid/gif appear as a labeled VIEW group; the active one is brass-filled; tapping a locked one (free account) opens the paywall (no silent tap); "Change ›" opens the photo-selection flow (or paywall if that's gated).

- [ ] **Step 5: Progress chrome** — single-photo, grid, GIF result, and time-difference all read in the flat instrument language (mat cards, hairlines, mono, no shadows). GIF generation still works end-to-end (generate → preview → save) on a premium/test account.

- [ ] **Step 6: Report** — summarize what was checked and any issues, for triage before Sub-project C.
