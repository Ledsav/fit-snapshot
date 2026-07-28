jest.mock("expo-media-library/legacy", () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
  saveToLibraryAsync: jest.fn(),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import * as MediaLibrary from "expo-media-library/legacy";
import * as Sharing from "expo-sharing";
import { saveFileToGallery, shareFile } from "./mediaExportService";

describe("saveFileToGallery", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns permission_denied when permission isn't granted", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    const result = await saveFileToGallery("file://photo.png");
    expect(result).toEqual({ status: "permission_denied" });
  });

  it("saves into a named album when albumName is given", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({ id: "asset1" });
    const result = await saveFileToGallery("file://photo.png", "FitSnapshot");
    expect(MediaLibrary.createAssetAsync).toHaveBeenCalledWith("file://photo.png");
    expect(MediaLibrary.createAlbumAsync).toHaveBeenCalledWith("FitSnapshot", { id: "asset1" }, false);
    expect(MediaLibrary.saveToLibraryAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "saved" });
  });

  it("saves to the default library when no albumName is given", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    const result = await saveFileToGallery("file://gif.gif");
    expect(MediaLibrary.saveToLibraryAsync).toHaveBeenCalledWith("file://gif.gif");
    expect(MediaLibrary.createAssetAsync).not.toHaveBeenCalled();
    expect(result).toEqual({ status: "saved" });
  });

  it("returns an error result when MediaLibrary throws", async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (MediaLibrary.saveToLibraryAsync as jest.Mock).mockRejectedValue(new Error("disk full"));
    const result = await saveFileToGallery("file://gif.gif");
    expect(result.status).toBe("error");
  });
});

describe("shareFile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns unavailable when sharing isn't supported", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    const result = await shareFile("file://photo.png", "image/png", "Share");
    expect(result).toEqual({ status: "unavailable" });
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it("shares the file when sharing is available", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    const result = await shareFile("file://photo.png", "image/png", "Share your progress");
    expect(Sharing.shareAsync).toHaveBeenCalledWith("file://photo.png", {
      mimeType: "image/png",
      dialogTitle: "Share your progress",
    });
    expect(result).toEqual({ status: "shared" });
  });

  it("returns an error result when sharing throws", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error("nope"));
    const result = await shareFile("file://photo.png", "image/png", "Share");
    expect(result.status).toBe("error");
  });
});
