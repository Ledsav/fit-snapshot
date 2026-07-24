# Camera & Import Alignment Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user align a new photo to a guide — either the app's generic silhouette or their own first photo of that pose at very low opacity ("ghost mode") — both live in the camera viewfinder and while cropping a gallery-imported photo.

**Architecture:** A new shared `AlignmentOverlay` component replaces the flat `TorsoSilhouette` wherever a guide is shown, picking between the generic silhouette and a low-opacity photo based on a persisted `ghostModeEnabled` flag. A new shared route (`app/photo-crop.tsx`) replaces both `camera.tsx`'s and `gallery.tsx`'s native `allowsEditing: true` picker crop with a custom pinch/pan crop stage that draws the same overlay on top, since the OS-native cropper can't be overlaid. Because expo-router can't return a value from a pushed screen, a tiny in-memory resolver registry (`pendingCropStore.ts`) lets each caller register what to do with the cropped result before pushing.

**Tech Stack:** React Native (Expo 57), expo-router, expo-image-picker, expo-image-manipulator, react-native-gesture-handler + react-native-reanimated (already project dependencies, no new packages), Jest + react-test-renderer (existing test harness).

## Global Constraints

- No new npm dependencies — `expo-image-manipulator`, `react-native-gesture-handler`, `react-native-reanimated` are already installed and already used elsewhere in this codebase (`camera.tsx`, `SyncedZoomPair.tsx`).
- Match existing code style: no comments explaining *what* code does, only non-obvious *why*; reuse existing design tokens (`spacing`, `borderRadius`, `overlayOpacity`, `fontFamily`) instead of hardcoded values; reuse the existing `Button`/`Ionicons` UI conventions from `camera.tsx`.
- All 5 locales (`en`, `es`, `it`, `de`, `fr` in `localization/translations.ts`) must implement every key in the `TranslationKeys` interface, or `npx tsc --noEmit` fails.
- Automated tests only for pure/presentational modules that match existing tested precedents (`services/lightingBaselineStore.ts` → `services/lightingBaselineStore.test.ts`, `components/home/ContactSheetFrame.tsx` → `.test.tsx`). Gesture-handler/reanimated components and full-screen RN screens have no existing test-harness precedent (`SyncedZoomPair.tsx` has none) — those are verified via `npx tsc --noEmit` plus manual QA, not automated tests.
- Run `npx jest <path> --watchAll=false` for one-shot test runs (the `npm test` script uses `--watchAll`, which will hang in this environment).

---

### Task 1: Add `camera.cropHint` translation key

**Files:**
- Modify: `localization/translations.ts:29-50` (interface), `:329-350` (en), `:656-677` (es), `:984-1006` (it), `:1311-1333` (de), `:1640-1662` (fr)

**Interfaces:**
- Produces: `t("camera.cropHint")`, usable by any component via the existing `useLocalization()` hook.

- [ ] **Step 1: Add the key to the `TranslationKeys` interface**

In `localization/translations.ts`, inside the `camera: { ... }` block of the top `interface TranslationKeys` (around line 49), change:

```ts
    lightingNone: string;
    recalibrateLighting: string;
  };
```

to:

```ts
    lightingNone: string;
    recalibrateLighting: string;
    cropHint: string;
  };
```

- [ ] **Step 2: Add the English value**

In the `en:` locale block (around line 349), change:

```ts
      lightingNone: "This shot sets your baseline",
      recalibrateLighting: "Set as baseline",
    },
```

to:

```ts
      lightingNone: "This shot sets your baseline",
      recalibrateLighting: "Set as baseline",
      cropHint: "Pinch and drag to align with the guide, then confirm",
    },
```

- [ ] **Step 3: Add the Spanish value**

In the `es:` locale block (around line 676), change:

```ts
      lightingNone: "Esta foto establece tu referencia",
      recalibrateLighting: "Establecer como referencia",
    },
```

to:

```ts
      lightingNone: "Esta foto establece tu referencia",
      recalibrateLighting: "Establecer como referencia",
      cropHint: "Pellizca y arrastra para alinear con la guía y luego confirma",
    },
```

- [ ] **Step 4: Add the Italian value**

In the `it:` locale block (around line 1005), change:

```ts
      lightingNone: "Questo scatto imposta la tua base di riferimento",
      recalibrateLighting: "Imposta come riferimento",
    },
```

to:

```ts
      lightingNone: "Questo scatto imposta la tua base di riferimento",
      recalibrateLighting: "Imposta come riferimento",
      cropHint: "Pizzica e trascina per allineare con la guida, poi conferma",
    },
```

- [ ] **Step 5: Add the German value**

In the `de:` locale block (around line 1332), change:

```ts
      lightingNone: "Diese Aufnahme legt deine Referenz fest",
      recalibrateLighting: "Als Referenz festlegen",
    },
```

to:

```ts
      lightingNone: "Diese Aufnahme legt deine Referenz fest",
      recalibrateLighting: "Als Referenz festlegen",
      cropHint: "Zum Ausrichten an der Führungslinie zoomen und ziehen, dann bestätigen",
    },
```

- [ ] **Step 6: Add the French value**

In the `fr:` locale block (around line 1661), change:

```ts
      lightingNone: "Cette photo définit votre référence",
      recalibrateLighting: "Définir comme référence",
    },
```

to:

```ts
      lightingNone: "Cette photo définit votre référence",
      recalibrateLighting: "Définir comme référence",
      cropHint: "Pincez et faites glisser pour aligner sur le repère, puis confirmez",
    },
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit`
Expected: no errors (this is the only automatic check for translation completeness — a missing key in any locale fails here).

- [ ] **Step 8: Commit**

```bash
git add localization/translations.ts
git commit -m "feat: add camera.cropHint translation key"
```

---

### Task 2: `services/ghostOverlayStore.ts` — persisted ghost-mode flag

**Files:**
- Create: `services/ghostOverlayStore.ts`
- Test: `services/ghostOverlayStore.test.ts`

**Interfaces:**
- Produces: `GhostOverlayStore.getEnabled(): Promise<boolean>`, `GhostOverlayStore.setEnabled(value: boolean): Promise<void>`.

- [ ] **Step 1: Write the failing test**

Create `services/ghostOverlayStore.test.ts`:

```ts
import { GhostOverlayStore } from "./ghostOverlayStore";

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => { store[k] = v; }),
  getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
}));

describe("GhostOverlayStore", () => {
  beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

  it("defaults to false when nothing is stored", async () => {
    expect(await GhostOverlayStore.getEnabled()).toBe(false);
  });

  it("persists and reads back the enabled flag", async () => {
    await GhostOverlayStore.setEnabled(true);
    expect(await GhostOverlayStore.getEnabled()).toBe(true);

    await GhostOverlayStore.setEnabled(false);
    expect(await GhostOverlayStore.getEnabled()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest services/ghostOverlayStore.test.ts --watchAll=false`
Expected: FAIL — `Cannot find module './ghostOverlayStore'`

- [ ] **Step 3: Write the implementation**

Create `services/ghostOverlayStore.ts`:

```ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const GHOST_OVERLAY_ENABLED_KEY = "ghostOverlay.enabled";

export const GhostOverlayStore = {
  async getEnabled(): Promise<boolean> {
    const raw = await AsyncStorage.getItem(GHOST_OVERLAY_ENABLED_KEY);
    return raw === "true";
  },

  async setEnabled(value: boolean): Promise<void> {
    await AsyncStorage.setItem(GHOST_OVERLAY_ENABLED_KEY, value ? "true" : "false");
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest services/ghostOverlayStore.test.ts --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add services/ghostOverlayStore.ts services/ghostOverlayStore.test.ts
git commit -m "feat: add persisted ghost-overlay-enabled store"
```

---

### Task 3: `components/camera/AlignmentOverlay.tsx` — silhouette/ghost-photo overlay

**Files:**
- Create: `components/camera/AlignmentOverlay.tsx`
- Test: `components/camera/AlignmentOverlay.test.tsx`

**Interfaces:**
- Consumes: `Photo` type from `services/photoStorage.ts` (`{ id: string; uri: string; date: string; type: PhotoType; fileName?: string; luminance?: number }`), `PhotoType` from `enums/Photos.ts`, `overlayOpacity` from `constants/Colors.ts` (`overlayOpacity.subtle === 0.15`), default export `TorsoSilhouette` from `images/TorsoSilhouette.js` (props: `{ type: PhotoType }`, renders a full-screen-centered `Image` at hardcoded `opacity: 0.3`).
- Produces: default export `AlignmentOverlay: React.FC<{ type: PhotoType; ghostPhoto?: Photo }>`.

- [ ] **Step 1: Write the failing test**

Create `components/camera/AlignmentOverlay.test.tsx`:

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import AlignmentOverlay from "./AlignmentOverlay";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";

describe("AlignmentOverlay", () => {
  it("falls back to the generic silhouette when no ghost photo is given", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<AlignmentOverlay type={PhotoType.front} />);
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("0.3");
    expect(json).not.toContain("ghost-photo-uri");
  });

  it("renders the ghost photo at low opacity instead of the silhouette when provided", () => {
    const ghostPhoto: Photo = {
      id: "1",
      uri: "file://ghost-photo-uri.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.front,
    };
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(<AlignmentOverlay type={PhotoType.front} ghostPhoto={ghostPhoto} />);
    });
    const json = JSON.stringify(tree!.toJSON());
    expect(json).toContain("file://ghost-photo-uri.jpg");
    expect(json).toContain("0.15");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/camera/AlignmentOverlay.test.tsx --watchAll=false`
Expected: FAIL — `Cannot find module './AlignmentOverlay'`

- [ ] **Step 3: Write the implementation**

Create `components/camera/AlignmentOverlay.tsx`:

```tsx
import { overlayOpacity } from "@/constants/Colors";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import React from "react";
import { Dimensions, Image, View } from "react-native";
import TorsoSilhouette from "@/images/TorsoSilhouette";

const { width, height } = Dimensions.get("window");

interface AlignmentOverlayProps {
  type: PhotoType;
  ghostPhoto?: Photo;
}

// Alignment guide shown over the live camera viewfinder and the import crop
// stage: either the generic body silhouette, or (ghost mode) the user's own
// first photo of this pose at very low opacity, so later shots can be lined
// up against their actual framing instead of a generic shape.
const AlignmentOverlay: React.FC<AlignmentOverlayProps> = ({ type, ghostPhoto }) => {
  if (!ghostPhoto) {
    return <TorsoSilhouette type={type} />;
  }

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={{ uri: ghostPhoto.uri }}
        style={{
          width: width * 0.8,
          height: height * 0.6,
          opacity: overlayOpacity.subtle,
          resizeMode: "contain",
        }}
      />
    </View>
  );
};

export default AlignmentOverlay;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/camera/AlignmentOverlay.test.tsx --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add components/camera/AlignmentOverlay.tsx components/camera/AlignmentOverlay.test.tsx
git commit -m "feat: add AlignmentOverlay (silhouette / ghost-photo guide)"
```

---

### Task 4: Wire ghost mode into the live camera

**Files:**
- Modify: `app/(tabs)/camera.tsx`

**Interfaces:**
- Consumes: `GhostOverlayStore` (Task 2), `AlignmentOverlay` (Task 3), `getPhotosByType(type: PhotoType): Photo[]` (already on `usePhotos()`, sorted ascending by date — `[0]` is the first photo).
- Produces: no new exports; `renderSilhouette()` now shows the ghost photo when enabled.

- [ ] **Step 1: Swap the `TorsoSilhouette` import for `AlignmentOverlay`**

In `app/(tabs)/camera.tsx`, change:

```ts
import TorsoSilhouette from "../../images/TorsoSilhouette";
```

to:

```ts
import AlignmentOverlay from "@/components/camera/AlignmentOverlay";
import { GhostOverlayStore } from "@/services/ghostOverlayStore";
```

- [ ] **Step 2: Add `ghostModeEnabled` state and load it on mount**

Change:

```ts
  const { photos, addPhoto } = usePhotos();
```

to:

```ts
  const { photos, addPhoto, getPhotosByType } = usePhotos();
```

Then, directly after the existing per-pose override-loading `useEffect` (the one that calls `LightingBaselineStore.getOverride`, currently ending around line 105), add:

```ts
  useEffect(() => {
    let cancelled = false;
    GhostOverlayStore.getEnabled().then((value) => {
      if (!cancelled) setGhostModeEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);
```

And add the state declaration next to the other `overlay`/`override` state (near line 61-62):

```ts
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);
```

- [ ] **Step 3: Add the toggle handler**

Next to `handleRecalibrate` (around line 159), add:

```ts
  const toggleGhostMode = () => {
    const next = !ghostModeEnabled;
    setGhostModeEnabled(next);
    GhostOverlayStore.setEnabled(next);
  };
```

- [ ] **Step 4: Update `renderSilhouette()` to pass a ghost photo when enabled**

Change:

```tsx
  const renderSilhouette = () => (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <TorsoSilhouette type={overlay} />
    </View>
  );
```

to:

```tsx
  const renderSilhouette = () => {
    const ghostPhoto = ghostModeEnabled ? getPhotosByType(overlay)[0] : undefined;
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <AlignmentOverlay type={overlay} ghostPhoto={ghostPhoto} />
      </View>
    );
  };
```

- [ ] **Step 5: Add the ghost-mode toggle button next to the pose selector**

Change `renderOverlaySelector()` from:

```tsx
  const renderOverlaySelector = () => (
    <View style={styles.overlaySelector}>
      {["front", "side", "back"].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.overlayButton,
            overlay === type && [
              styles.activeOverlayButton,
              { backgroundColor: theme.primary },
            ],
          ]}
          onPress={() => setOverlay(type as PhotoType)}
        >
          <Text
            style={[
              styles.overlayButtonText,
              preciseType.badgeLabel,
              { color: overlay === type ? theme.background : theme.text },
            ]}
          >
            {t(`camera.${type}`).toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
```

to:

```tsx
  const renderOverlaySelector = () => (
    <View style={styles.overlaySelector}>
      {["front", "side", "back"].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.overlayButton,
            overlay === type && [
              styles.activeOverlayButton,
              { backgroundColor: theme.primary },
            ],
          ]}
          onPress={() => setOverlay(type as PhotoType)}
        >
          <Text
            style={[
              styles.overlayButtonText,
              preciseType.badgeLabel,
              { color: overlay === type ? theme.background : theme.text },
            ]}
          >
            {t(`camera.${type}`).toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[
          styles.overlayButton,
          ghostModeEnabled && [
            styles.activeOverlayButton,
            { backgroundColor: theme.primary },
          ],
        ]}
        onPress={toggleGhostMode}
      >
        <Ionicons
          name={ghostModeEnabled ? "person" : "person-outline"}
          size={16}
          color={ghostModeEnabled ? theme.background : theme.text}
        />
      </TouchableOpacity>
    </View>
  );
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx jest --watchAll=false`
Expected: all existing suites still pass (no test covers `camera.tsx` itself — this screen is verified manually, per the vision-camera native-module constraint noted in `docs/superpowers/plans/2026-07-22-interaction-overhaul-C-composition.md`).

Manual check (device/simulator): open the camera screen, confirm the silhouette still shows by default; tap the new person icon — confirm it highlights and (with at least one existing photo of the selected pose) the silhouette is replaced by that photo at low opacity; toggle off — silhouette returns; restart the app — the toggle's last state persists.

- [ ] **Step 7: Commit**

```bash
git add "app/(tabs)/camera.tsx"
git commit -m "feat: add ghost-mode toggle to camera silhouette"
```

---

### Task 5: `utils/cropMath.ts` — pure crop-region math

**Files:**
- Create: `utils/cropMath.ts`
- Test: `utils/cropMath.test.ts`

**Interfaces:**
- Produces: `computeBaseScale(imageWidth, imageHeight, frameWidth, frameHeight): number`, `computeMaxTranslate(imageWidth, imageHeight, frameWidth, frameHeight, userScale): { maxX: number; maxY: number }`, `computeCropRect(params): CropRect` where `CropRect = { originX: number; originY: number; width: number; height: number }`.
- Consumed by: `components/camera/PhotoCropStage.tsx` (Task 7) and `app/photo-crop.tsx` (Task 8) via the `CropRect` type.

This is the trickiest logic in the feature (mapping a pan/zoom transform back to source-image pixel coordinates), so it's isolated as pure functions with no RN/gesture dependency, fully covered by unit tests.

- [ ] **Step 1: Write the failing tests**

Create `utils/cropMath.test.ts`:

```ts
import { computeBaseScale, computeMaxTranslate, computeCropRect } from "./cropMath";

describe("computeBaseScale", () => {
  it("picks the larger ratio so the image fully covers the frame", () => {
    expect(computeBaseScale(1000, 1000, 300, 400)).toBeCloseTo(0.4, 5);
  });
});

describe("computeMaxTranslate", () => {
  it("returns the pan bounds that keep the frame covered", () => {
    expect(computeMaxTranslate(1000, 1000, 300, 400, 1)).toEqual({ maxX: 50, maxY: 0 });
  });
});

describe("computeCropRect", () => {
  it("crops the centered region at rest (no zoom, no pan)", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 125, originY: 0, width: 750, height: 1000 });
  });

  it("crops a smaller region when zoomed in", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 2,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 313, originY: 250, width: 375, height: 500 });
  });

  it("clamps the origin to 0 when panned past the top-left edge", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 1,
      translateX: 1000,
      translateY: 0,
    });
    expect(rect.originX).toBe(0);
  });

  it("clamps the origin to the max bound when panned past the bottom-right edge", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 1,
      translateX: -1000,
      translateY: 0,
    });
    expect(rect.originX).toBe(250);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest utils/cropMath.test.ts --watchAll=false`
Expected: FAIL — `Cannot find module './cropMath'`

- [ ] **Step 3: Write the implementation**

Create `utils/cropMath.ts`:

```ts
export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

function clampNum(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// The scale at which the image, at its native size, would exactly cover the
// crop frame with no gaps (like resizeMode "cover"). Runs inside gesture
// worklets, so it's marked as one.
export function computeBaseScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
): number {
  "worklet";
  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
}

// Bounds for the pan gesture's translateX/translateY (screen pixels) at a
// given user zoom level, so the frame always stays fully covered by the
// image. Runs inside gesture worklets, so it's marked as one.
export function computeMaxTranslate(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  userScale: number
): { maxX: number; maxY: number } {
  "worklet";
  const scale = computeBaseScale(imageWidth, imageHeight, frameWidth, frameHeight) * userScale;
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;
  return {
    maxX: Math.max(0, (displayedWidth - frameWidth) / 2),
    maxY: Math.max(0, (displayedHeight - frameHeight) / 2),
  };
}

// Maps the crop frame back into original-image pixel coordinates, given the
// user's current zoom (userScale, relative to the cover baseline from
// computeBaseScale) and pan offset (translateX/translateY, in screen
// pixels). Called once on confirm, on the JS thread — not a worklet.
export function computeCropRect(params: {
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  userScale: number;
  translateX: number;
  translateY: number;
}): CropRect {
  const { imageWidth, imageHeight, frameWidth, frameHeight, userScale, translateX, translateY } = params;
  const scale = computeBaseScale(imageWidth, imageHeight, frameWidth, frameHeight) * userScale;
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;

  // Image's on-screen left/top edge, relative to the frame's left/top edge.
  const offsetX = (frameWidth - displayedWidth) / 2 + translateX;
  const offsetY = (frameHeight - displayedHeight) / 2 + translateY;

  const cropWidth = frameWidth / scale;
  const cropHeight = frameHeight / scale;

  const originX = clampNum(-offsetX / scale, 0, imageWidth - cropWidth);
  const originY = clampNum(-offsetY / scale, 0, imageHeight - cropHeight);

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest utils/cropMath.test.ts --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add utils/cropMath.ts utils/cropMath.test.ts
git commit -m "feat: add pure crop-region math for the import crop stage"
```

---

### Task 6: `services/pendingCropStore.ts` — one-shot crop-result callback

**Files:**
- Create: `services/pendingCropStore.ts`
- Test: `services/pendingCropStore.test.ts`

**Interfaces:**
- Produces: `PendingCropResult.setResolver(fn: (uri: string) => void): void`, `PendingCropResult.resolve(uri: string): void`, `PendingCropResult.clear(): void`.
- Consumed by: `camera.tsx` and `gallery.tsx` (Tasks 9-10, register a resolver before pushing) and `app/photo-crop.tsx` (Task 8, calls `resolve`/`clear`).

Not persisted (in-memory module state only) — it only needs to survive the single push/back round trip within one app session.

- [ ] **Step 1: Write the failing test**

Create `services/pendingCropStore.test.ts`:

```ts
import { PendingCropResult } from "./pendingCropStore";

describe("PendingCropResult", () => {
  afterEach(() => {
    PendingCropResult.clear();
  });

  it("does nothing when resolve is called with no resolver registered", () => {
    expect(() => PendingCropResult.resolve("file://x.jpg")).not.toThrow();
  });

  it("invokes the registered resolver exactly once with the given uri", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.resolve("file://cropped.jpg");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("file://cropped.jpg");

    PendingCropResult.resolve("file://again.jpg");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clear() prevents a registered resolver from firing", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.clear();
    PendingCropResult.resolve("file://cropped.jpg");
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest services/pendingCropStore.test.ts --watchAll=false`
Expected: FAIL — `Cannot find module './pendingCropStore'`

- [ ] **Step 3: Write the implementation**

Create `services/pendingCropStore.ts`:

```ts
type CropResolver = (uri: string) => void;

let resolver: CropResolver | null = null;

// Bridges a cropped-photo result back to whichever screen (camera or
// gallery) pushed the shared /photo-crop route, since expo-router has no
// built-in way to return a value from a pushed screen.
export const PendingCropResult = {
  setResolver(fn: CropResolver): void {
    resolver = fn;
  },

  resolve(uri: string): void {
    const fn = resolver;
    resolver = null;
    fn?.(uri);
  },

  clear(): void {
    resolver = null;
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest services/pendingCropStore.test.ts --watchAll=false`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add services/pendingCropStore.ts services/pendingCropStore.test.ts
git commit -m "feat: add pending-crop-result resolver registry"
```

---

### Task 7: `components/camera/PhotoCropStage.tsx` — gesture-driven crop UI

**Files:**
- Create: `components/camera/PhotoCropStage.tsx`

**Interfaces:**
- Consumes: `AlignmentOverlay` (Task 3), `computeBaseScale`/`computeMaxTranslate`/`computeCropRect`/`CropRect` from `utils/cropMath.ts` (Task 5), `Photo` (`services/photoStorage.ts`), `PhotoType` (`enums/Photos.ts`), `spacing`/`borderRadius` (`constants/DesignSystem.ts`), `overlayOpacity`/`withOpacity` (`constants/Colors.ts`), `useTheme()` (`context/ThemeContext.tsx`).
- Produces: named + default export `PhotoCropStage`, a `forwardRef<PhotoCropStageHandle, PhotoCropStageProps>` component. `export interface PhotoCropStageHandle { getCropRect(): CropRect; }`. Props: `{ imageUri: string; imageWidth: number; imageHeight: number; type: PhotoType; ghostPhoto?: Photo }`.
- Consumed by: `app/photo-crop.tsx` (Task 8), which holds a `ref` to call `getCropRect()` from its Confirm button.

No automated test for this file — it's a gesture-handler/reanimated component, and this repo has no test-harness precedent for that combination (`components/progress/SyncedZoomPair.tsx`, built the same way, has none either). Verified via `tsc` plus manual QA in Task 8's verification step.

- [ ] **Step 1: Write the component**

Create `components/camera/PhotoCropStage.tsx`:

```tsx
import AlignmentOverlay from "@/components/camera/AlignmentOverlay";
import Colors, { overlayOpacity, withOpacity } from "@/constants/Colors";
import { borderRadius, spacing } from "@/constants/DesignSystem";
import { useTheme } from "@/context/ThemeContext";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";
import { computeBaseScale, computeCropRect, computeMaxTranslate, CropRect } from "@/utils/cropMath";
import React, { forwardRef, useImperativeHandle } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const FRAME_WIDTH = screenWidth - spacing.xl * 2;
const FRAME_HEIGHT = FRAME_WIDTH * (4 / 3);
const FRAME_LEFT = spacing.xl;
const FRAME_TOP = (screenHeight - FRAME_HEIGHT) / 2;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clampWorklet(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

export interface PhotoCropStageHandle {
  getCropRect: () => CropRect;
}

interface PhotoCropStageProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  type: PhotoType;
  ghostPhoto?: Photo;
}

// Replaces the native OS gallery cropper: the picked photo can be panned and
// pinch-zoomed under a fixed 3:4 frame, with the same silhouette/ghost guide
// the live camera shows drawn on top, so an imported photo can be aligned
// the same way a live shot can.
export const PhotoCropStage = forwardRef<PhotoCropStageHandle, PhotoCropStageProps>(
  ({ imageUri, imageWidth, imageHeight, type, ghostPhoto }, ref) => {
    const { effectiveColorScheme } = useTheme();
    const theme = Colors[effectiveColorScheme];

    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const baseScale = computeBaseScale(imageWidth, imageHeight, FRAME_WIDTH, FRAME_HEIGHT);
    const baseWidth = imageWidth * baseScale;
    const baseHeight = imageHeight * baseScale;

    useImperativeHandle(ref, () => ({
      getCropRect: () =>
        computeCropRect({
          imageWidth,
          imageHeight,
          frameWidth: FRAME_WIDTH,
          frameHeight: FRAME_HEIGHT,
          userScale: scale.value,
          translateX: translateX.value,
          translateY: translateY.value,
        }),
    }));

    const pinchGesture = Gesture.Pinch()
      .onUpdate((event) => {
        scale.value = clampWorklet(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE);
        const { maxX, maxY } = computeMaxTranslate(imageWidth, imageHeight, FRAME_WIDTH, FRAME_HEIGHT, scale.value);
        translateX.value = clampWorklet(translateX.value, -maxX, maxX);
        translateY.value = clampWorklet(translateY.value, -maxY, maxY);
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const panGesture = Gesture.Pan()
      .minDistance(5)
      .onUpdate((event) => {
        const { maxX, maxY } = computeMaxTranslate(imageWidth, imageHeight, FRAME_WIDTH, FRAME_HEIGHT, scale.value);
        translateX.value = clampWorklet(savedTranslateX.value + event.translationX, -maxX, maxX);
        translateY.value = clampWorklet(savedTranslateY.value + event.translationY, -maxY, maxY);
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
      width: baseWidth,
      height: baseHeight,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    const maskColor = withOpacity("#000000", overlayOpacity.heavy);

    return (
      <GestureDetector gesture={composedGesture}>
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.imageCenterer} pointerEvents="none">
            <Animated.Image source={{ uri: imageUri }} style={animatedStyle} resizeMode="cover" />
          </View>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <AlignmentOverlay type={type} ghostPhoto={ghostPhoto} />
          </View>
          <View pointerEvents="none" style={[styles.mask, { top: 0, left: 0, right: 0, height: FRAME_TOP, backgroundColor: maskColor }]} />
          <View pointerEvents="none" style={[styles.mask, { bottom: 0, left: 0, right: 0, height: screenHeight - FRAME_TOP - FRAME_HEIGHT, backgroundColor: maskColor }]} />
          <View pointerEvents="none" style={[styles.mask, { top: FRAME_TOP, left: 0, width: FRAME_LEFT, height: FRAME_HEIGHT, backgroundColor: maskColor }]} />
          <View pointerEvents="none" style={[styles.mask, { top: FRAME_TOP, right: 0, width: screenWidth - FRAME_LEFT - FRAME_WIDTH, height: FRAME_HEIGHT, backgroundColor: maskColor }]} />
          <View
            pointerEvents="none"
            style={[styles.frameBorder, { top: FRAME_TOP, left: FRAME_LEFT, width: FRAME_WIDTH, height: FRAME_HEIGHT, borderColor: theme.primary }]}
          />
        </View>
      </GestureDetector>
    );
  }
);

const styles = StyleSheet.create({
  imageCenterer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  mask: {
    position: "absolute",
  },
  frameBorder: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: borderRadius.sm,
  },
});

export default PhotoCropStage;
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/camera/PhotoCropStage.tsx
git commit -m "feat: add PhotoCropStage gesture-driven crop component"
```

---

### Task 8: `app/photo-crop.tsx` — shared crop screen + route registration

**Files:**
- Create: `app/photo-crop.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `PhotoCropStage`/`PhotoCropStageHandle` (Task 7), `GhostOverlayStore` (Task 2), `PendingCropResult` (Task 6), `getPhotosByType` (`usePhotos()`), `Button` (`components/ui`), `manipulateAsync`/`SaveFormat` (`expo-image-manipulator`), `useLocalSearchParams`/`useRouter` (`expo-router`).
- Route params (all strings, per expo-router convention): `uri`, `width`, `height`, `type` (a `PhotoType` value), `date` (may be empty string).
- Produces: the `/photo-crop` route, pushed by `camera.tsx` (Task 9) and `gallery.tsx` (Task 10).

- [ ] **Step 1: Register the route**

In `app/_layout.tsx`, change:

```tsx
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                    </Stack>
```

to:

```tsx
                    <Stack>
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                      <Stack.Screen
                        name="photo-crop"
                        options={{ presentation: "fullScreenModal", headerShown: false }}
                      />
                    </Stack>
```

- [ ] **Step 2: Write the screen**

Create `app/photo-crop.tsx`:

```tsx
import { PhotoCropStage, PhotoCropStageHandle } from "@/components/camera/PhotoCropStage";
import { Button } from "@/components/ui";
import Colors from "@/constants/Colors";
import { spacing } from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { PhotoType } from "@/enums/Photos";
import { GhostOverlayStore } from "@/services/ghostOverlayStore";
import { PendingCropResult } from "@/services/pendingCropStore";
import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function PhotoCropScreen() {
  const params = useLocalSearchParams<{
    uri: string;
    width: string;
    height: string;
    type: string;
    date?: string;
  }>();
  const router = useRouter();
  const { effectiveColorScheme } = useTheme();
  const theme = Colors[effectiveColorScheme];
  const { t } = useLocalization();
  const { getPhotosByType } = usePhotos();
  const stageRef = useRef<PhotoCropStageHandle>(null);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const type = params.type as PhotoType;
  const imageWidth = Number(params.width);
  const imageHeight = Number(params.height);

  useEffect(() => {
    let cancelled = false;
    GhostOverlayStore.getEnabled().then((value) => {
      if (!cancelled) setGhostModeEnabled(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const ghostPhoto = ghostModeEnabled ? getPhotosByType(type)[0] : undefined;

  const handleCancel = () => {
    PendingCropResult.clear();
    router.back();
  };

  const handleConfirm = async () => {
    if (!stageRef.current || isProcessing) return;
    setIsProcessing(true);
    try {
      const cropRect = stageRef.current.getCropRect();
      const result = await manipulateAsync(
        params.uri,
        [{ crop: cropRect }],
        { format: SaveFormat.JPEG }
      );
      PendingCropResult.resolve(result.uri);
      router.back();
    } catch (error) {
      console.error("Error cropping image:", error);
      router.back();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "black" }]}>
      <PhotoCropStage
        ref={stageRef}
        imageUri={params.uri}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        type={type}
        ghostPhoto={ghostPhoto}
      />
      <View style={styles.footer}>
        <Text style={styles.hint}>{t("camera.cropHint")}</Text>
        <View style={styles.buttonsRow}>
          <Button
            title={t("common.cancel")}
            onPress={handleCancel}
            variant="danger"
            icon={<Ionicons name="close" size={18} color={theme.error} />}
            style={styles.button}
          />
          <Button
            title={t("camera.confirm")}
            onPress={handleConfirm}
            variant="primary"
            loading={isProcessing}
            icon={<Ionicons name="checkmark" size={18} color={theme.onAccent} />}
            style={styles.button}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    alignItems: "center",
  },
  hint: {
    color: "white",
    textAlign: "center",
    marginBottom: spacing.md,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: spacing.md,
    width: "100%",
  },
  button: {
    flex: 1,
  },
});
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/photo-crop.tsx "app/_layout.tsx"
git commit -m "feat: add shared photo-crop screen"
```

---

### Task 9: Wire the camera's import button to the crop screen

**Files:**
- Modify: `app/(tabs)/camera.tsx`

**Interfaces:**
- Consumes: `PendingCropResult` (Task 6), the `/photo-crop` route (Task 8).
- No change to `confirmPicture`/`addPhoto` — the resolver calls the exact same setters `pickImage()` already calls today.

- [ ] **Step 1: Add the `PendingCropResult` import and a router import check**

`camera.tsx` already imports `useRouter` from `expo-router` (used for `router.push("/(tabs)/gallery")` in `confirmPicture`) and `router` is already in scope. Add:

```ts
import { PendingCropResult } from "@/services/pendingCropStore";
```

- [ ] **Step 2: Replace `pickImage()`**

Change:

```ts
  const pickImage = async () => {
    if (isPhotoLimitReached) {
      alert(photoLimitStatus.reason || t("camera.photoLimitReached") || "Photo limit reached. Delete photos or upgrade to Premium.");
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert(t("camera.galleryPermissionDenied") || 'Sorry, we need media library permissions to import images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setIsImported(true);
        setCapturedImage(selectedAsset.uri);

        if (selectedAsset.exif?.DateTimeOriginal) {
          setImportedPhotoDate(selectedAsset.exif.DateTimeOriginal);
        } else {
          setImportedPhotoDate(null);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };
```

to:

```ts
  const pickImage = async () => {
    if (isPhotoLimitReached) {
      alert(photoLimitStatus.reason || t("camera.photoLimitReached") || "Photo limit reached. Delete photos or upgrade to Premium.");
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert(t("camera.galleryPermissionDenied") || 'Sorry, we need media library permissions to import images!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        const exifDate = selectedAsset.exif?.DateTimeOriginal ?? null;

        PendingCropResult.setResolver((croppedUri) => {
          setIsImported(true);
          setCapturedImage(croppedUri);
          setImportedPhotoDate(exifDate);
        });

        router.push({
          pathname: "/photo-crop",
          params: {
            uri: selectedAsset.uri,
            width: String(selectedAsset.width),
            height: String(selectedAsset.height),
            type: overlay,
            date: exifDate ?? "",
          },
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };
```

Note: `allowsEditing: true, aspect: [3, 4]` are dropped — the picker now returns the full, uncropped image, which the crop screen handles.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx jest --watchAll=false`
Expected: all existing suites pass.

Manual check (device/simulator): from the camera screen, tap import, pick a photo — you should land on the full-screen crop stage with the pose silhouette (or ghost photo, if enabled) overlaid, pinch/pan should keep the frame fully covered, Cancel returns to the camera with nothing changed, Confirm lands on the existing retake/confirm review screen with the cropped photo, and confirming there saves it exactly as before.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/camera.tsx"
git commit -m "feat: route camera's gallery import through the crop screen"
```

---

### Task 10: Wire the gallery's import flow to the crop screen

**Files:**
- Modify: `app/(tabs)/gallery.tsx`

**Interfaces:**
- Consumes: `PendingCropResult` (Task 6), the `/photo-crop` route (Task 8).
- No change to the type-selection modal UI, `addPhoto`'s call shape, or the existing date-resolution logic in `pickImage()`/`handleTypeSelection()` — only what happens after a type is chosen changes.

- [ ] **Step 1: Add imports and new state for the picked image's dimensions**

Change:

```ts
import { usePathname } from "expo-router";
```

to:

```ts
import { usePathname, useRouter } from "expo-router";
```

Add the import:

```ts
import { PendingCropResult } from "@/services/pendingCropStore";
```

Change:

```ts
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageDate, setPendingImageDate] = useState<string | null>(null);
```

to:

```ts
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [pendingImageWidth, setPendingImageWidth] = useState<number | null>(null);
  const [pendingImageHeight, setPendingImageHeight] = useState<number | null>(null);
  const [pendingImageDate, setPendingImageDate] = useState<string | null>(null);
```

Add, next to the other hooks near the top of the component body:

```ts
  const router = useRouter();
```

- [ ] **Step 2: Stop native-cropping in `pickImage()` and store the picked dimensions**

Change:

```ts
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setPendingImageUri(selectedAsset.uri);
```

to:

```ts
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedAsset = result.assets[0];
        setPendingImageUri(selectedAsset.uri);
        setPendingImageWidth(selectedAsset.width);
        setPendingImageHeight(selectedAsset.height);
```

- [ ] **Step 3: Replace `handleTypeSelection` to push to the crop screen instead of saving directly**

Change:

```ts
  const handleTypeSelection = async (type: PhotoType) => {
    if (!pendingImageUri) return;

    
    let photoDate = new Date().toISOString();

    if (pendingImageDate) {
      try {
        console.log('Processing pending image date:', pendingImageDate);

        
        if (pendingImageDate.includes('T') && pendingImageDate.includes('Z')) {
          photoDate = pendingImageDate;
          console.log('Using ISO date directly:', photoDate);
        } else {
          
          const dateStr = pendingImageDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            photoDate = parsedDate.toISOString();
            console.log('Parsed EXIF date to:', photoDate);
          } else {
            console.error('Failed to parse date:', dateStr);
          }
        }
      } catch (error) {
        console.error("Error parsing imported photo date:", error);
      }
    } else {
      console.log('No pending image date, using current date');
    }

    const newPhoto = {
      id: Date.now().toString(),
      uri: pendingImageUri,
      date: photoDate,
      type: type,
    };

    await addPhoto(newPhoto);

    
    setPendingImageUri(null);
    setPendingImageDate(null);
    setIsTypeSelectionVisible(false);
  };
```

to:

```ts
  const handleTypeSelection = async (type: PhotoType) => {
    if (!pendingImageUri || !pendingImageWidth || !pendingImageHeight) return;

    
    let photoDate = new Date().toISOString();

    if (pendingImageDate) {
      try {
        console.log('Processing pending image date:', pendingImageDate);

        
        if (pendingImageDate.includes('T') && pendingImageDate.includes('Z')) {
          photoDate = pendingImageDate;
          console.log('Using ISO date directly:', photoDate);
        } else {
          
          const dateStr = pendingImageDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            photoDate = parsedDate.toISOString();
            console.log('Parsed EXIF date to:', photoDate);
          } else {
            console.error('Failed to parse date:', dateStr);
          }
        }
      } catch (error) {
        console.error("Error parsing imported photo date:", error);
      }
    } else {
      console.log('No pending image date, using current date');
    }

    const uri = pendingImageUri;
    const width = pendingImageWidth;
    const height = pendingImageHeight;

    PendingCropResult.setResolver((croppedUri) => {
      addPhoto({
        id: Date.now().toString(),
        uri: croppedUri,
        date: photoDate,
        type,
      });
      setPendingImageUri(null);
      setPendingImageWidth(null);
      setPendingImageHeight(null);
      setPendingImageDate(null);
      setIsTypeSelectionVisible(false);
    });

    router.push({
      pathname: "/photo-crop",
      params: {
        uri,
        width: String(width),
        height: String(height),
        type,
        date: pendingImageDate ?? "",
      },
    });
  };
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx jest --watchAll=false`
Expected: all existing suites pass.

Manual check (device/simulator): from the gallery screen, use "Add Photo", pick an image — the existing type-selection modal (front/side/back) should appear unchanged; after choosing a type, you should land on the crop stage with that type's silhouette/ghost overlay; Cancel returns to the gallery with the type-selection modal dismissed and nothing saved; Confirm crops and saves the photo directly into the gallery under the chosen type (no review screen, matching current behavior), and the photo appears in the gallery grid.

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/gallery.tsx"
git commit -m "feat: route gallery's import through the crop screen"
```

---

### Task 11: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full test suite**

Run: `npx jest --watchAll=false`
Expected: all suites pass, including the 3 new suites from Tasks 2, 3, 5, 6 (`ghostOverlayStore`, `AlignmentOverlay`, `cropMath`, `pendingCropStore`).

- [ ] **Step 3: Manual QA pass on device/simulator**

Covering, per the design spec's testing notes:
- Ghost toggle: on/off from the camera screen, persists across an app restart, falls back to the generic silhouette when no first photo exists yet for the selected pose.
- Import crop from the camera screen: portrait and landscape source photos, pinch/pan stays clamped to the frame, Confirm produces a correctly-cropped 3:4 photo landing on the existing retake/confirm screen, Cancel returns cleanly.
- Import crop from the gallery screen: same as above, but Confirm saves directly (no review step) under the type chosen in the type-selection modal.
- Import crop mirrors the camera's current ghost-mode state, from both entry points.

- [ ] **Step 4: Report**

No commit for this task — if all checks pass, the feature is complete across Tasks 1-10. If manual QA finds an issue, return to the relevant task above rather than patching ad hoc.
