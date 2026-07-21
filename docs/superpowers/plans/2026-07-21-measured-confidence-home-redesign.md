# Measured Confidence: Home Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic near-black/neon-green, system-font visual identity with the "Measured Confidence" design system (Graphite & Brass palette, Fraunces/IBM Plex Mono/Inter typography, the contact-sheet photo motif) on the Home tab, per `docs/superpowers/specs/2026-07-21-measured-confidence-home-redesign-design.md`.

**Architecture:** Token layer first (fonts, colors), then new reusable presentational primitives (`ContactSheetFrame`, `InstrumentStrip`, `StreakBadge`), then restyle the existing Home child components to consume them, then rewire `app/(tabs)/index.tsx` to the new section order. Colors and fonts are shared app-wide tokens so other screens automatically inherit the new palette; only Home gets structural/compositional changes in this plan.

**Tech Stack:** Expo 57 / React Native 0.86 / React 19, expo-router, expo-font + `@expo-google-fonts/*`, jest-expo + react-test-renderer for tests.

## Global Constraints

- Do not modify Camera, Gallery, Settings, onboarding, or paywall screen files in this plan — they keep their current JSX/structure and only inherit new token *values* automatically through the shared `Colors`/`DesignSystem` objects.
- Do not change the existing values of `borderRadius`, `elevation`, or `typography` exported from `constants/DesignSystem.ts` — those are consumed by out-of-scope screens today. New/restyled Home components must reach for already-small existing scale values (`borderRadius.sm` = 8, `borderRadius.md` = 12) and local hairline-border styles instead of `elevation.*`, rather than changing the shared scale.
- All new or restyled component files must consume color via the `Colors`/`DesignSystem` token objects — no new hardcoded hex values.
- All new or restyled component files must also consume `fontSize`/`letterSpacing` via the centralized `preciseType` export (added in the addendum after Task 1) rather than inlining raw numbers per component — one named token per role, reused across components, not scattered literals.
- `AchievementBadges.tsx`, `WeeklyProgressChart.tsx`, and `ConsistencyHeatmap.tsx` are confirmed (via grep — no hardcoded hex/`"white"`/`"black"` literals) to consume only shared tokens. They need no code changes in this plan; verify this holds in the final manual QA task.
- Every new pure helper function gets a failing jest test written before the implementation (TDD).
- Every new presentational component (`ContactSheetFrame`, `InstrumentStrip`, `StreakBadge`) gets a `react-test-renderer` smoke test. Confirmed working pattern in this repo/toolchain (RN 0.86 + React 19 + react-test-renderer 19.2.3): wrap `create()` in `act()` from `react-test-renderer`, e.g.:
  ```tsx
  import { create, act } from "react-test-renderer";
  let tree: ReturnType<typeof create>;
  act(() => {
    tree = create(<Component {...props} />);
  });
  const json = JSON.stringify(tree!.toJSON());
  ```
  Calling `create()` directly (unwrapped) fails in this project with `ReferenceError: You are trying to import a file after the Jest environment has been torn down` — always use the `act()` wrapper shown above.
- The `@/*` path alias resolves correctly under Jest already (confirmed) — no `moduleNameMapper` changes needed in `package.json`.
- Run `npx tsc --noEmit` at the end of every task as the compilation gate.
- These are visual/design changes — passing tests and `tsc` confirm the code compiles and pure logic is correct, but do **not** confirm the redesign looks right. The final task is a mandatory manual run-through; do not report this plan complete without it.

---

## File structure

New files:
- `utils/photoUtils.test.ts` — unit test for the new weekly-count helper
- `components/home/ContactSheetFrame.tsx` + `.test.tsx` — the signature photo-mat primitive
- `components/home/InstrumentStrip.tsx` + `.test.tsx` — replaces `ProgressSummary` on Home
- `components/home/StreakBadge.tsx` + `.test.tsx` — replaces `StreakCard` on Home

Modified files:
- `package.json` — add 3 font packages
- `app/_layout.tsx` — load the new fonts, drop unused `SpaceMono`
- `constants/DesignSystem.ts` — add `fontFamily` token export
- `constants/Colors.ts` — replace the color palette
- `utils/photoUtils.ts` — add `getPhotosInLastNDays`
- `localization/translations.ts` — add `progressSummary.thisWeek` key (5 locales)
- `components/home/Header.tsx` — gradient hero → slim mono top bar
- `components/home/NextPhotoReminder.tsx` — restyle to hairline card
- `components/home/MiniComparisonPreview.tsx` — wrap in `ContactSheetFrame`, becomes the hero
- `components/home/LatestPhotoCard.tsx` — wrap in `ContactSheetFrame`
- `components/home/ShreddedTipsCarousel.tsx` — solid block → mat card
- `app/(tabs)/index.tsx` — reorder sections, swap `ProgressSummary`/`StreakCard` for `InstrumentStrip`/`StreakBadge`

Deleted: nothing (component files are rewritten in place; `StreakCard.tsx` and `ProgressSummary.tsx` are left on disk but no longer imported by `index.tsx` — confirmed via grep they have no other consumers; removing the now-dead files is a follow-up cleanup, not required for this plan to ship working software).

Untouched (confirmed no code changes needed): `AchievementBadges.tsx`, `WeeklyProgressChart.tsx`, `ConsistencyHeatmap.tsx`, `components/style/BackgroundImage.tsx` (see Task 14 note on the background image assets).

---

### Task 1: Bundle typefaces and add font tokens

**Files:**
- Modify: `package.json`
- Modify: `app/_layout.tsx`
- Modify: `constants/DesignSystem.ts`

**Interfaces:**
- Produces: `fontFamily` export from `@/constants/DesignSystem` with keys `display`, `displayRegular`, `mono`, `monoSemiBold`, `body`, `bodyMedium` (string values matching the exact `useFonts` keys loaded in `app/_layout.tsx`). Every later task that sets custom type reads these keys.

- [ ] **Step 1: Install the font packages**

Run: `npm install @expo-google-fonts/fraunces@^0.4.1 @expo-google-fonts/ibm-plex-mono@^0.4.1 @expo-google-fonts/inter@^0.4.2`
Expected: `package.json` `dependencies` gains all three packages; no peer-dependency warnings (these packages have zero deps).

- [ ] **Step 2: Load the fonts in `app/_layout.tsx`**

In `app/_layout.tsx`, replace:

```tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
```

with:

```tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
} from "@expo-google-fonts/fraunces";
import {
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
```

Then replace the `useFonts` call:

```tsx
const [loaded, error] = useFonts({
  SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  ...FontAwesome.font,
});
```

with:

```tsx
const [loaded, error] = useFonts({
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  Inter_400Regular,
  Inter_500Medium,
  ...FontAwesome.font,
});
```

- [ ] **Step 3: Add the `fontFamily` token export**

In `constants/DesignSystem.ts`, add this new export near the top (after the `spacing` export, before `typography`):

```ts
// Font family tokens (Measured Confidence type system)
export const fontFamily = {
  display: "Fraunces_500Medium_Italic", // editorial voice — photos, motivational copy
  displayRegular: "Fraunces_500Medium",
  mono: "IBMPlexMono_500Medium", // precision voice — stats, dates, labels
  monoSemiBold: "IBMPlexMono_600SemiBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
} as const;
```

Add `fontFamily` to the default export object at the bottom of the file (in the object passed to `export default { ... }`), alongside the existing keys.

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app/_layout.tsx constants/DesignSystem.ts
git commit -m "feat: bundle Fraunces/IBM Plex Mono/Inter and add fontFamily tokens"
```

---

### Addendum (post Task 6 review): centralize the type scale as `preciseType`

Task 6's reviewer flagged that `InstrumentStrip` hardcodes raw `fontSize`/`letterSpacing` numbers instead of pulling from a token. That pattern was present by design across Tasks 5–13 (deliberately not reusing the shared `typography` export, since its values are frozen for other screens per Global Constraints) — but scattering raw numbers per-component instead of centralizing them was a real gap. This addendum adds one centralized, additive export — `preciseType` — that Tasks 5–13 reference instead of inlining numbers. It does not modify `typography`, `borderRadius`, or `elevation`.

**Files:**
- Modify: `constants/DesignSystem.ts`

**Interfaces:**
- Produces: `preciseType` export from `@/constants/DesignSystem` — a set of named `{ fontSize: number; letterSpacing?: number }` objects, spread into a `Text` style alongside `fontFamily.*`. Every later task (5 onward) reads one of these keys instead of a raw `fontSize`/`letterSpacing` number.

- [ ] **Step 1: Add the `preciseType` export**

In `constants/DesignSystem.ts`, add this new export directly below the `fontFamily` export added in Task 1:

```ts
// Type-scale tokens for Measured Confidence components (additive — does not
// touch `typography`, which other screens still rely on unchanged).
export const preciseType = {
  wordmark: { fontSize: 12, letterSpacing: 2 },        // Header top bar
  caption: { fontSize: 11, letterSpacing: 0.5 },       // ContactSheetFrame caption, before/after labels
  statValue: { fontSize: 20 },                          // InstrumentStrip big numbers
  statLabel: { fontSize: 9, letterSpacing: 1 },        // InstrumentStrip small labels
  badgeValue: { fontSize: 14 },                         // StreakBadge count
  badgeLabel: { fontSize: 10, letterSpacing: 1 },      // StreakBadge label, NextPhotoReminder action
  sectionLabel: { fontSize: 11, letterSpacing: 1.5 },  // Home screen section labels (Latest Photo, Tips)
  message: { fontSize: 16 },                            // NextPhotoReminder title
  subtitle: { fontSize: 13 },                           // NextPhotoReminder subtitle
  tipHeadline: { fontSize: 17 },                        // ShreddedTipsCarousel main tip
  tipBody: { fontSize: 14 },                            // ShreddedTipsCarousel clarification
} as const;
```

Add `preciseType` to the default export object at the bottom of the file, alongside `fontFamily` and the other keys.

Usage pattern in consuming components (already reflected in Tasks 7–13's code below, and used to retrofit Tasks 5–6): spread the token object into the style array alongside the color/fontFamily overrides, e.g.:

```tsx
<Text style={[styles.caption, preciseType.caption, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
```

rather than putting `fontSize`/`letterSpacing` in the local `StyleSheet.create` block at all.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add constants/DesignSystem.ts
git commit -m "feat: add preciseType centralized type-scale tokens"
```

---

### Task 2: Replace the color palette

**Files:**
- Modify: `constants/Colors.ts`

**Interfaces:**
- Produces: `Colors.light` / `Colors.dark` objects — same keys as today (`text`, `background`, `tint`, `tabIconDefault`, `tabIconSelected`, `primary`, `secondary`, `accent`, `cardBackground`, `success`, `warning`, `error`, `info`, `transparent`) **plus one new key**: `milestone` (the ember accent, reserved for streaks/achievements). Every later task reads `theme.primary` (brass), `theme.secondary` (steel, used for hairline borders/captions), `theme.milestone` (ember), and the existing semantic keys.

- [ ] **Step 1: Replace the full contents of `constants/Colors.ts`**

```ts
// Color definitions — "Measured Confidence" palette (Graphite & Brass)
const colors = {
  ink: "#14161A",         // app background (dark)
  surface: "#1D2025",     // card/panel background (dark)
  surfaceLight: "#F7F4EE",// card/panel background (light)
  paper: "#EDEAE2",       // primary text (dark) / app background (light) / photo mats
  steel: "#4A5A63",       // dividers, secondary surfaces, hairline borders
  mist: "#8B9198",        // secondary/caption text, inactive icons
  brass: "#C9A227",       // precision accent — active states, primary actions, data highlights
  ember: "#D1603D",       // reserved exclusively for streaks/achievements/milestones
  sage: "#7A9E7E",        // success
  gold: "#D1943D",        // warning
  brick: "#B23B3B",       // error
  haze: "#5C7A8A",        // info
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
};

const tintColorLight = colors.brass;
const tintColorDark = colors.brass;

/**
 * Helper function to add opacity to hex colors
 * @param hex - The hex color string (e.g., "#00C676")
 * @param opacity - The opacity value between 0 and 1 (e.g., 0.5 for 50%)
 * @returns The hex color with opacity (e.g., "#00C67680")
 */
export const withOpacity = (hex: string, opacity: number): string => {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Calculate alpha value (0-255) and convert to hex
  const alpha = Math.round(opacity * 255);
  const alphaHex = alpha.toString(16).padStart(2, '0');

  return `#${cleanHex}${alphaHex}`;
};

/**
 * Common overlay opacity values
 * Use these with withOpacity() for consistent transparency
 */
export const overlayOpacity = {
  subtle: 0.15,   // 15% - Very light overlay
  light: 0.25,    // 25% - Light overlay
  medium: 0.4,    // 40% - Medium overlay
  heavy: 0.6,     // 60% - Heavy overlay
  veryHeavy: 0.8, // 80% - Very heavy overlay
} as const;

export default {
  light: {
    text: colors.ink,
    background: colors.paper,
    tint: tintColorLight,
    tabIconDefault: colors.mist,
    tabIconSelected: tintColorLight,
    primary: colors.brass,
    secondary: colors.steel,
    accent: colors.steel,
    cardBackground: colors.surfaceLight,
    milestone: colors.ember,
    success: colors.sage,
    warning: colors.gold,
    error: colors.brick,
    info: colors.haze,
    transparent: colors.transparent,
  },
  dark: {
    text: colors.paper,
    background: colors.ink,
    tint: tintColorDark,
    tabIconDefault: colors.mist,
    tabIconSelected: tintColorDark,
    primary: colors.brass,
    secondary: colors.steel,
    accent: colors.steel,
    cardBackground: colors.surface,
    milestone: colors.ember,
    success: colors.sage,
    warning: colors.gold,
    error: colors.brick,
    info: colors.haze,
    transparent: colors.transparent,
  },
};
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. (Every existing consumer reads keys that still exist; `milestone` is additive.)

- [ ] **Step 3: Commit**

```bash
git add constants/Colors.ts
git commit -m "feat: replace color palette with Measured Confidence (Graphite & Brass)"
```

---

### Task 3: Add the weekly photo count helper (TDD)

**Files:**
- Modify: `utils/photoUtils.ts`
- Create: `utils/photoUtils.test.ts`

**Interfaces:**
- Consumes: `Photo` type from `@/services/photoStorage` (`{ id: string; uri: string; date: string; type: PhotoType; fileName?: string }`), `PhotoType` enum from `@/enums/Photos` (`front`/`side`/`back`).
- Produces: `getPhotosInLastNDays(photos: Photo[], days: number): number`, used by Task 13 (`app/(tabs)/index.tsx`).

- [ ] **Step 1: Write the failing test**

Create `utils/photoUtils.test.ts`:

```ts
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import { getPhotosInLastNDays } from "./photoUtils";

const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

const makePhoto = (date: string): Photo => ({
  id: date,
  uri: "file://test.jpg",
  date,
  type: PhotoType.front,
});

describe("getPhotosInLastNDays", () => {
  it("counts only photos within the last N days", () => {
    const photos = [
      makePhoto(daysAgo(0)),
      makePhoto(daysAgo(2)),
      makePhoto(daysAgo(6)),
      makePhoto(daysAgo(8)),
      makePhoto(daysAgo(30)),
    ];

    expect(getPhotosInLastNDays(photos, 7)).toBe(3);
  });

  it("returns 0 for an empty photo list", () => {
    expect(getPhotosInLastNDays([], 7)).toBe(0);
  });

  it("returns 0 when no photos fall in the window", () => {
    const photos = [makePhoto(daysAgo(30)), makePhoto(daysAgo(60))];
    expect(getPhotosInLastNDays(photos, 7)).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest utils/photoUtils.test.ts`
Expected: FAIL — `getPhotosInLastNDays` is not exported from `./photoUtils`.

- [ ] **Step 3: Implement the helper**

In `utils/photoUtils.ts`, add below the existing `getBestComparisonPair` function:

```ts
// Counts photos taken within the last `days` days (inclusive of today).
export const getPhotosInLastNDays = (photos: Photo[], days: number): number => {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return photos.filter((photo) => new Date(photo.date).getTime() >= cutoff).length;
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest utils/photoUtils.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit` — expect no errors.

```bash
git add utils/photoUtils.ts utils/photoUtils.test.ts
git commit -m "feat: add getPhotosInLastNDays helper for the instrument strip"
```

---

### Task 4: Add the `progressSummary.thisWeek` translation key

**Files:**
- Modify: `localization/translations.ts`

**Interfaces:**
- Produces: `t("progressSummary.thisWeek")` — used by Task 6 (`InstrumentStrip`).

- [ ] **Step 1: Add the key to the `TranslationKeys` interface**

In the `progressSummary` block of the `TranslationKeys` interface (around line 176):

```ts
  progressSummary: {
    days: string;
    photos: string;
    consistency: string;
    thisWeek: string;
  };
```

- [ ] **Step 2: Add the translated value to each of the 5 locale blocks**

In the `en` locale's `progressSummary` block:
```ts
    progressSummary: {
      days: "days",
      photos: "photos",
      consistency: "consistency",
      thisWeek: "this week",
    },
```

In the `es` locale's `progressSummary` block:
```ts
    progressSummary: {
      days: "días",
      photos: "fotos",
      consistency: "consistencia",
      thisWeek: "esta semana",
    },
```
(keep the existing `consistency` value already in the file — only add the `thisWeek` line)

In the `it` locale's `progressSummary` block, add:
```ts
      thisWeek: "questa settimana",
```

In the `de` locale's `progressSummary` block, add:
```ts
      thisWeek: "diese Woche",
```

In the `fr` locale's `progressSummary` block, add:
```ts
      thisWeek: "cette semaine",
```

- [ ] **Step 3: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors (TypeScript would fail here if any locale block were missing the new required key — that's the safety net for this task).

- [ ] **Step 4: Commit**

```bash
git add localization/translations.ts
git commit -m "feat: add progressSummary.thisWeek translation key"
```

---

### Task 5: Build the `ContactSheetFrame` component

**Files:**
- Create: `components/home/ContactSheetFrame.tsx`
- Create: `components/home/ContactSheetFrame.test.tsx`

**Interfaces:**
- Consumes: `useTheme()` from `@/context/ThemeContext` (`{ effectiveColorScheme: 'light' | 'dark' }`), `Colors`/`withOpacity`/`overlayOpacity` from `@/constants/Colors`, `spacing`/`borderRadius`/`fontFamily` from `@/constants/DesignSystem`.
- Produces: `ContactSheetFrame` component with props `{ caption: string; children: React.ReactNode; style?: ViewStyle }`. Used by Task 10 (`MiniComparisonPreview`) and Task 11 (`LatestPhotoCard`).

- [ ] **Step 1: Write the failing test**

Create `components/home/ContactSheetFrame.test.tsx`:

```tsx
import React from "react";
import { Text } from "react-native";
import { create, act } from "react-test-renderer";
import { ContactSheetFrame } from "./ContactSheetFrame";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

describe("ContactSheetFrame", () => {
  it("renders the caption and its children", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <ContactSheetFrame caption="DAY 1 → DAY 47 · FRONT">
          <Text>photo-content</Text>
        </ContactSheetFrame>
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("DAY 1");
    expect(json).toContain("FRONT");
    expect(json).toContain("photo-content");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/home/ContactSheetFrame.test.tsx`
Expected: FAIL — cannot find module `./ContactSheetFrame`.

- [ ] **Step 3: Implement the component**

Create `components/home/ContactSheetFrame.tsx`:

```tsx
import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, borderRadius, fontFamily, preciseType } from "@/constants/DesignSystem";

interface ContactSheetFrameProps {
  caption: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

const TICK_COUNT = 10;

// The app's signature photo treatment: a paper mat with sprocket-hole ticks
// and a mono caption, applied everywhere a progress photo is shown.
export const ContactSheetFrame: React.FC<ContactSheetFrameProps> = ({
  caption,
  children,
  style,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  return (
    <View style={[styles.mat, { backgroundColor: theme.cardBackground }, style]}>
      <View style={styles.ticks}>
        {Array.from({ length: TICK_COUNT }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.tick,
              { backgroundColor: withOpacity(theme.secondary, overlayOpacity.medium) },
            ]}
          />
        ))}
      </View>
      <View style={styles.content}>{children}</View>
      <Text style={[styles.caption, preciseType.caption, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
        {caption}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  mat: {
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  ticks: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  tick: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  content: {
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  caption: {
    marginTop: spacing.sm,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/home/ContactSheetFrame.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit` — expect no errors.

```bash
git add components/home/ContactSheetFrame.tsx components/home/ContactSheetFrame.test.tsx
git commit -m "feat: add ContactSheetFrame signature photo-mat component"
```

---

### Task 6: Build the `InstrumentStrip` component

**Files:**
- Create: `components/home/InstrumentStrip.tsx`
- Create: `components/home/InstrumentStrip.test.tsx`

**Interfaces:**
- Consumes: `useTheme()`, `Colors`/`withOpacity`/`overlayOpacity`, `spacing`/`fontFamily`, `useLocalization()` from `@/context/LocalizationContext` (`{ t: (key: string) => string }`), translation keys `progressSummary.days` / `progressSummary.consistency` / `progressSummary.thisWeek` (added in Task 4).
- Produces: `InstrumentStrip` component with props `{ totalDays: number; consistency: number; weeklyPhotoCount: number }`. Replaces `ProgressSummary` in Task 13 (`app/(tabs)/index.tsx`).

- [ ] **Step 1: Write the failing test**

Create `components/home/InstrumentStrip.test.tsx`:

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import { InstrumentStrip } from "./InstrumentStrip";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "progressSummary.days": "days",
        "progressSummary.consistency": "consistency",
        "progressSummary.thisWeek": "this week",
      };
      return map[key] ?? key;
    },
  }),
}));

describe("InstrumentStrip", () => {
  it("renders all three stat columns", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <InstrumentStrip totalDays={47} consistency={82} weeklyPhotoCount={3} />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("47");
    expect(json).toContain("82%");
    expect(json).toContain("3");
    expect(json).toContain("THIS WEEK");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/home/InstrumentStrip.test.tsx`
Expected: FAIL — cannot find module `./InstrumentStrip`.

- [ ] **Step 3: Implement the component**

Create `components/home/InstrumentStrip.tsx`:

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { spacing, fontFamily, preciseType } from "@/constants/DesignSystem";

type InstrumentStripProps = {
  totalDays: number;
  consistency: number;
  weeklyPhotoCount: number;
};

// The precision readout: replaces ProgressSummary's stat cards with a single
// mono data strip, like a measurement instrument's display.
export const InstrumentStrip: React.FC<InstrumentStripProps> = ({
  totalDays,
  consistency,
  weeklyPhotoCount,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  const columns = [
    { key: "days", value: `${totalDays}`, label: t("progressSummary.days").toUpperCase(), color: theme.text },
    { key: "consistency", value: `${consistency.toFixed(0)}%`, label: t("progressSummary.consistency").toUpperCase(), color: theme.primary },
    { key: "thisWeek", value: `${weeklyPhotoCount}`, label: t("progressSummary.thisWeek").toUpperCase(), color: theme.text },
  ];

  return (
    <View style={styles.container}>
      {columns.map((column, index) => (
        <View
          key={column.key}
          style={[
            styles.column,
            index < columns.length - 1 && {
              borderRightWidth: 1,
              borderRightColor: withOpacity(theme.secondary, overlayOpacity.light),
            },
          ]}
        >
          <Text style={[styles.value, preciseType.statValue, { color: column.color, fontFamily: fontFamily.mono }]}>
            {column.value}
          </Text>
          <Text style={[styles.label, preciseType.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
            {column.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  column: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  value: {},
  label: {
    marginTop: spacing.xs,
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/home/InstrumentStrip.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit` — expect no errors.

```bash
git add components/home/InstrumentStrip.tsx components/home/InstrumentStrip.test.tsx
git commit -m "feat: add InstrumentStrip stat readout component"
```

---

### Task 7: Build the `StreakBadge` component

**Files:**
- Create: `components/home/StreakBadge.tsx`
- Create: `components/home/StreakBadge.test.tsx`

**Interfaces:**
- Consumes: `useTheme()`, `Colors`/`withOpacity`/`overlayOpacity` (specifically the new `theme.milestone` key from Task 2), `spacing`/`borderRadius`/`iconSize`/`fontFamily`, `useLocalization()`, translation key `home.streak`.
- Produces: `StreakBadge` component with props `{ streak: number }`. Replaces `StreakCard` in Task 13.

- [ ] **Step 1: Write the failing test**

Create `components/home/StreakBadge.test.tsx`:

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import { StreakBadge } from "./StreakBadge";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => (key === "home.streak" ? "Streak" : key),
  }),
}));

describe("StreakBadge", () => {
  it("renders the streak count and label", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<StreakBadge streak={7} />);
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("7");
    expect(json).toContain("STREAK");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/home/StreakBadge.test.tsx`
Expected: FAIL — cannot find module `./StreakBadge`.

- [ ] **Step 3: Implement the component**

Create `components/home/StreakBadge.tsx`:

```tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { spacing, borderRadius, iconSize, fontFamily, preciseType } from "@/constants/DesignSystem";

type StreakBadgeProps = {
  streak: number;
};

// The one place the 10% "athletic" accent (ember) is allowed to show up.
// Deliberately compact — a milestone signal, not a primary metric.
export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: withOpacity(theme.milestone, overlayOpacity.subtle) },
      ]}
    >
      <Ionicons name="flame" size={iconSize.sm} color={theme.milestone} />
      <Text style={[styles.count, preciseType.badgeValue, { color: theme.milestone, fontFamily: fontFamily.mono }]}>
        {streak}
      </Text>
      <Text style={[styles.label, preciseType.badgeLabel, { color: theme.milestone, fontFamily: fontFamily.mono }]}>
        {t("home.streak").toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    gap: spacing.xs,
  },
  count: {},
  label: {},
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/home/StreakBadge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit` — expect no errors.

```bash
git add components/home/StreakBadge.tsx components/home/StreakBadge.test.tsx
git commit -m "feat: add StreakBadge compact milestone component"
```

---

### Task 8: Restyle the Header into a slim mono top bar

**Files:**
- Modify: `components/home/Header.tsx`

**Interfaces:**
- Produces: `Header` component, unchanged props (`{ title: string }`), unchanged usage in `app/(tabs)/index.tsx` (`<Header title={t("home.title")} />`).

- [ ] **Step 1: Replace the full contents of `components/home/Header.tsx`**

```tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, fontFamily, preciseType } from "@/constants/DesignSystem";

interface HeaderProps {
  title: string;
}

// Slim instrument-panel top bar. Replaces the gradient hero + italic
// motivational quote, which was the single strongest "generic wellness app"
// tell in the original design.
export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          borderBottomColor: withOpacity(theme.secondary, overlayOpacity.light),
        },
      ]}
    >
      <Text style={[styles.wordmark, preciseType.wordmark, { color: theme.text, fontFamily: fontFamily.mono }]}>
        {title.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  wordmark: {},
});
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/Header.tsx
git commit -m "style: replace Home gradient hero with a slim mono top bar"
```

---

### Task 9: Restyle `NextPhotoReminder`

**Files:**
- Modify: `components/home/NextPhotoReminder.tsx`

**Interfaces:**
- Produces: `NextPhotoReminder` component, unchanged props (`{ latestPhoto: Photo | null }`), unchanged usage in `app/(tabs)/index.tsx`.

- [ ] **Step 1: Replace the full contents of `components/home/NextPhotoReminder.tsx`**

```tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import { useRouter } from "expo-router";
import { spacing, borderRadius, iconSize, fontFamily, preciseType } from "@/constants/DesignSystem";

type NextPhotoReminderProps = {
  latestPhoto: Photo | null;
};

export const NextPhotoReminder: React.FC<NextPhotoReminderProps> = ({ latestPhoto }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const router = useRouter();

  const message = (() => {
    if (!latestPhoto) {
      return {
        title: t("home.takeFirstPhoto") || "Take Your First Photo!",
        subtitle: t("home.startJourney") || "Start your transformation journey today",
        icon: "camera-outline" as const,
        color: theme.primary,
      };
    }

    const daysSinceLastPhoto = Math.floor(
      (new Date().getTime() - new Date(latestPhoto.date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastPhoto === 0) {
      return {
        title: t("home.photoTakenToday") || "Photo Taken Today!",
        subtitle: t("home.keepItUp") || "Great job staying consistent",
        icon: "checkmark-circle-outline" as const,
        color: theme.success,
      };
    } else if (daysSinceLastPhoto === 1) {
      return {
        title: t("home.takeNextPhoto") || "Time for Your Next Photo",
        subtitle: t("home.lastPhotoYesterday") || "Last photo was yesterday",
        icon: "camera-outline" as const,
        color: theme.primary,
      };
    } else if (daysSinceLastPhoto <= 3) {
      return {
        title: t("home.takeNextPhoto") || "Time for Your Next Photo",
        subtitle: `${daysSinceLastPhoto} ${t("home.daysSinceLastPhoto") || "days since last photo"}`,
        icon: "camera-outline" as const,
        color: theme.warning,
      };
    } else {
      return {
        title: t("home.missedDays") || `${daysSinceLastPhoto} Days Since Last Photo`,
        subtitle: t("home.getBackOnTrack") || "Get back on track today!",
        icon: "time-outline" as const,
        color: theme.error,
      };
    }
  })();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: withOpacity(message.color, overlayOpacity.heavy),
        },
      ]}
      onPress={() => router.push("/(tabs)/camera")}
      activeOpacity={0.85}
    >
      <Ionicons name={message.icon} size={iconSize.lg} color={message.color} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, preciseType.message, { color: theme.text, fontFamily: fontFamily.display }]}>
          {message.title}
        </Text>
        <Text style={[styles.subtitle, preciseType.subtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
          {message.subtitle}
        </Text>
      </View>
      <Text style={[styles.action, preciseType.badgeLabel, { color: message.color, fontFamily: fontFamily.mono }]}>
        {(t("home.takePhoto") || "capture").toUpperCase()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontStyle: "italic",
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  action: {},
});
```

Note: this collapses the original's duplicated early-return JSX (one block for "no photo yet", a near-identical second block for "has a photo") into a single `message` object plus one render path — same behavior, less duplication, and the whole render path needed rewriting anyway for the new visual treatment.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/NextPhotoReminder.tsx
git commit -m "style: restyle NextPhotoReminder to a hairline instrument card"
```

---

### Task 10: Restyle `MiniComparisonPreview` into the contact-sheet hero

**Files:**
- Modify: `components/home/MiniComparisonPreview.tsx`

**Interfaces:**
- Consumes: `ContactSheetFrame` from `./ContactSheetFrame` (Task 5).
- Produces: `MiniComparisonPreview` component, unchanged props (`{ photos: Photo[] }`), unchanged usage in `app/(tabs)/index.tsx`.

- [ ] **Step 1: Replace the full contents of `components/home/MiniComparisonPreview.tsx`**

```tsx
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { useTheme } from "@/context/ThemeContext";
import { Photo } from "@/services/photoStorage";
import { getBestComparisonPair } from "@/utils/photoUtils";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Animated, Dimensions, Image, PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ContactSheetFrame } from "./ContactSheetFrame";
import { spacing, fontFamily, preciseType } from "@/constants/DesignSystem";

const { width } = Dimensions.get("window");
const MINI_SLIDER_WIDTH = width - (spacing.huge * 2);
const MINI_THUMB_SIZE = 28;
const MINI_THUMB_RADIUS = MINI_THUMB_SIZE / 2;

type MiniComparisonPreviewProps = {
  photos: Photo[];
};

// The screen's thesis: the before/after photos themselves, framed like
// negatives on a light table. Stats are secondary and live in InstrumentStrip.
export const MiniComparisonPreview: React.FC<MiniComparisonPreviewProps> = ({ photos }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const router = useRouter();
  const [sliderValue, setSliderValue] = useState(50);
  const pan = React.useRef(new Animated.ValueXY({ x: MINI_SLIDER_WIDTH / 2, y: 0 })).current;

  const comparisonPair = getBestComparisonPair(photos);

  if (!comparisonPair) {
    return null;
  }

  const { type, oldest: oldestPhoto, newest: newestPhoto } = comparisonPair;

  const caption = `${new Date(oldestPhoto.date).toLocaleDateString()} → ${new Date(newestPhoto.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      let newX = gesture.moveX - spacing.huge;
      newX = Math.max(0, Math.min(newX, MINI_SLIDER_WIDTH));
      pan.x.setValue(newX);
      setSliderValue((newX / MINI_SLIDER_WIDTH) * 100);
    },
  });

  return (
    <TouchableOpacity onPress={() => router.push("/(tabs)/progress")} activeOpacity={0.95}>
      <ContactSheetFrame caption={caption}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: oldestPhoto.uri }}
            style={[styles.image, { opacity: (100 - sliderValue) / 100 }]}
          />
          <Image
            source={{ uri: newestPhoto.uri }}
            style={[styles.image, styles.overlayImage, { opacity: sliderValue / 100 }]}
          />

          <View style={styles.labels}>
            <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy), opacity: (100 - sliderValue) / 100 }]}>
              <Text style={[styles.labelText, preciseType.caption, { fontFamily: fontFamily.mono }]}>
                {t("common.before").toUpperCase()}
              </Text>
            </View>
            <View style={[styles.label, { backgroundColor: withOpacity(theme.text, overlayOpacity.heavy), opacity: sliderValue / 100 }]}>
              <Text style={[styles.labelText, preciseType.caption, { fontFamily: fontFamily.mono }]}>
                {t("common.after").toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sliderWrapper}>
          <View style={styles.sliderContainer} {...panResponder.panHandlers}>
            <View style={[styles.sliderTrack, { backgroundColor: withOpacity(theme.secondary, overlayOpacity.light) }]} />
            <View
              style={[
                styles.sliderProgress,
                { backgroundColor: theme.primary, width: `${sliderValue}%` },
              ]}
            />
            <Animated.View
              style={[
                styles.sliderThumb,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.primary,
                  transform: [{ translateX: Animated.subtract(pan.x, MINI_THUMB_RADIUS) }],
                },
              ]}
            >
              <View style={[styles.sliderThumbInner, { backgroundColor: theme.primary }]} />
            </Animated.View>
          </View>
        </View>
      </ContactSheetFrame>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlayImage: {
    position: "absolute",
    top: 0,
    left: 0,
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
  sliderWrapper: {
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    width: MINI_SLIDER_WIDTH,
    height: spacing.lg * 2,
    justifyContent: "center",
    alignSelf: "center",
    position: "relative",
  },
  sliderTrack: {
    width: "100%",
    height: spacing.xs,
    borderRadius: 2,
    position: "absolute",
  },
  sliderProgress: {
    height: spacing.xs,
    borderRadius: 2,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    width: MINI_THUMB_SIZE,
    height: MINI_THUMB_SIZE,
    borderRadius: MINI_THUMB_RADIUS,
    position: "absolute",
    top: 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  sliderThumbInner: {
    width: spacing.sm + 2,
    height: spacing.sm + 2,
    borderRadius: (spacing.sm + 2) / 2,
  },
});
```

Note: the old icon-chip title row ("Your Transformation" + chevron) and the italic "Tap to see full comparison" hint are dropped — the `ContactSheetFrame` caption now carries that information (dates + angle), and the whole tappable area implies navigation without needing a hint line.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/MiniComparisonPreview.tsx
git commit -m "style: restyle MiniComparisonPreview as the contact-sheet hero"
```

---

### Task 11: Restyle `LatestPhotoCard`

**Files:**
- Modify: `components/home/LatestPhotoCard.tsx`

**Interfaces:**
- Consumes: `ContactSheetFrame` from `./ContactSheetFrame` (Task 5).
- Produces: `LatestPhotoCard` component, unchanged props (`{ latestPhoto: Photo | null; onPress: () => void }`), unchanged usage in `app/(tabs)/index.tsx`.

- [ ] **Step 1: Replace the full contents of `components/home/LatestPhotoCard.tsx`**

```tsx
import React from "react";
import { StyleSheet, TouchableOpacity, Image } from "react-native";
import { Photo } from "@/services/photoStorage";
import { useLocalization } from "@/context/LocalizationContext";
import { ContactSheetFrame } from "./ContactSheetFrame";

interface LatestPhotoCardProps {
  latestPhoto: Photo | null;
  onPress: () => void;
}

export const LatestPhotoCard: React.FC<LatestPhotoCardProps> = ({ latestPhoto, onPress }) => {
  const { t } = useLocalization();

  if (!latestPhoto) return null;

  const caption = `${t(`camera.${latestPhoto.type}`).toUpperCase()} · ${new Date(latestPhoto.date).toLocaleDateString()}`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <ContactSheetFrame caption={caption}>
        <Image source={{ uri: latestPhoto.uri }} style={styles.image} />
      </ContactSheetFrame>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 220,
  },
});
```

Note: the original file's "no photo" placeholder branch (`noPhotoPlaceholder`) was unreachable dead code — the function already returned `null` one line above whenever `latestPhoto` was falsy, so that branch could never run. It's dropped here rather than restyled. `useTheme`/`Colors` are dropped too since the component no longer reads `theme.*` directly (the frame/photo colors all come from `ContactSheetFrame` itself).

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/LatestPhotoCard.tsx
git commit -m "style: restyle LatestPhotoCard with the ContactSheetFrame treatment"
```

---

### Task 12: Restyle `ShreddedTipsCarousel`

**Files:**
- Modify: `components/home/ShreddedTipsCarousel.tsx`

**Interfaces:**
- Produces: `ShreddedTipsCarousel` component, unchanged props (none), unchanged usage in `app/(tabs)/index.tsx`.

- [ ] **Step 1: Replace the full contents of `components/home/ShreddedTipsCarousel.tsx`**

```tsx
import React, { useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import PagerView from "react-native-pager-view";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { spacing, borderRadius, iconSize, fontFamily, preciseType } from "@/constants/DesignSystem";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CARD_MARGIN = spacing.sm;
const CARD_WIDTH = SCREEN_WIDTH - spacing.huge - 2 * CARD_MARGIN;

interface Tip {
  main: string;
  clarification: string;
  icon: string;
}

export const ShreddedTipsCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  const tips = useMemo(() => {
    try {
      return JSON.parse(t("shreddedTipsCarousel.tips")) as Tip[];
    } catch (error) {
      console.error("Failed to parse tips:", error);
      return [];
    }
  }, [t]);

  const handlePageSelected = (e: any) => {
    setActiveIndex(e.nativeEvent.position);
  };

  const scrollToIndex = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  return (
    <View style={styles.container}>
      <PagerView ref={pagerRef} style={styles.pagerView} initialPage={0} onPageSelected={handlePageSelected}>
        {tips.map((tip: Tip, index: number) => (
          <View key={index} style={styles.page}>
            <View
              style={[
                styles.slide,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: withOpacity(theme.secondary, overlayOpacity.light),
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={tip.icon as any} size={iconSize.xl} color={theme.primary} />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.mainText, preciseType.tipHeadline, { color: theme.text, fontFamily: fontFamily.display }]}>
                  {tip.main}
                </Text>
                <Text style={[styles.clarificationText, preciseType.tipBody, { color: theme.secondary, fontFamily: fontFamily.body }]}>
                  {tip.clarification}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </PagerView>
      <View style={styles.pagination}>
        {tips.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor:
                  index === activeIndex ? theme.primary : withOpacity(theme.secondary, overlayOpacity.heavy),
              },
            ]}
            onPress={() => scrollToIndex(index)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.25,
    marginVertical: spacing.xl,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: CARD_MARGIN,
  },
  slide: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    padding: spacing.xl,
    width: CARD_WIDTH,
    height: "100%",
  },
  iconContainer: {
    marginRight: spacing.xl,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontStyle: "italic",
    marginBottom: spacing.xs,
  },
  clarificationText: {
    flexWrap: "wrap",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: spacing.xs,
    marginHorizontal: spacing.xs,
  },
});
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/home/ShreddedTipsCarousel.tsx
git commit -m "style: restyle ShreddedTipsCarousel from a solid block to a mat card"
```

---

### Task 13: Rewire `app/(tabs)/index.tsx`

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `InstrumentStrip` (Task 6), `StreakBadge` (Task 7), `getPhotosInLastNDays` (Task 3), all previously-restyled components (Tasks 8–12). Removes: `ProgressSummary`, `StreakCard` imports.

- [ ] **Step 1: Update imports**

Remove these two import lines:
```tsx
import { ProgressSummary } from "@/components/home/ProgressSummary";
import { StreakCard } from "@/components/home/StreakCard";
```

Add:
```tsx
import { InstrumentStrip } from "@/components/home/InstrumentStrip";
import { StreakBadge } from "@/components/home/StreakBadge";
```

Change the `DesignSystem` import to only pull what's still used:
```tsx
import { spacing, fontFamily, preciseType } from "@/constants/DesignSystem";
```

Add the new helper to the existing `photoUtils` import:
```tsx
import { getBestComparisonPair, getPhotosInLastNDays } from "@/utils/photoUtils";
```

- [ ] **Step 2: Compute the weekly photo count**

Directly below the existing `consistency` calculation (after the `const consistency = ...` block), add:

```tsx
  const weeklyPhotoCount = useMemo(() => getPhotosInLastNDays(photos, 7), [photos]);
```

- [ ] **Step 3: Replace the JSX body's section list**

Replace everything from the `{/* Next Photo Reminder - Most important action */}` comment through the `{/* Tips Section - Educational content at bottom */}` block (i.e. the whole section list inside the `ScrollView`) with:

```tsx
          {/* Contact-sheet hero — the screen's thesis: the photos themselves */}
          {hasComparisonPhotos && (
            <View style={styles.section}>
              <MiniComparisonPreview photos={photos} />
            </View>
          )}

          {/* Instrument strip — precision readout, replaces ProgressSummary */}
          <View style={styles.section}>
            <InstrumentStrip
              totalDays={totalDays}
              consistency={consistency}
              weeklyPhotoCount={weeklyPhotoCount}
            />
          </View>

          {/* Next Photo Reminder - primary action */}
          <View style={styles.section}>
            <NextPhotoReminder latestPhoto={latestPhoto} />
          </View>

          {/* Streak badge - compact milestone signal, not a hero card */}
          <View style={styles.section}>
            <StreakBadge streak={streakData.currentStreak} />
          </View>

          {/* Latest Photo - Quick gallery preview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
              {t("home.latestPhoto")}
            </Text>
            <LatestPhotoCard
              latestPhoto={latestPhoto}
              onPress={() => navigateTo("/(tabs)/gallery")}
            />
          </View>

          {/* Achievements - Gamification for engagement - PREMIUM */}
          <FeatureGate
            feature={Feature.ACHIEVEMENT_BADGES}
            showPreview={false}
            containerStyle={styles.section}
            compact={false}
          >
            <AchievementBadges photos={photos} currentStreak={streakData.currentStreak} />
          </FeatureGate>

          {/* Weekly Progress Chart - Recent activity trend - PREMIUM */}
          <FeatureGate
            feature={Feature.WEEKLY_PROGRESS_CHART}
            showPreview={false}
            containerStyle={styles.section}
            compact={false}
          >
            <WeeklyProgressChart photos={photos} />
          </FeatureGate>

          {/* Consistency Heatmap - Long-term view - PREMIUM */}
          <FeatureGate
            feature={Feature.CONSISTENCY_HEATMAP}
            showPreview={false}
            containerStyle={styles.section}
            compact={false}
          >
            <ConsistencyHeatmap photos={photos} />
          </FeatureGate>

          {/* Tips Section - Educational content at bottom */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, preciseType.sectionLabel, { color: theme.secondary }]}>
              {t("home.tips")}
            </Text>
            <ShreddedTipsCarousel />
          </View>
```

- [ ] **Step 4: Replace the `StyleSheet`**

Replace the entire `const styles = StyleSheet.create({...})` block at the bottom of the file with:

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
    paddingBottom: spacing.huge,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fontFamily.mono,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
});
```

(This drops `quickCameraButton`, `quickCameraText`, `quickActions`, `quickActionButton`, `quickActionText`, `viewGalleryButton`, `viewGalleryText`, `settingsButton`, `settingsText` — confirmed dead code in the current file; none of these style keys are referenced anywhere in the component's JSX.)

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. In particular, confirm no leftover references to `borderRadius`, `elevation`, `typography`, or `iconSize` remain in this file (they're no longer imported).

- [ ] **Step 6: Run the full test suite**

Run: `npx jest`
Expected: all tests pass (the 4 new suites from Tasks 3, 5, 6, 7).

- [ ] **Step 7: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: rewire Home screen to the Measured Confidence section order"
```

---

### Task 14: Manual visual QA

This task has no automated test — a redesign cannot be verified as *looking right* by `tsc` or `jest` alone. Do not consider this plan complete without doing this.

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Use the project's `run` skill (or `npx expo start`) to launch Fit Snapshot in a simulator/emulator or on a device.

- [ ] **Step 2: Walk the Home tab in dark mode**

Confirm, in order top to bottom: the slim mono top bar (no gradient/quote), the contact-sheet comparison hero (if the test account has ≥2 photos of the same angle — add photos via the Camera tab first if not), the instrument strip (days / consistency % / this week), the hairline next-photo-reminder card, the compact ember streak badge, the matted latest-photo card, the achievements/weekly-chart/heatmap sections (premium — gate with a free/premium test account as needed) rendering coherently under the new palette, and the restyled tips carousel.

While in the tips carousel, check each tip's icon (`tip.icon`, sourced from `shreddedTipsCarousel.tips` in `localization/translations.ts`): per the spec, only streak/achievement moments should use filled Ionicons glyphs — everything else should read as outline. If any tip icon renders filled, note it as a small follow-up (swapping individual icon strings in the translation JSON), not a blocker for this pass.

- [ ] **Step 3: Switch to light mode** (Settings → theme, or device setting if using "system")

Confirm text stays legible against the `paper` background and cards read clearly against it using `surfaceLight`.

- [ ] **Step 4: Spot-check one out-of-scope screen** (e.g. Settings)

Confirm it still renders and functions — it will show the new brass/ember colors (expected, since color tokens are shared), but should not show layout breakage, missing text, or crashes.

- [ ] **Step 5: Check the background image assets**

`components/style/BackgroundImage.tsx` renders `assets/images/background_dark.jpg` / `background_light.jpg` behind a `BlurView` tint on Home. These image files are unchanged by this plan. If they visually clash with the new Graphite & Brass palette (e.g. show a green/emerald cast through the blur), flag it — replacing them is a separate design-asset task (new artwork), not something coverable by this code-focused plan.

- [ ] **Step 6: Report results to the user**

Summarize what was checked and any visual issues found (font not applying somewhere, a color that reads wrong, a layout overlap) so they can be triaged before considering the redesign done.
