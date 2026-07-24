import { computeBaseScale, computeMaxTranslate, computeCropRect } from "./cropMath";

describe("computeBaseScale", () => {
  it("picks the larger ratio so the image fully covers the frame", () => {
    expect(computeBaseScale(1000, 1000, 300, 400)).toBeCloseTo(0.4, 5);
  });
});

describe("computeMaxTranslate", () => {
  it("returns the pan bounds that keep the frame covered", () => {
    expect(computeMaxTranslate(1000, 1000, 300, 400, 1)).toEqual({ maxX: 50, maxY: 0 });
  });
});

describe("computeCropRect", () => {
  it("crops the centered region at rest (no zoom, no pan)", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 1,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 125, originY: 0, width: 750, height: 1000 });
  });

  it("crops a smaller region when zoomed in", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 2,
      translateX: 0,
      translateY: 0,
    });
    expect(rect).toEqual({ originX: 313, originY: 250, width: 375, height: 500 });
  });

  it("clamps the origin to 0 when panned past the top-left edge", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 1,
      translateX: 1000,
      translateY: 0,
    });
    expect(rect.originX).toBe(0);
  });

  it("clamps the origin to the max bound when panned past the bottom-right edge", () => {
    const rect = computeCropRect({
      imageWidth: 1000,
      imageHeight: 1000,
      frameWidth: 300,
      frameHeight: 400,
      userScale: 1,
      translateX: -1000,
      translateY: 0,
    });
    expect(rect.originX).toBe(250);
  });
});
