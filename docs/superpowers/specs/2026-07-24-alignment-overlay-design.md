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

**`pickImage()` in `camera.tsx` (currently lines 248-285) changes:**

- Drop `allowsEditing: true, aspect: [3, 4]` from the `launchImageLibraryAsync` call — this now returns the full, uncropped image (still `quality: 1, exif: true` for the date metadata).
- Instead of setting `capturedImage` directly, push a new route `/photo-crop` with params: the picked image's `uri`, its native `width`/`height` (from the picker result asset), the current `overlay` (`PhotoType`), and the EXIF date if present.

**New screen:** `app/photo-crop.tsx` — a modal-style stack route. Renders `components/camera/PhotoCropStage.tsx` plus confirm/cancel buttons, following the same `Button`/`Ionicons` conventions as the existing confirm screen in `camera.tsx`.

**New component:** `components/camera/PhotoCropStage.tsx`

- Gesture logic modeled directly on `components/progress/SyncedZoomPair.tsx`'s pinch+pan pattern: `useSharedValue` for `scale`/`translateX`/`translateY` (+ their `saved*` counterparts), `Gesture.Simultaneous(Gesture.Pinch(), Gesture.Pan())`, `useAnimatedStyle` applied to an `Animated.Image` rendering the full picked photo.
- A fixed 3:4 crop frame, sized from screen width (matching the app's standard photo aspect ratio used everywhere else — `BeforeAfterSlider`, `PhotoMorph`, `SyncedZoomPair`, the camera viewfinder box). Area outside the frame is dimmed via four absolutely-positioned semi-opaque panels (no SVG masking needed).
- Pan/pinch clamped (same `clamp()` worklet pattern as `SyncedZoomPair`) so the image can never be scaled/panned to leave a gap inside the frame — i.e., the frame is always fully covered by image content.
- `AlignmentOverlay` drawn on top of the frame, `pointerEvents="none"`, fed the same `type` param and a `ghostPhoto` looked up the same way as in `camera.tsx` (`ghostModeEnabled` read from `GhostOverlayStore`, `getPhotosByType(type)[0]` from `PhotoContext`) — so the import screen mirrors whichever mode is currently active in the camera.
- Confirm button: converts the final `scale`/`translateX`/`translateY` + known frame size + the image's native `width`/`height` (passed via params) into an `originX/originY/width/height` crop rectangle in original-image pixel space, then calls:
  ```ts
  manipulateAsync(uri, [{ crop: { originX, originY, width, height } }], { format: SaveFormat.JPEG })
  ```
  (`expo-image-manipulator`, `manipulateAsync`/`SaveFormat` already imported elsewhere in `camera.tsx`).
- On success: navigate back to `camera.tsx`, calling the same `setIsImported(true)` / `setCapturedImage(croppedUri)` / `setImportedPhotoDate(...)` it already calls today after picking — the rest of the confirm/save pipeline (`capturedImage` branch, `confirmPicture`, `addPhoto`) is untouched.
- Cancel button: navigate back to camera without setting `capturedImage`.

## Error handling

- If `manipulateAsync` throws (corrupt image, invalid crop rect from a math edge case), show the existing `alert(t("camera.imagePickerError"))` pattern and return to the image picker rather than leaving the user stuck on a broken crop screen.
- If the user backgrounds/cancels mid-crop, no partial state is persisted — `capturedImage` is only set on successful crop confirmation.

## Out of scope

- No change to the live-capture path (`capturePicture`) — ghost overlay applies there too via `AlignmentOverlay`, but no other behavior changes.
- No change to `PhotoContext`/`photoStorage` data model.
- Per-type ghost toggle (the toggle is one global on/off switch, not per front/side/back) — not requested.
- Automated tests: no existing RN UI test harness covers the camera/gallery screens; verification is manual (see below).

## Testing notes

Manual verification after implementation, covering:
- Ghost toggle: on/off, persists across app restart, correct fallback to generic silhouette when no first photo exists yet for the selected type.
- Import crop: portrait and landscape source images, pan/pinch clamping at frame edges, confirm produces a correctly-cropped 3:4 image, cancel returns cleanly to camera.
- Import crop mirrors camera's current ghost-mode state (on and off).
