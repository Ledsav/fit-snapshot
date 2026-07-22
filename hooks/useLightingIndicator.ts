import { useMemo, useState } from "react";
import { useFrameOutput } from "react-native-vision-camera";
import { scheduleOnRN } from "react-native-worklets";
import { useSharedValue } from "react-native-reanimated";
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

// Process ~1 in every N frames to keep the pipeline light (~5 Hz at 30 fps).
// The rest are disposed immediately so the Camera pipeline never stalls.
const PROCESS_EVERY_N_FRAMES = 6;

interface Params {
  photos: Photo[];
  type: PhotoType;
  /** Per-pose recalibration override (from LightingBaselineStore), or null. */
  override: number | null;
}

/**
 * Live lighting-guidance hook for vision-camera V5.
 *
 * Returns a `frameOutput` to pass into `<Camera outputs={[...]}>`, the current
 * indicator `state`, and the last normalized luminance reading `currentLuma`
 * (read at capture time to persist on the new photo).
 *
 * All non-trivial math lives in the unit-tested pure functions in
 * `services/lightingService.ts`; this hook only wires them to the frame stream.
 */
export function useLightingIndicator({ photos, type, override }: Params) {
  const [currentLuma, setCurrentLuma] = useState(0);
  // Frame throttle counter, shared into the frame worklet runtime.
  const frameCounter = useSharedValue(0);

  const baseline = useMemo(
    () => resolveBaseline(photos, type, override),
    [photos, type, override]
  );

  const state: LightingState = useMemo(
    () => classifyLighting(currentLuma, baseline),
    [currentLuma, baseline]
  );

  const frameOutput = useFrameOutput({
    // YUV keeps the Y (luma) plane at full resolution with no RGB conversion.
    pixelFormat: "yuv",
    dropFramesWhileBusy: true,
    onFrame: (frame) => {
      "worklet";
      frameCounter.value = (frameCounter.value + 1) % PROCESS_EVERY_N_FRAMES;
      if (frameCounter.value !== 0) {
        frame.dispose();
        return;
      }
      try {
        if (frame.isPlanar) {
          const planes = frame.getPlanes();
          if (planes.length > 0) {
            const yPlane = planes[0];
            const y = new Uint8Array(yPlane.getPixelBuffer());
            const mean = meanLumaFromYPlane(
              y,
              yPlane.width,
              yPlane.height,
              yPlane.bytesPerRow,
              DEFAULT_BG_REGIONS
            );
            scheduleOnRN(setCurrentLuma, normalizeLuma(mean));
          }
        }
      } finally {
        // Always dispose, even on error, or the Camera pipeline stalls.
        frame.dispose();
      }
    },
  });

  return { frameOutput, state, currentLuma };
}
