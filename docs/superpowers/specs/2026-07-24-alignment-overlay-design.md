# Camera & Import Alignment Overlay — Design

Date: 2026-07-24

## Context

Two related asks:

1. When importing a photo from the gallery, the user currently gets the native OS cropper (`ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3,4] })`), which cannot be overlaid with anything — it's a separate native surface outside the RN render tree. The user wants to be able to align an imported photo against the same silhouette guide the live camera shows.
2. In the live camera, the silhouette overlay (`images/TorsoSilhouette.js`) is currently a generic flat PNG shape per pose type (front/side/back), hardcoded at `opacity: 0.3`. The user wants the option to use their own **first photo** of the selected pose type as a low-opacity "ghost" overlay instead, so later photos can be aligned to their actual body/framing rather than a generic silhouette.

Both features are covered by one implementation, since the import screen's overlay should mirror whatever mode is active in the camera.

## 1. Camera ghost overlay

**New component:** `components/camera/AlignmentOverlay.tsx`

Props: `{ type: PhotoType; ghostPhoto?: Photo }`

- If `ghostPhoto` is provided, renders that photo's `Image` in place of the flat silhouette, at `opacity: overlayOpacity.subtle` (0.15 — the app's existing lowest design-system opacity token), in the same centered box as today's `TorsoSilhouette` (`width*0.8 × height*0.6`, `resizeMode: "contain"`, wrapped in `pointerEvents="none"`).
- If `ghostPhoto` is absent, renders the existing `TorsoSilhouette` (generic shape) — this is the fallback both when ghost mode is off and when ghost mode is on but no first photo exists yet for the selected type.
- `TorsoSilhouette` itself is unchanged; `AlignmentOverlay` wraps/supersedes it as the thing both `camera.tsx` and the new crop screen render.

**New store:** `services/ghostOverlayStore.ts`, same tiny AsyncStorage-wrapper shape as the existing `services/lightingBaselineStore.ts`:

```ts
export const GhostOverlayStore = {
  async getEnabled(): Promise<boolean> { ... }, // key: "ghostOverlay.enabled"
  async setEnabled(value: boolean): Promise<void> { ... },
};
```

One global boolean (not per-type) — persists across app sessions.

**`app/(tabs)/camera.tsx` changes:**

- New state `ghostModeEnabled: boolean`, loaded from `GhostOverlayStore.getEnabled()` on mount, written back via `GhostOverlayStore.setEnabled()` whenever toggled.
- New toggle button rendered next to `renderOverlaySelector()` (the front/side/back buttons) — a ghost/eye icon (`Ionicons`) that flips `ghostModeEnabled`.
- `renderSilhouette()` (currently `camera.tsx:287-291`) changes to:
  ```tsx
  const ghostPhoto = ghostModeEnabled ? getPhotosByType(overlay)[0] : undefined;
  <AlignmentOverlay type={overlay} ghostPhoto={ghostPhoto} />
  ```
  `getPhotosByType` already exists on `PhotoContext` and is already destructured in scope elsewhere in the file; `[0]` is the earliest (first) photo of that type since `getPhotosByType` sorts ascending by date.

No changes to `PhotoContext`/`photoStorage` — existing `getPhotosByType` is sufficient.

## 2. In-app crop screen for imports

Two independent screens currently import from the gallery, with different flows around the picker:

- **`app/(tabs)/camera.tsx`** (`pickImage()`, lines 248-285): the pose `type` is already known (the `overlay` state, selected via the front/side/back buttons) *before* picking. After picking, it goes straight to the existing local-state `capturedImage` confirm/review step (retake/confirm), same as a live capture.
- **`app/(tabs)/gallery.tsx`** (`pickImage()` / `handleTypeSelection()`, lines 260-412): the pose `type` is *not* known before picking — the user picks an image first, then a type-selection modal (`isTypeSelectionVisible`) asks which pose it is, and `handleTypeSelection` currently calls `addPhoto` directly with no review step.

Because both screens need the same crop+overlay UI but at different points in otherwise-different flows, the crop stage is a **shared route** (`app/photo-crop.tsx`), pushed by whichever screen has just learned the `type` — immediately after picking for camera, immediately after the type-selection modal for gallery.

**Returning the result:** expo-router has no built-in way to return a value from a pushed screen. New module **`services/pendingCropStore.ts`** — in-memory only (not persisted), a one-shot callback registry:

```ts
export const PendingCropResult = {
  setResolver(fn: (uri: string) => void): void { ... },
  resolve(uri: string): void { ... }, // calls the registered fn, then clears it
  clear(): void { ... },
};
```

Each caller calls `PendingCropResult.setResolver(...)` with its own follow-up logic immediately before `router.push('/photo-crop', ...)`. `app/photo-crop.tsx` calls `PendingCropResult.resolve(croppedUri)` on confirm (or `.clear()` on cancel), then `router.back()` — control returns to the exact same caller instance with its existing local state intact.

**`pickImage()` in `camera.tsx` changes:**

- Drop `allowsEditing: true, aspect: [3, 4]` from the `launchImageLibraryAsync` call — this now returns the full, uncropped image (still `quality: 1, exif: true` for the date metadata) plus its native `width`/`height`.
- Before pushing, call `PendingCropResult.setResolver((croppedUri) => { setIsImported(true); setCapturedImage(croppedUri); setImportedPhotoDate(exifDateOrNull); })` — this is exactly what `pickImage()` does today after picking, just deferred until after cropping.
- `router.push({ pathname: "/photo-crop", params: { uri, width: String(width), height: String(height), type: overlay, date: exifDateOrEmptyString } })`.

**`pickImage()` / `handleTypeSelection()` in `gallery.tsx` changes:**

- `pickImage()`: drop `allowsEditing: true, aspect: [3, 4]`; store the picked asset's `width`/`height` alongside the existing `pendingImageUri`/`pendingImageDate` state (new state `pendingImageWidth`/`pendingImageHeight`). Everything else in `pickImage()` (EXIF/date-fallback resolution, `setIsTypeSelectionVisible(true)`) is unchanged.
- `handleTypeSelection(type)`: instead of building `newPhoto` and calling `addPhoto` directly, call `PendingCropResult.setResolver((croppedUri) => { addPhoto({ id: Date.now().toString(), uri: croppedUri, date: photoDate, type }); setPendingImageUri(null); setPendingImageDate(null); setIsTypeSelectionVisible(false); })`, then `router.push({ pathname: "/photo-crop", params: { uri: pendingImageUri, width: String(pendingImageWidth), height: String(pendingImageHeight), type, date: pendingImageDate ?? "" } })`. The existing date-parsing logic that produces `photoDate` stays in `handleTypeSelection`, computed before the resolver closure captures it.

**New screen:** `app/photo-crop.tsx` — registered as a `Stack.Screen` in `app/_layout.tsx` (`presentation: "fullScreenModal"`, alongside the existing `modal` screen entry). Reads `{ uri, width, height, type, date }` via `useLocalSearchParams`. Renders `components/camera/PhotoCropStage.tsx` plus a hint line and Cancel/Confirm buttons, following the same `Button`/`Ionicons` conventions as the existing confirm screen in `camera.tsx`. Looks up its own `ghostModeEnabled` (`GhostOverlayStore.getEnabled()`) and `ghostPhoto` (`getPhotosByType(type)[0]` from `PhotoContext`, when enabled) — same logic as `camera.tsx`, so the overlay mirrors whichever mode is currently active regardless of which screen navigated here.

**New component:** `components/camera/PhotoCropStage.tsx`

- A `forwardRef` component exposing `{ getCropRect(): CropRect }` via `useImperativeHandle`, so the confirm button (owned by `app/photo-crop.tsx`) can pull the final crop rectangle after the user finishes gesturing.
- Gesture logic modeled directly on `components/progress/SyncedZoomPair.tsx`'s pinch+pan pattern: `useSharedValue` for `scale`/`translateX`/`translateY` (+ their `saved*` counterparts), `Gesture.Simultaneous(Gesture.Pinch(), Gesture.Pan())`, `useAnimatedStyle` applied to an `Animated.Image` rendering the full picked photo, sized so it fully covers a fixed 3:4 frame at rest (cover-fit baseline) and clamped so pinch/pan can never leave a gap inside the frame.
- New pure-math module **`utils/cropMath.ts`**: `computeBaseScale`, `computeMaxTranslate` (both `"worklet"`-marked, called from gesture callbacks), and `computeCropRect` (plain JS, called once on confirm) — the only part of this feature with meaningful branching logic, and the only part covered by automated tests (gesture-handler/reanimated components have no existing test-harness precedent in this repo, per `SyncedZoomPair` having none either).
- The frame is screen-width-based (matching the app's standard 3:4 photo aspect used everywhere else). The full image plus a full-screen `AlignmentOverlay` render underneath four absolutely-positioned dim panels (covering everything outside the frame) and a frame border — so the overlay is visible at full size/position inside the frame (matching the live camera 1:1) and dimmed-over outside it, without needing to rescale the overlay to the frame's smaller box.
- Confirm rect computed via `computeCropRect({ imageWidth, imageHeight, frameWidth, frameHeight, userScale: scale.value, translateX: translateX.value, translateY: translateY.value })`.

`app/photo-crop.tsx`'s confirm handler calls `manipulateAsync(uri, [{ crop: stageRef.current.getCropRect() }], { format: SaveFormat.JPEG })`, then `PendingCropResult.resolve(result.uri)` and `router.back()`.

## Error handling

- If `manipulateAsync` throws (corrupt image, invalid crop rect from a math edge case), `console.error` and `router.back()` without resolving — the caller's resolver is left registered but never invoked (harmless: it's overwritten by `setResolver` the next time an import starts, or ignored), and the user lands back wherever they started the import, able to retry.
- If the user cancels, `PendingCropResult.clear()` runs before `router.back()`, so no stale resolver fires later.

## Out of scope

- No change to the live-capture path (`capturePicture`) — ghost overlay applies there too via `AlignmentOverlay`, but no other behavior changes.
- No change to `PhotoContext`/`photoStorage` data model.
- Per-type ghost toggle (the toggle is one global on/off switch, not per front/side/back) — not requested.
- `gallery.tsx`'s existing type-selection modal UI/copy is unchanged — only what happens after a type is chosen changes.
- Automated tests: no existing RN UI test harness covers the camera/gallery screens or gesture-handler components (`SyncedZoomPair` has none); verification for `camera.tsx`, `gallery.tsx`, `app/photo-crop.tsx`, and `PhotoCropStage` is manual (see below). `cropMath.ts`, `ghostOverlayStore.ts`, and `AlignmentOverlay.tsx` get automated tests since they're pure/presentational and match existing tested precedents (`lightingBaselineStore.ts`, `ContactSheetFrame.tsx`).

## Testing notes

Manual verification after implementation, covering:
- Ghost toggle: on/off, persists across app restart, correct fallback to generic silhouette when no first photo exists yet for the selected type.
- Import crop from the camera screen: portrait and landscape source images, pan/pinch clamping at frame edges, confirm produces a correctly-cropped 3:4 image landing in the existing retake/confirm review step, cancel returns cleanly to the camera.
- Import crop from the gallery screen: same as above, but confirm should save the photo directly (no review step, matching gallery's existing behavior) under the type chosen in the type-selection modal.
- Import crop mirrors camera's current ghost-mode state (on and off), from both entry points.
