import { parsePhotoDateString, extractPhotoDate } from "./photoDate";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library/legacy";

jest.mock("expo-file-system/legacy", () => ({
  getInfoAsync: jest.fn(),
}));

jest.mock("expo-media-library/legacy", () => ({
  getAssetInfoAsync: jest.fn(),
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

const makeAsset = (
  overrides: Partial<{ uri: string; assetId: string | null; exif: Record<string, any> | null }> = {}
) => ({
  uri: "file://photo.jpg",
  width: 100,
  height: 100,
  assetId: null,
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
    expect(MediaLibrary.getAssetInfoAsync).not.toHaveBeenCalled();
    expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
  });

  it("falls back to EXIF DateTime when DateTimeOriginal is absent", async () => {
    const asset = makeAsset({ exif: { DateTime: "2022:06:01 09:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2022:06:01 09:00:00").toISOString());
  });

  it("falls back to EXIF DateTime when DateTimeOriginal is an empty string", async () => {
    const asset = makeAsset({ exif: { DateTimeOriginal: "", DateTime: "2023:05:10 14:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2023:05:10 14:00:00").toISOString());
    expect(MediaLibrary.getAssetInfoAsync).not.toHaveBeenCalled();
  });

  it("falls back to EXIF DateTimeDigitized when the others are absent", async () => {
    const asset = makeAsset({ exif: { DateTimeDigitized: "2021:12:25 00:00:00" } });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(parsePhotoDateString("2021:12:25 00:00:00").toISOString());
  });

  it("uses MediaLibrary.getAssetInfoAsync via assetId when no EXIF date is present", async () => {
    (MediaLibrary.getAssetInfoAsync as jest.Mock).mockResolvedValue({
      creationTime: 1650000000000,
    });
    const asset = makeAsset({ assetId: "asset-123", exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1650000000000).toISOString());
    expect(MediaLibrary.getAssetInfoAsync).toHaveBeenCalledWith("asset-123");
    expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
  });

  it("falls back to file modification time when there is no assetId", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      modificationTime: 1700000000,
    });
    const asset = makeAsset({ assetId: null, exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
    expect(MediaLibrary.getAssetInfoAsync).not.toHaveBeenCalled();
  });

  it("falls back to file modification time when the assetId lookup throws", async () => {
    (MediaLibrary.getAssetInfoAsync as jest.Mock).mockRejectedValue(new Error("ml error"));
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      modificationTime: 1700000000,
    });
    const asset = makeAsset({ assetId: "asset-123", exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it("falls back to file modification time when the assetId lookup has no creationTime", async () => {
    (MediaLibrary.getAssetInfoAsync as jest.Mock).mockResolvedValue({ creationTime: 0 });
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      modificationTime: 1700000000,
    });
    const asset = makeAsset({ assetId: "asset-123", exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBe(new Date(1700000000 * 1000).toISOString());
  });

  it("returns null when nothing is found", async () => {
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });
    const asset = makeAsset({ assetId: null, exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBeNull();
  });

  it("returns null when the assetId lookup and file lookup both throw", async () => {
    (MediaLibrary.getAssetInfoAsync as jest.Mock).mockRejectedValue(new Error("ml error"));
    (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error("fs error"));
    const asset = makeAsset({ assetId: "asset-123", exif: {} });
    const result = await extractPhotoDate(asset as any);
    expect(result).toBeNull();
  });
});
