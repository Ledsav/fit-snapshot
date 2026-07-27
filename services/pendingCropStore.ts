type CropResolver = (uri: string, date: string) => void;

let resolver: CropResolver | null = null;

// Bridges a cropped-photo result back to whichever screen (camera or
// gallery) pushed the shared /photo-crop route, since expo-router has no
// built-in way to return a value from a pushed screen.
export const PendingCropResult = {
  setResolver(fn: CropResolver): void {
    resolver = fn;
  },

  resolve(uri: string, date: string): void {
    const fn = resolver;
    resolver = null;
    fn?.(uri, date);
  },

  clear(): void {
    resolver = null;
  },
};
