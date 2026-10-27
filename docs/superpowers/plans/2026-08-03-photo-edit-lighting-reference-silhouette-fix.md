# Photo Edit, On-Demand Lighting Reference, and Silhouette Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users re-crop existing gallery photos in place, let them explicitly pick any photo as the lighting reference for its pose, and fix the crop tool's silhouette guide rendering far too large compared to the live camera view.

**Architecture:** Reuses the existing `/photo-crop` route and `PhotoCropStage` component unchanged for edits (just a new caller in the gallery). Adds a storage-layer `updatePhoto` that overwrites a photo's file under a fresh filename (busting React Native's URI-keyed image cache) while preserving its `id`. Adds a pure-JS static-image luminance reader so any photo — not just a live camera capture — can seed the lighting baseline, triggered only by an explicit button tap. Fixes a percentage-vs-pixel sizing bug in the shared silhouette component.

**Tech Stack:** React Native (Expo SDK 57), expo-router, expo-image-manipulator, AsyncStorage, expo-file-system, Jest + react-test-renderer. New pure-JS deps: `jpeg-js`, `base64-js` (no native code, no dev-client rebuild).

## Global Constraints

- No new native/native-linked dependencies — `jpeg-js` and `base64-js` are pure JS only.
- Luminance for non-camera-capture photos is computed **only** when the user explicitly presses "set as reference luminance" — never automatically on import, edit, or app load.
- Editing an existing photo overwrites it in place (same `id`), never creates a new gallery entry.
- Edited photo files must get a **new filename** on disk, not reuse the old one — React Native's `<Image>` caches by URI, so reusing the old path would show a stale thumbnail.
- New user-facing strings must be added to `localization/translations.ts` in the `interface TranslationKeys` block and all 5 locale blocks (`en`, `es`, `it`, `de`, `fr`) — never left English-only.
- Follow existing file conventions: services use `try/catch` + `console.error` + rethrow; contexts wrap storage calls returning `{ success, error? }`; tests use `react-test-renderer` + inline `jest.mock(...)` (no `@testing-library/react-native`, which isn't installed).

---

### Task 1: Fix the silhouette scaling bug

**Files:**
- Modify: `images/TorsoSilhouette.js`
- Test: `components/camera/AlignmentOverlay.test.tsx` (existing — must keep passing)

**Interfaces:**
- Consumes: nothing new.
- Produces: `TorsoSilhouette` renders its guide image sized relative to its own container instead of the full device screen — no signature change, so nothing downstream needs updating.

**Root cause:** `images/TorsoSilhouette.js` sizes its image from `Dimensions.get("window")` (captured once at module load) — `width: width * 0.8, height: height * 0.6` — regardless of where it's actually placed. In the live camera screen the container happens to be the full screen, so it looks right by coincidence. In `PhotoCropStage` the same component sits inside a much smaller inset 3:4 frame box, but still sizes from full-screen dimensions, overflowing it.

- [ ] **Step 1: Replace the fixed-pixel sizing with percentages of the parent, and drop the `Dimensions` dependency**

Replace the full contents of `images/TorsoSilhouette.js` with:

```js
import React from "react";
import { Image, View } from "react-native";

const TorsoSilhouette = ({ type = "front" }) => {
  // Select silhouette based on photo type
  const getSilhouetteSource = () => {
    switch (type) {
      case "side":
        return require("../assets/images/silhouette_side.png");
      case "front":
      case "back":
      default:
        return require("../assets/images/silhouette.png");
    }
  };

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
        source={getSilhouetteSource()}
        style={{
          width: "80%",
          height: "60%",
          opacity: 0.3,
          resizeMode: "contain",
        }}
      />
    </View>
  );
};

export default TorsoSilhouette;
```

This View already absolutely fills whichever parent renders it (the full-screen live camera overlay, or the small inset frame in `PhotoCropStage`), so percentages resolve correctly in both places automatically — no call-site changes needed.

- [ ] **Step 2: Run the existing AlignmentOverlay test to confirm nothing broke**

Run: `npx jest components/camera/AlignmentOverlay.test.tsx`
Expected: PASS (it only asserts on the `0.3` opacity value and ghost-photo URI presence, not layout, so it's unaffected by this change).

- [ ] **Step 3: Manual visual check**

Run the app, open the camera screen and note the silhouette's proportions relative to the screen. Then import a photo (camera screen import button) to reach the crop screen and compare the silhouette's proportions there — they should now look consistent instead of the crop-screen one being oversized.

- [ ] **Step 4: Commit**

```bash
git add images/TorsoSilhouette.js
git commit -m "fix: size silhouette guide relative to its container instead of the full screen"
```

---

### Task 2: Add `computeImageLuminance` utility

**Files:**
- Create: `utils/imageLuminance.ts`
- Test: `utils/imageLuminance.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `DEFAULT_BG_REGIONS` and `normalizeLuma` from `services/lightingService.ts` (already exist, unchanged).
- Produces: `computeImageLuminance(uri: string): Promise<number | null>` — used by Task 6 (gallery wiring). Returns `null` on any failure instead of throwing.

- [ ] **Step 1: Add the new dependencies to `package.json`**

In `package.json`, find:

```json
  "@react-native-google-signin/google-signin": "^13.1.0",
  "date-fns": "^3.6.0",
```

Replace with:

```json
  "@react-native-google-signin/google-signin": "^13.1.0",
  "base64-js": "^1.5.1",
  "date-fns": "^3.6.0",
```

Then find:

```json
  "firebase": "^12.4.0",
  "react": "19.2.3",
```

Replace with:

```json
  "firebase": "^12.4.0",
  "jpeg-js": "^0.4.4",
  "react": "19.2.3",
```

- [ ] **Step 2: Install the dependencies**

Run: `npm install`
Expected: `jpeg-js` and `base64-js` appear in `package-lock.json` with no native-linking postinstall steps.

- [ ] **Step 3: Write the failing tests**

Create `utils/imageLuminance.test.ts`:

```ts
jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: "jpeg" },
}));
jest.mock("jpeg-js", () => ({
  decode: jest.fn(),
}));
jest.mock("base64-js", () => ({
  toByteArray: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

import { manipulateAsync } from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";
import { computeImageLuminance } from "./imageLuminance";

function makeDecodedImage(
  width: number,
  height: number,
  fill: (x: number, y: number) => [number, number, number]
) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fill(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("computeImageLuminance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resizes the image and requests base64 JPEG output", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg", base64: "fake" });
    (decodeJpeg as jest.Mock).mockReturnValue(makeDecodedImage(4, 4, () => [0, 0, 0]));

    await computeImageLuminance("file://photo.jpg");

    expect(manipulateAsync).toHaveBeenCalledWith(
      "file://photo.jpg",
      [{ resize: { width: 100 } }],
      { format: "jpeg", base64: true }
    );
  });

  it("averages luma only over the top-left/top-right background corners, ignoring the center", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg", base64: "fake" });
    // 10x10 image: background corners are pure white, everything else (including
    // the whole center where a subject would stand) is pure black.
    const image = makeDecodedImage(10, 10, (x, y) => {
      const inTopLeft = x < 2 && y < 2;
      const inTopRight = x >= 7 && y < 2;
      return inTopLeft || inTopRight ? [255, 255, 255] : [0, 0, 0];
    });
    (decodeJpeg as jest.Mock).mockReturnValue(image);

    const luminance = await computeImageLuminance("file://photo.jpg");

    expect(luminance).toBeCloseTo(1, 5);
  });

  it("returns null when manipulateAsync yields no base64 data", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg" });

    const luminance = await computeImageLuminance("file://photo.jpg");

    expect(luminance).toBeNull();
    expect(decodeJpeg).not.toHaveBeenCalled();
  });

  it("returns null instead of throwing when decoding fails", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg", base64: "fake" });
    (decodeJpeg as jest.Mock).mockImplementation(() => {
      throw new Error("bad jpeg");
    });

    const luminance = await computeImageLuminance("file://photo.jpg");

    expect(luminance).toBeNull();
  });

  it("returns null instead of throwing when manipulateAsync rejects", async () => {
    (manipulateAsync as jest.Mock).mockRejectedValue(new Error("file not found"));

    const luminance = await computeImageLuminance("file://missing.jpg");

    expect(luminance).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx jest utils/imageLuminance.test.ts`
Expected: FAIL with "Cannot find module './imageLuminance'"

- [ ] **Step 5: Implement `utils/imageLuminance.ts`**

```ts
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";
import { toByteArray } from "base64-js";
import { DEFAULT_BG_REGIONS, normalizeLuma } from "@/services/lightingService";

const SAMPLE_WIDTH = 100;

// Computes the same background-corner luminance reading the live camera uses
// (see DEFAULT_BG_REGIONS), but from a static saved photo instead of a live
// camera frame, so an existing/imported photo can serve as a lighting
// reference. Returns null (never throws) on any failure so callers can treat
// "couldn't compute" as a normal outcome, not an exceptional one.
export async function computeImageLuminance(uri: string): Promise<number | null> {
  try {
    const resized = await manipulateAsync(
      uri,
      [{ resize: { width: SAMPLE_WIDTH } }],
      { format: SaveFormat.JPEG, base64: true }
    );
    if (!resized.base64) return null;

    const bytes = toByteArray(resized.base64);
    const { data, width, height } = decodeJpeg(bytes, { useTArray: true });

    let sum = 0;
    let count = 0;
    for (const region of DEFAULT_BG_REGIONS) {
      const x0 = Math.max(0, Math.floor(region.x * width));
      const y0 = Math.max(0, Math.floor(region.y * height));
      const x1 = Math.min(width, Math.floor((region.x + region.width) * width));
      const y1 = Math.min(height, Math.floor((region.y + region.height) * height));
      for (let py = y0; py < y1; py++) {
        for (let px = x0; px < x1; px++) {
          const i = (py * width + px) * 4;
          sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          count++;
        }
      }
    }

    if (count === 0) return null;
    return normalizeLuma(sum / count);
  } catch (error) {
    console.error("Error computing image luminance:", error);
    return null;
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest utils/imageLuminance.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json utils/imageLuminance.ts utils/imageLuminance.test.ts
git commit -m "feat: add computeImageLuminance for reading brightness from a static photo"
```

---

### Task 3: Add `photoStorage.updatePhoto`

**Files:**
- Modify: `services/photoStorage.ts`
- Test: `services/photoStorage.test.ts`

**Interfaces:**
- Consumes: `Photo` type, `PHOTO_STORAGE_KEY`, `PHOTO_DIRECTORY`, `savePhotoToDevice` (all already exist in this file, unexported/module-scope except `Photo`).
- Produces: `updatePhoto(id: string, updates: { uri?: string; date?: string; luminance?: number }): Promise<Photo>` — used by Task 4.

- [ ] **Step 1: Write the failing tests**

Create `services/photoStorage.test.ts`:

```ts
const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => {
    store[k] = v;
  }),
  getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
}));

const files = new Set<string>();
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///docs/",
  getInfoAsync: jest.fn(async (path: string) => ({
    exists: files.has(path),
    isDirectory: false,
  })),
  makeDirectoryAsync: jest.fn(async (path: string) => {
    files.add(path);
  }),
  copyAsync: jest.fn(async ({ to }: { from: string; to: string }) => {
    files.add(to);
  }),
  deleteAsync: jest.fn(async (path: string) => {
    files.delete(path);
  }),
  readDirectoryAsync: jest.fn(async () => []),
}));

jest.mock("expo-media-library/legacy", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "denied" })),
  saveToLibraryAsync: jest.fn(async () => {}),
}));

import { savePhoto, updatePhoto, getPhotos } from "./photoStorage";
import { PhotoType } from "@/enums/Photos";

describe("updatePhoto", () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    files.clear();
  });

  it("replaces the photo's file under a new name and deletes the old one", async () => {
    await savePhoto({
      id: "1",
      uri: "file:///tmp/original.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.front,
    });
    const before = (await getPhotos())[0];
    expect(files.has(before.uri)).toBe(true);

    const updated = await updatePhoto("1", { uri: "file:///tmp/cropped.jpg" });

    expect(updated.fileName).not.toBe(before.fileName);
    expect(files.has(before.uri)).toBe(false);
    expect(files.has(updated.uri)).toBe(true);
  });

  it("updates the date and clears luminance when explicitly set to undefined", async () => {
    await savePhoto({
      id: "2",
      uri: "file:///tmp/original2.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.side,
      luminance: 0.5,
    });

    const updated = await updatePhoto("2", {
      uri: "file:///tmp/cropped2.jpg",
      date: "2026-02-02T00:00:00.000Z",
      luminance: undefined,
    });

    expect(updated.date).toBe("2026-02-02T00:00:00.000Z");
    expect(updated.luminance).toBeUndefined();
  });

  it("leaves luminance untouched when the update doesn't mention it", async () => {
    await savePhoto({
      id: "3",
      uri: "file:///tmp/original3.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.back,
      luminance: 0.42,
    });

    const updated = await updatePhoto("3", { date: "2026-03-03T00:00:00.000Z" });

    expect(updated.luminance).toBe(0.42);
  });

  it("sets a reference luminance without touching the file", async () => {
    await savePhoto({
      id: "4",
      uri: "file:///tmp/original4.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.front,
    });
    const before = (await getPhotos())[0];

    const updated = await updatePhoto("4", { luminance: 0.61 });

    expect(updated.luminance).toBe(0.61);
    expect(updated.fileName).toBe(before.fileName);
    expect(updated.uri).toBe(before.uri);
  });

  it("throws when the photo id doesn't exist", async () => {
    await expect(updatePhoto("missing", { luminance: 0.1 })).rejects.toThrow(
      "Photo not found: missing"
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest services/photoStorage.test.ts`
Expected: FAIL with "updatePhoto is not a function" (or similar — it isn't exported yet)

- [ ] **Step 3: Implement `updatePhoto` in `services/photoStorage.ts`**

Add this function after `savePhoto` (around line 83, right before `export const getPhotos`):

```ts
export const updatePhoto = async (
  id: string,
  updates: { uri?: string; date?: string; luminance?: number }
): Promise<Photo> => {
  try {
    const existingPhotos = await getPhotos();
    const index = existingPhotos.findIndex((photo) => photo.id === id);
    if (index === -1) {
      throw new Error(`Photo not found: ${id}`);
    }
    const existing = existingPhotos[index];

    let fileName = existing.fileName;
    let uri = existing.uri;

    if (updates.uri) {
      // Always a fresh filename, never the original one — <Image> caches by
      // URI, so overwriting the same path would keep showing the old bytes.
      const newFileName = `${existing.type}_edited-${Date.now()}_${existing.id}.jpg`;
      uri = await savePhotoToDevice(updates.uri, newFileName);

      if (existing.fileName) {
        const oldFilePath = PHOTO_DIRECTORY + existing.fileName;
        const oldFileInfo = await FileSystem.getInfoAsync(oldFilePath);
        if (oldFileInfo.exists) {
          await FileSystem.deleteAsync(oldFilePath);
        }
      }
      fileName = newFileName;
    }

    const updatedPhoto: Photo = {
      ...existing,
      uri,
      fileName,
      date: updates.date ?? existing.date,
      // 'luminance' in updates distinguishes "field not touched" (keep
      // existing) from "explicitly cleared to undefined" (the edit-crop flow
      // needs the latter, since cropping invalidates any cached reading).
      luminance: "luminance" in updates ? updates.luminance : existing.luminance,
    };

    existingPhotos[index] = updatedPhoto;
    await AsyncStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(existingPhotos));
    return updatedPhoto;
  } catch (error) {
    console.error("Error updating photo:", error);
    throw error;
  }
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest services/photoStorage.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add services/photoStorage.ts services/photoStorage.test.ts
git commit -m "feat: add photoStorage.updatePhoto for in-place photo edits"
```

---

### Task 4: Add `PhotoContext.updatePhoto` wrapper

**Files:**
- Modify: `context/PhotoContext.tsx`

**Interfaces:**
- Consumes: `updatePhoto` from `services/photoStorage.ts` (Task 3) — `(id: string, updates: { uri?: string; date?: string; luminance?: number }) => Promise<Photo>`.
- Produces: `usePhotos().updatePhoto(id, updates): Promise<{ success: boolean; error?: string }>` — used by Task 6.

There's no existing test file for any context in this codebase (contexts are thin wrappers exercised indirectly through screens), so this task has no dedicated automated test — it's verified by Task 6's manual checklist, which exercises this method end-to-end.

- [ ] **Step 1: Import the storage function under an alias**

In `context/PhotoContext.tsx`, find:

```ts
import {
  Photo,
  cleanupOrphanedFiles,
  deletePhoto,
  getPhotos,
  getStorageInfo,
  savePhoto,
} from "@/services/photoStorage";
```

Replace with:

```ts
import {
  Photo,
  cleanupOrphanedFiles,
  deletePhoto,
  getPhotos,
  getStorageInfo,
  savePhoto,
  updatePhoto as updatePhotoFile,
} from "@/services/photoStorage";
```

- [ ] **Step 2: Add `updatePhoto` to the context type**

Find:

```ts
interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Photo) => Promise<{ success: boolean; error?: string }>;
  removePhoto: (id: string) => Promise<void>;
```

Replace with:

```ts
interface PhotoContextType {
  photos: Photo[];
  addPhoto: (photo: Photo) => Promise<{ success: boolean; error?: string }>;
  updatePhoto: (
    id: string,
    updates: { uri?: string; date?: string; luminance?: number }
  ) => Promise<{ success: boolean; error?: string }>;
  removePhoto: (id: string) => Promise<void>;
```

- [ ] **Step 3: Implement the provider method**

Find:

```ts
  const removePhoto = async (id: string) => {
```

Insert immediately before it:

```ts
  const updatePhoto = async (
    id: string,
    updates: { uri?: string; date?: string; luminance?: number }
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await updatePhotoFile(id, updates);
      setPhotos((prevPhotos) =>
        prevPhotos.map((photo) => (photo.id === id ? updated : photo))
      );
      return { success: true };
    } catch (err) {
      const errorMessage = "Failed to update photo. Please try again.";
      setError(errorMessage);
      console.error("Error updating photo:", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = async (id: string) => {
```

- [ ] **Step 4: Expose it from the provider value**

Find:

```ts
  const value: PhotoContextType = {
    photos,
    addPhoto,
    removePhoto,
```

Replace with:

```ts
  const value: PhotoContextType = {
    photos,
    addPhoto,
    updatePhoto,
    removePhoto,
```

- [ ] **Step 5: Verify the project still type-checks**

Run: `npx tsc --noEmit`
Expected: no new errors from `context/PhotoContext.tsx` (Task 6 will introduce the only consumer, so this step mainly guards against typos in this task).

- [ ] **Step 6: Commit**

```bash
git add context/PhotoContext.tsx
git commit -m "feat: expose updatePhoto from PhotoContext"
```

---

### Task 5: Add Edit and Set-Reference-Luminance buttons to `FullScreenPhotoModal`

**Files:**
- Modify: `components/gallery/FullScreenPhotoModal.tsx`
- Test: `components/gallery/FullScreenPhotoModal.test.tsx`

**Interfaces:**
- Consumes: `Photo` type from `services/photoStorage.ts` (unchanged).
- Produces: new optional props `photo?: Photo`, `onEdit?: (photo: Photo) => void`, `onSetReferenceLuminance?: (photo: Photo) => void`, `isComputingLuminance?: boolean` on `FullScreenPhotoModal` — used by Task 6. Buttons carry `testID="fullscreen-photo-edit-button"` and `testID="fullscreen-photo-reference-luminance-button"`.

- [ ] **Step 1: Write the failing tests**

Create `components/gallery/FullScreenPhotoModal.test.tsx`:

```tsx
import React from "react";
import { create, act } from "react-test-renderer";
import { ActivityIndicator } from "react-native";
import { FullScreenPhotoModal } from "./FullScreenPhotoModal";
import { PhotoType } from "@/enums/Photos";
import { Photo } from "@/services/photoStorage";

jest.mock("@expo/vector-icons", () => ({ Ionicons: (_p: any) => null }));

const photo: Photo = {
  id: "1",
  uri: "file://photo.jpg",
  date: "2026-01-01T00:00:00.000Z",
  type: PhotoType.front,
};

describe("FullScreenPhotoModal", () => {
  it("hides the edit and reference-luminance buttons when no photo is given (GIF case)", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal isVisible photoUri="file://gif.gif" onClose={() => {}} />
      );
    });
    expect(tree!.root.findAllByProps({ testID: "fullscreen-photo-edit-button" })).toHaveLength(0);
    expect(
      tree!.root.findAllByProps({ testID: "fullscreen-photo-reference-luminance-button" })
    ).toHaveLength(0);
  });

  it("calls onEdit with the photo when the edit button is pressed", () => {
    const onEdit = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal
          isVisible
          photoUri={photo.uri}
          onClose={() => {}}
          photo={photo}
          onEdit={onEdit}
        />
      );
    });
    act(() => {
      tree!.root.findByProps({ testID: "fullscreen-photo-edit-button" }).props.onPress();
    });
    expect(onEdit).toHaveBeenCalledWith(photo);
  });

  it("calls onSetReferenceLuminance with the photo when the reference button is pressed", () => {
    const onSetReferenceLuminance = jest.fn();
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal
          isVisible
          photoUri={photo.uri}
          onClose={() => {}}
          photo={photo}
          onSetReferenceLuminance={onSetReferenceLuminance}
        />
      );
    });
    act(() => {
      tree!.root
        .findByProps({ testID: "fullscreen-photo-reference-luminance-button" })
        .props.onPress();
    });
    expect(onSetReferenceLuminance).toHaveBeenCalledWith(photo);
  });

  it("shows a spinner and disables both buttons while computing luminance", () => {
    let tree: ReturnType<typeof create>;
    act(() => {
      tree = create(
        <FullScreenPhotoModal
          isVisible
          photoUri={photo.uri}
          onClose={() => {}}
          photo={photo}
          onEdit={() => {}}
          onSetReferenceLuminance={() => {}}
          isComputingLuminance
        />
      );
    });
    expect(tree!.root.findAllByType(ActivityIndicator)).toHaveLength(1);
    expect(
      tree!.root.findByProps({ testID: "fullscreen-photo-edit-button" }).props.disabled
    ).toBe(true);
    expect(
      tree!.root.findByProps({ testID: "fullscreen-photo-reference-luminance-button" }).props
        .disabled
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest components/gallery/FullScreenPhotoModal.test.tsx`
Expected: FAIL (no `photo`/`onEdit`/`onSetReferenceLuminance` props exist yet, so the buttons are never rendered)

- [ ] **Step 3: Implement the new props and buttons**

Replace the full contents of `components/gallery/FullScreenPhotoModal.tsx` with:

```tsx
import React from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Photo } from "@/services/photoStorage";

interface FullScreenPhotoModalProps {
  isVisible: boolean;
  photoUri: string;
  onClose: () => void;
  /** Present for real gallery photos; absent for GIFs, which reuse this modal. */
  photo?: Photo;
  onEdit?: (photo: Photo) => void;
  onSetReferenceLuminance?: (photo: Photo) => void;
  isComputingLuminance?: boolean;
}

const { width, height } = Dimensions.get("window");

export const FullScreenPhotoModal: React.FC<FullScreenPhotoModalProps> = ({
  isVisible,
  photoUri,
  onClose,
  photo,
  onEdit,
  onSetReferenceLuminance,
  isComputingLuminance = false,
}) => {
  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photoUri }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
        {photo && (
          <View style={styles.actionButtons}>
            {onEdit && (
              <TouchableOpacity
                testID="fullscreen-photo-edit-button"
                style={styles.actionButton}
                onPress={() => onEdit(photo)}
                disabled={isComputingLuminance}
              >
                <Ionicons name="crop-outline" size={24} color="white" />
              </TouchableOpacity>
            )}
            {onSetReferenceLuminance && (
              <TouchableOpacity
                testID="fullscreen-photo-reference-luminance-button"
                style={styles.actionButton}
                onPress={() => onSetReferenceLuminance(photo)}
                disabled={isComputingLuminance}
              >
                {isComputingLuminance ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="sunny-outline" size={24} color="white" />
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: width,
    height: height,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  actionButtons: {
    position: "absolute",
    top: 40,
    left: 20,
    flexDirection: "row",
    gap: 16,
    zIndex: 1,
  },
  actionButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest components/gallery/FullScreenPhotoModal.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/gallery/FullScreenPhotoModal.tsx components/gallery/FullScreenPhotoModal.test.tsx
git commit -m "feat: add edit and set-reference-luminance buttons to the full-screen photo modal"
```

---

### Task 6: Wire editing and reference-luminance into the gallery screen

**Files:**
- Modify: `localization/translations.ts`
- Modify: `app/(tabs)/gallery.tsx`

**Interfaces:**
- Consumes: `updatePhoto` from `usePhotos()` (Task 4), `computeImageLuminance` from `utils/imageLuminance.ts` (Task 2), `photo`/`onEdit`/`onSetReferenceLuminance`/`isComputingLuminance` props on `FullScreenPhotoModal` (Task 5), `LightingBaselineStore.setOverride(type, value)` (existing, `services/lightingBaselineStore.ts`).
- Produces: nothing further downstream — this is the final integration point.

There's no existing test harness for screens under `app/` in this codebase (only services/utils/components are unit-tested), so this task is verified manually per Step 6 below, consistent with existing project conventions.

- [ ] **Step 1: Add the three new localization keys to the interface**

In `localization/translations.ts`, find (inside `interface TranslationKeys`, in the `gallery` block):

```ts
    invalidGifFile: string;
  };
  progress: {
```

Replace with:

```ts
    invalidGifFile: string;
    referenceLuminanceSetTitle: string;
    referenceLuminanceSetMessage: string;
    luminanceComputeError: string;
  };
  progress: {
```

- [ ] **Step 2: Add the English translations**

Find:

```ts
      invalidGifFile: "Please select a GIF file.",
    },
```

Replace with:

```ts
      invalidGifFile: "Please select a GIF file.",
      referenceLuminanceSetTitle: "Reference Set",
      referenceLuminanceSetMessage: "This photo is now your lighting reference for this pose.",
      luminanceComputeError: "Couldn't read this photo's lighting. Please try a different photo.",
    },
```

- [ ] **Step 3: Add the Spanish translations**

Find:

```ts
      invalidGifFile: "Por favor selecciona un archivo GIF.",
    },
```

Replace with:

```ts
      invalidGifFile: "Por favor selecciona un archivo GIF.",
      referenceLuminanceSetTitle: "Referencia Establecida",
      referenceLuminanceSetMessage: "Esta foto ahora es tu referencia de iluminación para esta pose.",
      luminanceComputeError: "No se pudo leer la iluminación de esta foto. Prueba con otra foto.",
    },
```

- [ ] **Step 4: Add the Italian translations**

Find:

```ts
      invalidGifFile: "Seleziona un file GIF.",
    },
```

Replace with:

```ts
      invalidGifFile: "Seleziona un file GIF.",
      referenceLuminanceSetTitle: "Riferimento Impostato",
      referenceLuminanceSetMessage: "Questa foto è ora il tuo riferimento di illuminazione per questa posa.",
      luminanceComputeError: "Impossibile leggere l'illuminazione di questa foto. Prova con un'altra foto.",
    },
```

- [ ] **Step 5: Add the German translations**

Find:

```ts
      invalidGifFile: "Bitte wähle eine GIF-Datei aus.",
    },
```

Replace with:

```ts
      invalidGifFile: "Bitte wähle eine GIF-Datei aus.",
      referenceLuminanceSetTitle: "Referenz Festgelegt",
      referenceLuminanceSetMessage: "Dieses Foto ist jetzt deine Beleuchtungsreferenz für diese Pose.",
      luminanceComputeError: "Die Beleuchtung dieses Fotos konnte nicht gelesen werden. Versuche es mit einem anderen Foto.",
    },
```

- [ ] **Step 6: Add the French translations**

Find:

```ts
      invalidGifFile: "Veuillez sélectionner un fichier GIF.",
    },
```

Replace with:

```ts
      invalidGifFile: "Veuillez sélectionner un fichier GIF.",
      referenceLuminanceSetTitle: "Référence Définie",
      referenceLuminanceSetMessage: "Cette photo est maintenant votre référence d'éclairage pour cette pose.",
      luminanceComputeError: "Impossible de lire l'éclairage de cette photo. Essayez une autre photo.",
    },
```

- [ ] **Step 7: Run the TypeScript compiler to confirm all 5 locale objects satisfy the updated interface**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `localization/translations.ts` (a missing key in any one locale block would fail to satisfy `TranslationKeys` and show up here).

- [ ] **Step 8: Add the new imports to `app/(tabs)/gallery.tsx`**

Find:

```ts
import { PendingCropResult } from "@/services/pendingCropStore";
```

Replace with:

```ts
import { LightingBaselineStore } from "@/services/lightingBaselineStore";
import { PendingCropResult } from "@/services/pendingCropStore";
import { computeImageLuminance } from "@/utils/imageLuminance";
```

- [ ] **Step 9: Add the new state**

Find:

```ts
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
```

Replace with:

```ts
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<Photo | null>(null);
  const [isComputingLuminance, setIsComputingLuminance] = useState(false);
```

- [ ] **Step 10: Pull `updatePhoto` out of `usePhotos()`**

Find:

```ts
  const {
    photos,
    addPhoto,
    removePhoto,
    refreshPhotos,
    canAddPhoto,
    isLoading: contextLoading,
    error,
  } = usePhotos();
```

Replace with:

```ts
  const {
    photos,
    addPhoto,
    updatePhoto,
    removePhoto,
    refreshPhotos,
    canAddPhoto,
    isLoading: contextLoading,
    error,
  } = usePhotos();
```

- [ ] **Step 11: Track the selected photo's record and add the edit/reference-luminance handlers**

Find:

```ts
  const openFullScreenPhoto = (photoUri: string) => {
    setSelectedPhoto(photoUri);
  };

  const closeFullScreenPhoto = () => {
    setSelectedPhoto(null);
  };
```

Replace with:

```ts
  const openFullScreenPhoto = (photoUri: string, photo?: Photo) => {
    setSelectedPhoto(photoUri);
    setSelectedPhotoRecord(photo ?? null);
  };

  const closeFullScreenPhoto = () => {
    setSelectedPhoto(null);
    setSelectedPhotoRecord(null);
  };

  const getImageSize = (uri: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
    });

  const handleEditPhoto = async (photo: Photo) => {
    try {
      const { width, height } = await getImageSize(photo.uri);

      PendingCropResult.setResolver((croppedUri, date) => {
        updatePhoto(photo.id, { uri: croppedUri, date, luminance: undefined });
      });

      closeFullScreenPhoto();
      router.push({
        pathname: "/photo-crop",
        params: {
          uri: photo.uri,
          width: String(width),
          height: String(height),
          type: photo.type,
          date: photo.date,
        },
      });
    } catch (error) {
      console.error("Error preparing photo for edit:", error);
      Alert.alert(t("common.error"), t("camera.imagePickerError") || "Error selecting image. Please try again.");
    }
  };

  const handleSetReferenceLuminance = async (photo: Photo) => {
    setIsComputingLuminance(true);
    try {
      const luminance = await computeImageLuminance(photo.uri);
      if (luminance === null) {
        Alert.alert(t("common.error"), t("gallery.luminanceComputeError"));
        return;
      }
      await LightingBaselineStore.setOverride(photo.type, luminance);
      await updatePhoto(photo.id, { luminance });
      Alert.alert(
        t("gallery.referenceLuminanceSetTitle"),
        t("gallery.referenceLuminanceSetMessage")
      );
    } finally {
      setIsComputingLuminance(false);
    }
  };
```

- [ ] **Step 12: Pass the photo record when opening the full-screen viewer from the grid**

Find:

```ts
          onPress={() => selectionMode ? togglePhotoSelection(item.id) : openFullScreenPhoto(item.uri)}
```

Replace with:

```ts
          onPress={() => selectionMode ? togglePhotoSelection(item.id) : openFullScreenPhoto(item.uri, item)}
```

- [ ] **Step 13: Wire the new props into `FullScreenPhotoModal`**

Find:

```tsx
        <FullScreenPhotoModal
          isVisible={!!selectedPhoto}
          photoUri={selectedPhoto || ""}
          onClose={closeFullScreenPhoto}
        />
```

Replace with:

```tsx
        <FullScreenPhotoModal
          isVisible={!!selectedPhoto}
          photoUri={selectedPhoto || ""}
          onClose={closeFullScreenPhoto}
          photo={selectedPhotoRecord ?? undefined}
          onEdit={handleEditPhoto}
          onSetReferenceLuminance={handleSetReferenceLuminance}
          isComputingLuminance={isComputingLuminance}
        />
```

- [ ] **Step 14: Run the TypeScript compiler and the full test suite**

Run: `npx tsc --noEmit && npx jest`
Expected: no type errors; all test suites pass, including the ones added in Tasks 2, 3, and 5.

- [ ] **Step 15: Manual verification in the running app**

Start the app (`npx expo start` with your existing dev client) and check:
1. Open the gallery, tap a photo thumbnail, tap the new crop-outline "Edit" button. Adjust the crop and confirm. Back in the gallery, the same thumbnail should show the new crop (not the old one) and stay in the same position/date in its section.
2. Open a GIF from the gallery's GIFs section — confirm neither the Edit nor the sun icon appear (only Close).
3. Open a photo, tap the sun icon ("set as reference luminance"). Confirm a success alert appears, then go to the camera screen for that photo's pose (front/side/back) and confirm the lighting indicator now compares against this reading (e.g. tap "Recalibrate" beforehand on a different reading, then verify the gallery-set value takes over — the indicator's matched/close/off state should reflect the newly set baseline).
4. Force a failure path if convenient (e.g. temporarily point `computeImageLuminance` at a non-image URI) to confirm the error alert appears instead of a silent failure or crash — then revert.

- [ ] **Step 16: Commit**

```bash
git add localization/translations.ts "app/(tabs)/gallery.tsx"
git commit -m "feat: let users edit existing photos and set any photo as the lighting reference"
```
