# Import Photo Date Extraction & Editing — Design

Date: 2026-07-27

## Context

Two related asks:

1. When importing a photo from the gallery (via either `app/(tabs)/camera.tsx`'s import button or `app/(tabs)/gallery.tsx`'s "Add Photo" flow), the photo should be dated using the image's own metadata (EXIF capture date, falling back to file modification time, falling back to the OS media library's creation time) rather than "today." `gallery.tsx` already does most of this, but `camera.tsx`'s import path only checks EXIF `DateTimeOriginal` and skips the rest of the fallback chain — the two are inconsistent.
2. After cropping an imported photo (both import paths already route through the shared `app/photo-crop.tsx` screen), the user should be able to change the date before it's saved, in case the extracted metadata date is wrong or missing.

Both entry points already push `/photo-crop` and thread a raw `date` param through it unused — this design wires that param up and lets the crop screen become the single owner of the final date.

## 1. Shared date-extraction utility

**New file:** `utils/photoDate.ts`

```ts
export function parsePhotoDateString(raw?: string | null): Date
export async function extractPhotoDate(asset: ImagePicker.ImagePickerAsset): Promise<string | null>
```

- `parsePhotoDateString` — pure, synchronous. Accepts either an already-ISO string or raw EXIF `"YYYY:MM:DD HH:MM:SS"` format (converts the date portion's `:` to `-` before parsing, matching the existing regex used in both `camera.tsx` and `gallery.tsx` today). Returns `new Date()` when `raw` is missing, empty, or fails to parse.
- `extractPhotoDate` — async orchestration, replacing the fallback chain currently only implemented in `gallery.tsx`'s `pickImage`:
  1. EXIF `DateTimeOriginal` → `DateTime` → `DateTimeDigitized`, first one present, parsed via `parsePhotoDateString`.
  2. If none present: `FileSystem.getInfoAsync(asset.uri)` — use `modificationTime` if available.
  3. If still nothing: `MediaLibrary.getAssetsAsync({ first: 1000, sortBy: MediaLibrary.SortBy.creationTime })`, find the asset matching by filename/uri, use its `creationTime`.
  4. Otherwise `null`.
  - Returns an **ISO string** (already normalized) or `null` — never a raw EXIF-format string. Each fallback step is wrapped in try/catch, collapsing to `null` on failure (matches existing behavior — this is a best-effort read, never a user-facing error).

`app/(tabs)/camera.tsx`'s `pickImage` and `app/(tabs)/gallery.tsx`'s `pickImage` both replace their current inline EXIF/file/media-library logic with a single `const isoDate = await extractPhotoDate(selectedAsset);` call, and pass `date: isoDate ?? ""` as the `/photo-crop` route param. This removes the duplicated fallback logic from `gallery.tsx` and fixes `camera.tsx`'s import path to get the same fallback chain.

## 2. Date editing on the crop screen

**`app/photo-crop.tsx` changes:**

- New state: `const [date, setDate] = useState(() => parsePhotoDateString(params.date))` — seeded from the route param (already ISO, or empty), falling back to "now" if absent.
- New UI: a pill row (calendar icon + formatted date, e.g. "Jul 22, 2025", using the same `toLocaleDateString` format as `gallery.tsx`'s `formatCaptionDate`) rendered above the existing hint text in the footer. Tapping it opens `@react-native-community/datetimepicker` (already an installed dependency, currently unused) in `mode="date"` with `maximumDate={new Date()}` — a progress photo can't be dated in the future.
- On the picker's `onChange`, the selected day/month/year is merged onto the **existing** `date` state's time-of-day (hours/minutes/seconds/ms) — so the stored timestamp's time component is always whatever it was seeded with (from EXIF or "now"), never whatever the native picker happens to return for the clock portion.
- `handleConfirm` (already crops via `manipulateAsync`) now calls `PendingCropResult.resolve(result.uri, date.toISOString())` instead of `resolve(result.uri)`.

**`services/pendingCropStore.ts` changes:**

- `CropResolver` type changes from `(uri: string) => void` to `(uri: string, date: string) => void`.
- `resolve(uri: string, date: string): void` — passes both through to the registered resolver.

**Callers (`camera.tsx`, `gallery.tsx`) changes:**

- Both `PendingCropResult.setResolver(...)` callbacks gain the `date` parameter and use it **directly** as the photo's final `date` field — no re-parsing. This deletes:
  - `camera.tsx`'s `importedPhotoDate` regex/try-catch block inside `confirmPicture` (the state variable itself can stay, just holding the already-ISO value from the resolver instead of a raw EXIF string).
  - `gallery.tsx`'s entire ISO-detection/EXIF-regex `photoDate` computation block in `handleTypeSelection` — since the resolver now receives the crop screen's final date directly, `handleTypeSelection` no longer needs to precompute a date before navigating at all.

Because `photo-crop.tsx` always seeds a valid `Date` (see above), `date.toISOString()` is always well-formed by the time `resolve()` fires — no nullable-date branches remain downstream in either caller.

## Testing

- `services/pendingCropStore.test.ts`: update existing tests for the two-arg `resolve(uri, date)` signature.
- `utils/photoDate.test.ts` (new): pure unit tests for `parsePhotoDateString` (ISO input, EXIF-colon-format input, garbage/missing input → `new Date()` fallback) and `extractPhotoDate` (mocking `expo-file-system/legacy` and `expo-media-library/legacy` to cover each fallback tier: EXIF present, EXIF absent + file mtime present, both absent + MediaLibrary match present, nothing found → `null`).

## Out of scope

- Camera-captured (non-imported) photos never route through `/photo-crop` and keep using "now" as their date — unaffected by this change.
- Editing time-of-day (only the calendar day is editable).
- iOS-specific picker styling — this app is Android-only for launch.
