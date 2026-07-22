# Live Lighting Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the user a real-time on-screen indicator while framing a progress photo that shows whether the room lighting matches their first (baseline) shot of that pose.

**Architecture:** All decision logic — luminance normalization, per-pose baseline resolution, and Δ→indicator-state classification — lives in a pure, dependency-free service (`services/lightingService.ts`) that is fully unit-tested without a device. The camera screen (`app/(tabs)/camera.tsx`) migrates from `expo-camera` to `react-native-vision-camera` V5, whose frame processor reads the frame's luma bytes via `frame.toArrayBuffer()` and feeds them through the pure service to drive a small `LightingIndicator` UI. A tiny persisted store holds optional per-pose recalibration overrides.

**Tech Stack:** React Native 0.86, React 19.2, Expo SDK 57 (dev client, new architecture always on), TypeScript, Jest (`jest-expo` preset), `react-native-vision-camera` ^5.1.0 + `react-native-vision-camera-worklets`, `react-native-worklets` 0.10.0 (already installed), `react-native-reanimated` 4.5.0 (already installed), AsyncStorage (already installed).

## Global Constraints

- Expo SDK 57 / RN 0.86 / React 19.2 — do not downgrade any of these.
- Dev client build only (`expo-dev-client` present). Feature will NOT run in Expo Go; that is acceptable and expected.
- No pixel-reading dependency for still images — legacy photos are never analyzed; baselines seed from new captures only.
- vision-camera Camera MUST be configured with `pixelFormat="yuv"` so `frame.toArrayBuffer()` yields a luma (Y) plane first.
- All pure logic must be **total** (never throw) — bad/partial input returns a neutral result, not an exception.
- Tolerance band constants (matched ≤ 0.08, close ≤ 0.18) live in ONE place in `lightingService.ts` and are exported.
- Run a single test file with: `npx jest <path> --watchAll=false`.
- Follow existing code conventions: colocated `*.test.ts`, `@/` path alias, named exports, `services/` for logic modules.

---

### Task 1: Add `luminance` to the Photo model

**Files:**
- Modify: `services/photoStorage.ts` (the `Photo` interface, ~lines 6–12)

**Interfaces:**
- Consumes: nothing.
- Produces: `Photo.luminance?: number` — a 0–1 background luminance captured at shoot time, optional so all existing/legacy photos remain valid.

- [ ] **Step 1: Add the optional field**

In `services/photoStorage.ts`, extend the interface:

```ts
export interface Photo {
  id: string;
  uri: string;
  date: string;
  type: PhotoType;
  fileName?: string;
  /** 0–1 background luminance captured at shoot time (live-lighting feature). Absent on legacy photos. */
  luminance?: number;
}
```

- [ ] **Step 2: Verify the project still type-checks**

Run: `npx tsc --noEmit`
Expected: PASS (no new errors). The field is optional and additive, so no existing call site breaks.

- [ ] **Step 3: Commit**

```bash
git add services/photoStorage.ts
git commit -m "feat: add optional luminance field to Photo model"
```

---

### Task 2: Luminance normalization + indicator classification (pure)

**Files:**
- Create: `services/lightingService.ts`
- Test: `services/lightingService.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `LIGHTING_TOLERANCE = { matched: 0.08, close: 0.18 }` (exported const)
  - `type LightingState = "matched" | "close" | "off" | "none"`
  - `normalizeLuma(mean0to255: number): number` — clamps 0–255 → 0–1.
  - `classifyLighting(current: number, baseline: number | null): LightingState` — returns `"none"` when `baseline` is null; otherwise compares `Math.abs(current - baseline)` to the tolerance band.

- [ ] **Step 1: Write the failing test**

Create `services/lightingService.test.ts`:

```ts
import {
  LIGHTING_TOLERANCE,
  normalizeLuma,
  classifyLighting,
} from "./lightingService";

describe("normalizeLuma", () => {
  it("maps 0..255 onto 0..1", () => {
    expect(normalizeLuma(0)).toBe(0);
    expect(normalizeLuma(255)).toBe(1);
    expect(normalizeLuma(127.5)).toBeCloseTo(0.5, 5);
  });

  it("clamps out-of-range input", () => {
    expect(normalizeLuma(-10)).toBe(0);
    expect(normalizeLuma(300)).toBe(1);
  });

  it("returns 0 for non-finite input rather than NaN", () => {
    expect(normalizeLuma(NaN)).toBe(0);
    expect(normalizeLuma(Infinity)).toBe(1);
  });
});

describe("classifyLighting", () => {
  it("returns 'none' when there is no baseline", () => {
    expect(classifyLighting(0.5, null)).toBe("none");
  });

  it("returns 'matched' within the matched tolerance", () => {
    expect(classifyLighting(0.5, 0.5)).toBe("matched");
    expect(classifyLighting(0.5 + LIGHTING_TOLERANCE.matched, 0.5)).toBe("matched");
  });

  it("returns 'close' between matched and close tolerance", () => {
    expect(classifyLighting(0.5 + 0.12, 0.5)).toBe("close");
    expect(classifyLighting(0.5 - 0.12, 0.5)).toBe("close");
  });

  it("returns 'off' beyond the close tolerance", () => {
    expect(classifyLighting(0.5 + 0.3, 0.5)).toBe("off");
    expect(classifyLighting(0.1, 0.9)).toBe("off");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest services/lightingService.test.ts --watchAll=false`
Expected: FAIL — "Cannot find module './lightingService'".

- [ ] **Step 3: Write minimal implementation**

Create `services/lightingService.ts`:

```ts
/** Δ tolerance (in normalized 0–1 luminance) around the baseline. */
export const LIGHTING_TOLERANCE = { matched: 0.08, close: 0.18 } as const;

export type LightingState = "matched" | "close" | "off" | "none";

/** Clamp a 0–255 mean luma onto 0–1. Non-finite input degrades to a clamped bound. */
export function normalizeLuma(mean0to255: number): number {
  if (Number.isNaN(mean0to255)) return 0;
  if (mean0to255 <= 0) return 0;
  if (mean0to255 >= 255) return 1;
  return mean0to255 / 255;
}

/** Map current-vs-baseline luminance to an indicator state. */
export function classifyLighting(
  current: number,
  baseline: number | null
): LightingState {
  if (baseline === null || !Number.isFinite(baseline)) return "none";
  const delta = Math.abs(current - baseline);
  if (delta <= LIGHTING_TOLERANCE.matched) return "matched";
  if (delta <= LIGHTING_TOLERANCE.close) return "close";
  return "off";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest services/lightingService.test.ts --watchAll=false`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add services/lightingService.ts services/lightingService.test.ts
git commit -m "feat: add luminance normalization and lighting classification"
```

---

### Task 3: Compute mean luma from a Y-plane byte buffer (pure)

**Files:**
- Modify: `services/lightingService.ts`
- Modify: `services/lightingService.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type LumaSampleRegion = { x: number; y: number; width: number; height: number }` — all values normalized 0–1 (fractions of frame width/height).
  - `DEFAULT_BG_REGIONS: LumaSampleRegion[]` — two top-corner background bands (top-left and top-right), each outside the centered silhouette.
  - `meanLumaFromYPlane(y: Uint8Array, width: number, height: number, bytesPerRow: number, regions: LumaSampleRegion[]): number` — averages Y bytes across the given regions and returns a 0–255 mean. Returns `0` if no valid samples.

**Context:** For a `yuv` frame, `frame.toArrayBuffer()` gives a buffer whose first `bytesPerRow * height` bytes are the full-resolution luma (Y) plane; byte at pixel `(px, py)` is `y[py * bytesPerRow + px]`. `bytesPerRow` may exceed `width` due to row padding — hence it is a separate parameter. This function is layout-agnostic and fully testable with a synthetic buffer; the on-device plane offsets are confirmed in Task 8.

- [ ] **Step 1: Write the failing test**

Append to `services/lightingService.test.ts`:

```ts
import {
  meanLumaFromYPlane,
  DEFAULT_BG_REGIONS,
  type LumaSampleRegion,
} from "./lightingService";

describe("meanLumaFromYPlane", () => {
  // 4x4 frame, no row padding (bytesPerRow === width).
  const makeFrame = (value: number) => new Uint8Array(16).fill(value);

  it("averages a uniform plane to that value", () => {
    const full: LumaSampleRegion[] = [{ x: 0, y: 0, width: 1, height: 1 }];
    expect(meanLumaFromYPlane(makeFrame(200), 4, 4, 4, full)).toBeCloseTo(200, 5);
  });

  it("samples only the requested region", () => {
    // Left half = 0, right half = 100.
    const y = new Uint8Array(16);
    for (let row = 0; row < 4; row++) {
      y[row * 4 + 2] = 100;
      y[row * 4 + 3] = 100;
    }
    const rightHalf: LumaSampleRegion[] = [{ x: 0.5, y: 0, width: 0.5, height: 1 }];
    expect(meanLumaFromYPlane(y, 4, 4, 4, rightHalf)).toBeCloseTo(100, 5);
  });

  it("respects bytesPerRow padding", () => {
    // width 2, height 2, but each row is padded to 4 bytes. Real pixels = 50.
    const y = new Uint8Array([50, 50, 9, 9, 50, 50, 9, 9]);
    const full: LumaSampleRegion[] = [{ x: 0, y: 0, width: 1, height: 1 }];
    expect(meanLumaFromYPlane(y, 2, 2, 4, full)).toBeCloseTo(50, 5);
  });

  it("returns 0 when regions select no pixels", () => {
    const empty: LumaSampleRegion[] = [{ x: 0, y: 0, width: 0, height: 0 }];
    expect(meanLumaFromYPlane(makeFrame(200), 4, 4, 4, empty)).toBe(0);
  });

  it("exposes two default background regions", () => {
    expect(DEFAULT_BG_REGIONS).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest services/lightingService.test.ts --watchAll=false`
Expected: FAIL — `meanLumaFromYPlane` / `DEFAULT_BG_REGIONS` not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `services/lightingService.ts`:

```ts
export type LumaSampleRegion = {
  /** All values are fractions of frame dimensions, 0–1. */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Two top-corner background bands, chosen to fall OUTSIDE the centered torso
 * silhouette so shirt/skin color does not skew the reading.
 */
export const DEFAULT_BG_REGIONS: LumaSampleRegion[] = [
  { x: 0.0, y: 0.0, width: 0.22, height: 0.25 }, // top-left
  { x: 0.78, y: 0.0, width: 0.22, height: 0.25 }, // top-right
];

/** Average Y-plane bytes across the given normalized regions → 0–255 mean. */
export function meanLumaFromYPlane(
  y: Uint8Array,
  width: number,
  height: number,
  bytesPerRow: number,
  regions: LumaSampleRegion[]
): number {
  let sum = 0;
  let count = 0;
  for (const r of regions) {
    const x0 = Math.max(0, Math.floor(r.x * width));
    const y0 = Math.max(0, Math.floor(r.y * height));
    const x1 = Math.min(width, Math.floor((r.x + r.width) * width));
    const y1 = Math.min(height, Math.floor((r.y + r.height) * height));
    for (let py = y0; py < y1; py++) {
      const rowStart = py * bytesPerRow;
      for (let px = x0; px < x1; px++) {
        sum += y[rowStart + px];
        count++;
      }
    }
  }
  return count === 0 ? 0 : sum / count;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest services/lightingService.test.ts --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/lightingService.ts services/lightingService.test.ts
git commit -m "feat: compute mean luma from Y-plane background regions"
```

---

### Task 4: Per-pose baseline resolution + recalibration store

**Files:**
- Create: `services/lightingBaselineStore.ts`
- Test: `services/lightingBaselineStore.test.ts`
- Modify: `services/lightingService.ts` (add `resolveBaseline`)
- Modify: `services/lightingService.test.ts`

**Interfaces:**
- Consumes: `Photo` (Task 1), `PhotoType` (`@/enums/Photos`).
- Produces:
  - `resolveBaseline(photos: Photo[], type: PhotoType, override: number | null): number | null` — returns `override` if non-null; else the `luminance` of the earliest-dated photo of `type` that has a numeric `luminance`; else `null`.
  - `LightingBaselineStore.getOverride(type): Promise<number | null>`
  - `LightingBaselineStore.setOverride(type, value): Promise<void>`

- [ ] **Step 1: Write the failing test for resolveBaseline**

Append to `services/lightingService.test.ts`:

```ts
import { resolveBaseline } from "./lightingService";
import { PhotoType } from "@/enums/Photos";
import type { Photo } from "./photoStorage";

const p = (date: string, type: PhotoType, luminance?: number): Photo => ({
  id: date, uri: "x", date, type, luminance,
});

describe("resolveBaseline", () => {
  it("returns the override when provided", () => {
    expect(resolveBaseline([], PhotoType.front, 0.42)).toBe(0.42);
  });

  it("returns null when no override and no photo has luminance", () => {
    const photos = [p("2026-01-01", PhotoType.front)];
    expect(resolveBaseline(photos, PhotoType.front, null)).toBeNull();
  });

  it("returns the earliest luminance for the matching pose", () => {
    const photos = [
      p("2026-03-01", PhotoType.front, 0.6),
      p("2026-01-01", PhotoType.front, 0.5), // earliest front with luminance
      p("2026-02-01", PhotoType.side, 0.9),
    ];
    expect(resolveBaseline(photos, PhotoType.front, null)).toBe(0.5);
  });

  it("ignores photos of other poses", () => {
    const photos = [p("2026-01-01", PhotoType.side, 0.9)];
    expect(resolveBaseline(photos, PhotoType.front, null)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest services/lightingService.test.ts --watchAll=false`
Expected: FAIL — `resolveBaseline` not exported.

- [ ] **Step 3: Implement resolveBaseline**

Append to `services/lightingService.ts`:

```ts
import type { Photo } from "./photoStorage";
import type { PhotoType } from "@/enums/Photos";

/** Baseline luminance for a pose: manual override, else earliest photo with luminance, else null. */
export function resolveBaseline(
  photos: Photo[],
  type: PhotoType,
  override: number | null
): number | null {
  if (override !== null && Number.isFinite(override)) return override;
  const withLuma = photos
    .filter((ph) => ph.type === type && typeof ph.luminance === "number")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return withLuma.length > 0 ? (withLuma[0].luminance as number) : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest services/lightingService.test.ts --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Write the failing test for the override store**

Create `services/lightingBaselineStore.test.ts` (mirrors the AsyncStorage mock style in `services/streakService.test.ts`):

```ts
import { LightingBaselineStore } from "./lightingBaselineStore";
import { PhotoType } from "@/enums/Photos";

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
  getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
}));

describe("LightingBaselineStore", () => {
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

  it("returns null when no override is stored", async () => {
    expect(await LightingBaselineStore.getOverride(PhotoType.front)).toBeNull();
  });

  it("persists and reads back a per-pose override", async () => {
    await LightingBaselineStore.setOverride(PhotoType.side, 0.37);
    expect(await LightingBaselineStore.getOverride(PhotoType.side)).toBeCloseTo(0.37, 5);
    expect(await LightingBaselineStore.getOverride(PhotoType.front)).toBeNull();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx jest services/lightingBaselineStore.test.ts --watchAll=false`
Expected: FAIL — "Cannot find module './lightingBaselineStore'".

- [ ] **Step 7: Implement the override store**

Create `services/lightingBaselineStore.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PhotoType } from "@/enums/Photos";

const keyFor = (type: PhotoType) => `lighting.baseline.override.${type}`;

export const LightingBaselineStore = {
  async getOverride(type: PhotoType): Promise<number | null> {
    const raw = await AsyncStorage.getItem(keyFor(type));
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  },

  async setOverride(type: PhotoType, value: number): Promise<void> {
    await AsyncStorage.setItem(keyFor(type), String(value));
  },
};
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest services/lightingBaselineStore.test.ts --watchAll=false`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add services/lightingService.ts services/lightingService.test.ts services/lightingBaselineStore.ts services/lightingBaselineStore.test.ts
git commit -m "feat: resolve per-pose lighting baseline with recalibration override"
```

---

### Task 5: LightingIndicator UI component

**Files:**
- Create: `components/camera/LightingIndicator.tsx`
- Test: `components/camera/LightingIndicator.test.tsx`
- Modify: `localization/translations.ts` (add lighting strings)

**Interfaces:**
- Consumes: `LightingState` (Task 2), `useTheme`, `useLocalization`, `Colors`.
- Produces: `<LightingIndicator state={LightingState} onRecalibrate={() => void} />` — renders a dot + localized label; shows a recalibrate affordance only when `state !== "none"`.

**Context:** Match existing camera-control styling (mono font labels via `fontFamily.mono`, `Colors[scheme]`, `withOpacity`). The project has NO `@testing-library/react-native` — follow the `StreakBadge.test.tsx` pattern exactly: `react-test-renderer` (`create`, `act`) with `@expo/vector-icons`, `ThemeContext`, and `LocalizationContext` mocked. `theme.success` / `theme.warning` / `theme.error` all exist in `constants/Colors.ts` — use them directly.

- [ ] **Step 1: Add localization strings**

In `localization/translations.ts`, add under the `camera` section for each supported language (English shown; mirror existing keys for other locales already present in the file):

```ts
// within camera: { ... }
lightingMatched: "Lighting matched",
lightingClose: "Lighting close",
lightingOff: "Lighting off",
lightingNone: "This shot sets your baseline",
recalibrateLighting: "Set as baseline",
```

- [ ] **Step 2: Write the failing test**

Create `components/camera/LightingIndicator.test.tsx` (mirrors `StreakBadge.test.tsx` — `react-test-renderer`, mocked contexts/icons, `t` echoes keys so text is assertable):

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import { LightingIndicator } from "./LightingIndicator";

jest.mock("@expo/vector-icons", () => ({ Ionicons: (_p: any) => null }));
jest.mock("@/context/ThemeContext", () => ({
  useTheme: () => ({ effectiveColorScheme: "dark" }),
}));
jest.mock("@/context/LocalizationContext", () => ({
  useLocalization: () => ({ t: (k: string) => k }), // echo keys
}));

/** Collect all rendered Text string children into a flat array. */
const texts = (root: any): string[] =>
  root
    .findAllByType(Text)
    .flatMap((n: any) => (Array.isArray(n.props.children) ? n.props.children : [n.props.children]))
    .filter((c: any) => typeof c === "string");

describe("LightingIndicator", () => {
  it("shows the matched label when state is matched", () => {
    let tree: any;
    act(() => { tree = create(<LightingIndicator state="matched" onRecalibrate={() => {}} />); });
    expect(texts(tree.root)).toContain("camera.lightingMatched");
  });

  it("shows the baseline-seeding label and no recalibrate when state is none", () => {
    let tree: any;
    act(() => { tree = create(<LightingIndicator state="none" onRecalibrate={() => {}} />); });
    const labels = texts(tree.root);
    expect(labels).toContain("camera.lightingNone");
    expect(labels).not.toContain("camera.recalibrateLighting");
  });

  it("offers recalibrate when a baseline exists", () => {
    let tree: any;
    act(() => { tree = create(<LightingIndicator state="off" onRecalibrate={() => {}} />); });
    expect(texts(tree.root)).toContain("camera.recalibrateLighting");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest components/camera/LightingIndicator.test.tsx --watchAll=false`
Expected: FAIL — "Cannot find module './LightingIndicator'".

- [ ] **Step 4: Implement the component**

Create `components/camera/LightingIndicator.tsx`:

```tsx
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors, { withOpacity, overlayOpacity } from "@/constants/Colors";
import { spacing, borderRadius, fontFamily, typography } from "@/constants/DesignSystem";
import { useTheme } from "@/context/ThemeContext";
import { useLocalization } from "@/context/LocalizationContext";
import type { LightingState } from "@/services/lightingService";

interface Props {
  state: LightingState;
  onRecalibrate: () => void;
}

const LABEL_KEY: Record<LightingState, string> = {
  matched: "camera.lightingMatched",
  close: "camera.lightingClose",
  off: "camera.lightingOff",
  none: "camera.lightingNone",
};

export const LightingIndicator: React.FC<Props> = ({ state, onRecalibrate }) => {
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();

  const dotColor =
    state === "matched" ? theme.success
    : state === "close" ? theme.warning
    : state === "off" ? theme.error
    : theme.secondary;

  return (
    <View style={[styles.container, { backgroundColor: withOpacity("#000000", overlayOpacity.heavy) }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: "#fff", fontFamily: fontFamily.mono }]} numberOfLines={1}>
        {t(LABEL_KEY[state])}
      </Text>
      {state !== "none" && (
        <TouchableOpacity onPress={onRecalibrate} hitSlop={8}>
          <Text style={[styles.action, { color: theme.primary, fontFamily: fontFamily.mono }]}>
            {t("camera.recalibrateLighting")}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    gap: spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...typography.small, letterSpacing: 0.3 },
  action: { ...typography.small, fontWeight: "700", textDecorationLine: "underline" },
});
```

(`theme.success`, `theme.warning`, `theme.error` are confirmed to exist in `constants/Colors.ts` — sage/gold/brick.)

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest components/camera/LightingIndicator.test.tsx --watchAll=false`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/camera/LightingIndicator.tsx components/camera/LightingIndicator.test.tsx localization/translations.ts
git commit -m "feat: add LightingIndicator component and strings"
```

---

### Task 6: Install vision-camera V5 and configure the Expo plugin

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `app.json` (plugins, camera permissions)

**Interfaces:**
- Consumes: nothing.
- Produces: buildable native project with vision-camera available. No JS import changes yet.

**Context:** vision-camera V5 uses Nitro modules and a dedicated worklets package. `react-native-worklets` 0.10.0 is already present. This task changes native config only; the camera screen is still on `expo-camera` after it, so the app must still build and run.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npx expo install react-native-vision-camera react-native-vision-camera-worklets react-native-nitro-modules
```
Expected: packages added to `package.json`. If `expo install` cannot resolve a version, pin `react-native-vision-camera@^5.1.0` and let its peer deps drive the nitro/worklets versions.

- [ ] **Step 2: Configure the config plugin and permissions in `app.json`**

Add the vision-camera plugin (keep `expo-camera` for now so nothing breaks mid-migration) with permission copy:

```jsonc
"plugins": [
  "expo-camera",
  [
    "react-native-vision-camera",
    {
      "cameraPermissionText": "Fit Snapshot uses the camera to take your progress photos.",
      "enableCodeScanner": false
    }
  ]
]
```

- [ ] **Step 3: Prebuild / rebuild the dev client**

Run:
```bash
npx expo prebuild --clean
```
Then rebuild the dev client for your target (e.g. `npx expo run:android` or `npx expo run:ios`).
Expected: native build succeeds; app launches; existing `expo-camera` screen still works.

- [ ] **Step 4: Verify the JS types resolve**

Run: `npx tsc --noEmit`
Expected: PASS. (`import { Camera } from "react-native-vision-camera"` resolves even though not yet used.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore: add react-native-vision-camera V5 and config plugin"
```

---

### Task 7: Build the luminance frame-processor hook

**Files:**
- Create: `hooks/useLightingIndicator.ts`

**Interfaces:**
- Consumes: `meanLumaFromYPlane`, `normalizeLuma`, `classifyLighting`, `resolveBaseline`, `DEFAULT_BG_REGIONS` (Tasks 2–4), vision-camera `useFrameProcessor` + `useSharedValue`, `Worklets.createRunOnJS`.
- Produces:
  - `useLightingIndicator({ photos, type, override }): { frameProcessor, state, currentLuma }` where `state: LightingState` and `currentLuma` is a React state number (last normalized reading). `frameProcessor` is passed to `<Camera frameProcessor={...} />`. `currentLuma` is read at capture time to persist on the new photo.

**Context:** The frame processor runs on the worklet thread at ~5 Hz (`runAtTargetFps(5, ...)`). It reads the Y plane via `frame.toArrayBuffer()`, computes the mean over `DEFAULT_BG_REGIONS`, normalizes, and pushes the value to JS via a `Worklets.createRunOnJS` callback that calls `setState`. Baseline resolution and classification happen on the JS side (cheap, and keeps the worklet minimal). This hook cannot be unit-tested without a device (worklet + native frame); it is verified in Task 8. Keep ALL non-trivial math in the Task 2–4 pure functions — this hook only wires them.

> **⚠️ WORKLET-SAFETY (flagged by the foundation review — do this or the app throws at runtime on-device).** `meanLumaFromYPlane` and `normalizeLuma` are called *inside* the frame-processor worklet. Under `react-native-worklets`, a plain module function invoked from a worklet must itself be a worklet, or it throws at runtime. Before wiring, add `'worklet';` as the FIRST statement inside the bodies of `meanLumaFromYPlane` and `normalizeLuma` in `services/lightingService.ts` (their bodies are already worklet-friendly — no closures, no unsupported APIs, so only the directive is needed). The directive is a no-op string literal under `jest-expo`, so re-run `npx jest services/lightingService.test.ts --watchAll=false` afterward and confirm all tests still pass (should be unchanged). `classifyLighting` and `resolveBaseline` run on the JS side and do NOT need the directive. Commit this directive change together with the hook.

- [ ] **Step 1: Implement the hook**

Create `hooks/useLightingIndicator.ts`:

```ts
import { useMemo, useState } from "react";
import { useFrameProcessor } from "react-native-vision-camera";
import { Worklets } from "react-native-worklets";
import {
  meanLumaFromYPlane,
  normalizeLuma,
  classifyLighting,
  resolveBaseline,
  DEFAULT_BG_REGIONS,
  type LightingState,
} from "@/services/lightingService";
import type { Photo } from "@/services/photoStorage";
import type { PhotoType } from "@/enums/Photos";

interface Params {
  photos: Photo[];
  type: PhotoType;
  override: number | null;
}

export function useLightingIndicator({ photos, type, override }: Params) {
  const [currentLuma, setCurrentLuma] = useState(0);

  const baseline = useMemo(
    () => resolveBaseline(photos, type, override),
    [photos, type, override]
  );

  const state: LightingState = useMemo(
    () => classifyLighting(currentLuma, baseline),
    [currentLuma, baseline]
  );

  const pushLuma = useMemo(() => Worklets.createRunOnJS(setCurrentLuma), []);

  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      // ~5 Hz to protect battery/thermals.
      // NOTE: for a 'yuv' frame, the first bytesPerRow*height bytes are the Y plane.
      const buffer = frame.toArrayBuffer();
      const y = new Uint8Array(buffer);
      const mean = meanLumaFromYPlane(
        y,
        frame.width,
        frame.height,
        frame.bytesPerRow,
        DEFAULT_BG_REGIONS
      );
      pushLuma(normalizeLuma(mean));
    },
    [pushLuma]
  );

  return { frameProcessor, state, currentLuma };
}
```

Note: wrap the body in vision-camera's `runAtTargetFps(5, () => { ... })` in Task 8 once you confirm the import path on the installed version (`import { runAtTargetFps } from "react-native-vision-camera"`). Left out here to keep this step to one action; it is a one-line wrap added during device verification.

- [ ] **Step 2: Verify types resolve**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add hooks/useLightingIndicator.ts
git commit -m "feat: add luminance frame-processor hook"
```

---

### Task 8: Migrate the camera screen to vision-camera and wire the indicator

**Files:**
- Modify: `app/(tabs)/camera.tsx` (full camera migration)

**Interfaces:**
- Consumes: `useLightingIndicator` (Task 7), `LightingIndicator` (Task 5), `LightingBaselineStore` (Task 4), vision-camera `Camera`/`useCameraDevice`/`useCameraPermission`.
- Produces: working camera that shows the live indicator and stores `luminance` on captured photos.

**Context:** This is the one task requiring a device/dev build. It replaces `expo-camera`'s `CameraView`, `useCameraPermissions`, and `takePictureAsync` with the vision-camera equivalents while preserving ALL existing behavior: front/back toggle, zoom, flash, `TorsoSilhouette` overlay, post-capture flip via `expo-image-manipulator`, imported-photo date handling, and the paywall/`canAddPhoto` gate. Read the current `app/(tabs)/camera.tsx` in full before editing.

- [ ] **Step 1: Read the current camera implementation**

Read `app/(tabs)/camera.tsx` completely and list every behavior to preserve (permission flow, capture, flip, zoom gesture, flash state, overlay switching, `addPhoto` call shape, imported date). Confirm the exact `Photo` object built at capture so you can add `luminance`.

- [ ] **Step 2: Replace the camera component and permission flow**

Swap imports and the camera element:
- `import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";`
- Device: `const device = useCameraDevice(facing);` (`facing` maps `"back"`/`"front"`).
- Permission: `const { hasPermission, requestPermission } = useCameraPermission();`
- Render `<Camera ref={cameraRef} device={device} isActive={isFocused} photo={true} pixelFormat="yuv" frameProcessor={frameProcessor} zoom={zoom} torch={flash === "on" ? "on" : "off"} style={...} />`.

Wire the hook:
```ts
const { frameProcessor, state, currentLuma } = useLightingIndicator({
  photos, type: overlay, override,
});
```
where `photos` comes from `usePhotos()` and `override` is loaded per-pose via `LightingBaselineStore.getOverride(overlay)` in an effect keyed on `overlay`.

Add `runAtTargetFps(5, () => { ... })` around the frame-processor body in `hooks/useLightingIndicator.ts` now that the install is confirmed.

- [ ] **Step 3: Port capture to vision-camera and persist luminance**

Replace `takePictureAsync` with:
```ts
const photo = await cameraRef.current.takePhoto({ flash });
let uri = `file://${photo.path}`;
// preserve existing front-camera mirror flip via expo-image-manipulator
```
Build the saved photo object exactly as today, plus:
```ts
await addPhoto({ id, uri, date, type: overlay, luminance: currentLuma });
```

- [ ] **Step 4: Render the indicator and recalibrate**

Place `<LightingIndicator state={state} onRecalibrate={handleRecalibrate} />` over the preview (e.g. just above the bottom control bar). Implement:
```ts
const handleRecalibrate = async () => {
  await LightingBaselineStore.setOverride(overlay, currentLuma);
  setOverride(currentLuma); // triggers baseline re-resolution
};
```

- [ ] **Step 5: Device verification — confirm the Y-plane layout**

On a dev build, open the camera and cover/uncover the lens and dim/brighten the room. Confirm:
- Indicator goes 🔴 dark → 🟢 as lighting matches the seeded baseline.
- Temporarily `console.log` `frame.width`, `frame.height`, `frame.bytesPerRow`, and the first few `y[]` values to confirm the Y plane is at buffer offset 0 and `bytesPerRow >= width`. If a device pads or orders planes differently, adjust the offset passed to `meanLumaFromYPlane` (still via the pure function — do not inline math).
- Take a photo of each pose; reopen and confirm the first shot seeded the baseline and subsequent shots classify against it.
- Confirm capture, flip, zoom, flash, overlay, and imported-date flow all still work.

- [ ] **Step 6: Full test + type check**

Run: `npx jest --watchAll=false && npx tsc --noEmit`
Expected: all unit tests PASS, no type errors.

- [ ] **Step 7: Commit**

```bash
git add app/(tabs)/camera.tsx hooks/useLightingIndicator.ts
git commit -m "feat: migrate camera to vision-camera with live lighting indicator"
```

---

### Task 9: Remove expo-camera (cleanup)

**Files:**
- Modify: `app.json` (drop `expo-camera` plugin)
- Modify: `package.json` (remove `expo-camera` if no other importers)

**Interfaces:**
- Consumes: nothing.
- Produces: leaner dependency set; single camera library.

- [ ] **Step 1: Confirm no remaining expo-camera importers**

Run: `npx grep -r "expo-camera" app components services hooks` (or use the editor search).
Expected: zero matches outside comments. If any remain, migrate or stop and report.

- [ ] **Step 2: Remove the plugin and dependency**

Remove `"expo-camera"` from `app.json` plugins and from `package.json` dependencies. Then:
```bash
npx expo prebuild --clean
```
Rebuild the dev client. Confirm the camera still works.

- [ ] **Step 3: Full verification**

Run: `npx jest --watchAll=false && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app.json package.json package-lock.json
git commit -m "chore: remove expo-camera after vision-camera migration"
```

---

## Notes for the implementer

- Tasks 1–5 and 7 are pure/JS and can be completed on any machine. Tasks 6, 8, 9 require the dev build and a physical device (camera + frame processor do not work in a simulator's fake camera reliably; use a real device).
- `theme.success`/`theme.warning`/`theme.error` exist (sage/gold/brick). Do not invent new color tokens.
- Keep every non-trivial computation in the Task 2–4 pure functions so it stays unit-tested; the hook and screen only wire things together.
