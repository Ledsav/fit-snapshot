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
