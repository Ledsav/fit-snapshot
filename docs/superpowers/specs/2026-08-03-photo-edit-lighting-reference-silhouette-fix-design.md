# Photo edit, on-demand lighting reference, and silhouette scaling fix

## Overview

Three related changes to the camera/gallery/lighting subsystem:

1. Let users re-crop any existing gallery photo using the same crop tool used for imports.
2. Let a user pick any existing photo and explicitly set it as the lighting reference for its pose, instead of the reference only ever coming from a live camera capture.
3. Fix the silhouette guide rendering far too large in the crop tool compared to the live camera view.

## Feature 1 — Edit existing photos

Currently `/photo-crop` (`app/photo-crop.tsx` + `components/camera/PhotoCropStage.tsx`) is only ever reached from the camera screen's or gallery's "import from library" flow, and always results in a brand-new `Photo` via `addPhoto`. This feature reuses that exact same screen for editing a photo that's already saved, replacing it in place instead of creating a new entry.

### `components/gallery/FullScreenPhotoModal.tsx`
- New optional props: `photo?: Photo`, `onEdit?: (photo: Photo) => void`.
- When `photo` and `onEdit` are both present, render an Edit icon button (`Ionicons "crop-outline"`) alongside the existing Close button. Absent for GIFs, which pass no `photo`.

### `app/(tabs)/gallery.tsx`
- `openFullScreenPhoto` takes an optional second argument, the `Photo` record, stored in a new `selectedPhotoRecord` state alongside the existing `selectedPhoto` (uri) state. Grid-item taps pass the record; GIF taps don't.
- New `handleEditPhoto(photo: Photo)`:
  1. Resolve the photo's current pixel dimensions with `Image.getSize` (wrapped in a promise) — `Photo` doesn't store width/height today.
  2. `PendingCropResult.setResolver((croppedUri, date) => { updatePhoto(photo.id, { uri: croppedUri, date, luminance: undefined }); })`. `luminance` is explicitly cleared because cropping changes which pixels fall in the background-corner sample regions, so any previously-cached value is no longer valid for this file.
  3. Close the full-screen modal, then `router.push("/photo-crop", { params: { uri: photo.uri, width, height, type: photo.type, date: photo.date } })` — identical route/params shape already used for imports, so `PhotoCropStage` needs no changes.
- Wired into `FullScreenPhotoModal` as `onEdit={handleEditPhoto}`.

### `services/photoStorage.ts`
New `updatePhoto(id: string, updates: { uri?: string; date?: string; luminance?: number }): Promise<Photo>`:
- Loads the stored array, finds the entry by `id` (throws if missing).
- If `updates.uri` is given: saves it to the photo directory under a **new** filename (reusing the existing `savePhotoToDevice` helper, same naming scheme as `savePhoto`) and deletes the old physical file. A new filename is required — reusing the old one would leave `<Image>` showing a stale cached thumbnail after the edit, since RN caches by URI.
- Merges `date` if given.
- Luminance uses `'luminance' in updates` (not a truthiness/undefined check) to distinguish "field not touched" from "explicitly cleared to undefined" — the edit-crop flow needs the latter.
- Persists the merged array back to `AsyncStorage` and returns the updated `Photo`.

### `context/PhotoContext.tsx`
New `updatePhoto(id, updates): Promise<{success: boolean; error?: string}>` following the existing `addPhoto`/`removePhoto` pattern: calls the storage function, on success replaces the matching entry in local `photos` state, surfaces errors the same way.

## Feature 2 — On-demand "set as reference luminance"

Today `Photo.luminance` is only ever populated from a live camera-frame reading at shutter time (`hooks/useLightingIndicator.ts`), and the lighting baseline (`services/lightingService.ts#resolveBaseline`) either uses a manual per-pose override (`services/lightingBaselineStore.ts`, set today only via the camera screen's "Recalibrate" button using the live frame) or the earliest photo that happens to have a `luminance` value. Imported/older photos can never become a reference.

### New `utils/imageLuminance.ts`
`computeImageLuminance(uri: string): Promise<number | null>`:
1. `expo-image-manipulator`'s `manipulateAsync(uri, [{ resize: { width: 100 } }], { format: SaveFormat.JPEG, base64: true })` — downsizes for a cheap decode; aspect ratio is preserved so the fractional sample regions below stay valid.
2. Decode the base64 JPEG bytes with `jpeg-js` (`base64-js` for base64 → `Uint8Array`) to get RGBA pixel data.
3. Average luma (`0.299R + 0.587G + 0.114B`) over the same `DEFAULT_BG_REGIONS` corner fractions already defined in `services/lightingService.ts` for live-camera sampling, then `normalizeLuma(...)` to 0–1.
4. Returns `null` on any failure (bad file, decode error) — callers must treat this as "couldn't compute," not throw.

New dependencies: `jpeg-js`, `base64-js` — both pure JS, no native code, no dev-client rebuild required.

### `components/gallery/FullScreenPhotoModal.tsx`
- New optional prop `onSetReferenceLuminance?: (photo: Photo) => void`, plus an `isComputingLuminance?: boolean` prop to show a spinner in place of the icon and disable both new buttons while pending.
- Renders a second icon button (`Ionicons "sunny-outline"`) next to Edit, shown under the same `photo` presence condition.

### `app/(tabs)/gallery.tsx`
New `handleSetReferenceLuminance(photo: Photo)`:
1. Set `isComputingLuminance = true`.
2. `computeImageLuminance(photo.uri)`. If `null`, `Alert.alert` with a new error message key and stop.
3. `LightingBaselineStore.setOverride(photo.type, luminance)` — the exact same store the camera screen's existing "Recalibrate" button writes to, so this photo's reading becomes the live baseline for that pose immediately.
4. `updatePhoto(photo.id, { luminance })` — cache the value on the record so it isn't recomputed if pressed again, and so it can still serve as a fallback baseline via `resolveBaseline` if the override is ever cleared.
5. `Alert.alert` success confirmation.
6. `isComputingLuminance = false` in a `finally`.

No automatic computation anywhere else — not on import, not on edit-confirm, no background backfill pass. Luminance for non-camera-capture photos is set only when the user explicitly presses this button.

### Localization
Three new keys needed across the interface and all 5 locale blocks in `localization/translations.ts`:
- `gallery.referenceLuminanceSetTitle`
- `gallery.referenceLuminanceSetMessage`
- `gallery.luminanceComputeError`

## Feature 3 — Silhouette scaling fix

### Root cause
`images/TorsoSilhouette.js` sizes its overlay image using `Dimensions.get("window")` (the full device screen, captured once at module load) — `width: width * 0.8, height: height * 0.6` — regardless of the container it's actually placed in.

- In the live camera screen (`app/(tabs)/camera.tsx`), the overlay's container happens to be the full screen, so the sizing is coincidentally correct.
- In `PhotoCropStage`, the same component is nested inside a much smaller inset 3:4 frame box (`FRAME_WIDTH`/`FRAME_HEIGHT`, well under the full screen), but it still sizes itself from the full-screen dimensions — overflowing the frame, exactly matching the reported "way bigger" symptom.

### Fix
In `images/TorsoSilhouette.js`, replace the fixed pixel dimensions with percentages of the immediate parent (`width: "80%", height: "60%"`) and remove the `Dimensions` import/usage entirely. The existing wrapper `View` already absolutely fills its parent, so the percentages resolve against whatever box the caller places it in — the full screen live, the small frame in the crop tool — keeping proportions consistent in both places automatically. No prop threading or call-site changes needed.

`components/camera/AlignmentOverlay.test.tsx` only asserts on the opacity value and ghost-photo URI presence, not on layout, so it's unaffected.

## Testing

- Unit tests for `computeImageLuminance` (mock `manipulateAsync` and `jpeg-js`; verify region-fraction math and that decode/file errors resolve to `null`, not a thrown exception).
- Unit tests for `photoStorage.updatePhoto`: file gets replaced under a new name, old file deleted, `luminance` correctly distinguishes "untouched" vs. "explicitly cleared" via the `'luminance' in updates` check.
- Existing `AlignmentOverlay.test.tsx` should keep passing unchanged.
- Manual verification in the running app:
  - Edit an existing gallery photo end-to-end; confirm the thumbnail updates (not stale-cached) and its position/date in the gallery reflects the edit.
  - Press "Set as reference luminance" on an imported photo; confirm the camera screen's lighting indicator now uses it as the baseline for that pose.
  - Visually compare the silhouette's proportions in the live camera view vs. the crop tool — should now look consistent.
