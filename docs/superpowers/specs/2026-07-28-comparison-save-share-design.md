# Save & share for before/after comparison and GIF

## Problem

The before/after slider (`BeforeAfterSlider` inside `PhotoMorph.tsx`) has a single
download button that saves one raw source photo (whichever side has more weight
past the 50% mark) — it never actually saves the split composite the user sees
on screen. The GIF mode can save to the gallery but has no way to share either
output. Users want to save or share a single image that captures the
before/after split at the slider's current position, and to share (not just
save) the generated GIF.

## Goals

- Save a composite image reproducing the on-screen before/after split at the
  slider's current divider position, including labels and a date-range
  caption.
- Add a Share action (native Android share sheet) for that composite.
- Add a Share action for the generated GIF, alongside its existing Save.
- Do this without adding a heavyweight native dependency where an existing one
  already covers it.

## Non-goals

- Side-by-side (`SyncedZoomPair`) and grid modes are unaffected — only the
  slider and GIF modes are in scope.
- Replicating `ContactSheetFrame`'s sprocket-hole tick marks in the exported
  image — decorative, not required for this feature.
- Theme-matching the exported image to the viewer's current light/dark theme —
  colors are fixed so a shared image looks the same regardless of theme.

## Key technical decision: no `react-native-view-shot`

Compositing two separate photos into one image cannot be done with
`expo-image-manipulator` alone (it only operates on a single source image per
call — crop/resize/rotate/flip). The obvious next tool would be
`react-native-view-shot`, but that's a new native dependency purely to
screenshot a rendered view.

Instead: `react-native-svg` (already installed at 15.15.4 and already linked —
`components/style/Pattern.tsx` renders native SVG elements today) exposes a
built-in rasterizer on its `Svg` ref: `toDataURL(callback, options)`. This lets
us build the composite as an SVG tree (two `<Image>` layers, one clipped to the
divider position, via a `<ClipPath>`) and rasterize it to a PNG natively, with
**zero new native dependencies** for the compositing step itself.

The only new dependency is `expo-sharing` (first-party Expo SDK module, thin
JS wrapper around the native share sheet) for the Share buttons. The app
already runs a custom dev client (`expo-dev-client`, needed for
`react-native-purchases`/RevenueCat), so adding `expo-sharing` requires one dev
client rebuild — the same kind of rebuild already required for any native
dependency change, not a new category of work. After that rebuild, all further
changes in this feature are pure JS.

Two separate buttons (Save + Share) rather than one combined share-sheet
button: Android's native share sheet does not reliably offer a "save to
gallery" destination across devices (unlike iOS), and this app is Android-only
per the launch plan. A dedicated Save button using `MediaLibrary` directly is
the reliable path; Share is for sending to other apps.

## Architecture

Two new files, one extended:

- **`utils/compositeImage.ts`** (new) — `buildBeforeAfterComposite({ beforeUri,
  afterUri, dividerPct, caption, type }): Promise<string>`, returning a local
  file URI for the rasterized PNG. Pure logic for computing the SVG geometry
  (clip rect, label/caption positions) is exported separately so it's
  unit-testable without touching the native `toDataURL` call.
- **`components/progress/CompositeExporter.tsx`** (new) — mounts the
  off-screen `<Svg>` tree (positioned off-canvas, not `display:none`, so it
  still rasterizes) and exposes an imperative `export(): Promise<string>` via
  `forwardRef`/`useImperativeHandle`. `PhotoMorph.tsx` renders one instance and
  calls `.export()` on Save/Share tap.
- **`components/progress/PhotoMorph.tsx`** (extended) — slider stage's single
  download button becomes a Save+Share button pair; GIF's action row gains a
  Share button. Both reuse a small shared helper (`services/mediaExportService.ts`,
  new) for the actual save/share side effects (`MediaLibrary` album save,
  `expo-sharing` share), parameterized by file URI, so GIF and composite share
  identical mechanics.

## UI changes

**Slider stage:** the current single floating `extractButton` (bottom-right
download icon) becomes two floating circular buttons in the same visual style
(theme-primary circle, white icon), stacked bottom-right: Save
(`download-outline`) above Share (`share-outline`). This fully replaces
today's raw single-photo save behavior.

**GIF mode:** `gifActionsRow` goes from `[Download] [Clear]` to `[Download]
[Share] [Clear]`, using the same `Button` component styling as the existing
two.

## Composite generation flow

1. Read `beforeUri` and `afterUri` as base64 via `expo-file-system` (same
   helper `gifService.ts` already uses for its own photos) and embed as
   `data:image/jpeg;base64,...`. This is the key trick that avoids any
   async image-load race against the native `toDataURL` rasterization — the
   pixel data is inline in the tree at render time, not fetched after mount.
2. Render an off-screen `<Svg width={1080} height={1520}>` (1080×1440 photo
   area + ~80px caption strip):
   - background `<Image>` ("after" photo, `preserveAspectRatio="xMidYMid
     slice"` — SVG's equivalent of `resizeMode="cover"`) filling 1080×1440
   - a clipped `<Image>` ("before" photo, same fit) clipped to a `<ClipPath>`
     rect of width `1080 * dividerPct/100`, reproducing `BeforeAfterSlider`'s
     on-screen split exactly
   - a 3px divider `<Rect>` at the clip boundary
   - "BEFORE"/"AFTER" label pills (semi-opaque `<Rect>` + `<Text>`)
     top-left/top-right, matching the on-screen labels
   - a bottom caption strip (solid `<Rect>` + `<Text>`) with the date-range
     caption (e.g. "Jan 3, 2026 → Jul 20, 2026 · FRONT"), echoing
     `ContactSheetFrame`'s caption styling (mono font, muted color) — no
     sprocket ticks
   - all colors (pill background, divider, caption strip) are hardcoded, not
     pulled from the live theme
3. Call the `Svg` ref's `toDataURL(callback, { width: 1080, height: 1520 })`
   to rasterize to base64 PNG.
4. Write the PNG to `${FileSystem.cacheDirectory}composite_${Date.now()}.png`
   via `writeAsStringAsync`.
5. Return that file URI. `PhotoMorph.tsx` feeds it to
   `MediaLibrary.createAssetAsync` + `createAlbumAsync("FitSnapshot", ...)`
   (Save, matching `extractPhoto`'s existing album pattern) or
   `Sharing.shareAsync` (Share).

## Error handling & permissions

- **Save (composite & GIF):** unchanged pattern from today —
  `MediaLibrary.requestPermissionsAsync()`, existing
  `permissions.title`/`permissions.photoSaveMessage` alert on denial;
  `progress.photoSavedMessage`/`progress.photoSaveErrorMessage` (or the GIF
  saved-badge) on success/failure.
- **Share (composite & GIF):** wrap `Sharing.shareAsync()` in try/catch. If
  `Sharing.isAvailableAsync()` is false, show a simple alert
  (`progress.sharingUnavailableMessage`) rather than failing silently. User
  cancelling the share sheet is not an error — no alert in that case.
- **Composite generation failure** (`toDataURL` returns nothing, file read
  fails): same handling as today's `extractPhoto` catch block — log and show
  the generic error message, no partial/corrupt file left behind.

## Localization

New keys in all 5 locales (`en`, `es`, `it`, `de`, `fr`), following existing
naming conventions:

- `progress.shareButton`
- `progress.shareErrorMessage`
- `progress.gifShareButton`
- `progress.gifShareErrorMessage`
- `progress.sharingUnavailableMessage`

## Testing

- Unit test `utils/compositeImage.ts`'s pure geometry math (divider-pixel/clip
  rect calculation, canvas dimensions), the same way `cropMath.test.ts` tests
  `utils/cropMath.ts`. No attempt to test the native `toDataURL` rasterization
  itself in Jest.
- Manual device testing after the dev-client rebuild: composite Save lands in
  the "FitSnapshot" album, Share opens the Android share sheet with a valid
  PNG, GIF Share works with the existing GIF file, permission-denied paths
  show the right alerts.

## Decisions log (from brainstorming)

- No `react-native-view-shot` — `react-native-svg`'s `toDataURL` covers it,
  zero new native deps for compositing.
- `expo-sharing` accepted as the one new native dependency; one dev-client
  rebuild required, acceptable.
- Slider's existing single-photo download button is replaced by the composite
  save (not kept alongside).
- Composite includes BEFORE/AFTER labels + divider line, and the date-range
  caption, baked into the image.
- Save and Share are two separate buttons (not one combined share-sheet
  button), specifically because Android's share sheet doesn't reliably offer
  a save-to-gallery destination and this app is Android-only.
- Export resolution fixed at 1080×1440 (+ caption strip) regardless of source
  photo resolution.
