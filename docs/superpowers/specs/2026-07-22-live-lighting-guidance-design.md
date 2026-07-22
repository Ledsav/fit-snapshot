# Live Lighting Guidance — Design

**Date:** 2026-07-22
**Status:** Approved (design), pending implementation plan
**Related:** [Progress KPIs](2026-07-22-progress-kpis-design.md) (shares the `Photo.luminance` field)

## Goal

Give the user real-time, on-screen feedback while framing a progress photo so the
room lighting matches their first (baseline) shot of the same pose. Consistent
lighting is what makes progress photos actually comparable over months.

## User-facing behavior

- When the camera is open, a small indicator shows one of three states relative to
  the pose's lighting baseline:
  - 🟢 **matched** — within tolerance of baseline
  - 🟡 **close** — near but off
  - 🔴 **off** — retake conditions (too dim / too bright)
- The user taps the shutter when they see green (nothing is blocked — the indicator
  is guidance, not a gate).
- A **recalibrate** action lets the user set the current lighting as the new baseline
  for that pose (covers the "my first photo had bad lighting" case).

## Constraints & context (verified)

- Stack: Expo SDK 57, `expo-dev-client` present (custom dev build — **not** Expo Go),
  `eas.json` present, new architecture default.
- `react-native-reanimated` 4.5.0 and `react-native-worklets` 0.10.0 already
  installed — the worklet infrastructure vision-camera frame processors need is in place.
- `expo-camera` (~57.0.1) is the current camera. It exposes **no** preview-frame
  access, so live analysis is impossible without switching libraries.
- No pixel-reading library is installed (only `expo-image-manipulator` for resize/crop
  and `expo-file-system`). Design deliberately avoids adding one.

## Architecture

### 1. Camera migration: `expo-camera` → `react-native-vision-camera`

Migrate `app/(tabs)/camera.tsx` to `react-native-vision-camera`'s `<Camera>`.
Port existing behavior 1:1:

- Photo capture (currently `cameraRef.current.takePictureAsync` equivalent) and the
  post-capture flip via `expo-image-manipulator` (`FlipType`, `manipulateAsync`).
- Front/back facing toggle, zoom (currently a `useSharedValue` + gesture), flash on/off.
- The `TorsoSilhouette` pose overlay and existing framing UI.
- Camera permission flow (replace `useCameraPermissions` with vision-camera's
  `useCameraPermission` / `Camera.requestCameraPermission`).

Add the vision-camera config plugin to `app.json` (replacing/alongside the
`expo-camera` plugin) and any required prebuild step.

### 2. Luminance frame processor

A frame processor worklet runs on incoming frames:

- Reads the frame's **Y (luma) plane** directly (YUV) — luminance without RGB
  conversion, cheap.
- Samples **two fixed background regions** — normalized top-left and top-right
  corners, chosen to fall **outside the silhouette** so shirt/skin color does not
  skew the reading. Uses normalized coordinates so it is resolution-independent.
- Averages the sampled luma, normalizes 0–255 → 0–1.
- Throttles to ~5 Hz (skip frames) to protect battery/thermals.
- Writes the value to a shared value consumed on the JS thread to drive the indicator.

### 3. Baseline resolution & tolerance

- **Baseline for a pose** = the pose's manual override if one exists, else the
  `luminance` of the earliest-dated `Photo` of that pose that has a stored
  `luminance` value. If none exists yet, the indicator shows a neutral "no baseline
  yet — this shot will set it" state.
- **Tolerance band** (starting values, tunable in one constants place):
  - |Δ| ≤ 8% → 🟢 matched
  - 8% < |Δ| ≤ 18% → 🟡 close
  - |Δ| > 18% → 🔴 off
- On capture, the current live luminance (already in the shared value) is written to
  the new `Photo.luminance`. This means the **first** shot of a pose after the feature
  ships seeds that pose's baseline automatically.
- **Recalibrate** writes a per-pose baseline override equal to the current reading.

## Data model changes

- `services/photoStorage.ts` — extend `Photo`:
  ```ts
  export interface Photo {
    id: string;
    uri: string;
    date: string;
    type: PhotoType;
    fileName?: string;
    luminance?: number; // 0–1 background luminance captured at shoot time
  }
  ```
- Per-pose baseline override store (small persisted map `PhotoType -> number`),
  location alongside existing photo/user storage. Only written by "recalibrate".

## Error handling & edge cases

- **Camera permission denied** — same fallback UX as today (prompt + gallery import).
- **No luminance yet for a pose** (all photos legacy) — neutral indicator; first new
  capture seeds it.
- **Frame processor unavailable / errors** — degrade gracefully to a camera with no
  indicator; never block capture.
- **Extreme readings** (fully black/blown-out frame) — still reported; 🔴 is the
  correct signal.

## Testing

- Unit-test the pure pieces: luminance normalization, baseline resolution (override vs
  earliest-photo vs none), and Δ → indicator-state mapping against the tolerance band.
- Manual/dev-build verification for the frame-processor path and the ported camera
  controls (capture, flip, zoom, flash, silhouette).

## Out of scope (this spec)

- Post-capture "retake?" prompt (chosen approach is live-only).
- Reading luminance from legacy still images (declined the pixel dependency).
- Any pose/body analysis (see Progress KPIs spec, Tier B).
