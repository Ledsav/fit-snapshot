/** Δ tolerance (in normalized 0–1 luminance) around the baseline. */
export const LIGHTING_TOLERANCE = { matched: 0.08, close: 0.18 } as const;

export type LightingState = "matched" | "close" | "off" | "none";

/** Clamp a 0–255 mean luma onto 0–1. Non-finite input degrades to a clamped bound. */
export function normalizeLuma(mean0to255: number): number {
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
