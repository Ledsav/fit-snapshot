export interface CompositeLayout {
  canvasWidth: number;
  canvasHeight: number;
  photoHeight: number;
  captionHeight: number;
  dividerX: number;
  beforeClipWidth: number;
}

export const COMPOSITE_CANVAS_WIDTH = 1080;
export const COMPOSITE_PHOTO_HEIGHT = 1440;
export const COMPOSITE_CAPTION_HEIGHT = 96;

// Mirrors BeforeAfterSlider's own divider math: afterness is 0-100 (higher =
// more "after" shown), dividerLeftPct = 100 - afterness is where the
// before/after boundary sits, as a percentage from the left edge.
export function computeCompositeLayout(afterness: number): CompositeLayout {
  const clampedAfterness = Math.min(100, Math.max(0, afterness));
  const dividerLeftPct = 100 - clampedAfterness;
  const dividerX = Math.round((COMPOSITE_CANVAS_WIDTH * dividerLeftPct) / 100);
  return {
    canvasWidth: COMPOSITE_CANVAS_WIDTH,
    canvasHeight: COMPOSITE_PHOTO_HEIGHT + COMPOSITE_CAPTION_HEIGHT,
    photoHeight: COMPOSITE_PHOTO_HEIGHT,
    captionHeight: COMPOSITE_CAPTION_HEIGHT,
    dividerX,
    beforeClipWidth: dividerX,
  };
}
