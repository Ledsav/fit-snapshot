import {
  LIGHTING_TOLERANCE,
  normalizeLuma,
  classifyLighting,
  meanLumaFromYPlane,
  DEFAULT_BG_REGIONS,
  resolveBaseline,
  type LumaSampleRegion,
} from "./lightingService";
import { PhotoType } from "@/enums/Photos";
import type { Photo } from "./photoStorage";

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

describe("meanLumaFromYPlane", () => {
  // 4x4 frame, no row padding (bytesPerRow === width).
  const makeFrame = (value: number) => new Uint8Array(16).fill(value);

  it("averages a uniform plane to that value", () => {
    const full: LumaSampleRegion[] = [{ x: 0, y: 0, width: 1, height: 1 }];
    expect(meanLumaFromYPlane(makeFrame(200), 4, 4, 4, full)).toBeCloseTo(200, 5);
  });

  it("samples only the requested region", () => {
    // Left half = 0, right half = 100.
    const y = new Uint8Array(16);
    for (let row = 0; row < 4; row++) {
      y[row * 4 + 2] = 100;
      y[row * 4 + 3] = 100;
    }
    const rightHalf: LumaSampleRegion[] = [{ x: 0.5, y: 0, width: 0.5, height: 1 }];
    expect(meanLumaFromYPlane(y, 4, 4, 4, rightHalf)).toBeCloseTo(100, 5);
  });

  it("respects bytesPerRow padding", () => {
    // width 2, height 2, but each row is padded to 4 bytes. Real pixels = 50.
    const y = new Uint8Array([50, 50, 9, 9, 50, 50, 9, 9]);
    const full: LumaSampleRegion[] = [{ x: 0, y: 0, width: 1, height: 1 }];
    expect(meanLumaFromYPlane(y, 2, 2, 4, full)).toBeCloseTo(50, 5);
  });

  it("returns 0 when regions select no pixels", () => {
    const empty: LumaSampleRegion[] = [{ x: 0, y: 0, width: 0, height: 0 }];
    expect(meanLumaFromYPlane(makeFrame(200), 4, 4, 4, empty)).toBe(0);
  });

  it("exposes two default background regions", () => {
    expect(DEFAULT_BG_REGIONS).toHaveLength(2);
  });
});

const p = (date: string, type: PhotoType, luminance?: number): Photo => ({
  id: date, uri: "x", date, type, luminance,
});

describe("resolveBaseline", () => {
  it("returns the override when provided", () => {
    expect(resolveBaseline([], PhotoType.front, 0.42)).toBe(0.42);
  });

  it("returns null when no override and no photo has luminance", () => {
    const photos = [p("2026-01-01", PhotoType.front)];
    expect(resolveBaseline(photos, PhotoType.front, null)).toBeNull();
  });

  it("returns the earliest luminance for the matching pose", () => {
    const photos = [
      p("2026-03-01", PhotoType.front, 0.6),
      p("2026-01-01", PhotoType.front, 0.5), // earliest front with luminance
      p("2026-02-01", PhotoType.side, 0.9),
    ];
    expect(resolveBaseline(photos, PhotoType.front, null)).toBe(0.5);
  });

  it("ignores photos of other poses", () => {
    const photos = [p("2026-01-01", PhotoType.side, 0.9)];
    expect(resolveBaseline(photos, PhotoType.front, null)).toBeNull();
  });
});
