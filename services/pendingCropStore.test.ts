import { PendingCropResult } from "./pendingCropStore";

describe("PendingCropResult", () => {
  afterEach(() => {
    PendingCropResult.clear();
  });

  it("does nothing when resolve is called with no resolver registered", () => {
    expect(() =>
      PendingCropResult.resolve("file://x.jpg", "2025-07-22T00:00:00.000Z")
    ).not.toThrow();
  });

  it("invokes the registered resolver exactly once with the given uri and date", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.resolve("file://cropped.jpg", "2025-07-22T00:00:00.000Z");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("file://cropped.jpg", "2025-07-22T00:00:00.000Z");

    PendingCropResult.resolve("file://again.jpg", "2025-01-01T00:00:00.000Z");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clear() prevents a registered resolver from firing", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.clear();
    PendingCropResult.resolve("file://cropped.jpg", "2025-07-22T00:00:00.000Z");
    expect(fn).not.toHaveBeenCalled();
  });
});
