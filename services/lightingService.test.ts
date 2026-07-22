import {
  LIGHTING_TOLERANCE,
  normalizeLuma,
  classifyLighting,
} from "./lightingService";

describe("normalizeLuma", () => {
  it("maps 0..255 onto 0..1", () => {
    expect(normalizeLuma(0)).toBe(0);
    expect(normalizeLuma(255)).toBe(1);
    expect(normalizeLuma(127.5)).toBeCloseTo(0.5, 5);
  });

  it("clamps out-of-range input", () => {
    expect(normalizeLuma(-10)).toBe(0);
    expect(normalizeLuma(300)).toBe(1);
  });

  it("returns 0 for non-finite input rather than NaN", () => {
    expect(normalizeLuma(NaN)).toBe(0);
    expect(normalizeLuma(Infinity)).toBe(1);
  });
});

describe("classifyLighting", () => {
  it("returns 'none' when there is no baseline", () => {
    expect(classifyLighting(0.5, null)).toBe("none");
  });

  it("returns 'matched' within the matched tolerance", () => {
    expect(classifyLighting(0.5, 0.5)).toBe("matched");
    expect(classifyLighting(0.5 + LIGHTING_TOLERANCE.matched, 0.5)).toBe("matched");
  });

  it("returns 'close' between matched and close tolerance", () => {
    expect(classifyLighting(0.5 + 0.12, 0.5)).toBe("close");
    expect(classifyLighting(0.5 - 0.12, 0.5)).toBe("close");
  });

  it("returns 'off' beyond the close tolerance", () => {
    expect(classifyLighting(0.5 + 0.3, 0.5)).toBe("off");
    expect(classifyLighting(0.1, 0.9)).toBe("off");
  });
});
