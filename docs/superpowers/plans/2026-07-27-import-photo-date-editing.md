# Import Photo Date Extraction & Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a user imports a photo from the gallery (via either the camera tab or the gallery tab), the saved photo is dated from the image's own metadata (EXIF → file mtime → media-library creation time) instead of "today," and the user can edit that date on the crop screen before confirming.

**Architecture:** A new pure+async utility (`utils/photoDate.ts`) unifies the metadata-extraction fallback chain that today only half-exists in `gallery.tsx`. The shared `/photo-crop` route (already pushed by both import flows) becomes the single owner of the final date: it seeds local state from the extracted date, lets the user edit the day via a native date picker, and returns the final ISO date alongside the cropped URI through the existing `PendingCropResult` bridge (extended to carry two values instead of one).

**Tech Stack:** React Native / Expo Router, `expo-image-picker`, `expo-file-system/legacy`, `expo-media-library/legacy`, `@react-native-community/datetimepicker` (already an installed, currently-unused dependency), Jest (`jest-expo` preset).

## Global Constraints

- Android-only launch — no iOS-specific picker styling to worry about.
- Only the calendar day is editable on the crop screen; time-of-day is preserved from whatever the date was seeded with (EXIF/file/media-library time, or "now").
- The date picker's `maximumDate` is today — a progress photo can't be dated in the future.
- Camera-captured (non-imported) photos never route through `/photo-crop` and keep dating themselves as "now" — out of scope.
- No co-authored-by trailer in commits (project convention).

---

### Task 1: `utils/photoDate.ts` — date parsing and extraction utility

**Files:**
- Create: `utils/photoDate.ts`
- Test: `utils/photoDate.test.ts`

**Interfaces:**
- Produces: `parsePhotoDateString(raw?: string | null): Date` — pure, sync.
- Produces: `extractPhotoDate(asset: ImagePicker.ImagePickerAsset): Promise<string | null>` — async, returns an ISO string or `null`.

- [ ] **Step 1: Write failing tests for `parsePhotoDateString`**

Create `utils/photoDate.test.ts`:

```ts
import { parsePhotoDateString } from "./photoDate";

describe("parsePhotoDateString", () => {
  it("parses an already-ISO date string", () => {
    const result = parsePhotoDateString("2025-07-22T10:15:00.000Z");
    expect(result.toISOString()).toBe("2025-07-22T10:15:00.000Z");
  });

  it("parses a raw EXIF-format date string", () => {
    const result = parsePhotoDateString("2024:03:05 08:30:00");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2); // 0-indexed: March
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(30);
  });

  it("falls back to now when given undefined", () => {
    const before = Date.now();
    const result = parsePhotoDateString(undefined);
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it("falls back to now when given an empty string", () => {
    const before = Date.now();
    const result = parsePhotoDateString("");
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it("falls back to now when given unparseable garbage", () => {
    const before = Date.now();
    const result = parsePhotoDateString("not a date");
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest utils/photoDate.test.ts`
Expected: FAIL — `Cannot find module './photoDate'`

- [ ] **Step 3: Implement `parsePhotoDateString`**

Create `utils/photoDate.ts`:

```ts
export function parsePhotoDateString(raw?: string | null): Date {
  if (!raw) return new Date();

  const normalized =
    raw.includes("T") && raw.includes("Z")
      ? raw
      : raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3");

  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest utils/photoDate.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add utils/photoDate.ts utils/photoDate.test.ts
git commit -m "feat: add parsePhotoDateString utility for EXIF/ISO date parsing"
```

- [ ] **Step 6: Write failing tests for `extractPhotoDate`**

Append to `utils/photoDate.test.ts` (add these imports at the top of the file alongside the existing one, and this new `describe` block at the bottom):

```ts
import { parsePhotoDateString, extractPhotoDate } from "./photoDate";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock("expo-media-library/legacy", () => ({
  getAssetsAsync: jest.fn(),
  SortBy: { creationTime: "creationTime" },
}));

const makeAsset = (overrides: Partial<{ uri: string; exif: Record<string, any> | null }> = {}) => ({
  uri: "file://photo.jpg",
  width: 100,
  height: 100,
  exif: null,
  ...overrides,
});

describe("extractPhotoDate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses EXIF DateTimeOriginal when present", async () => {
    const asset = makeAsset({ exif: { DateTimeOriginal: "2023:01:15 12:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2023:01:15 12:00:00").toISOString());
    expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
  });

  it("falls back to EXIF DateTime when DateTimeOriginal is absent", async () => {
    const asset = makeAsset({ exif: { DateTime: "2022:06:01 09:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2022:06:01 09:00:00").toISOString());
  });

  it("falls back to EXIF DateTimeDigitized when the others are absent", async () => {
    const asset = makeAsset({ exif: { DateTimeDigitized: "2021:12:25 00:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2021:12:25 00:00:00").toISOString());
  });

  it("falls back to file modification time when no EXIF date is present", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      modificationTime: 1700000000,
    });
    const asset = makeAsset({ exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
    expect(MediaLibrary.getAssetsAsync).not.toHaveBeenCalled();
  });

  it("falls back to MediaLibrary creation time when neither EXIF nor file mtime is available", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue({
      assets: [{ filename: "photo.jpg", uri: "file://other.jpg", creationTime: 1650000000000 }],
    });
    const asset = makeAsset({ uri: "file://photo.jpg", exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1650000000000).toISOString());
  });

  it("returns null when nothing is found", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue({ assets: [] });
    const asset = makeAsset({ exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBeNull();
  });

  it("returns null when file and media-library lookups throw", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error("fs error"));
    (MediaLibrary.getAssetsAsync as jest.Mock).mockRejectedValue(new Error("ml error"));
    const asset = makeAsset({ exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 7: Run the tests to verify they fail**

Run: `npx jest utils/photoDate.test.ts`
Expected: FAIL — `extractPhotoDate` is not exported / not a function

- [ ] **Step 8: Implement `extractPhotoDate`**

Add to `utils/photoDate.ts` (below `parsePhotoDateString`):

```ts
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library/legacy";

export async function extractPhotoDate(
  asset: ImagePicker.ImagePickerAsset
): Promise<string | null> {
  const exifDate =
    asset.exif?.DateTimeOriginal ??
    asset.exif?.DateTime ??
    asset.exif?.DateTimeDigitized ??
    null;

  if (exifDate) {
    return parsePhotoDateString(exifDate).toISOString();
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(asset.uri);
    if (fileInfo.exists && fileInfo.modificationTime) {
      return new Date(fileInfo.modificationTime * 1000).toISOString();
    }
  } catch (error) {
    console.log("extractPhotoDate: could not read file info", error);
  }

  try {
    const assets = await MediaLibrary.getAssetsAsync({
      first: 1000,
      sortBy: MediaLibrary.SortBy.creationTime,
    });
    const matchedAsset = assets.assets.find(
      (a) => asset.uri.includes(a.filename) || a.uri === asset.uri
    );
    if (matchedAsset && matchedAsset.creationTime) {
      return new Date(matchedAsset.creationTime).toISOString();
    }
  } catch (error) {
    console.log("extractPhotoDate: could not query MediaLibrary", error);
  }

  return null;
}
```

Put the two new imports (`FileSystem`, `MediaLibrary`) and the existing `ImagePicker` type-only usage at the top of the file, above `parsePhotoDateString`.

- [ ] **Step 9: Run the tests to verify they pass**

Run: `npx jest utils/photoDate.test.ts`
Expected: PASS (12 tests total)

- [ ] **Step 10: Commit**

```bash
git add utils/photoDate.ts utils/photoDate.test.ts
git commit -m "feat: add extractPhotoDate EXIF/file/media-library fallback chain"
```

---

### Task 2: `services/pendingCropStore.ts` — carry the date through the resolver

**Files:**
- Modify: `services/pendingCropStore.ts` (full file, 23 lines)
- Modify: `services/pendingCropStore.test.ts` (full file, 31 lines)

**Interfaces:**
- Produces: `PendingCropResult.setResolver(fn: (uri: string, date: string) => void): void`
- Produces: `PendingCropResult.resolve(uri: string, date: string): void`
- Produces: `PendingCropResult.clear(): void` (unchanged)

- [ ] **Step 1: Update the test file for the two-arg signature**

Replace the full contents of `services/pendingCropStore.test.ts`:

```ts
import { PendingCropResult } from "./pendingCropStore";

describe("PendingCropResult", () => {
  afterEach(() => {
    PendingCropResult.clear();
  });

  it("does nothing when resolve is called with no resolver registered", () => {
    expect(() =>
      PendingCropResult.resolve("file://x.jpg", "2025-07-22T00:00:00.000Z")
    ).not.toThrow();
  });

  it("invokes the registered resolver exactly once with the given uri and date", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.resolve("file://cropped.jpg", "2025-07-22T00:00:00.000Z");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("file://cropped.jpg", "2025-07-22T00:00:00.000Z");

    PendingCropResult.resolve("file://again.jpg", "2025-01-01T00:00:00.000Z");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clear() prevents a registered resolver from firing", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.clear();
    PendingCropResult.resolve("file://cropped.jpg", "2025-07-22T00:00:00.000Z");
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest services/pendingCropStore.test.ts`
Expected: FAIL — `expect(fn).toHaveBeenCalledWith(...)` mismatch (current resolver only receives one arg)

- [ ] **Step 3: Update the implementation**

Replace the full contents of `services/pendingCropStore.ts`:

```ts
type CropResolver = (uri: string, date: string) => void;

let resolver: CropResolver | null = null;

// Bridges a cropped-photo result back to whichever screen (camera or
// gallery) pushed the shared /photo-crop route, since expo-router has no
// built-in way to return a value from a pushed screen.
export const PendingCropResult = {
  setResolver(fn: CropResolver): void {
    resolver = fn;
  },

  resolve(uri: string, date: string): void {
    const fn = resolver;
    resolver = null;
    fn?.(uri, date);
  },

  clear(): void {
    resolver = null;
  },
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest services/pendingCropStore.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add services/pendingCropStore.ts services/pendingCropStore.test.ts
git commit -m "feat: carry the photo date through PendingCropResult alongside the uri"
```

---

### Task 3: `app/photo-crop.tsx` — editable date UI

**Files:**
- Modify: `app/photo-crop.tsx` (full file, 135 lines — rewritten below)

**Interfaces:**
- Consumes: `parsePhotoDateString(raw?: string | null): Date` from `@/utils/photoDate` (Task 1).
- Consumes: `PendingCropResult.resolve(uri: string, date: string): void` from `@/services/pendingCropStore` (Task 2).
- No new exports — this is a screen component (default export unchanged).

This screen has no existing automated test (screens in this codebase are verified manually, not unit-tested — see `components/camera/AlignmentOverlay.test.tsx` etc. for the kind of thing that *does* get a test: small reusable components, not routed screens). Verification for this task is a manual run-through (Step 3 below).

- [ ] **Step 1: Replace the full contents of `app/photo-crop.tsx`**

```tsx
import { PhotoCropStage, PhotoCropStageHandle } from "@/components/camera/PhotoCropStage";
import { Button } from "@/components/ui";
import Colors from "@/constants/Colors";
import { borderRadius, spacing } from "@/constants/DesignSystem";
import { useLocalization } from "@/context/LocalizationContext";
import { usePhotos } from "@/context/PhotoContext";
import { useTheme } from "@/context/ThemeContext";
import { PhotoType } from "@/enums/Photos";
import { GhostOverlayStore } from "@/services/ghostOverlayStore";
import { PendingCropResult } from "@/services/pendingCropStore";
import { parsePhotoDateString } from "@/utils/photoDate";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
  const [date, setDate] = useState(() => parsePhotoDateString(params.date));
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

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

  const handleDateChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    setIsDatePickerVisible(false);
    setDate((prev) => {
      const merged = new Date(prev);
      merged.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      return merged;
    });
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
      PendingCropResult.resolve(result.uri, date.toISOString());
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
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setIsDatePickerVisible(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="white" />
          <Text style={styles.dateText}>{formatDate(date)}</Text>
        </TouchableOpacity>
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
      {isDatePickerVisible && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onValueChange={handleDateChange}
          onDismiss={() => setIsDatePickerVisible(false)}
        />
      )}
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.round,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  dateText: {
    color: "white",
    fontWeight: "600",
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

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `app/photo-crop.tsx`

- [ ] **Step 3: Manual verification**

Run the app (`npx expo start`, or the existing dev workflow), go to the Gallery tab → Add Photo → pick an image with EXIF data → confirm the type-selection modal → on the crop screen, verify:
- The date pill above the hint text shows the photo's actual capture date (not today), formatted like "Jul 22, 2025".
- Tapping the pill opens the native Android date picker, capped at today.
- Picking an earlier date updates the pill's text immediately.
- Cropping and confirming saves the photo with the edited date (check it lands in the correct date group in the gallery's Timeline view).
- Cancelling the picker (back button / outside tap) leaves the previously-shown date unchanged.

- [ ] **Step 4: Commit**

```bash
git add app/photo-crop.tsx
git commit -m "feat: let the user edit the photo date on the crop screen"
```

---

### Task 4: `app/(tabs)/camera.tsx` — wire up extraction + the two-arg resolver

**Files:**
- Modify: `app/(tabs)/camera.tsx:22` (imports)
- Modify: `app/(tabs)/camera.tsx:253-282` (`confirmPicture`)
- Modify: `app/(tabs)/camera.tsx:289-334` (`pickImage`)

**Interfaces:**
- Consumes: `extractPhotoDate(asset: ImagePicker.ImagePickerAsset): Promise<string | null>` from `@/utils/photoDate` (Task 1).
- Consumes: `PendingCropResult.setResolver(fn: (uri: string, date: string) => void): void` from `@/services/pendingCropStore` (Task 2).

No automated test for this file (screen component, same rationale as Task 3) — verified manually in Step 4.

- [ ] **Step 1: Add the `extractPhotoDate` import**

In `app/(tabs)/camera.tsx`, find this existing line (currently line 22):

```tsx
import { PendingCropResult } from "@/services/pendingCropStore";
```

Add immediately after it:

```tsx
import { extractPhotoDate } from "@/utils/photoDate";
```

- [ ] **Step 2: Simplify `confirmPicture`**

Find the current `confirmPicture` function (currently lines 253-282):

```tsx
  const confirmPicture = async () => {
    if (capturedImage) {
      let photoDate = new Date().toISOString();

      if (importedPhotoDate) {
        try {
          const dateStr = importedPhotoDate.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) {
            photoDate = parsedDate.toISOString();
          }
        } catch (error) {
          console.error("Error parsing imported photo date:", error);
        }
      }

      const newPhoto = {
        id: Date.now().toString(),
        uri: capturedImage,
        date: photoDate,
        type: overlay,
        // Imported photos have no live reading; only camera captures carry one.
        luminance: isImported ? undefined : capturedLuma,
      };
      await addPhoto(newPhoto);
      setCapturedImage(null);
      setImportedPhotoDate(null);
      router.push("/(tabs)/gallery");
    }
  };
```

Replace it with:

```tsx
  const confirmPicture = async () => {
    if (capturedImage) {
      const photoDate = importedPhotoDate ?? new Date().toISOString();

      const newPhoto = {
        id: Date.now().toString(),
        uri: capturedImage,
        date: photoDate,
        type: overlay,
        // Imported photos have no live reading; only camera captures carry one.
        luminance: isImported ? undefined : capturedLuma,
      };
      await addPhoto(newPhoto);
      setCapturedImage(null);
      setImportedPhotoDate(null);
      router.push("/(tabs)/gallery");
    }
  };
```

(`importedPhotoDate` now always holds an already-ISO string coming straight from `PendingCropResult`'s resolver — see Step 3 — so no re-parsing is needed here.)

- [ ] **Step 3: Update `pickImage` to use `extractPhotoDate` and the two-arg resolver**

Find the current `pickImage` function (currently lines 289-334):

```tsx
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

Replace it with:

```tsx
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
        const isoDate = await extractPhotoDate(selectedAsset);

        PendingCropResult.setResolver((croppedUri, date) => {
          setIsImported(true);
          setCapturedImage(croppedUri);
          setImportedPhotoDate(date);
        });

        router.push({
          pathname: "/photo-crop",
          params: {
            uri: selectedAsset.uri,
            width: String(selectedAsset.width),
            height: String(selectedAsset.height),
            type: overlay,
            date: isoDate ?? "",
          },
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };
```

- [ ] **Step 4: Type-check and manually verify**

Run: `npx tsc --noEmit`
Expected: no errors in `app/(tabs)/camera.tsx`

Manual check: Camera tab → gallery-import icon → pick a photo with known EXIF date → crop screen shows that date → edit it → confirm → the photo lands in the app's gallery with the edited date (check Gallery tab's Timeline view).

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/camera.tsx"
git commit -m "feat: use extractPhotoDate and the crop screen's edited date in camera import"
```

---

### Task 5: `app/(tabs)/gallery.tsx` — wire up extraction + the two-arg resolver

**Files:**
- Modify: `app/(tabs)/gallery.tsx:29,31` (remove now-unused imports)
- Modify: `app/(tabs)/gallery.tsx:1-46` (add `extractPhotoDate` import)
- Modify: `app/(tabs)/gallery.tsx:264-363` (`pickImage`)
- Modify: `app/(tabs)/gallery.tsx:365-426` (`handleTypeSelection`)

**Interfaces:**
- Consumes: `extractPhotoDate(asset: ImagePicker.ImagePickerAsset): Promise<string | null>` from `@/utils/photoDate` (Task 1).
- Consumes: `PendingCropResult.setResolver(fn: (uri: string, date: string) => void): void` from `@/services/pendingCropStore` (Task 2).

No automated test for this file (screen component) — verified manually in Step 5.

- [ ] **Step 1: Swap the `FileSystem`/`MediaLibrary` imports for `extractPhotoDate`**

Find these two existing lines (currently lines 29 and 31):

```tsx
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library/legacy';
```

Replace with:

```tsx
import * as ImagePicker from 'expo-image-picker';
import { extractPhotoDate } from "@/utils/photoDate";
```

(`FileSystem` and `MediaLibrary` are only used inside `pickImage`, which Step 2 rewrites to no longer call them directly — the fallback chain now lives in `extractPhotoDate`.)

- [ ] **Step 2: Simplify `pickImage`**

Find the current `pickImage` function (currently lines 264-363):

```tsx
  const pickImage = async () => {
    
    const storageCheck = canAddPhoto();
    if (!storageCheck.allowed) {
      setIsPaywallVisible(true);
      return;
    }

    try {
      const { status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

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
        setPendingImageUri(selectedAsset.uri);
        setPendingImageWidth(selectedAsset.width);
        setPendingImageHeight(selectedAsset.height);


        console.log('Selected asset EXIF data:', selectedAsset.exif);
        console.log('Selected asset full data:', selectedAsset);

        
        let dateFromExif = null;
        if (selectedAsset.exif) {
          dateFromExif = selectedAsset.exif.DateTimeOriginal ||
                         selectedAsset.exif.DateTime ||
                         selectedAsset.exif.DateTimeDigitized;
        }

        if (dateFromExif) {
          console.log('Found EXIF date:', dateFromExif);
          setPendingImageDate(dateFromExif);
        } else {
          
          let fileDate = null;

          try {
            
            const fileInfo = await FileSystem.getInfoAsync(selectedAsset.uri);
            console.log('File info:', fileInfo);

            if (fileInfo.exists && fileInfo.modificationTime) {
              fileDate = new Date(fileInfo.modificationTime * 1000).toISOString();
              console.log('Using file modification time:', fileDate);
            }
          } catch (error) {
            console.log('Could not get file info:', error);
          }

          
          if (fileDate) {
            setPendingImageDate(fileDate);
          } else {
            try {
              
              const assets = await MediaLibrary.getAssetsAsync({
                first: 1000,
                sortBy: MediaLibrary.SortBy.creationTime,
              });

              
              const matchedAsset = assets.assets.find(asset =>
                selectedAsset.uri.includes(asset.filename) ||
                asset.uri === selectedAsset.uri
              );

              if (matchedAsset && matchedAsset.creationTime) {
                const creationDate = new Date(matchedAsset.creationTime).toISOString();
                console.log('Found asset in MediaLibrary with creation time:', creationDate);
                setPendingImageDate(creationDate);
              } else {
                console.log('No date metadata found, will use current date');
                setPendingImageDate(null);
              }
            } catch (error) {
              console.log('Could not access MediaLibrary:', error);
              setPendingImageDate(null);
            }
          }
        }

        
        setIsTypeSelectionVisible(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };
```

Replace it with:

```tsx
  const pickImage = async () => {

    const storageCheck = canAddPhoto();
    if (!storageCheck.allowed) {
      setIsPaywallVisible(true);
      return;
    }

    try {
      const { status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

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
        setPendingImageUri(selectedAsset.uri);
        setPendingImageWidth(selectedAsset.width);
        setPendingImageHeight(selectedAsset.height);

        const isoDate = await extractPhotoDate(selectedAsset);
        setPendingImageDate(isoDate);

        setIsTypeSelectionVisible(true);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      alert(t("camera.imagePickerError") || 'Error selecting image. Please try again.');
    }
  };
```

- [ ] **Step 3: Simplify `handleTypeSelection`**

Find the current `handleTypeSelection` function (currently lines 365-426):

```tsx
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
    });

    setIsTypeSelectionVisible(false);

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

Replace it with:

```tsx
  const handleTypeSelection = async (type: PhotoType) => {
    if (!pendingImageUri || !pendingImageWidth || !pendingImageHeight) return;

    const uri = pendingImageUri;
    const width = pendingImageWidth;
    const height = pendingImageHeight;
    const initialDate = pendingImageDate;

    PendingCropResult.setResolver((croppedUri, date) => {
      addPhoto({
        id: Date.now().toString(),
        uri: croppedUri,
        date,
        type,
      });
      setPendingImageUri(null);
      setPendingImageWidth(null);
      setPendingImageHeight(null);
      setPendingImageDate(null);
    });

    setIsTypeSelectionVisible(false);

    router.push({
      pathname: "/photo-crop",
      params: {
        uri,
        width: String(width),
        height: String(height),
        type,
        date: initialDate ?? "",
      },
    });
  };
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `app/(tabs)/gallery.tsx`

- [ ] **Step 5: Manual verification**

Gallery tab → floating "+" button → Add Photo → pick a photo → select a pose type → on the crop screen, verify the date pill shows the photo's real capture date → edit it → confirm → verify the photo appears under the edited date in the Timeline view.

Also spot-check the fallback chain: pick a screenshot or a photo with no EXIF data (e.g. one saved without location/camera metadata) and confirm the pill still shows a sensible date (file mtime or media-library creation time) rather than silently defaulting to today.

- [ ] **Step 6: Commit**

```bash
git add "app/(tabs)/gallery.tsx"
git commit -m "feat: use extractPhotoDate and the crop screen's edited date in gallery import"
```

---

## Post-plan check

After Task 5, run the full test suite once to confirm nothing else broke:

Run: `npx jest`
Expected: all suites pass, including the new/updated `utils/photoDate.test.ts` and `services/pendingCropStore.test.ts`.
