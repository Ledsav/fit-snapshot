# Comparison Save & Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Save + Share for the before/after slider (as a composited split image at the current divider position) and a Share button for the generated GIF.

**Architecture:** A new pure-math module computes the composite's layout; a new off-screen component renders that layout as an SVG (using `react-native-svg`'s built-in `toDataURL` rasterizer — no `react-native-view-shot` needed) and exposes an imperative `export()`; a new shared service wraps the `MediaLibrary`/`expo-sharing` save/share side effects so both the composite and the GIF use identical mechanics; `PhotoMorph.tsx` is extended to wire buttons to all of the above.

**Tech Stack:** React Native (Expo SDK 57), TypeScript, `react-native-svg` (already installed/linked), `expo-image-manipulator`/`expo-file-system`/`expo-media-library` (already installed), `expo-sharing` (new — first-party Expo module, requires one dev-client rebuild), Jest (`jest-expo` preset).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-28-comparison-save-share-design.md`.
- No `react-native-view-shot` — compositing uses `react-native-svg`'s `Svg` ref `toDataURL(callback, options)`.
- Export canvas is fixed at 1080×1440 (photo area) regardless of source photo resolution.
- All exported-image colors are hardcoded (not theme-derived) so a shared/saved image looks the same regardless of theme.
- Save and Share are two separate buttons everywhere in this feature (not one combined share-sheet button) — Android's share sheet doesn't reliably offer a save-to-gallery destination, and this app is Android-only.
- New localization keys must be added to all 5 locales in `localization/translations.ts`: `en`, `es`, `it`, `de`, `fr`.
- The slider stage's *comparison* Save button (two-photo case) is being replaced by the new composite save. The single-photo view's existing Save button (only one photo, no comparison possible) is unrelated and must keep working unchanged.

---

### Task 1: Composite layout math

**Files:**
- Create: `utils/compositeImage.ts`
- Test: `utils/compositeImage.test.ts`

**Interfaces:**
- Produces: `computeCompositeLayout(afterness: number): CompositeLayout`, `COMPOSITE_CANVAS_WIDTH: number`, `COMPOSITE_PHOTO_HEIGHT: number`, `COMPOSITE_CAPTION_HEIGHT: number`, and the type `CompositeLayout { canvasWidth: number; canvasHeight: number; photoHeight: number; captionHeight: number; dividerX: number; beforeClipWidth: number }`. Task 4 consumes this directly.

`afterness` is the same 0–100 "after-ness" value `BeforeAfterSlider`'s `onValueChange` already reports (higher = more of the "after" photo shown, `dividerLeftPct = 100 - afterness`, matching `BeforeAfterSlider.tsx`'s own `dividerLeft` calculation).

- [ ] **Step 1: Write the failing test**

Create `utils/compositeImage.test.ts`:

```ts
import {
  computeCompositeLayout,
  COMPOSITE_CANVAS_WIDTH,
  COMPOSITE_PHOTO_HEIGHT,
  COMPOSITE_CAPTION_HEIGHT,
} from "./compositeImage";

describe("computeCompositeLayout", () => {
  it("splits the canvas evenly at the default 50/50 slider position", () => {
    const layout = computeCompositeLayout(50);
    expect(layout.dividerX).toBe(540);
    expect(layout.beforeClipWidth).toBe(540);
  });

  it("shows the full 'before' photo when afterness is 0", () => {
    const layout = computeCompositeLayout(0);
    expect(layout.dividerX).toBe(COMPOSITE_CANVAS_WIDTH);
  });

  it("shows the full 'after' photo when afterness is 100", () => {
    const layout = computeCompositeLayout(100);
    expect(layout.dividerX).toBe(0);
  });

  it("clamps afterness below 0", () => {
    const layout = computeCompositeLayout(-20);
    expect(layout.dividerX).toBe(COMPOSITE_CANVAS_WIDTH);
  });

  it("clamps afterness above 100", () => {
    const layout = computeCompositeLayout(150);
    expect(layout.dividerX).toBe(0);
  });

  it("always reports the fixed canvas dimensions", () => {
    const layout = computeCompositeLayout(37);
    expect(layout.canvasWidth).toBe(COMPOSITE_CANVAS_WIDTH);
    expect(layout.photoHeight).toBe(COMPOSITE_PHOTO_HEIGHT);
    expect(layout.captionHeight).toBe(COMPOSITE_CAPTION_HEIGHT);
    expect(layout.canvasHeight).toBe(COMPOSITE_PHOTO_HEIGHT + COMPOSITE_CAPTION_HEIGHT);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest utils/compositeImage.test.ts`
Expected: FAIL — `Cannot find module './compositeImage'`

- [ ] **Step 3: Write minimal implementation**

Create `utils/compositeImage.ts`:

```ts
export interface CompositeLayout {
  canvasWidth: number;
  canvasHeight: number;
  photoHeight: number;
  captionHeight: number;
  dividerX: number;
  beforeClipWidth: number;
}

export const COMPOSITE_CANVAS_WIDTH = 1080;
export const COMPOSITE_PHOTO_HEIGHT = 1440;
export const COMPOSITE_CAPTION_HEIGHT = 96;

// Mirrors BeforeAfterSlider's own divider math: afterness is 0-100 (higher =
// more "after" shown), dividerLeftPct = 100 - afterness is where the
// before/after boundary sits, as a percentage from the left edge.
export function computeCompositeLayout(afterness: number): CompositeLayout {
  const clampedAfterness = Math.min(100, Math.max(0, afterness));
  const dividerLeftPct = 100 - clampedAfterness;
  const dividerX = Math.round((COMPOSITE_CANVAS_WIDTH * dividerLeftPct) / 100);
  return {
    canvasWidth: COMPOSITE_CANVAS_WIDTH,
    canvasHeight: COMPOSITE_PHOTO_HEIGHT + COMPOSITE_CAPTION_HEIGHT,
    photoHeight: COMPOSITE_PHOTO_HEIGHT,
    captionHeight: COMPOSITE_CAPTION_HEIGHT,
    dividerX,
    beforeClipWidth: dividerX,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest utils/compositeImage.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add utils/compositeImage.ts utils/compositeImage.test.ts
git commit -m "feat: add composite layout math for before/after export"
```

---

### Task 2: Shared media export service

**Files:**
- Create: `services/mediaExportService.ts`
- Test: `services/mediaExportService.test.ts`
- Modify: `package.json` (adds `expo-sharing`)

**Interfaces:**
- Consumes: `expo-media-library/legacy` (`requestPermissionsAsync`, `createAssetAsync`, `createAlbumAsync`, `saveToLibraryAsync` — already used the same way in `PhotoMorph.tsx` today), `expo-sharing` (`isAvailableAsync`, `shareAsync`).
- Produces: `saveFileToGallery(uri: string, albumName?: string): Promise<SaveResult>` where `SaveResult = { status: "saved" } | { status: "permission_denied" } | { status: "error"; error: unknown }`; `shareFile(uri: string, mimeType: string, dialogTitle: string): Promise<ShareResult>` where `ShareResult = { status: "shared" } | { status: "unavailable" } | { status: "error"; error: unknown }`. Tasks 5 and 6 consume both.

- [ ] **Step 1: Install expo-sharing**

Run: `npx expo install expo-sharing`
Expected: `package.json`'s `dependencies` gains an `expo-sharing` entry at the SDK-57-compatible version; `package-lock.json` updates accordingly.

- [ ] **Step 2: Write the failing test**

Create `services/mediaExportService.test.ts`:

```ts
jest.mock("expo-media-library/legacy", () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";
import { saveFileToGallery, shareFile } from "./mediaExportService";

describe("saveFileToGallery", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns permission_denied when permission isn't granted", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    const result = await saveFileToGallery("file://photo.png");
    expect(result).toEqual({ status: "permission_denied" });
  });

  it("saves into a named album when albumName is given", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({ id: "asset1" });
    const result = await saveFileToGallery("file://photo.png", "FitSnapshot");
    expect(MediaLibrary.createAssetAsync).toHaveBeenCalledWith("file://photo.png");
    expect(MediaLibrary.createAlbumAsync).toHaveBeenCalledWith("FitSnapshot", { id: "asset1" }, false);
    expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "saved" });
  });

  it("saves to the default library when no albumName is given", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    const result = await saveFileToGallery("file://gif.gif");
    expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith("file://gif.gif");
    expect(MediaLibrary.createAssetAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "saved" });
  });

  it("returns an error result when MediaLibrary throws", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (MediaLibrary.saveToLibraryAsync as jest.Mock).mockRejectedValue(new Error("disk full"));
    const result = await saveFileToGallery("file://gif.gif");
    expect(result.status).toBe("error");
  });
});

describe("shareFile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns unavailable when sharing isn't supported", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    const result = await shareFile("file://photo.png", "image/png", "Share");
    expect(result).toEqual({ status: "unavailable" });
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it("shares the file when sharing is available", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    const result = await shareFile("file://photo.png", "image/png", "Share your progress");
    expect(Sharing.shareAsync).toHaveBeenCalledWith("file://photo.png", {
      mimeType: "image/png",
      dialogTitle: "Share your progress",
    });
    expect(result).toEqual({ status: "shared" });
  });

  it("returns an error result when sharing throws", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error("nope"));
    const result = await shareFile("file://photo.png", "image/png", "Share");
    expect(result.status).toBe("error");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest services/mediaExportService.test.ts`
Expected: FAIL — `Cannot find module './mediaExportService'`

- [ ] **Step 4: Write minimal implementation**

Create `services/mediaExportService.ts`:

```ts
import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";

export type SaveResult =
  | { status: "saved" }
  | { status: "permission_denied" }
  | { status: "error"; error: unknown };

export async function saveFileToGallery(uri: string, albumName?: string): Promise<SaveResult> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      return { status: "permission_denied" };
    }
    if (albumName) {
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync(albumName, asset, false);
    } else {
      await MediaLibrary.saveToLibraryAsync(uri);
    }
    return { status: "saved" };
  } catch (error) {
    return { status: "error", error };
  }
}

export type ShareResult =
  | { status: "shared" }
  | { status: "unavailable" }
  | { status: "error"; error: unknown };

export async function shareFile(uri: string, mimeType: string, dialogTitle: string): Promise<ShareResult> {
  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) {
      return { status: "unavailable" };
    }
    await Sharing.shareAsync(uri, { mimeType, dialogTitle });
    return { status: "shared" };
  } catch (error) {
    return { status: "error", error };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest services/mediaExportService.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json services/mediaExportService.ts services/mediaExportService.test.ts
git commit -m "feat: add shared save/share media export service"
```

---

### Task 3: Localization keys

**Files:**
- Modify: `localization/translations.ts` (interface block around line 84, and the `en`/`es`/`it`/`de`/`fr` `progress` objects)

**Interfaces:**
- Produces: `t("progress.shareButton")`, `t("progress.shareErrorMessage")`, `t("progress.gifShareButton")`, `t("progress.gifShareErrorMessage")`, `t("progress.sharingUnavailableMessage")` in all 5 locales. Tasks 5 and 6 consume these.

- [ ] **Step 1: Add the keys to the `TranslationKeys` interface**

In `localization/translations.ts`, find this block (around line 83-84):

```ts
    photoSavedMessage: string;
    photoSaveErrorMessage: string;
```

Replace with:

```ts
    photoSavedMessage: string;
    photoSaveErrorMessage: string;
    shareButton: string;
    shareErrorMessage: string;
    gifShareButton: string;
    gifShareErrorMessage: string;
    sharingUnavailableMessage: string;
```

- [ ] **Step 2: Add the English values**

Find (around line 385-386):

```ts
      photoSavedMessage: "Photo saved successfully",
      photoSaveErrorMessage: "Error saving photo",
```

Replace with:

```ts
      photoSavedMessage: "Photo saved successfully",
      photoSaveErrorMessage: "Error saving photo",
      shareButton: "Share",
      shareErrorMessage: "Error sharing photo",
      gifShareButton: "Share",
      gifShareErrorMessage: "Error sharing GIF",
      sharingUnavailableMessage: "Sharing isn't available on this device",
```

- [ ] **Step 3: Add the Spanish values**

Find (around line 715-716):

```ts
      photoSavedMessage: "Foto guardada con éxito",
      photoSaveErrorMessage: "Error al guardar foto",
```

Replace with:

```ts
      photoSavedMessage: "Foto guardada con éxito",
      photoSaveErrorMessage: "Error al guardar foto",
      shareButton: "Compartir",
      shareErrorMessage: "Error al compartir foto",
      gifShareButton: "Compartir",
      gifShareErrorMessage: "Error al compartir GIF",
      sharingUnavailableMessage: "Compartir no está disponible en este dispositivo",
```

- [ ] **Step 4: Add the Italian values**

Find (around line 1045-1046):

```ts
      photoSavedMessage: "Foto salvata con successo",
      photoSaveErrorMessage: "Errore nel salvare la foto",
```

Replace with:

```ts
      photoSavedMessage: "Foto salvata con successo",
      photoSaveErrorMessage: "Errore nel salvare la foto",
      shareButton: "Condividi",
      shareErrorMessage: "Errore nella condivisione della foto",
      gifShareButton: "Condividi",
      gifShareErrorMessage: "Errore nella condivisione della GIF",
      sharingUnavailableMessage: "La condivisione non è disponibile su questo dispositivo",
```

- [ ] **Step 5: Add the German values**

Find (around line 1375-1376):

```ts
      photoSavedMessage: "Foto erfolgreich gespeichert",
      photoSaveErrorMessage: "Fehler beim Speichern des Fotos",
```

Replace with:

```ts
      photoSavedMessage: "Foto erfolgreich gespeichert",
      photoSaveErrorMessage: "Fehler beim Speichern des Fotos",
      shareButton: "Teilen",
      shareErrorMessage: "Fehler beim Teilen des Fotos",
      gifShareButton: "Teilen",
      gifShareErrorMessage: "Fehler beim Teilen des GIFs",
      sharingUnavailableMessage: "Teilen ist auf diesem Gerät nicht verfügbar",
```

- [ ] **Step 6: Add the French values**

Find (around line 1706-1707):

```ts
      photoSavedMessage: "Photo enregistrée avec succès",
      photoSaveErrorMessage: "Erreur lors de l'enregistrement de la photo",
```

Replace with:

```ts
      photoSavedMessage: "Photo enregistrée avec succès",
      photoSaveErrorMessage: "Erreur lors de l'enregistrement de la photo",
      shareButton: "Partager",
      shareErrorMessage: "Erreur lors du partage de la photo",
      gifShareButton: "Partager",
      gifShareErrorMessage: "Erreur lors du partage du GIF",
      sharingUnavailableMessage: "Le partage n'est pas disponible sur cet appareil",
```

- [ ] **Step 7: Verify all 5 locale objects satisfy the updated interface**

Run: `npx tsc --noEmit`
Expected: no errors. (`translations` is typed as `Translations = { [key: string]: TranslationKeys }`, so a locale object missing any of the 5 new keys fails to compile — this is the test for this task.)

- [ ] **Step 8: Commit**

```bash
git add localization/translations.ts
git commit -m "feat: add share/save localization keys for all locales"
```

---

### Task 4: Off-screen composite exporter component

**Files:**
- Create: `components/progress/CompositeExporter.tsx`

**Interfaces:**
- Consumes: `computeCompositeLayout` from `utils/compositeImage.ts` (Task 1); `fontFamily` from `@/constants/DesignSystem`; `react-native-svg`'s `Svg`/`Image`/`Rect`/`Defs`/`ClipPath`/`Text`; `expo-file-system/legacy`.
- Produces: `CompositeExporter` (default export, a `forwardRef` component) and `CompositeExporterHandle { export: () => Promise<string> }` (named export). Props: `{ beforeUri: string; afterUri: string; afterness: number; caption: string; beforeLabel: string; afterLabel: string }`. Task 5 consumes both.

No automated test for this task — `toDataURL` is a native-module call that Jest can't meaningfully exercise (per the design doc's testing section). It's covered by Task 7's manual verification.

- [ ] **Step 1: Create the component**

Create `components/progress/CompositeExporter.tsx`:

```tsx
import { fontFamily } from "@/constants/DesignSystem";
import { computeCompositeLayout } from "@/utils/compositeImage";
import * as FileSystem from "expo-file-system/legacy";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { View } from "react-native";
import Svg, { ClipPath, Defs, Image as SvgImage, Rect, Text as SvgText } from "react-native-svg";

// Colors are fixed (not theme-derived) so a saved/shared image looks the
// same regardless of the viewer's or exporter's app theme. Mirrors
// constants/Colors.ts's ink/paper/brass values (not exported from there).
const INK = "#14161A";
const PAPER = "#EDEAE2";
const BRASS = "#C9A227";

const DIVIDER_WIDTH = 4;
const LABEL_MARGIN = 40;
const LABEL_PILL_WIDTH = 260;
const LABEL_PILL_HEIGHT = 58;
const LABEL_FONT_SIZE = 30;
const CAPTION_FONT_SIZE = 32;

export interface CompositeExporterHandle {
  export: () => Promise<string>;
}

interface CompositeExporterProps {
  beforeUri: string;
  afterUri: string;
  afterness: number;
  caption: string;
  beforeLabel: string;
  afterLabel: string;
}

export const CompositeExporter = forwardRef<CompositeExporterHandle, CompositeExporterProps>(
  ({ beforeUri, afterUri, afterness, caption, beforeLabel, afterLabel }, ref) => {
    const svgRef = useRef<Svg>(null);
    const [dataUris, setDataUris] = useState<{ before: string; after: string } | null>(null);
    const loadedCountRef = useRef(0);
    const readyResolveRef = useRef<(() => void) | null>(null);

    const layout = computeCompositeLayout(afterness);

    const handleImageLoad = () => {
      loadedCountRef.current += 1;
      if (loadedCountRef.current >= 2 && readyResolveRef.current) {
        readyResolveRef.current();
        readyResolveRef.current = null;
      }
    };

    useImperativeHandle(ref, () => ({
      export: async () => {
        loadedCountRef.current = 0;

        // Embed both photos as data URIs before mounting the SVG <Image>
        // elements — the pixel data is inline in the tree at render time
        // instead of being fetched after mount, which avoids racing
        // toDataURL against an async image load.
        const [beforeBase64, afterBase64] = await Promise.all([
          FileSystem.readAsStringAsync(beforeUri, { encoding: FileSystem.EncodingType.Base64 }),
          FileSystem.readAsStringAsync(afterUri, { encoding: FileSystem.EncodingType.Base64 }),
        ]);

        const ready = new Promise<void>((resolve) => {
          readyResolveRef.current = resolve;
        });
        setDataUris({
          before: `data:image/jpeg;base64,${beforeBase64}`,
          after: `data:image/jpeg;base64,${afterBase64}`,
        });
        await ready;

        return new Promise<string>((resolve, reject) => {
          svgRef.current?.toDataURL(
            (base64Png) => {
              const fileUri = `${FileSystem.cacheDirectory}composite_${Date.now()}.png`;
              FileSystem.writeAsStringAsync(fileUri, base64Png, {
                encoding: FileSystem.EncodingType.Base64,
              })
                .then(() => resolve(fileUri))
                .catch(reject);
            },
            { width: layout.canvasWidth, height: layout.canvasHeight }
          );
        });
      },
    }));

    return (
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: -9999, top: 0, width: layout.canvasWidth, height: layout.canvasHeight }}
      >
        <Svg ref={svgRef} width={layout.canvasWidth} height={layout.canvasHeight}>
          <Defs>
            <ClipPath id="beforeClip">
              <Rect x={0} y={0} width={layout.beforeClipWidth} height={layout.photoHeight} />
            </ClipPath>
          </Defs>
          {/* Fills the whole canvas — doubles as the caption strip's
              background since the photo images only cover 0..photoHeight. */}
          <Rect x={0} y={0} width={layout.canvasWidth} height={layout.canvasHeight} fill={INK} />
          {dataUris && (
            <>
              <SvgImage
                x={0}
                y={0}
                width={layout.canvasWidth}
                height={layout.photoHeight}
                href={dataUris.after}
                preserveAspectRatio="xMidYMid slice"
                onLoad={handleImageLoad}
              />
              <SvgImage
                x={0}
                y={0}
                width={layout.canvasWidth}
                height={layout.photoHeight}
                href={dataUris.before}
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#beforeClip)"
                onLoad={handleImageLoad}
              />
              <Rect
                x={layout.dividerX - DIVIDER_WIDTH / 2}
                y={0}
                width={DIVIDER_WIDTH}
                height={layout.photoHeight}
                fill={BRASS}
              />
              <Rect
                x={LABEL_MARGIN}
                y={LABEL_MARGIN}
                width={LABEL_PILL_WIDTH}
                height={LABEL_PILL_HEIGHT}
                rx={LABEL_PILL_HEIGHT / 2}
                fill={INK}
                fillOpacity={0.6}
              />
              <SvgText
                x={LABEL_MARGIN + LABEL_PILL_WIDTH / 2}
                y={LABEL_MARGIN + LABEL_PILL_HEIGHT / 2 + LABEL_FONT_SIZE * 0.35}
                fontSize={LABEL_FONT_SIZE}
                fontFamily={fontFamily.monoSemiBold}
                fill={PAPER}
                textAnchor="middle"
              >
                {beforeLabel.toUpperCase()}
              </SvgText>
              <Rect
                x={layout.canvasWidth - LABEL_MARGIN - LABEL_PILL_WIDTH}
                y={LABEL_MARGIN}
                width={LABEL_PILL_WIDTH}
                height={LABEL_PILL_HEIGHT}
                rx={LABEL_PILL_HEIGHT / 2}
                fill={INK}
                fillOpacity={0.6}
              />
              <SvgText
                x={layout.canvasWidth - LABEL_MARGIN - LABEL_PILL_WIDTH / 2}
                y={LABEL_MARGIN + LABEL_PILL_HEIGHT / 2 + LABEL_FONT_SIZE * 0.35}
                fontSize={LABEL_FONT_SIZE}
                fontFamily={fontFamily.monoSemiBold}
                fill={PAPER}
                textAnchor="middle"
              >
                {afterLabel.toUpperCase()}
              </SvgText>
              <SvgText
                x={layout.canvasWidth / 2}
                y={layout.photoHeight + layout.captionHeight / 2 + CAPTION_FONT_SIZE * 0.35}
                fontSize={CAPTION_FONT_SIZE}
                fontFamily={fontFamily.mono}
                fill={PAPER}
                textAnchor="middle"
                letterSpacing={1}
              >
                {caption}
              </SvgText>
            </>
          )}
        </Svg>
      </View>
    );
  }
);

export default CompositeExporter;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/progress/CompositeExporter.tsx
git commit -m "feat: add off-screen SVG composite exporter"
```

---

### Task 5: Wire Save + Share into the slider stage

**Files:**
- Modify: `components/progress/PhotoMorph.tsx`

**Interfaces:**
- Consumes: `CompositeExporter`, `CompositeExporterHandle` (Task 4); `saveFileToGallery`, `shareFile` (Task 2); `t("progress.shareButton")` etc. (Task 3).

- [ ] **Step 1: Update imports**

In `components/progress/PhotoMorph.tsx`, find:

```tsx
import React, { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
```

Replace with:

```tsx
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
```

Note: leave the `import * as MediaLibrary from "expo-media-library/legacy";` line in place for now — Task 6 still has two call sites using it directly (removing it here would break compilation until Task 6 runs). Task 6's last step deletes it once nothing references it anymore.

Find:

```tsx
import { BeforeAfterSlider } from "@/components/progress/BeforeAfterSlider";
import { ContactSheetFrame } from "@/components/home/ContactSheetFrame";
import { Button } from "@/components/ui";
```

Replace with:

```tsx
import { BeforeAfterSlider } from "@/components/progress/BeforeAfterSlider";
import { CompositeExporter, CompositeExporterHandle } from "@/components/progress/CompositeExporter";
import { ContactSheetFrame } from "@/components/home/ContactSheetFrame";
import { saveFileToGallery, shareFile } from "@/services/mediaExportService";
import { Button } from "@/components/ui";
```

- [ ] **Step 2: Simplify `extractPhoto` (single-photo view only) and add composite state**

Find:

```tsx
  const extractPhoto = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
        return;
      }

      const photoToExtract =
        photos.length > 1
          ? sliderValue > 50
            ? photos[photos.length - 1]
            : photos[0]
          : photos[0];
      const asset = await MediaLibrary.createAssetAsync(photoToExtract.uri);
      await MediaLibrary.createAlbumAsync("FitSnapshot", asset, false);

      Alert.alert(t("common.success"), t("progress.photoSavedMessage"));
    } catch (error) {
      console.error("Error extracting photo:", error);
      Alert.alert(t("common.error"), t("progress.photoSaveErrorMessage"));
    }
  }, [photos, sliderValue, t]);
```

This function is only reachable from the single-photo view (`photos.length === 1`, no slider, no comparison) now that the slider's own Save/Share are handled separately below — the old `photos.length > 1` branch is dead code. Replace with:

```tsx
  // Single-photo view only (no comparison possible with one photo) — the
  // slider's own Save/Share, added below, replace this for the two-photo case.
  const extractPhoto = useCallback(async () => {
    const result = await saveFileToGallery(photos[0].uri, "FitSnapshot");
    if (result.status === "permission_denied") {
      Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
    } else if (result.status === "error") {
      console.error("Error extracting photo:", result.error);
      Alert.alert(t("common.error"), t("progress.photoSaveErrorMessage"));
    } else {
      Alert.alert(t("common.success"), t("progress.photoSavedMessage"));
    }
  }, [photos, t]);
```

- [ ] **Step 3: Add composite Save/Share state and a ref for the exporter**

Find:

```tsx
  const [paywallVisible, setPaywallVisible] = useState(false);
```

Replace with:

```tsx
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [isSavingComposite, setIsSavingComposite] = useState(false);
  const [isSharingComposite, setIsSharingComposite] = useState(false);
  const [isSharingGif, setIsSharingGif] = useState(false);
  const compositeExporterRef = useRef<CompositeExporterHandle>(null);
```

- [ ] **Step 4: Add the caption variable and the two composite handlers**

Find:

```tsx
  const oldestPhoto = photos[0];
  const newestPhoto = photos[photos.length - 1];

  return (
```

Replace with:

```tsx
  const oldestPhoto = photos[0];
  const newestPhoto = photos[photos.length - 1];

  const sliderCaption = `${new Date(photo1.date).toLocaleDateString()} → ${new Date(photo2.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`;

  const handleSaveComposite = async () => {
    if (isSavingComposite || isSharingComposite) return;
    setIsSavingComposite(true);
    try {
      const fileUri = await compositeExporterRef.current?.export();
      if (!fileUri) throw new Error("Composite export returned no file");
      const result = await saveFileToGallery(fileUri, "FitSnapshot");
      if (result.status === "permission_denied") {
        Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
      } else if (result.status === "error") {
        Alert.alert(t("common.error"), t("progress.photoSaveErrorMessage"));
      } else {
        Alert.alert(t("common.success"), t("progress.photoSavedMessage"));
      }
    } catch (error) {
      console.error("Error saving composite photo:", error);
      Alert.alert(t("common.error"), t("progress.photoSaveErrorMessage"));
    } finally {
      setIsSavingComposite(false);
    }
  };

  const handleShareComposite = async () => {
    if (isSavingComposite || isSharingComposite) return;
    setIsSharingComposite(true);
    try {
      const fileUri = await compositeExporterRef.current?.export();
      if (!fileUri) throw new Error("Composite export returned no file");
      const result = await shareFile(fileUri, "image/png", t("progress.shareButton"));
      if (result.status === "unavailable") {
        Alert.alert(t("common.error"), t("progress.sharingUnavailableMessage"));
      } else if (result.status === "error") {
        Alert.alert(t("common.error"), t("progress.shareErrorMessage"));
      }
    } catch (error) {
      console.error("Error sharing composite photo:", error);
      Alert.alert(t("common.error"), t("progress.shareErrorMessage"));
    } finally {
      setIsSharingComposite(false);
    }
  };

  return (
```

- [ ] **Step 5: Replace the slider stage's single button with Save + Share + the off-screen exporter**

Find:

```tsx
      {/* Slider Mode */}
      {comparisonMode === 'slider' && (
        <ContactSheetFrame caption={`${new Date(photo1.date).toLocaleDateString()} → ${new Date(photo2.date).toLocaleDateString()} · ${t(`camera.${type}`).toUpperCase()}`}>
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

Replace with:

```tsx
      {/* Slider Mode */}
      {comparisonMode === 'slider' && (
        <ContactSheetFrame caption={sliderCaption}>
          <View style={styles.sliderStage}>
            <BeforeAfterSlider
              beforeUri={photo1.uri}
              afterUri={photo2.uri}
              beforeLabel={t("common.before")}
              afterLabel={t("common.after")}
              onValueChange={setSliderValue}
            />
            <TouchableOpacity
              style={[styles.compositeActionButton, styles.compositeSaveButton, { backgroundColor: theme.primary }]}
              onPress={handleSaveComposite}
              disabled={isSavingComposite || isSharingComposite}
              activeOpacity={0.8}
            >
              {isSavingComposite ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Ionicons name="download-outline" size={20} color={theme.background} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.compositeActionButton, styles.compositeShareButton, { backgroundColor: theme.primary }]}
              onPress={handleShareComposite}
              disabled={isSavingComposite || isSharingComposite}
              activeOpacity={0.8}
            >
              {isSharingComposite ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Ionicons name="share-social-outline" size={20} color={theme.background} />
              )}
            </TouchableOpacity>
            <CompositeExporter
              ref={compositeExporterRef}
              beforeUri={photo1.uri}
              afterUri={photo2.uri}
              afterness={sliderValue}
              caption={sliderCaption}
              beforeLabel={t("common.before")}
              afterLabel={t("common.after")}
            />
          </View>
        </ContactSheetFrame>
      )}
```

- [ ] **Step 6: Add the two new button styles**

Find:

```tsx
  extractButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
```

Replace with:

```tsx
  extractButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  compositeActionButton: {
    position: "absolute",
    bottom: 16,
    borderRadius: 24,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  compositeSaveButton: {
    right: 64,
  },
  compositeShareButton: {
    right: 16,
  },
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (`MediaLibrary` is still imported and still used by the two GIF call sites Task 6 hasn't touched yet, so it must NOT be removed at this point.)

- [ ] **Step 8: Commit**

```bash
git add components/progress/PhotoMorph.tsx
git commit -m "feat: replace slider download button with composite Save + Share"
```

---

### Task 6: Wire Share into the GIF action row

**Files:**
- Modify: `components/progress/PhotoMorph.tsx`

**Interfaces:**
- Consumes: `saveFileToGallery`, `shareFile` (Task 2, already imported in Task 5); `isSharingGif` state (already added in Task 5 Step 3); `t("progress.gifShareButton")` etc. (Task 3).

- [ ] **Step 1: Refactor the GIF auto-save (runs right after generation) onto the shared service**

There's a second, separate `MediaLibrary` call site besides the Download button: the "Generate" button's `onPress` auto-saves the GIF as soon as it's created. This must be refactored too before the `MediaLibrary` import can be removed in Step 4 below.

Find:

```tsx
                    try {
                      const { status } = await MediaLibrary.requestPermissionsAsync();
                      if (status === 'granted') {
                        await MediaLibrary.saveToLibraryAsync(result.gifUri);
                        setGifSaved(true);
                      }
                    } catch (saveError) {
                      console.error('Error auto-saving GIF:', saveError);
                    }
```

Replace with:

```tsx
                    const autoSaveResult = await saveFileToGallery(result.gifUri);
                    if (autoSaveResult.status === 'saved') {
                      setGifSaved(true);
                    } else if (autoSaveResult.status === 'error') {
                      console.error('Error auto-saving GIF:', autoSaveResult.error);
                    }
```

- [ ] **Step 2: Refactor the Download button onto the shared service and add a Share button**

Find:

```tsx
            <View style={styles.gifActionsRow}>
              <Button
                title={gifSaved ? 'Save Again' : 'Download'}
                onPress={async () => {
                  try {
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status !== 'granted') {
                      Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
                      return;
                    }

                    await MediaLibrary.saveToLibraryAsync(gifUrl);
                    setGifSaved(true);
                    Alert.alert(t("common.success"), 'GIF saved to gallery');
                  } catch (error) {
                    Alert.alert(t("common.error"), 'Failed to save GIF');
                  }
                }}
                variant="primary"
                icon={<Ionicons name="download-outline" size={20} color={theme.onAccent} />}
                style={styles.gifDownloadButton}
              />
              <Button
                title="Clear"
                onPress={() => {
                  setGifUrl(null);
                  setGifError(null);
                  setGifSaved(false);
                }}
                variant="ghost"
                icon={<Ionicons name="close-outline" size={20} color={theme.text} />}
                style={styles.gifClearButton}
              />
            </View>
```

Replace with:

```tsx
            <View style={styles.gifActionsRow}>
              <Button
                title={gifSaved ? 'Save Again' : 'Download'}
                onPress={async () => {
                  const result = await saveFileToGallery(gifUrl);
                  if (result.status === 'permission_denied') {
                    Alert.alert(t("permissions.title"), t("permissions.photoSaveMessage"));
                  } else if (result.status === 'error') {
                    Alert.alert(t("common.error"), 'Failed to save GIF');
                  } else {
                    setGifSaved(true);
                    Alert.alert(t("common.success"), 'GIF saved to gallery');
                  }
                }}
                variant="primary"
                icon={<Ionicons name="download-outline" size={20} color={theme.onAccent} />}
                style={styles.gifDownloadButton}
              />
              <Button
                title={t("progress.gifShareButton")}
                onPress={async () => {
                  setIsSharingGif(true);
                  const result = await shareFile(gifUrl, 'image/gif', t("progress.gifShareButton"));
                  if (result.status === 'unavailable') {
                    Alert.alert(t("common.error"), t("progress.sharingUnavailableMessage"));
                  } else if (result.status === 'error') {
                    Alert.alert(t("common.error"), t("progress.gifShareErrorMessage"));
                  }
                  setIsSharingGif(false);
                }}
                variant="secondary"
                loading={isSharingGif}
                icon={<Ionicons name="share-social-outline" size={20} color={theme.text} />}
                style={styles.gifShareButton}
              />
              <Button
                title="Clear"
                onPress={() => {
                  setGifUrl(null);
                  setGifError(null);
                  setGifSaved(false);
                }}
                variant="ghost"
                icon={<Ionicons name="close-outline" size={20} color={theme.text} />}
                style={styles.gifClearButton}
              />
            </View>
```

- [ ] **Step 3: Add the new button's (empty) style slot**

Find:

```tsx
  gifDownloadButton: {},
  gifClearButton: {},
```

Replace with:

```tsx
  gifDownloadButton: {},
  gifShareButton: {},
  gifClearButton: {},
```

- [ ] **Step 4: Remove the now-unused `MediaLibrary` import**

After Steps 1-2, nothing in `PhotoMorph.tsx` calls `MediaLibrary` directly anymore (`extractPhoto`, the GIF auto-save, and the Download button all now go through `saveFileToGallery`). Find:

```tsx
import * as MediaLibrary from "expo-media-library/legacy";
```

Delete that line entirely.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors, and no "unused import" lint warning for `MediaLibrary`.

- [ ] **Step 6: Commit**

```bash
git add components/progress/PhotoMorph.tsx
git commit -m "feat: add GIF share button alongside download"
```

---

### Task 7: Rebuild dev client and manually verify on device

**Files:** none (device verification only)

**Interfaces:** none — this task consumes the finished feature end-to-end.

- [ ] **Step 1: Rebuild the dev client**

Run: `eas build --profile development --platform android` (or `npx expo run:android` if building locally)
Expected: build succeeds and includes the new `expo-sharing` native module; install the resulting build on a test device/emulator.

- [ ] **Step 2: Verify the slider Save**

In the app, open Progress → a photo type with ≥2 photos → Slider mode. Drag the slider away from 50%. Tap the Save (download icon) button.
Expected: permission prompt on first use → success alert → a new image appears in the device's "FitSnapshot" gallery album showing the before/after split at the divider position used, with BEFORE/AFTER labels and the date-range caption visible.

- [ ] **Step 3: Verify the slider Share**

Tap the Share (share icon) button next to Save.
Expected: Android share sheet opens with the same composite PNG attached; sharing to any app (e.g. a Gmail draft) attaches a valid, correctly-composited image.

- [ ] **Step 4: Verify GIF Share**

Switch to GIF mode, generate a GIF, tap the new Share button.
Expected: Android share sheet opens with the GIF file attached; the recipient app receives a playable animated GIF, not a static frame.

- [ ] **Step 5: Regression-check GIF Download**

Tap Download/Save Again in GIF mode.
Expected: still saves to the gallery and shows the existing saved-badge/alert, unchanged from before this feature.

- [ ] **Step 6: Regression-check the single-photo view**

Open Progress for a photo type with exactly 1 photo.
Expected: the existing single Save button still saves that one photo into the "FitSnapshot" album, unchanged.

- [ ] **Step 7: Theme independence check**

Toggle the app's light/dark theme setting, then repeat Step 2.
Expected: the exported composite's colors (label pills, divider, caption strip) look identical regardless of the app's current theme.
