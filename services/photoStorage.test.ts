const mockStore: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(async (k: string, v: string) => {
    mockStore[k] = v;
  }),
  getItem: jest.fn(async (k: string) => (k in mockStore ? mockStore[k] : null)),
}));

const mockFiles = new Set<string>();
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///docs/",
  getInfoAsync: jest.fn(async (path: string) => ({
    exists: mockFiles.has(path),
    isDirectory: false,
  })),
  makeDirectoryAsync: jest.fn(async (path: string) => {
    mockFiles.add(path);
  }),
  copyAsync: jest.fn(async ({ to }: { from: string; to: string }) => {
    mockFiles.add(to);
  }),
  deleteAsync: jest.fn(async (path: string) => {
    mockFiles.delete(path);
  }),
  readDirectoryAsync: jest.fn(async () => []),
}));

jest.mock("expo-media-library/legacy", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "denied" })),
  saveToLibraryAsync: jest.fn(async () => {}),
}));

import { savePhoto, updatePhoto, getPhotos } from "./photoStorage";
import { PhotoType } from "@/enums/Photos";

describe("updatePhoto", () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    mockFiles.clear();
  });

  it("replaces the photo's file under a new name and deletes the old one", async () => {
    await savePhoto({
      id: "1",
      uri: "file:///tmp/original.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.front,
    });
    const before = (await getPhotos())[0];
    expect(mockFiles.has(before.uri)).toBe(true);

    const updated = await updatePhoto("1", { uri: "file:///tmp/cropped.jpg" });

    expect(updated.fileName).not.toBe(before.fileName);
    expect(mockFiles.has(before.uri)).toBe(false);
    expect(mockFiles.has(updated.uri)).toBe(true);
  });

  it("updates the date and clears luminance when explicitly set to undefined", async () => {
    await savePhoto({
      id: "2",
      uri: "file:///tmp/original2.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.side,
      luminance: 0.5,
    });

    const updated = await updatePhoto("2", {
      uri: "file:///tmp/cropped2.jpg",
      date: "2026-02-02T00:00:00.000Z",
      luminance: undefined,
    });

    expect(updated.date).toBe("2026-02-02T00:00:00.000Z");
    expect(updated.luminance).toBeUndefined();
  });

  it("leaves luminance untouched when the update doesn't mention it", async () => {
    await savePhoto({
      id: "3",
      uri: "file:///tmp/original3.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.back,
      luminance: 0.42,
    });

    const updated = await updatePhoto("3", { date: "2026-03-03T00:00:00.000Z" });

    expect(updated.luminance).toBe(0.42);
  });

  it("sets a reference luminance without touching the file", async () => {
    await savePhoto({
      id: "4",
      uri: "file:///tmp/original4.jpg",
      date: "2026-01-01T00:00:00.000Z",
      type: PhotoType.front,
    });
    const before = (await getPhotos())[0];

    const updated = await updatePhoto("4", { luminance: 0.61 });

    expect(updated.luminance).toBe(0.61);
    expect(updated.fileName).toBe(before.fileName);
    expect(updated.uri).toBe(before.uri);
  });

  it("throws when the photo id doesn't exist", async () => {
    await expect(updatePhoto("missing", { luminance: 0.1 })).rejects.toThrow(
      "Photo not found: missing"
    );
  });
});
