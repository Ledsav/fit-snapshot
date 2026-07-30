# **FitSnapshot**

A mobile application for tracking fitness progress through photo tracking.

## **Table of Contents**

- [Concept](#concept)
- [Design](#design)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Useful Commands](#useful-commands)

## **Concept**

FitSnapshot is a private, local-first progress-photo tracker for people working on a body transformation. Instead of relying on the scale, it turns consistent, dated photos into visual proof of change.

The core loop is simple:

1. **Capture** — On a repeatable cadence (typically daily), the user takes a photo from one of three fixed angles: **front**, **side**, or **back**. A translucent body-silhouette overlay in the camera view helps them line up the same pose, distance, and framing every time, so photos stay comparable over weeks and months. Users can also import an existing photo from their gallery instead of shooting a new one, in which case the capture date is pulled from the image's EXIF/file metadata.
2. **Build a streak** — Taking a photo "today" following one taken "yesterday" grows a streak counter, turning consistency into a small game. Backdated or out-of-order imports don't affect the streak, and missing a day resets it.
3. **Compare** — Per angle, the user can flip between several ways of viewing their progress:
   - **Slider** — drag to morph/crossfade between the oldest and newest photo.
   - **Side-by-side** — two photos shown together with synchronized pinch-zoom and pan, so the user can zoom into the same body region on both images at once.
   - **Grid** — up to six photos laid out together for an at-a-glance timeline.
   - **Custom pair** — pick any two specific photos to compare directly.
   - **GIF** — generate an animated before/after GIF to save or share.
4. **Review progress** — The home screen surfaces the current streak, stats (days tracked, total photos, consistency %), gamified widgets (achievement badges, a weekly activity chart, a consistency heatmap), and a preview of the latest comparison, so progress is visible without digging through the gallery.

Everything — photos and their metadata (id, date, angle) — lives on the device (local filesystem + on-device storage) rather than in a remote database, making the app usable offline and keeping progress photos private by default. A lightweight account/sign-in layer exists only to support optional cloud-adjacent features like GIF generation.

The app follows a freemium model: core capture, streak tracking, and now side-by-side/grid comparison are free for everyone, while higher-effort features (unlimited photo storage, custom photo-pair comparison, progress charts/heatmaps, GIF export, bulk export, and social sharing) are gated behind a premium subscription or one-time purchase.

## **Design**

FitSnapshot uses a dark-first, athletic visual identity built on a hand-rolled design-token system (`constants/DesignSystem.ts`, `constants/Colors.ts`) rather than a third-party UI kit.

- **Palette** — a near-black/forest-green base (`midnight`, `graphite`, `forest`) paired with a vibrant `emerald` (#00C676) as the primary accent, plus supporting colors for alerts (`coral`), warnings (`amber`), and info (`sky`). Full light and dark themes are supported (with a "match system" option), both built from the same token set so the app never looks inconsistent between modes.
- **Typography** — a structured type scale (h1–h4, body, bodyBold, caption, small, tiny) on the system font, keeping text hierarchy consistent across screens without shipping custom font files.
- **Spacing, radius & elevation** — a 4px spacing scale, a border-radius scale running from subtle (8px) to fully rounded (`999px` pills), and standardized shadow/elevation presets, so cards, buttons, and badges share the same sense of depth and roundness throughout the app.
- **Components** — a small internal `ui/` library (`Button`, `IconButton`, `Card`, `Badge`, `Modal`) that all read from the active theme, giving consistent variants (e.g. default/interactive/emphasized/flat cards, solid/outlined badges) instead of one-off styles per screen.
- **Signature patterns** — blurred, glassmorphic photo backgrounds (`BackgroundImage` + `expo-blur`) behind key screens like Progress and onboarding; soft linear-gradient headers with large rounded corners; pill-shaped segmented tab bars for switching between front/side/back and comparison modes; and a subtle dotted SVG background texture on plain surfaces. Icons come from `Ionicons` (via `@expo/vector-icons`).

The overall feel sits between "premium fitness tracker" and "minimal photo app": restrained color use, generous rounding, and blur/gradient layering for depth, rather than flat or skeuomorphic decoration.

## **Features**

- Track fitness progress through photo tracking
- View streaks and latest photos
- Camera functionality for taking new photos
- Storage for photos and streak data

## **Installation**

To install the application, follow these steps:

1. Clone the repository: `git clone https://github.com/your-username/fit-snapshot.git`
2. Install dependencies: `npm install` or `yarn install`
3. Run the application: `npm start` or `yarn start`

## **Usage**

1. Open the application on your mobile device
2. Take a new photo using the camera functionality
3. View your streaks and latest photos

## **Useful Commands**

### Local development

| Command | Description |
| --- | --- |
| `npm start` | Start the Metro dev server (Expo dev client / Expo Go) |
| `npm run android` | Start Metro and open on a connected Android device/emulator |
| `npm run ios` | Start Metro and open on iOS simulator |
| `npm run web` | Start Metro for the web target |
| `npm test` | Run the Jest test suite in watch mode |
| `npx jest` | Run the full Jest test suite once (no watch) |
| `npx tsc --noEmit` | Type-check the whole project without emitting output |

### EAS Build

Builds are a real native rebuild — required any time a native dependency changes (new native module, `app.config.js`/plugin changes), not needed for pure JS changes (those go out via OTA/just re-running Metro).

| Command | Description |
| --- | --- |
| `eas build --platform android --profile development` | Internal dev-client build (native modules included, connects to Metro) |
| `eas build --platform android --profile preview` | Internal build for testing a release-like build without publishing |
| `eas build --platform android --profile production` | Store-ready release build (auto-increments version code) |
| `eas submit --platform android --profile production` | Submit the latest production build to the Play Store |
| `eas build:list --platform android --profile development --limit 5` | List recent builds for a profile, including the exact git commit each was built from — compare against `git log --oneline` to verify which version is actually installed |

### EAS environment variables & secrets

Cloud EAS builds do **not** read your local `.env` — env vars/secrets must be uploaded to EAS separately per environment (`production` / `preview` / `development`).

| Command | Description |
| --- | --- |
| `eas env:list production --scope project` | List env vars configured for the `production` environment |
| `eas env:set production --name KEY --value VALUE --scope project` | Set/update a plain string env var |
| `eas env:set production --name KEY --type file --value ./path/to/file --visibility plaintext --scope project` | Upload a file-type env var (e.g. `GOOGLE_SERVICES_JSON`) |
| `eas whoami` | Check which EAS account the CLI is currently authenticated as |
