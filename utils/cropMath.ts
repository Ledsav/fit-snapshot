export interface CropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

function clampNum(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// The scale at which the image, at its native size, would exactly cover the
// crop frame with no gaps (like resizeMode "cover"). Runs inside gesture
// worklets, so it's marked as one.
export function computeBaseScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
): number {
  "worklet";
  return Math.max(frameWidth / imageWidth, frameHeight / imageHeight);
}

// Bounds for the pan gesture's translateX/translateY (screen pixels) at a
// given user zoom level, so the frame always stays fully covered by the
// image. Runs inside gesture worklets, so it's marked as one.
export function computeMaxTranslate(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number,
  userScale: number
): { maxX: number; maxY: number } {
  "worklet";
  const scale = computeBaseScale(imageWidth, imageHeight, frameWidth, frameHeight) * userScale;
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;
  return {
    maxX: Math.max(0, (displayedWidth - frameWidth) / 2),
    maxY: Math.max(0, (displayedHeight - frameHeight) / 2),
  };
}

// Maps the crop frame back into original-image pixel coordinates, given the
// user's current zoom (userScale, relative to the cover baseline from
// computeBaseScale) and pan offset (translateX/translateY, in screen
// pixels). Called once on confirm, on the JS thread — not a worklet.
export function computeCropRect(params: {
  imageWidth: number;
  imageHeight: number;
  frameWidth: number;
  frameHeight: number;
  userScale: number;
  translateX: number;
  translateY: number;
}): CropRect {
  const { imageWidth, imageHeight, frameWidth, frameHeight, userScale, translateX, translateY } = params;
  const scale = computeBaseScale(imageWidth, imageHeight, frameWidth, frameHeight) * userScale;
  const displayedWidth = imageWidth * scale;
  const displayedHeight = imageHeight * scale;

  // Image's on-screen left/top edge, relative to the frame's left/top edge.
  const offsetX = (frameWidth - displayedWidth) / 2 + translateX;
  const offsetY = (frameHeight - displayedHeight) / 2 + translateY;

  const cropWidth = frameWidth / scale;
  const cropHeight = frameHeight / scale;

  const originX = clampNum(-offsetX / scale, 0, imageWidth - cropWidth);
  const originY = clampNum(-offsetY / scale, 0, imageHeight - cropHeight);

  return {
    originX: Math.round(originX),
    originY: Math.round(originY),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}
