jest.mock("expo-image-manipulator", () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: "jpeg" },
}));
jest.mock("jpeg-js", () => ({
  decode: jest.fn(),
}));
jest.mock("base64-js", () => ({
  toByteArray: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

import { manipulateAsync } from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";
import { computeImageLuminance } from "./imageLuminance";

function makeDecodedImage(
  width: number,
  height: number,
  fill: (x: number, y: number) => [number, number, number]
) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = fill(x, y);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}

describe("computeImageLuminance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("resizes the image and requests base64 JPEG output", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg", base64: "fake" });
    (decodeJpeg as jest.Mock).mockReturnValue(makeDecodedImage(4, 4, () => [0, 0, 0]));

    await computeImageLuminance("file://photo.jpg");

    expect(manipulateAsync).toHaveBeenCalledWith(
      "file://photo.jpg",
      [{ resize: { width: 100 } }],
      { format: "jpeg", base64: true }
    );
  });

  it("averages luma only over the top-left/top-right background corners, ignoring the center", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg", base64: "fake" });
    // 10x10 image: background corners are pure white, everything else (including
    // the whole center where a subject would stand) is pure black.
    const image = makeDecodedImage(10, 10, (x, y) => {
      const inTopLeft = x < 2 && y < 2;
      const inTopRight = x >= 7 && y < 2;
      return inTopLeft || inTopRight ? [255, 255, 255] : [0, 0, 0];
    });
    (decodeJpeg as jest.Mock).mockReturnValue(image);

    const luminance = await computeImageLuminance("file://photo.jpg");

    expect(luminance).toBeCloseTo(1, 5);
  });

  it("returns null when manipulateAsync yields no base64 data", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg" });

    const luminance = await computeImageLuminance("file://photo.jpg");

    expect(luminance).toBeNull();
    expect(decodeJpeg).not.toHaveBeenCalled();
  });

  it("returns null instead of throwing when decoding fails", async () => {
    (manipulateAsync as jest.Mock).mockResolvedValue({ uri: "file://resized.jpg", base64: "fake" });
    (decodeJpeg as jest.Mock).mockImplementation(() => {
      throw new Error("bad jpeg");
    });

    const luminance = await computeImageLuminance("file://photo.jpg");

    expect(luminance).toBeNull();
  });

  it("returns null instead of throwing when manipulateAsync rejects", async () => {
    (manipulateAsync as jest.Mock).mockRejectedValue(new Error("file not found"));

    const luminance = await computeImageLuminance("file://missing.jpg");

    expect(luminance).toBeNull();
  });
});
