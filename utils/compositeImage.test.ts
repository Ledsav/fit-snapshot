import {
  computeCompositeLayout,
  COMPOSITE_CANVAS_WIDTH,
  COMPOSITE_PHOTO_HEIGHT,
  COMPOSITE_CAPTION_HEIGHT,
} from "./compositeImage";

describe("computeCompositeLayout", () => {
  it("splits the canvas evenly at the default 50/50 slider position", () => {
    const layout = computeCompositeLayout(50);
    expect(layout.dividerX).toBe(540);
    expect(layout.beforeClipWidth).toBe(540);
  });

  it("shows the full 'before' photo when afterness is 0", () => {
    const layout = computeCompositeLayout(0);
    expect(layout.dividerX).toBe(COMPOSITE_CANVAS_WIDTH);
  });

  it("shows the full 'after' photo when afterness is 100", () => {
    const layout = computeCompositeLayout(100);
    expect(layout.dividerX).toBe(0);
  });

  it("clamps afterness below 0", () => {
    const layout = computeCompositeLayout(-20);
    expect(layout.dividerX).toBe(COMPOSITE_CANVAS_WIDTH);
  });

  it("clamps afterness above 100", () => {
    const layout = computeCompositeLayout(150);
    expect(layout.dividerX).toBe(0);
  });

  it("always reports the fixed canvas dimensions", () => {
    const layout = computeCompositeLayout(37);
    expect(layout.canvasWidth).toBe(COMPOSITE_CANVAS_WIDTH);
    expect(layout.photoHeight).toBe(COMPOSITE_PHOTO_HEIGHT);
    expect(layout.captionHeight).toBe(COMPOSITE_CAPTION_HEIGHT);
    expect(layout.canvasHeight).toBe(COMPOSITE_PHOTO_HEIGHT + COMPOSITE_CAPTION_HEIGHT);
  });
});
