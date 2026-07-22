# Interaction Overhaul — Sub-project A: Shared Primitives & Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the app's two button systems into one Measured-Confidence Button primitive, and replace the five different premium presentations with one quiet, always-actionable lock pattern — per `docs/superpowers/specs/2026-07-22-interaction-overhaul-design.md` (Sub-project A).

**Architecture:** Rebuild the shared `Button` (its public API is preserved, so existing call sites keep compiling and inherit the new look automatically). Add a new `PremiumLock` row component. Rewrite `FeatureGate` to render that row and always open the shared paywall on tap (killing the dead-tap bug). Migrate Camera's confirm screen off its inline hand-built buttons onto the primitive. This is the dependency root for Sub-projects B and C.

**Tech Stack:** Expo 57 / React Native 0.86 / React 19, jest-expo + react-test-renderer.

## Global Constraints

- Reuse existing tokens only — `Colors` (incl. `withOpacity`/`overlayOpacity`), `fontFamily`, `preciseType`, `spacing`, `borderRadius` from `constants/`. Do not change any token's value.
- **No raw `fontSize`/`letterSpacing` literals where a `preciseType` token matches** — spread the token (e.g. `preciseType.badgeLabel`). This rule cost four follow-up fixes in the prior rollout; honor it from the first draft.
- **No new hardcoded hex colors.** Colors come from the theme object / `withOpacity`.
- Brass (`theme.primary`) = actionable/selected only. Steel (`theme.secondary`, via `withOpacity`) = hairlines/plain borders. Brick (`theme.error`) = destructive only.
- The `Button` public prop interface (`title`, `onPress`, `variant`, `size`, `disabled`, `loading`, `fullWidth`, `icon`, `iconPosition`, `style`, `textStyle`) must be preserved so the existing call sites in `camera.tsx` (permission screen) and `PaywallModal.tsx` (purchase button) keep compiling unchanged.
- Every new component gets a `react-test-renderer` smoke test using the repo's proven pattern: `import { create, act } from "react-test-renderer"` and wrap `create()` in `act()` (calling `create()` unwrapped throws "Jest environment has been torn down" in this project). Mock `@/context/ThemeContext`, `@/context/LocalizationContext`, and `@/context/UserContext` as needed.
- Verify every task with `npx tsc --noEmit`; run `npx jest` for tasks that add/change tests.
- This is visual/interaction work — `tsc`/`jest` confirm compilation and logic, not that it *looks* right. Task 5 is a mandatory manual pass; do not report the plan complete without it.
- Do NOT touch `app/(tabs)/gallery.tsx` or `localization/translations.ts` in this sub-project (they carry unrelated uncommitted WIP; they're handled in later sub-projects).

---

## File structure

New files:
- `components/monetization/PremiumLock.tsx` + `.test.tsx` — the shared quiet lock row
- `components/ui/Button.test.tsx` — smoke test for the rebuilt primitive
- `components/monetization/FeatureGate.test.tsx` — smoke test for the rewritten gate

Modified files:
- `components/ui/Button.tsx` — full rebuild, same public API
- `components/monetization/FeatureGate.tsx` — rewrite locked rendering to use `PremiumLock`
- `app/(tabs)/camera.tsx` — confirm-screen buttons migrated to the `Button` primitive

Untouched but inheriting the new look automatically (verify they still compile, don't edit): `PaywallModal.tsx` purchase button, `camera.tsx` permission button.

---

### Task 1: Rebuild the Button primitive

**Files:**
- Modify: `components/ui/Button.tsx`
- Create: `components/ui/Button.test.tsx`

**Interfaces:**
- Produces: `Button` component, **unchanged public `ButtonProps`**. Variants restyled: `primary` (brass fill), `ghost`/`outline` (transparent + steel hairline), `secondary` (subtle steel fill), `danger` (transparent + brick border/label). All labels mono uppercase via `preciseType.badgeLabel`. Consumed by Task 4 and by existing call sites in `camera.tsx`/`PaywallModal.tsx`.

- [ ] **Step 1: Write the failing smoke test**

Create `components/ui/Button.test.tsx`:

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import { Button } from "./Button";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));

describe("Button", () => {
  it("renders an uppercased mono label for each variant", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <>
          <Button title="Continue" onPress={() => {}} variant="primary" />
          <Button title="Retake" onPress={() => {}} variant="ghost" />
          <Button title="Delete" onPress={() => {}} variant="danger" />
        </>
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("CONTINUE");
    expect(json).toContain("RETAKE");
    expect(json).toContain("DELETE");
  });

  it("renders a spinner instead of the label when loading", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <Button title="Save" onPress={() => {}} loading />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).not.toContain("SAVE");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/ui/Button.test.tsx`
Expected: FAIL — the current Button renders the label in its original case (`"Continue"`, not `"CONTINUE"`), so the first assertion fails.

- [ ] **Step 3: Replace the full contents of `components/ui/Button.tsx`**

```tsx
/**
 * Standardized Button Component
 *
 * The single button system for the app (Measured Confidence).
 * Mono uppercase label, hairline or solid fill, no drop shadow.
 * All buttons meet WCAG touch target requirements (minimum 44x44px).
 *
 * Variants:
 * - primary:   brass fill — the one action that matters in a view
 * - ghost:     transparent + steel hairline — secondary action
 * - outline:   alias of ghost (kept for API compatibility)
 * - secondary: subtle steel fill (kept for API compatibility)
 * - danger:    transparent + brick border/label — destructive
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Colors, { withOpacity, overlayOpacity } from '@/constants/Colors';
import {
  borderRadius,
  spacing,
  fontFamily,
  preciseType,
  touchTarget,
  opacity,
} from '@/constants/DesignSystem';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];

  const sizeStyles = {
    small: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: touchTarget.min,
    },
    medium: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: touchTarget.comfortable,
    },
    large: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xxl,
      minHeight: touchTarget.large,
    },
  };

  const hairline = withOpacity(theme.secondary, overlayOpacity.light);

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: theme.primary, borderWidth: 1, borderColor: theme.primary },
    secondary: {
      backgroundColor: withOpacity(theme.secondary, overlayOpacity.subtle),
      borderWidth: 1,
      borderColor: hairline,
    },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: hairline },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: hairline },
    danger: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: withOpacity(theme.error, overlayOpacity.heavy),
    },
  };

  const textVariantStyles: Record<string, TextStyle> = {
    primary: { color: theme.background },
    secondary: { color: theme.text },
    outline: { color: theme.text },
    ghost: { color: theme.text },
    danger: { color: theme.error },
  };

  const spinnerColor =
    variant === 'primary' ? theme.background : variant === 'danger' ? theme.error : theme.text;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && { opacity: opacity.disabled },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {title && (
            <Text
              style={[styles.text, preciseType.badgeLabel, textVariantStyles[variant], textStyle]}
            >
              {title.toUpperCase()}
            </Text>
          )}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  text: {
    fontFamily: fontFamily.mono,
  },
  fullWidth: {
    width: '100%',
  },
});
```

Note: `primary` label uses `theme.background` (ink on brass in dark), matching the convention already used by the camera confirm button and other on-brass text in the app. The `outline` variant is now visually identical to `ghost` — both kept as distinct keys only for API compatibility with any caller.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/ui/Button.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit` — expect no errors (confirm `camera.tsx` permission button and `PaywallModal.tsx` purchase button still compile against the unchanged prop API).

```bash
git add components/ui/Button.tsx components/ui/Button.test.tsx
git commit -m "feat: rebuild Button as the single Measured Confidence primitive"
```

---

### Task 2: Build the `PremiumLock` row

**Files:**
- Create: `components/monetization/PremiumLock.tsx`
- Create: `components/monetization/PremiumLock.test.tsx`

**Interfaces:**
- Consumes: `useTheme()`, `Colors`/`withOpacity`/`overlayOpacity`, `spacing`/`borderRadius`/`iconSize`/`fontFamily`/`preciseType`, `useLocalization()`, `Ionicons`.
- Produces: `PremiumLock` component with props `{ title: string; subtitle?: string; icon?: keyof typeof Ionicons.glyphMap; onPress: () => void; compact?: boolean }`. A pressable hairline row: outline glyph (mist), title (paper), optional mono sub-label (mist), and a mono `PRO` chip (brass hairline pill). Consumed by Task 3 (`FeatureGate`) and later by Sub-project C.

- [ ] **Step 1: Write the failing test**

Create `components/monetization/PremiumLock.test.tsx`:

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import { PremiumLock } from "./PremiumLock";

jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));
jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({ t: (k: string) => (k === "featureGate.pro" ? "Pro" : k) }),
}));

describe("PremiumLock", () => {
  it("renders the title and a PRO chip, and fires onPress", () => {
    const onPress = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <PremiumLock title="Weekly progress chart" subtitle="Trend over time" onPress={onPress} />
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("Weekly progress chart");
    expect(json).toContain("PRO");

    // find the root pressable and invoke its onPress
    const root = tree!.root.findAll(
      (n) => typeof n.props.onPress === "function"
    )[0];
    act(() => root.props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/monetization/PremiumLock.test.tsx`
Expected: FAIL — cannot find module `./PremiumLock`.

- [ ] **Step 3: Implement the component**

Create `components/monetization/PremiumLock.tsx`:

```tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { useLocalization } from "@/context/LocalizationContext";
import { spacing, borderRadius, iconSize, fontFamily, preciseType } from "@/constants/DesignSystem";

interface PremiumLockProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  compact?: boolean;
}

// The one quiet premium-lock pattern, reused everywhere a feature is gated.
// A hairline row that always opens the shared paywall on tap — never a
// blur overlay, never a silent no-op.
export const PremiumLock: React.FC<PremiumLockProps> = ({
  title,
  subtitle,
  icon = "lock-closed-outline",
  onPress,
  compact = false,
}) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  return (
    <TouchableOpacity
      style={[
        styles.row,
        compact && styles.rowCompact,
        { borderColor: withOpacity(theme.secondary, overlayOpacity.light) },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.glyph, { backgroundColor: withOpacity(theme.secondary, overlayOpacity.subtle) }]}>
        <Ionicons name={icon} size={iconSize.sm} color={theme.secondary} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text, fontFamily: fontFamily.body }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && !compact && (
          <Text
            style={[styles.subtitle, preciseType.statLabel, { color: theme.secondary, fontFamily: fontFamily.mono }]}
            numberOfLines={1}
          >
            {subtitle.toUpperCase()}
          </Text>
        )}
      </View>
      <View style={[styles.chip, { borderColor: withOpacity(theme.primary, overlayOpacity.medium) }]}>
        <Text style={[styles.chipText, preciseType.statLabel, { color: theme.primary, fontFamily: fontFamily.mono }]}>
          {(t("featureGate.pro") || "Pro").toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  rowCompact: {
    padding: spacing.sm,
  },
  glyph: {
    width: iconSize.lg,
    height: iconSize.lg,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 14,
  },
  subtitle: {
    marginTop: 2,
  },
  chip: {
    borderWidth: 1,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {},
});
```

Note: `styles.title` uses a raw `fontSize: 14` because no `preciseType` token is exactly `{fontSize:14}` alone (`tipBody`/`badgeValue` are 14 but semantically wrong for a row title, and this is a plain body label). If a `preciseType.rowTitle` is later added, migrate this. The `PRO` chip and subtitle both correctly use `preciseType.statLabel`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/monetization/PremiumLock.test.tsx`
Expected: PASS.

- [ ] **Step 5: Add the `featureGate.pro` translation key**

The component reads `t("featureGate.pro")`. Add it so the string is localized rather than falling back. In `localization/translations.ts`, in the `featureGate` block of the `TranslationKeys` interface, add:

```ts
    pro: string;
```

Then in each of the 5 locale blocks' `featureGate` object, add:
- en: `pro: "Pro",`
- es: `pro: "Pro",`
- it: `pro: "Pro",`
- de: `pro: "Pro",`
- fr: `pro: "Pro",`

**IMPORTANT — `localization/translations.ts` carries pre-existing unrelated uncommitted WIP.** Before editing it, isolate that WIP:
1. `git stash push --message "A-task2-preexisting-wip" -- localization/translations.ts`
2. Verify clean: `git diff -- localization/translations.ts` shows no output.
3. Make only the `featureGate.pro` additions above.
4. `npx tsc --noEmit` (TS fails if any locale is missing the new required key — that's the safety net).
5. Commit (Step 6 below) — this commit includes `PremiumLock.tsx`, its test, AND `translations.ts`.
6. `git stash pop` to restore the WIP.
7. Verify `git diff -- localization/translations.ts` shows the restored unrelated content (not a conflict). If `git stash pop` conflicts, STOP and report BLOCKED.

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit` and `npx jest components/monetization/PremiumLock.test.tsx` — both clean.

```bash
git add components/monetization/PremiumLock.tsx components/monetization/PremiumLock.test.tsx localization/translations.ts
git commit -m "feat: add PremiumLock shared lock-row component"
```

(Then perform Step 5's `git stash pop` if not already done.)

---

### Task 3: Rewrite `FeatureGate` to use `PremiumLock` and always open the paywall

**Files:**
- Modify: `components/monetization/FeatureGate.tsx`
- Create: `components/monetization/FeatureGate.test.tsx`

**Interfaces:**
- Consumes: `PremiumLock` (Task 2), `useUser().hasFeatureAccess`, `PaywallModal`, `useLocalization()`.
- Produces: `FeatureGate` with its **existing props preserved** (`feature`, `children`, `fallback`, `showPreview`, `customMessage`, `containerStyle`, `compact`) so all current call sites in `app/(tabs)/index.tsx` and `components/progress/PhotoMorph.tsx` keep compiling. Behavior change: when access is denied it renders a single `PremiumLock` row that opens the shared `PaywallModal` on tap (no blur, no bespoke card). `showPreview` is accepted but no longer blurs — it always renders the row.

- [ ] **Step 1: Write the failing test**

Create `components/monetization/FeatureGate.test.tsx`:

```tsx
import React from "react";
import { Text } from "react-native";
import { create, act } from "react-test-renderer";

let mockHasAccess = false;
// Stub the icon set — FeatureGate renders the real PremiumLock, which renders
// an Ionicon; the async font loader otherwise fires a setState after teardown
// and surfaces as a non-zero exit on isolated runs.
jest.mock("@expo/vector-icons", () => ({
  Ionicons: (props: any) => null,
}));
jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));
jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));
jest.mock("@/context/UserContext", () => ({
  useUser: () => ({ hasFeatureAccess: () => mockHasAccess }),
}));

import { FeatureGate } from "./FeatureGate";
import { Feature } from "@/constants/Features";

describe("FeatureGate", () => {
  it("renders children when access is granted", () => {
    mockHasAccess = true;
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FeatureGate feature={Feature.ACHIEVEMENT_BADGES}>
          <Text>unlocked-content</Text>
        </FeatureGate>
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain("unlocked-content");
  });

  it("renders a lock row (not the children) when access is denied", () => {
    mockHasAccess = false;
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FeatureGate feature={Feature.ACHIEVEMENT_BADGES} customMessage="Achievements">
          <Text>unlocked-content</Text>
        </FeatureGate>
      );
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).not.toContain("unlocked-content");
    expect(json).toContain("PRO");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest components/monetization/FeatureGate.test.tsx`
Expected: FAIL — the current `FeatureGate` renders the old blur/lock-card markup, so the denied-access case does not contain `"PRO"` (it renders `featureGate.premiumFeature`), and the assertion fails. (It may also fail earlier on the blur/`BlurView` path.)

- [ ] **Step 3: Replace the full contents of `components/monetization/FeatureGate.tsx`**

```tsx
/**
 * FeatureGate Component
 *
 * Wrapper that controls access to premium features. When the user lacks
 * access it renders one quiet PremiumLock row that opens the shared paywall
 * on tap — no blur overlay, no bespoke card, no silent no-op.
 */

import { Feature } from '@/constants/Features';
import { useLocalization } from '@/context/LocalizationContext';
import { useUser } from '@/context/UserContext';
import React, { ReactNode, useState } from 'react';
import { View, ViewStyle } from 'react-native';
import { PremiumLock } from './PremiumLock';
import PaywallModal from './PaywallModal';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean; // accepted for API compatibility; no longer blurs
  customMessage?: string;
  containerStyle?: ViewStyle;
  compact?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  customMessage,
  containerStyle,
  compact = false,
}) => {
  const { hasFeatureAccess } = useUser();
  const { t } = useLocalization();
  const [showPaywall, setShowPaywall] = useState(false);

  if (hasFeatureAccess(feature)) {
    return <View style={containerStyle}>{children}</View>;
  }

  if (fallback) {
    return <View style={containerStyle}>{fallback}</View>;
  }

  return (
    <View style={containerStyle}>
      <PremiumLock
        title={customMessage || t('featureGate.premiumFeature')}
        onPress={() => setShowPaywall(true)}
        compact={compact}
      />
      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        source="feature_gate"
        feature={feature}
      />
    </View>
  );
};

export default FeatureGate;
```

Note: this removes the `BlurView`, `Ionicons`, `Colors`/`useTheme`, and the entire old lock-card `StyleSheet` — all now unused. The `showPreview` prop is dropped from the destructure (still allowed by the interface, so call sites passing `showPreview={false}` keep compiling) since it no longer changes behavior. `customMessage` becomes the row's title (call sites on Home pass a human label; where none is passed it falls back to `featureGate.premiumFeature`).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest components/monetization/FeatureGate.test.tsx`
Expected: PASS — 2 tests.

- [ ] **Step 5: Verify compilation and commit**

Run: `npx tsc --noEmit` — expect no errors. Confirm the `FeatureGate` call sites in `app/(tabs)/index.tsx` (achievements/chart/heatmap) and `components/progress/PhotoMorph.tsx` still compile (their props are a subset of the preserved interface).

```bash
git add components/monetization/FeatureGate.tsx components/monetization/FeatureGate.test.tsx
git commit -m "feat: rewrite FeatureGate to the quiet PremiumLock pattern"
```

---

### Task 4: Migrate Camera's confirm buttons to the Button primitive

**Files:**
- Modify: `app/(tabs)/camera.tsx`

**Interfaces:**
- Consumes: `Button` (Task 1, via `@/components/ui`).
- Produces: no API change to `CameraScreen`. Removes the inline `confirmButton`/`confirmButtonText` hand-built buttons (the "second button system") from the confirm screen, replacing them with `<Button>`.

- [ ] **Step 1: Add the `Button` import**

In `app/(tabs)/camera.tsx`, find the existing import:
```tsx
import { Button } from "@/components/ui";
```
It already exists (used by the permission screen). No import change needed — confirm it's present.

- [ ] **Step 2: Replace the confirm-screen action buttons**

Find:
```tsx
        <View style={styles.confirmationButtonsContainer}>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, { borderColor: theme.error }]}
              onPress={retakePicture}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={18} color={theme.error} />
              <Text style={[styles.confirmButtonText, preciseType.badgeLabel, { color: theme.error, fontFamily: fontFamily.mono }]}>
                {(t("camera.retake") || "Retake").toUpperCase()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={confirmPicture}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color={theme.background} />
              <Text style={[styles.confirmButtonText, preciseType.badgeLabel, { color: theme.background, fontFamily: fontFamily.mono }]}>
                {(t("camera.confirm") || "Confirm").toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.helperText, { color: theme.secondary }]}>
            {t("camera.confirmHelper") || "Review your photo before saving"}
          </Text>
        </View>
```
Replace with:
```tsx
        <View style={styles.confirmationButtonsContainer}>
          <View style={styles.confirmationButtons}>
            <Button
              title={t("camera.retake") || "Retake"}
              onPress={retakePicture}
              variant="danger"
              icon={<Ionicons name="refresh-outline" size={18} color={theme.error} />}
              style={styles.confirmBtn}
            />
            <Button
              title={t("camera.confirm") || "Confirm"}
              onPress={confirmPicture}
              variant="primary"
              icon={<Ionicons name="checkmark" size={18} color={theme.background} />}
              style={styles.confirmBtn}
            />
          </View>

          <Text style={[styles.helperText, { color: theme.secondary }]}>
            {t("camera.confirmHelper") || "Review your photo before saving"}
          </Text>
        </View>
```

- [ ] **Step 3: Replace the now-unused confirm-button styles with one layout style**

Find:
```tsx
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
  confirmButtonText: {},
```
Replace with:
```tsx
  confirmBtn: {
    flex: 1,
  },
```
(The `Button` primitive now owns the border/radius/padding/gap/label; the screen only needs to size the two buttons to share the row.)

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: no errors. Confirm no remaining references to `styles.confirmButton` or `styles.confirmButtonText` anywhere in the file. Note `preciseType` and `fontFamily` may become unused in this file if nothing else references them — if `tsc` (or the existing lint setup) flags them, remove them from the import; if still used elsewhere in the file, leave them.

- [ ] **Step 5: Run the full test suite and commit**

Run: `npx jest`
Expected: all suites pass (the 3 new A suites + prior suites).

```bash
git add "app/(tabs)/camera.tsx"
git commit -m "refactor: migrate camera confirm screen to the Button primitive"
```

---

### Task 5: Manual visual QA

No automated test confirms a redesign looks right — do not report this sub-project complete without this.

**Files:** none (verification only).

- [ ] **Step 1: Start the app** (project `run` skill or `npx expo start`).

- [ ] **Step 2: Check the Button primitive in both themes**

- Camera permission screen (deny/reset camera permission to reach it): the "Grant permission" button should now be a flat brass mono-label button, no drop shadow.
- Paywall (Settings → upgrade): the purchase button should match — same flat mono primary style. Confirm both look identical to each other (proving one system).

- [ ] **Step 3: Check the premium lock pattern**

- On Home with a **free** account: the achievements / weekly chart / consistency heatmap gates should now render as quiet single hairline `PRO` rows instead of big brass-bordered blur cards. (They'll be three separate rows for now — consolidating to one Pro group is Sub-project C.)
- **Tap each locked row** → the shared paywall sheet opens every time. This is the key behavioral fix; confirm there is no dead/silent tap.
- In Progress (`PhotoMorph`) with a free account, the feature-gated areas likewise open the paywall on tap.

- [ ] **Step 4: Check the camera confirm screen**

Capture a photo → the retake (brick ghost) and confirm (brass primary) buttons should look like the Button primitive used elsewhere, in the contact-sheet frame, no drop shadow.

- [ ] **Step 5: Report results** — summarize what was checked and any visual issues, for triage before moving to Sub-project B.
