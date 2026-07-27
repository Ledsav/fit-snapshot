import { parsePhotoDateString } from "./photoDate";

describe("parsePhotoDateString", () => {
  it("parses an already-ISO date string", () => {
    const result = parsePhotoDateString("2025-07-22T10:15:00.000Z");
    expect(result.toISOString()).toBe("2025-07-22T10:15:00.000Z");
  });

  it("parses a raw EXIF-format date string", () => {
    const result = parsePhotoDateString("2024:03:05 08:30:00");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2); // 0-indexed: March
    expect(result.getDate()).toBe(5);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(30);
  });

  it("falls back to now when given undefined", () => {
    const before = Date.now();
    const result = parsePhotoDateString(undefined);
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it("falls back to now when given an empty string", () => {
    const before = Date.now();
    const result = parsePhotoDateString("");
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });

  it("falls back to now when given unparseable garbage", () => {
    const before = Date.now();
    const result = parsePhotoDateString("not a date");
    const after = Date.now();
    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after);
  });
});
