import type { Photo } from "./photoStorage";
import type { PhotoType } from "@/enums/Photos";

/** Δ tolerance (in normalized 0–1 luminance) around the baseline. */
export const LIGHTING_TOLERANCE = { matched: 0.08, close: 0.18 } as const;

export type LightingState = "matched" | "close" | "off" | "none";

/**
 * Clamp a 0–255 mean luma onto 0–1. Non-finite input degrades to a clamped bound.
 * Carries a 'worklet' directive: called from the vision-camera frame worklet.
 */
export function normalizeLuma(mean0to255: number): number {
  "worklet";
  if (Number.isNaN(mean0to255)) return 0;
  if (mean0to255 <= 0) return 0;
  if (mean0to255 >= 255) return 1;
  return mean0to255 / 255;
}

/** Map current-vs-baseline luminance to an indicator state. */
export function classifyLighting(
  current: number,
  baseline: number | null
): LightingState {
  if (baseline === null || !Number.isFinite(baseline)) return "none";
  const delta = Math.abs(current - baseline);
  if (delta <= LIGHTING_TOLERANCE.matched) return "matched";
  if (delta <= LIGHTING_TOLERANCE.close) return "close";
  return "off";
}

export type LumaSampleRegion = {
  /** All values are fractions of frame dimensions, 0–1. */
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Two top-corner background bands, chosen to fall OUTSIDE the centered torso
 * silhouette so shirt/skin color does not skew the reading.
 */
export const DEFAULT_BG_REGIONS: LumaSampleRegion[] = [
  { x: 0.0, y: 0.0, width: 0.22, height: 0.25 }, // top-left
  { x: 0.78, y: 0.0, width: 0.22, height: 0.25 }, // top-right
];

/**
 * Average Y-plane bytes across the given normalized regions → 0–255 mean.
 * Carries a 'worklet' directive: called from the vision-camera frame worklet.
 */
export function meanLumaFromYPlane(
  y: Uint8Array,
  width: number,
  height: number,
  bytesPerRow: number,
  regions: LumaSampleRegion[]
): number {
  "worklet";
  let sum = 0;
  let count = 0;
  for (const r of regions) {
    const x0 = Math.max(0, Math.floor(r.x * width));
    const y0 = Math.max(0, Math.floor(r.y * height));
    const x1 = Math.min(width, Math.floor((r.x + r.width) * width));
    const y1 = Math.min(height, Math.floor((r.y + r.height) * height));
    for (let py = y0; py < y1; py++) {
      const rowStart = py * bytesPerRow;
      for (let px = x0; px < x1; px++) {
        sum += y[rowStart + px];
        count++;
      }
    }
  }
  return count === 0 ? 0 : sum / count;
}

/** Baseline luminance for a pose: manual override, else earliest photo with luminance, else null. */
export function resolveBaseline(
  photos: Photo[],
  type: PhotoType,
  override: number | null
): number | null {
  if (override !== null && Number.isFinite(override)) return override;
  const withLuma = photos
    .filter((ph) => ph.type === type && typeof ph.luminance === "number")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return withLuma.length > 0 ? (withLuma[0].luminance as number) : null;
}
