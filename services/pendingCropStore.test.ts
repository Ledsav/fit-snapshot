import { PendingCropResult } from "./pendingCropStore";

describe("PendingCropResult", () => {
  afterEach(() => {
    PendingCropResult.clear();
  });

  it("does nothing when resolve is called with no resolver registered", () => {
    expect(() => PendingCropResult.resolve("file://x.jpg")).not.toThrow();
  });

  it("invokes the registered resolver exactly once with the given uri", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.resolve("file://cropped.jpg");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("file://cropped.jpg");

    PendingCropResult.resolve("file://again.jpg");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clear() prevents a registered resolver from firing", () => {
    const fn = jest.fn();
    PendingCropResult.setResolver(fn);
    PendingCropResult.clear();
    PendingCropResult.resolve("file://cropped.jpg");
    expect(fn).not.toHaveBeenCalled();
  });
});
