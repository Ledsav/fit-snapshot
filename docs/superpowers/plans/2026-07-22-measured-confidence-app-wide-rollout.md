# Measured Confidence: App-Wide Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the "Measured Confidence" design system (already shipped on the Home tab) to the rest of the app — Onboarding, Camera, Progress, Gallery, Settings, Paywall — plus fix the photographic background that no longer matches the new palette. Scope and direction come from the approved wireframe artifact (published this session) and the original design spec (`docs/superpowers/specs/2026-07-21-measured-confidence-home-redesign-design.md`).

**Architecture:** Each screen gets a targeted restyle of its existing render output — no new screens, no logic changes, no new navigation. Two small additive tokens are introduced (`preciseType.heroTitle`, one new translation key) and reused across tasks. The signature `ContactSheetFrame` primitive (already shipped) is reused literally where a full-size photo appears (Camera confirm); gallery's tiny grid thumbnails get a lighter, purpose-built sibling treatment instead, since `ContactSheetFrame`'s padding/ticks are too heavy at that density.

**Tech Stack:** Expo 57 / React Native 0.86 / React 19, expo-router.

## Explicit scope cut

`components/progress/PhotoMorph.tsx` (the Progress tab's comparison engine — 5 modes: slider, side-by-side, GIF, grid, custom-selection, each with its own premium gating and styling) is **not** touched by this plan. It's a large, feature-dense component that deserves its own dedicated plan. This plan only restyles the outer `app/(tabs)/progress.tsx` wrapper (header + angle-tab selector) that sits around it. Flagging this now so it isn't mistaken for an oversight later.

## Global Constraints

- Reuse existing tokens exactly — `Colors` (ink/surface/paper/steel/mist/brass/ember + semantic), `fontFamily`, `preciseType`, `spacing`, `borderRadius` from `constants/DesignSystem.ts` and `constants/Colors.ts`. Do not change any existing token's value.
- No hardcoded hex colors. No raw `fontSize`/`letterSpacing` literals for anything that already has (or should have) a `preciseType` entry — reuse an existing key, or add one additively (see Task 2) rather than inlining a new number. This was a hard rule established during the Home rollout; it applies here from the start.
- Brass (`theme.primary`) is reserved for actionable/selected/data-highlight moments. Plain list rows, inactive tabs, and hairline borders use `theme.secondary` (steel) via `withOpacity`, not brass — several existing screens (Settings rows, Paywall's radio button) currently misuse brass or raw hex/opacity-string hacks (e.g. `theme.primary + '20'`) for decoration; fix these to the `withOpacity`/`overlayOpacity` helper as part of the surrounding task, since they're being touched anyway.
- Business logic (capture flow, gallery selection/GIF/import logic, settings handlers, paywall purchase flow, onboarding step advancement) must not change — every task here is a render/style change only.
- Remove any import that becomes unused as a result of a task's edit (e.g. `LinearGradient` in Settings/Paywall once their gradient blocks are removed).
- Verify every task with `npx tsc --noEmit`. Run `npx jest` for the one task that adds new translated strings (Task 9) to confirm the interface/locale contract still type-checks.
- This is a visual rollout — passing `tsc`/`jest` confirms compilation, not correctness of the actual pixels. Task 10 is a mandatory manual pass; do not report this plan complete without it.

---

## File structure

Modified files:
- `components/style/BackgroundImage.tsx` — drop the photographic background, render the flat theme background
- `constants/DesignSystem.ts` — add `preciseType.heroTitle`
- `components/onBoarding/OnboardingCarousel.tsx` — full restyle
- `app/(tabs)/camera.tsx` — angle-selector chrome (Task 4), confirm screen (Task 5)
- `app/(tabs)/progress.tsx` — angle-tab selector restyle only
- `app/(tabs)/gallery.tsx` — grid item restyle (`renderItem`, `renderGifItem`, related styles)
- `app/(tabs)/settings.tsx` — hairline row + instrument-style premium/upgrade card restyle
- `components/monetization/PaywallModal.tsx` — hero, pricing card, trust-line restyle
- `localization/translations.ts` — one new key, `paywall.trustLine`, across all 5 locales

Untouched (explicit scope cut): `components/progress/PhotoMorph.tsx`.

---

### Task 1: Flatten the background

**Files:**
- Modify: `components/style/BackgroundImage.tsx`

**Interfaces:**
- Produces: `BackgroundImage` default export, **same prop signature as today** (`{ children, style, blurIntensity?, overlayOpacity? }`) so every existing call site (`app/(tabs)/index.tsx`, `app/(tabs)/progress.tsx`, `app/(tabs)/gallery.tsx`) keeps compiling with zero changes. `blurIntensity`/`overlayOpacity` are accepted but no longer used.

- [ ] **Step 1: Replace the full contents of `components/style/BackgroundImage.tsx`**

```tsx
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";

interface BackgroundImageProps {
  children: React.ReactNode;
  style?: ViewStyle;
  blurIntensity?: number;
  overlayOpacity?: number;
}

// Flat instrument-panel ground. Replaces the photographic background, which
// no longer matches the Graphite & Brass palette even blurred/tinted.
// blurIntensity/overlayOpacity are kept in the prop signature so existing
// call sites don't need changes, but are no longer used.
const BackgroundImage: React.FC<BackgroundImageProps> = ({ children, style }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  return (
    <View style={[styles.background, { backgroundColor: theme.background }, style]}>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
  },
});

export default BackgroundImage;
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. In particular, confirm `app/(tabs)/index.tsx`, `app/(tabs)/progress.tsx`, and `app/(tabs)/gallery.tsx` (the three consumers) still compile untouched.

- [ ] **Step 3: Commit**

```bash
git add components/style/BackgroundImage.tsx
git commit -m "style: replace photographic background with the flat token ground"
```

---

### Task 2: Add the `preciseType.heroTitle` token

**Files:**
- Modify: `constants/DesignSystem.ts`

**Interfaces:**
- Produces: `preciseType.heroTitle` (`{ fontSize: 28 }`). Consumed by Task 3 (Onboarding) and Task 9 (Paywall) — the two screens with a hero-scale headline, larger than any existing `preciseType` role.

- [ ] **Step 1: Add the new key**

In `constants/DesignSystem.ts`, add one line to the existing `preciseType` object (added during the Home rollout), directly after `tipBody`:

```ts
  tipBody: { fontSize: 14 },                            // ShreddedTipsCarousel clarification
  heroTitle: { fontSize: 28 },                          // Onboarding & Paywall headline
} as const;
```

(i.e. insert the `heroTitle` line before the closing `} as const;` of `preciseType` — do not touch any other key, and do not touch `typography`, `fontFamily`, `borderRadius`, or `elevation`.)

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add constants/DesignSystem.ts
git commit -m "feat: add preciseType.heroTitle token"
```

---

### Task 3: Restyle Onboarding

**Files:**
- Modify: `components/onBoarding/OnboardingCarousel.tsx`

**Interfaces:**
- Produces: `OnboardingCarousel` component, unchanged props (`{ onComplete: () => void }`), unchanged usage in `app/(tabs)/_layout.tsx` and `app/(tabs)/settings.tsx` (tutorial replay modal).

- [ ] **Step 1: Replace the full contents of `components/onBoarding/OnboardingCarousel.tsx`**

```tsx
import Colors from "@/constants/Colors";
import { fontFamily, preciseType } from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PagerView from "react-native-pager-view";

interface OnboardingCarouselProps {
  onComplete: () => void;
}

export const OnboardingCarousel: React.FC<OnboardingCarouselProps> = ({
  onComplete,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "dark"];
  const { t } = useLocalization();

  const onboardingSteps = [
    {
      title: t("onboardingCarousel.seeProgress.title"),
      subtitle: t("onboardingCarousel.seeProgress.subtitle"),
      image: require("@/assets/images/onbording/progress.jpg"),
    },
    {
      title: t("onboardingCarousel.takePhoto.title"),
      subtitle: t("onboardingCarousel.takePhoto.subtitle"),
      image: require("@/assets/images/onbording/photo.jpg"),
    },
    {
      title: t("onboardingCarousel.shareResults.title"),
      subtitle: t("onboardingCarousel.shareResults.subtitle"),
      image: require("@/assets/images/onbording/share.jpg"),
    },
  ];

  const handlePageSelected = (e: any) => {
    setActiveIndex(e.nativeEvent.position);
  };

  const nextStep = () => {
    if (activeIndex < onboardingSteps.length - 1) {
      pagerRef.current?.setPage(activeIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <PagerView
        ref={pagerRef}
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        {onboardingSteps.map((step, index) => (
          <View key={index} style={[styles.page, { backgroundColor: theme.background }]}>
            <Image source={step.image} style={styles.onboardingImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.4)', theme.background]}
              locations={[0, 0.6, 1]}
              style={styles.imageGradient}
            />
          </View>
        ))}
      </PagerView>
      <View style={styles.footer}>
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.step, { color: theme.primary, fontFamily: fontFamily.mono }]}>
              {String(activeIndex + 1).padStart(2, "0")} / {String(onboardingSteps.length).padStart(2, "0")}
            </Text>
            <Text
              style={[styles.title, preciseType.heroTitle, { color: theme.text, fontFamily: fontFamily.display }]}
            >
              {onboardingSteps[activeIndex].title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {onboardingSteps[activeIndex].subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.navigationContainer}>
          <View style={styles.pagination}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  {
                    backgroundColor: index === activeIndex ? theme.primary : theme.tabIconDefault,
                    width: index === activeIndex ? 24 : 8,
                  },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: theme.primary }]}
            onPress={nextStep}
          >
            <Text style={[styles.nextButtonText, { color: theme.background, fontFamily: fontFamily.mono }]}>
              {(activeIndex === onboardingSteps.length - 1
                ? t("onboardingCarousel.getStarted")
                : t("onboardingCarousel.next")
              ).toUpperCase()}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={theme.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pagerView: { flex: 1 },
  page: { flex: 1, position: "relative" },
  onboardingImage: { width: "100%", height: "100%", position: "absolute", top: 0, left: 0 },
  imageGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 40,
    paddingBottom: 50,
  },
  contentContainer: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  textContainer: { flex: 1 },
  step: { fontSize: 11, letterSpacing: 2, marginBottom: 10 },
  title: { fontStyle: "italic", marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  navigationContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pagination: { flexDirection: "row", alignItems: "center" },
  paginationDot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonText: { fontSize: 11, letterSpacing: 1 },
});
```

Note: the original `onboardingSteps` entries also carried unused `gradient`/`backgroundColor` fields (never referenced anywhere in the render — verified by reading the whole original file). Dropped here as dead data, not a functional change.

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/onBoarding/OnboardingCarousel.tsx
git commit -m "style: restyle onboarding with mono step counter and hero title"
```

---

### Task 4: Restyle the Camera angle-selector chrome

**Files:**
- Modify: `app/(tabs)/camera.tsx`

**Interfaces:**
- No prop/behavior changes. Touches only `renderOverlaySelector`'s JSX and the `overlayButton`/`activeOverlayButton`/`overlayButtonText` style entries.

- [ ] **Step 1: Add `fontFamily` to the existing `DesignSystem` import**

Find (near the top of the file):
```tsx
import {
  borderRadius,
  opacity as designOpacity,
  elevation,
  iconSize,
  spacing,
  touchTarget,
  typography,
} from "@/constants/DesignSystem";
```
Replace with:
```tsx
import {
  borderRadius,
  opacity as designOpacity,
  elevation,
  fontFamily,
  iconSize,
  spacing,
  touchTarget,
  typography,
} from "@/constants/DesignSystem";
```

- [ ] **Step 2: Uppercase the angle labels**

In `renderOverlaySelector`, find:
```tsx
          <Text
            style={[
              styles.overlayButtonText,
              { color: overlay === type ? theme.background : theme.text },
            ]}
          >
            {t(`camera.${type}`)}
          </Text>
```
Replace the last line with:
```tsx
            {t(`camera.${type}`).toUpperCase()}
```

- [ ] **Step 3: Restyle the pill shape and label typography**

Find:
```tsx
  overlayButton: {
    padding: spacing.md,
    marginRight: spacing.md,
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    borderRadius: borderRadius.xl,
  },
  activeOverlayButton: {
    backgroundColor: withOpacity('#ffffff', overlayOpacity.light),
  },
  overlayButtonText: {
    color: "white",
    ...typography.captionBold,
  },
```
Replace with:
```tsx
  overlayButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    backgroundColor: withOpacity('#000000', overlayOpacity.medium),
    borderRadius: borderRadius.round,
  },
  activeOverlayButton: {
    backgroundColor: withOpacity('#ffffff', overlayOpacity.light),
  },
  overlayButtonText: {
    color: "white",
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
```

(The active-state fill color itself is already correct — the JSX applies `{ backgroundColor: theme.primary }` inline when `overlay === type`, which now resolves to brass automatically. Only shape and type needed fixing.)

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/camera.tsx"
git commit -m "style: restyle camera angle selector to mono pill tabs"
```

---

### Task 5: Restyle the Camera confirm screen

**Files:**
- Modify: `app/(tabs)/camera.tsx`

**Interfaces:**
- Consumes: `ContactSheetFrame` from `@/components/home/ContactSheetFrame` (shipped in the Home rollout).
- No prop/behavior changes to `CameraScreen` itself — this only touches the `if (capturedImage) { return (...) }` block and its dedicated styles.

- [ ] **Step 1: Add the `ContactSheetFrame` import**

Near the top of `app/(tabs)/camera.tsx`, add:
```tsx
import { ContactSheetFrame } from "@/components/home/ContactSheetFrame";
```

- [ ] **Step 2: Replace the `if (capturedImage)` block**

Find the entire block:
```tsx
  if (capturedImage) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />

        {/* Photo Type Badge */}
        <View style={styles.photoTypeBadgeContainer}>
          <View
            style={[
              styles.photoTypeBadge,
              { backgroundColor: theme.primary },
            ]}
          >
            <Ionicons
              name={
                overlay === PhotoType.front ? "body-outline" :
                overlay === PhotoType.side ? "arrow-forward-outline" :
                "person-outline"
              }
              size={20}
              color="white"
            />
            <Text style={styles.photoTypeBadgeText}>
              {t(`camera.${overlay}`).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.confirmationButtonsContainer}>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={retakePicture}
              activeOpacity={0.8}
            >
              <View style={[styles.actionButtonCircle, { backgroundColor: theme.cardBackground, borderColor: theme.error }]}>
                <Ionicons
                  name="refresh-outline"
                  size={32}
                  color={theme.error}
                />
              </View>
              <View style={styles.actionButtonLabelContainer}>
                <Text style={styles.actionButtonLabel}>
                  {t("camera.retake") || "Retake"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={confirmPicture}
              activeOpacity={0.8}
            >
              <View style={[styles.actionButtonCircle, { backgroundColor: theme.success }]}>
                <Ionicons name="checkmark" size={36} color="white" />
              </View>
              <View style={styles.actionButtonLabelContainer}>
                <Text style={styles.actionButtonLabel}>
                  {t("camera.confirm") || "Confirm"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Optional helper text */}
          <Text style={[styles.helperText, { color: theme.text }]}>
            {t("camera.confirmHelper") || "Review your photo before saving"}
          </Text>
        </View>
      </View>
    );
  }
```

Replace it with:
```tsx
  if (capturedImage) {
    const confirmCaption = `${t(`camera.${overlay}`).toUpperCase()} · ${new Date().toLocaleDateString()}`;

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.confirmFrameContainer}>
          <ContactSheetFrame caption={confirmCaption}>
            <Image source={{ uri: capturedImage }} style={styles.preview} />
          </ContactSheetFrame>
        </View>

        <View style={styles.confirmationButtonsContainer}>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, { borderColor: theme.error }]}
              onPress={retakePicture}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={18} color={theme.error} />
              <Text style={[styles.confirmButtonText, { color: theme.error, fontFamily: fontFamily.mono }]}>
                {(t("camera.retake") || "Retake").toUpperCase()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={confirmPicture}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color={theme.background} />
              <Text style={[styles.confirmButtonText, { color: theme.background, fontFamily: fontFamily.mono }]}>
                {(t("camera.confirm") || "Confirm").toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.helperText, { color: theme.secondary }]}>
            {t("camera.confirmHelper") || "Review your photo before saving"}
          </Text>
        </View>
      </View>
    );
  }
```

- [ ] **Step 3: Replace the dedicated styles**

Find and remove these now-unused style entries: `photoTypeBadgeContainer`, `photoTypeBadge`, `photoTypeBadgeText`, `actionButton`, `actionButtonCircle`, `actionButtonLabelContainer`, `actionButtonLabel`.

Find:
```tsx
  preview: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
```
Replace with:
```tsx
  confirmFrameContainer: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  preview: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
```

Find:
```tsx
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    gap: spacing.huge + spacing.xl, // 60px - space between action buttons
    marginBottom: spacing.lg,
  },
```
Replace with:
```tsx
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  confirmButtonText: {
    fontSize: 10,
    letterSpacing: 1,
  },
```

Find:
```tsx
  helperText: {
    ...typography.small,
    opacity: designOpacity.secondary,
    textAlign: "center",
    fontStyle: "italic",
  },
```
Replace with:
```tsx
  helperText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: fontFamily.body,
  },
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. Confirm no remaining references to `photoTypeBadge*`/`actionButton*` anywhere in the file (they should be fully removed, not just orphaned in the stylesheet).

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/camera.tsx"
git commit -m "style: restyle camera confirm screen with ContactSheetFrame"
```

---

### Task 6: Restyle the Progress screen's angle-tab selector

**Files:**
- Modify: `app/(tabs)/progress.tsx`

**Interfaces:**
- No prop/behavior changes. `PhotoMorph` (the actual comparison engine) is untouched — see "Explicit scope cut" above.

- [ ] **Step 1: Update imports**

Find:
```tsx
import Colors from "@/constants/Colors";
```
Replace with:
```tsx
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { fontFamily } from "@/constants/DesignSystem";
```

- [ ] **Step 2: Restyle the tab buttons**

Find:
```tsx
      <View style={styles.tabBar}>
        {types.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.tabButton,
              { backgroundColor: activeType === type ? theme.primary : theme.cardBackground },
            ]}
            onPress={() => setActiveType(type)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeType === type ? theme.background : theme.text },
              ]}
            >
              {t(`camera.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
```
Replace with:
```tsx
      <View style={styles.tabBar}>
        {types.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.tabButton,
              activeType === type
                ? { backgroundColor: theme.primary, borderColor: theme.primary }
                : { backgroundColor: theme.transparent, borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
            ]}
            onPress={() => setActiveType(type)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                { color: activeType === type ? theme.background : theme.text },
              ]}
            >
              {t(`camera.${type}`).toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
```

- [ ] **Step 3: Update the tab styles**

Find:
```tsx
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
```
Replace with:
```tsx
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
  },
  tabButtonText: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: fontFamily.mono,
  },
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/progress.tsx"
git commit -m "style: restyle progress angle tabs to the mono pill pattern"
```

---

### Task 7: Restyle the Gallery grid items

**Files:**
- Modify: `app/(tabs)/gallery.tsx`

**Interfaces:**
- No prop/behavior changes to `GalleryScreen`. Touches only `renderItem`, `renderGifItem`, and the `item`/`imageWrapper`/`itemCaption`(new)/`deleteButton` style entries. `imageDateOverlay`, `dateText`, `typeIndicator`, `typeIndicatorText` styles become unused and are removed.

This is a compact sibling of `ContactSheetFrame` — the full component's padding and sprocket ticks are too heavy for a ~110px grid thumbnail, so this task hand-builds a lighter hairline-border + mono-caption treatment using the same visual vocabulary, rather than instantiating `ContactSheetFrame` itself.

- [ ] **Step 1: Add `fontFamily` to the existing `DesignSystem` import**

Find:
```tsx
import {
  spacing,
  borderRadius,
  elevation,
  typography,
  iconSize,
  opacity as designOpacity,
  touchTarget,
} from "@/constants/DesignSystem";
```
Replace with:
```tsx
import {
  spacing,
  borderRadius,
  elevation,
  fontFamily,
  typography,
  iconSize,
  opacity as designOpacity,
  touchTarget,
} from "@/constants/DesignSystem";
```

- [ ] **Step 2: Replace `renderItem`**

Find:
```tsx
  const renderItem = ({ item }: { item: Photo }) => {
    const isSelected = selectedPhotoIds.has(item.id);

    return (
      <View key={item.id} style={styles.item}>
        <TouchableOpacity
          style={[
            styles.imageWrapper,
            isSelected && { borderWidth: 3, borderColor: theme.primary }
          ]}
          onPress={() => selectionMode ? togglePhotoSelection(item.id) : openFullScreenPhoto(item.uri)}
          activeOpacity={0.95}
        >
          <Image source={{ uri: item.uri }} style={styles.image} />
          <View style={styles.imageDateOverlay}>
            <Text style={styles.dateText}>
              {new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: '2-digit'
              })}
            </Text>
          </View>
          {viewMode === 'timeline' && (
            <View style={[styles.typeIndicator, { backgroundColor: theme.primary }]}>
              <Text style={styles.typeIndicatorText}>
                {item.type.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {selectionMode && isSelected && (
            <View style={[styles.selectedOverlay, { backgroundColor: theme.primary + '40' }]}>
              <Ionicons name="checkmark-circle" size={32} color={theme.primary} />
            </View>
          )}
        </TouchableOpacity>
        {!selectionMode && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: theme.error }]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePhoto(item.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };
```
Replace with:
```tsx
  const renderItem = ({ item }: { item: Photo }) => {
    const isSelected = selectedPhotoIds.has(item.id);
    const caption =
      viewMode === 'timeline'
        ? `${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${item.type.toUpperCase()}`
        : new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
      <View key={item.id} style={styles.item}>
        <TouchableOpacity
          style={[
            styles.imageWrapper,
            { borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
            isSelected && { borderWidth: 2, borderColor: theme.primary },
          ]}
          onPress={() => selectionMode ? togglePhotoSelection(item.id) : openFullScreenPhoto(item.uri)}
          activeOpacity={0.95}
        >
          <Image source={{ uri: item.uri }} style={styles.image} />
          {selectionMode && isSelected && (
            <View style={[styles.selectedOverlay, { backgroundColor: withOpacity(theme.primary, overlayOpacity.medium) }]}>
              <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
            </View>
          )}
        </TouchableOpacity>
        <Text
          style={[styles.itemCaption, { color: theme.secondary, fontFamily: fontFamily.mono }]}
          numberOfLines={1}
        >
          {caption}
        </Text>
        {!selectionMode && (
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: withOpacity('#000000', overlayOpacity.veryHeavy) }]}
            onPress={(e) => {
              e.stopPropagation();
              handleDeletePhoto(item.id);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={14} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  };
```

- [ ] **Step 3: Replace `renderGifItem`**

Find:
```tsx
  const renderGifItem = (gif: GeneratedGif) => (
    <View key={gif.id} style={styles.item}>
      <TouchableOpacity
        style={styles.imageWrapper}
        onPress={() => openFullScreenPhoto(gif.uri)}
        activeOpacity={0.95}
      >
        <Image source={{ uri: gif.uri }} style={styles.image} />
        <View style={styles.imageDateOverlay}>
          <Text style={styles.dateText}>
            {new Date(gif.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: '2-digit'
            })}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: theme.error }]}
        onPress={(e) => {
          e.stopPropagation();
          handleDeleteGif(gif.id);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
```
Replace with:
```tsx
  const renderGifItem = (gif: GeneratedGif) => (
    <View key={gif.id} style={styles.item}>
      <TouchableOpacity
        style={[styles.imageWrapper, { borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}
        onPress={() => openFullScreenPhoto(gif.uri)}
        activeOpacity={0.95}
      >
        <Image source={{ uri: gif.uri }} style={styles.image} />
      </TouchableOpacity>
      <Text
        style={[styles.itemCaption, { color: theme.secondary, fontFamily: fontFamily.mono }]}
        numberOfLines={1}
      >
        {new Date(gif.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </Text>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: withOpacity('#000000', overlayOpacity.veryHeavy) }]}
        onPress={(e) => {
          e.stopPropagation();
          handleDeleteGif(gif.id);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="close" size={14} color="white" />
      </TouchableOpacity>
    </View>
  );
```

- [ ] **Step 4: Replace the associated styles**

Find:
```tsx
  item: {
    width: itemSize,
    height: itemSize,
    position: "relative",
  },
```
Replace with:
```tsx
  item: {
    width: itemSize,
    position: "relative",
  },
```

Find:
```tsx
  imageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    backgroundColor: "#000",
  },
```
Replace with:
```tsx
  imageWrapper: {
    width: itemSize,
    height: itemSize,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#000",
  },
```

Find:
```tsx
  imageDateOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: withOpacity('#000000', overlayOpacity.heavy),
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  dateText: {
    color: "white",
    ...typography.tiny,
    fontWeight: "500",
    opacity: designOpacity.high,
  },
```
Replace with:
```tsx
  itemCaption: {
    fontSize: 9,
    letterSpacing: 0.3,
    marginTop: spacing.xs,
    textAlign: "center",
  },
```

Find and remove the now-unused `typeIndicator` and `typeIndicatorText` style entries:
```tsx
  typeIndicator: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: iconSize.md,
    height: iconSize.md,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIndicatorText: {
    color: 'white',
    ...typography.small,
    fontWeight: 'bold',
  },
```
(delete both entries entirely)

Find:
```tsx
  deleteButton: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: iconSize.md,
    height: iconSize.md,
    borderRadius: borderRadius.round,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: withOpacity('#000000', overlayOpacity.veryHeavy),
  },
```
This one is unchanged — leave it as-is (the JSX call sites now pass the background color inline instead of relying on this static value, but the rest of the static shape/position properties are still correct and used).

- [ ] **Step 5: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. Confirm no remaining references to `imageDateOverlay`, `dateText`, `typeIndicator`, or `typeIndicatorText` anywhere in the file.

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/gallery.tsx"
git commit -m "style: restyle gallery grid items with hairline mat + mono caption"
```

---

### Task 8: Restyle Settings

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Interfaces:**
- No prop/behavior changes. Touches the `SettingItem` component, the `sectionTitle` style, and the premium/upgrade card block + styles. The `LinearGradient` import becomes unused after this task and must be removed.

- [ ] **Step 1: Add `fontFamily` to the existing `DesignSystem` import, remove the `LinearGradient` import**

Find:
```tsx
import { LinearGradient } from "expo-linear-gradient";
```
Delete this line entirely.

Find:
```tsx
import {
  borderRadius,
  opacity as designOpacity,
  iconSize,
  spacing,
  typography
} from "@/constants/DesignSystem";
```
Replace with:
```tsx
import {
  borderRadius,
  opacity as designOpacity,
  fontFamily,
  iconSize,
  spacing,
  typography
} from "@/constants/DesignSystem";
```

- [ ] **Step 2: Restyle `SettingItem`**

Find:
```tsx
const SettingItem: React.FC<{
  title: string;
  onPress: () => void;
  icon: string;
  theme: any;
  value?: string;
}> = ({ title, onPress, icon, theme, value }) => (
  <TouchableOpacity
    style={[
      styles.settingItem,
      {
        backgroundColor: theme.cardBackground,
        borderColor: withOpacity(theme.primary, overlayOpacity.light)
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
      <Ionicons
        name={icon as any}
        size={24}
        color={theme.primary}
      />
    </View>
    <Text style={[styles.settingText, { color: theme.text }]}>{title}</Text>
    {value && (
      <Text style={[styles.settingValue, { color: theme.text }]}>{value}</Text>
    )}
    <Ionicons name="chevron-forward" size={20} color={theme.text} />
  </TouchableOpacity>
);
```
Replace with:
```tsx
const SettingItem: React.FC<{
  title: string;
  onPress: () => void;
  icon: string;
  theme: any;
  value?: string;
}> = ({ title, onPress, icon, theme, value }) => (
  <TouchableOpacity
    style={[
      styles.settingItem,
      {
        backgroundColor: theme.cardBackground,
        borderColor: withOpacity(theme.secondary, overlayOpacity.light)
      }
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: withOpacity(theme.primary, overlayOpacity.subtle) }]}>
      <Ionicons name={icon as any} size={20} color={theme.primary} />
    </View>
    <Text style={[styles.settingText, { color: theme.text, fontFamily: fontFamily.body }]}>{title}</Text>
    {value && (
      <Text style={[styles.settingValue, { color: theme.secondary, fontFamily: fontFamily.mono }]}>{value}</Text>
    )}
    <Ionicons name="chevron-forward" size={18} color={theme.secondary} />
  </TouchableOpacity>
);
```

- [ ] **Step 3: Restyle the section title**

Find:
```tsx
  sectionTitle: {
    ...typography.caption,
    fontWeight: "600",
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: designOpacity.secondary,
  },
```
Replace with:
```tsx
  sectionTitle: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    opacity: designOpacity.secondary,
  },
```

- [ ] **Step 4: Restyle the premium/upgrade card block**

Find the whole "Premium Section" block:
```tsx
        {/* Premium Section */}
        <View style={styles.section}>
          {isPremium ? (
            <LinearGradient
              colors={[theme.primary + '20', theme.primary + '05']}
              style={styles.premiumCard}
            >
              <View style={styles.premiumHeader}>
                <PremiumBadge size="large" />
                <Text style={[styles.premiumTitle, { color: theme.text }]}>
                  {t("settings.premiumActive")}
                </Text>
              </View>
              <Text style={[styles.premiumSubtitle, { color: theme.text }]}>
                {t("settings.thankYouMessage")}
              </Text>
              <View style={styles.premiumStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>
                    {featureUsage.photoCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>{t("settings.photos")}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary }]}>∞</Text>
                  <Text style={[styles.statLabel, { color: theme.text }]}>{t("settings.limit")}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.manageButton, { borderColor: theme.primary }]}
                onPress={handleManageSubscription}
              >
                <Text style={[styles.manageButtonText, { color: theme.primary }]}>
                  {t("settings.manageSubscription")}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={styles.upgradeCard}
              onPress={handleUpgradePress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[theme.primary, theme.primary + 'CC']}
                style={styles.upgradeGradient}
              >
                <Ionicons name="star" size={40} color="#FFF" />
                <Text style={styles.upgradeTitle}>{t("settings.upgradeToPremium")}</Text>
                <Text style={styles.upgradeSubtitle}>
                  {t("settings.unlimitedPhotosAnalytics")}
                </Text>
                <View style={styles.upgradeStats}>
                  <Text style={styles.upgradeStatsText}>
                    {featureUsage.photoCount} / {FREE_TIER_LIMITS.MAX_PHOTOS} {t("settings.photosUsed")}
                  </Text>
                </View>
                <View style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>{t("settings.seePlans")}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
```
Replace with:
```tsx
        {/* Premium Section */}
        <View style={styles.section}>
          {isPremium ? (
            <View style={[styles.premiumCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}>
              <View style={styles.premiumHeader}>
                <PremiumBadge size="large" />
                <Text style={[styles.premiumTitle, { color: theme.text, fontFamily: fontFamily.display }]}>
                  {t("settings.premiumActive")}
                </Text>
              </View>
              <Text style={[styles.premiumSubtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
                {t("settings.thankYouMessage")}
              </Text>
              <View
                style={[
                  styles.premiumStats,
                  {
                    borderTopColor: withOpacity(theme.secondary, overlayOpacity.light),
                    borderBottomColor: withOpacity(theme.secondary, overlayOpacity.light),
                  },
                ]}
              >
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.text, fontFamily: fontFamily.mono }]}>
                    {featureUsage.photoCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
                    {t("settings.photos").toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.primary, fontFamily: fontFamily.mono }]}>&#8734;</Text>
                  <Text style={[styles.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
                    {t("settings.limit").toUpperCase()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.manageButton, { borderColor: withOpacity(theme.secondary, overlayOpacity.light) }]}
                onPress={handleManageSubscription}
              >
                <Text style={[styles.manageButtonText, { color: theme.text, fontFamily: fontFamily.mono }]}>
                  {t("settings.manageSubscription").toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.upgradeCard, { backgroundColor: theme.cardBackground, borderColor: theme.primary }]}
              onPress={handleUpgradePress}
              activeOpacity={0.85}
            >
              <Text style={[styles.upgradeTitle, { color: theme.text, fontFamily: fontFamily.display }]}>
                {t("settings.upgradeToPremium")}
              </Text>
              <Text style={[styles.upgradeSubtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
                {t("settings.unlimitedPhotosAnalytics")}
              </Text>
              <Text style={[styles.upgradeStatsText, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
                {featureUsage.photoCount} / {FREE_TIER_LIMITS.MAX_PHOTOS} {t("settings.photosUsed").toUpperCase()}
              </Text>
              <View style={[styles.upgradeButton, { backgroundColor: theme.primary }]}>
                <Text style={[styles.upgradeButtonText, { color: theme.background, fontFamily: fontFamily.mono }]}>
                  {t("settings.seePlans").toUpperCase()}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={theme.background} />
              </View>
            </TouchableOpacity>
          )}
        </View>
```

- [ ] **Step 5: Replace the associated styles**

Find:
```tsx
  premiumCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  premiumTitle: {
    ...typography.h3,
  },
  premiumSubtitle: {
    ...typography.caption,
    opacity: designOpacity.medium,
    marginBottom: spacing.xl,
  },
  premiumStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...typography.h1,
  },
  statLabel: {
    ...typography.small,
    opacity: designOpacity.medium,
    marginTop: spacing.xs,
  },
  manageButton: {
    borderWidth: 2,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  manageButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  upgradeCard: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  upgradeGradient: {
    padding: spacing.xxl,
    alignItems: "center",
  },
  upgradeTitle: {
    ...typography.h2,
    color: "#FFF",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  upgradeSubtitle: {
    ...typography.caption,
    color: "#FFF",
    opacity: designOpacity.high,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  upgradeStats: {
    backgroundColor: withOpacity('#ffffff', overlayOpacity.subtle),
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
  },
  upgradeStatsText: {
    color: "#FFF",
    ...typography.small,
    fontWeight: "600",
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: withOpacity('#ffffff', overlayOpacity.light),
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  upgradeButtonText: {
    color: "#FFF",
    ...typography.body,
    fontWeight: "bold",
  },
```
Replace with:
```tsx
  premiumCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.sm,
  },
  premiumHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  premiumTitle: {
    fontSize: 18,
    fontStyle: "italic",
  },
  premiumSubtitle: {
    fontSize: 13,
    marginBottom: spacing.xl,
  },
  premiumStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.xl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: spacing.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 1,
    marginTop: spacing.xs,
  },
  manageButton: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  manageButtonText: {
    fontSize: 10,
    letterSpacing: 1,
  },
  upgradeCard: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.sm,
    alignItems: "center",
  },
  upgradeTitle: {
    fontSize: 18,
    fontStyle: "italic",
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  upgradeSubtitle: {
    fontSize: 13,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  upgradeStatsText: {
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  upgradeButtonText: {
    fontSize: 10,
    letterSpacing: 1,
  },
```

- [ ] **Step 6: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. Confirm `LinearGradient` no longer appears anywhere in the file (import removed and both usages replaced).

- [ ] **Step 7: Commit**

```bash
git add "app/(tabs)/settings.tsx"
git commit -m "style: restyle settings rows and premium card to hairline instrument language"
```

---

### Task 9: Restyle Paywall

**Files:**
- Modify: `components/monetization/PaywallModal.tsx`
- Modify: `localization/translations.ts`

**Interfaces:**
- Consumes: `preciseType.heroTitle` (Task 2), new translation key `paywall.trustLine`.
- No prop/behavior changes to `PaywallModal` (`{ visible, onClose, source?, feature? }` unchanged) or the purchase flow.

- [ ] **Step 1: Add the `paywall.trustLine` translation key**

In the `TranslationKeys` interface, in the `paywall` block, add a new field directly after `cancelAnytime`:
```ts
    cancelAnytime: string;
    trustLine: string;
    termsAgreement: string;
```

In the `en` locale's `paywall` block (around line 565), add directly after `cancelAnytime`:
```ts
      cancelAnytime: "Cancel anytime. No commitment.",
      trustLine: "Your photos stay yours either way.",
```

In the `es` locale's `paywall` block (around line 873), add directly after `cancelAnytime`:
```ts
      cancelAnytime: "Cancela en cualquier momento. Sin compromiso.",
      trustLine: "Tus fotos siguen siendo tuyas en cualquier caso.",
```

In the `it` locale's `paywall` block (around line 1181), add directly after `cancelAnytime`:
```ts
      cancelAnytime: "Annulla in qualsiasi momento. Nessun impegno.",
      trustLine: "Le tue foto restano tue in ogni caso.",
```

In the `de` locale's `paywall` block (around line 1490), add directly after `cancelAnytime`:
```ts
      cancelAnytime: "Jederzeit kündbar. Keine Verpflichtung.",
      trustLine: "Deine Fotos bleiben so oder so deine.",
```

In the `fr` locale's `paywall` block (around line 1798), add directly after `cancelAnytime`:
```ts
      cancelAnytime: "Annulez à tout moment. Aucun engagement.",
      trustLine: "Vos photos restent les vôtres, quoi qu'il arrive.",
```

- [ ] **Step 2: Verify the translation contract compiles**

Run: `npx tsc --noEmit`
Expected: no errors (TypeScript fails here if any locale block is missing `trustLine` — that's the safety net).

- [ ] **Step 3: Commit the translation key separately**

```bash
git add localization/translations.ts
git commit -m "feat: add paywall.trustLine translation key"
```

- [ ] **Step 4: Update imports in `PaywallModal.tsx`**

Find:
```tsx
import { LinearGradient } from 'expo-linear-gradient';
```
Delete this line entirely (it becomes unused once Steps 5–6 remove both `LinearGradient` usages).

Find:
```tsx
import {
  spacing,
  borderRadius,
  elevation,
  typography,
  iconSize,
  opacity as designOpacity,
} from '@/constants/DesignSystem';
```
Replace with:
```tsx
import {
  spacing,
  borderRadius,
  elevation,
  fontFamily,
  preciseType,
  typography,
  iconSize,
  opacity as designOpacity,
} from '@/constants/DesignSystem';
```

- [ ] **Step 5: Restyle the hero section**

Find:
```tsx
          {/* Hero Section */}
          <LinearGradient
            colors={[theme.primary + '20', theme.primary + '05']}
            style={styles.hero}
          >
            <Ionicons name="star" size={48} color={theme.primary} />
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              {t("paywall.upgradeTitle")}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.text }]}>
              {t("paywall.upgradeSubtitle")}
            </Text>
          </LinearGradient>
```
Replace with:
```tsx
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text
              style={[styles.heroTitle, preciseType.heroTitle, { color: theme.text, fontFamily: fontFamily.display }]}
            >
              {t("paywall.upgradeTitle")}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {t("paywall.upgradeSubtitle")}
            </Text>
          </View>
```

- [ ] **Step 6: Restyle `PricingCard`**

Find:
```tsx
    return (
      <TouchableOpacity
        style={[
          styles.pricingCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isSelected ? theme.primary : 'transparent',
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedPlan(plan)}
        activeOpacity={0.8}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.popularBadgeText, { color: theme.background }]}>
              {t("paywall.mostPopular")}
            </Text>
          </View>
        )}
        <View style={styles.pricingHeader}>
          <View style={styles.radioButton}>
            {isSelected && (
              <View
                style={[styles.radioButtonInner, { backgroundColor: theme.primary }]}
              />
            )}
          </View>
          <View style={styles.pricingInfo}>
            <Text style={[styles.pricingTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.pricingSubtitle, { color: theme.text }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.pricingBottom}>
          <Text style={[styles.pricingPrice, { color: theme.primary }]}>{t("paywall.currency")}{price}</Text>
          {savings && (
            <View style={[styles.savingsBadge, { backgroundColor: theme.success + '20' }]}>
              <Text style={[styles.savingsText, { color: theme.success }]}>
                {t("paywall.save")} {savings}%
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
```
Replace with:
```tsx
    return (
      <TouchableOpacity
        style={[
          styles.pricingCard,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isSelected ? theme.primary : withOpacity(theme.secondary, overlayOpacity.light),
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedPlan(plan)}
        activeOpacity={0.8}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
            <Text style={[styles.popularBadgeText, { color: theme.background, fontFamily: fontFamily.mono }]}>
              {t("paywall.mostPopular").toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.pricingHeader}>
          <View style={[styles.radioButton, { borderColor: isSelected ? theme.primary : theme.secondary }]}>
            {isSelected && (
              <View style={[styles.radioButtonInner, { backgroundColor: theme.primary }]} />
            )}
          </View>
          <View style={styles.pricingInfo}>
            <Text style={[styles.pricingTitle, { color: theme.text, fontFamily: fontFamily.body }]}>{title}</Text>
            <Text style={[styles.pricingSubtitle, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {subtitle}
            </Text>
          </View>
        </View>
        <View style={styles.pricingBottom}>
          <Text style={[styles.pricingPrice, { color: theme.primary, fontFamily: fontFamily.mono }]}>
            {t("paywall.currency")}{price}
          </Text>
          {savings && (
            <View style={[styles.savingsBadge, { backgroundColor: withOpacity(theme.success, overlayOpacity.subtle) }]}>
              <Text style={[styles.savingsText, { color: theme.success, fontFamily: fontFamily.mono }]}>
                {t("paywall.save")} {savings}%
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
```

Note: this introduces `withOpacity`/`overlayOpacity` — confirm they're already imported at the top of the file (`import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';` — they are, per the existing import line; no import change needed for this step).

- [ ] **Step 7: Add the trust line to the footer**

Find:
```tsx
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.text }]}>
              {t("paywall.cancelAnytime")}
            </Text>
            <Text style={[styles.footerText, { color: theme.text }]}>
              {t("paywall.termsAgreement")}
            </Text>
          </View>
```
Replace with:
```tsx
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {t("paywall.cancelAnytime")}
            </Text>
            <Text style={[styles.trustLine, { color: theme.secondary, fontFamily: fontFamily.mono }]}>
              {t("paywall.trustLine")}
            </Text>
            <Text style={[styles.footerText, { color: theme.secondary, fontFamily: fontFamily.body }]}>
              {t("paywall.termsAgreement")}
            </Text>
          </View>
```

- [ ] **Step 8: Update the styles**

Find:
```tsx
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
    borderRadius: borderRadius.xl,
  },
  heroTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    ...typography.body,
    opacity: designOpacity.medium,
    textAlign: 'center',
  },
```
Replace with:
```tsx
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  heroTitle: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
```

Find:
```tsx
  radioButton: {
    width: iconSize.md,
    height: iconSize.md,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    borderColor: withOpacity('#cccccc', 1),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
```
Replace with:
```tsx
  radioButton: {
    width: iconSize.md,
    height: iconSize.md,
    borderRadius: borderRadius.round,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
```
(`borderColor` moved to the inline theme-dependent style in Step 6 — the static hardcoded `'#cccccc'` value is removed here.)

Find:
```tsx
  footerText: {
    ...typography.small,
    opacity: designOpacity.hint,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
```
Replace with:
```tsx
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  trustLine: {
    fontSize: 10,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
```

- [ ] **Step 9: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. Confirm `LinearGradient` no longer appears anywhere in the file.

- [ ] **Step 10: Commit**

```bash
git add components/monetization/PaywallModal.tsx
git commit -m "style: restyle paywall to hairline plan cards with a trust line"
```

---

### Task 10: Manual visual QA

No automated test can confirm a redesign looks right — do not report this plan complete without doing this.

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Use the project's `run` skill (or `npx expo start`).

- [ ] **Step 2: Walk each restyled screen in dark mode, then light mode**

- Onboarding: fresh install or Settings → "View Tutorial" to replay it. Check the mono step counter, hero title, and button.
- Camera: check the angle pill tabs, then capture a photo and check the confirm screen's `ContactSheetFrame` + retake/confirm buttons.
- Progress: check the angle tabs match Camera/Gallery's pill styling. (`PhotoMorph`'s own modes below the tabs are unchanged by this plan — expect them to still look like the old design; that's expected, not a bug.)
- Gallery: check grid thumbnails (both Grouped and Timeline view) and the GIF section for the new hairline + caption treatment, in both normal and selection mode.
- Settings: check the row hairlines, and both the Premium (if testable via the test-premium toggle) and Upgrade card states.
- Paywall: open via Settings → Upgrade. Check the hero, all three plan cards (including the selected/annual state), and the trust line above the terms text.
- Home/index, generally: confirm the flat background (Task 1) doesn't look broken or empty compared to before — it should now read as a plain, un-decorated ground consistent with the rest of the app.

- [ ] **Step 3: Report results to the user**

Summarize what was checked and any visual issues found, so they can be triaged before considering this rollout done.
