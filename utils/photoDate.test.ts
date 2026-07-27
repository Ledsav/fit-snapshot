import { parsePhotoDateString, extractPhotoDate } from "./photoDate";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock("expo-media-library/legacy", () => ({
  getAssetsAsync: jest.fn(),
  SortBy: { creationTime: "creationTime" },
}));

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

const makeAsset = (overrides: Partial<{ uri: string; exif: Record<string, any> | null }> = {}) => ({
  uri: "file://photo.jpg",
  width: 100,
  height: 100,
  exif: null,
  ...overrides,
});

describe("extractPhotoDate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses EXIF DateTimeOriginal when present", async () => {
    const asset = makeAsset({ exif: { DateTimeOriginal: "2023:01:15 12:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2023:01:15 12:00:00").toISOString());
    expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
  });

  it("falls back to EXIF DateTime when DateTimeOriginal is absent", async () => {
    const asset = makeAsset({ exif: { DateTime: "2022:06:01 09:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2022:06:01 09:00:00").toISOString());
  });

  it("falls back to EXIF DateTimeDigitized when the others are absent", async () => {
    const asset = makeAsset({ exif: { DateTimeDigitized: "2021:12:25 00:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2021:12:25 00:00:00").toISOString());
  });

  it("falls back to file modification time when no EXIF date is present", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      modificationTime: 1700000000,
    });
    const asset = makeAsset({ exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
    expect(MediaLibrary.getAssetsAsync).not.toHaveBeenCalled();
  });

  it("falls back to MediaLibrary creation time when neither EXIF nor file mtime is available", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue({
      assets: [{ filename: "photo.jpg", uri: "file://other.jpg", creationTime: 1650000000000 }],
    });
    const asset = makeAsset({ uri: "file://photo.jpg", exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1650000000000).toISOString());
  });

  it("returns null when nothing is found", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue({ assets: [] });
    const asset = makeAsset({ exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBeNull();
  });

  it("returns null when file and media-library lookups throw", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error("fs error"));
    (MediaLibrary.getAssetsAsync as jest.Mock).mockRejectedValue(new Error("ml error"));
    const asset = makeAsset({ exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBeNull();
  });
});
