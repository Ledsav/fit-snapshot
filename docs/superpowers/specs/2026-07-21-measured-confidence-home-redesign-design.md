# Measured Confidence: Home Screen Visual Redesign

**Date:** 2026-07-21
**Status:** Approved for implementation planning
**Scope:** Design tokens (app-wide) + Home tab (`app/(tabs)/index.tsx` and its child components)

## Background

The current visual design (near-black `#0A0F0D` background, single emerald `#00C676` accent used for every UI role, zero custom typography, repeated circle-icon-chip pattern) reads as a generic AI/template fitness app rather than a considered product. See conversation critique for full detail:

- `constants/Colors.ts` uses one accent color for icons, borders, progress bars, badges, and CTAs alike — nothing signals relative importance.
- `constants/DesignSystem.ts`'s `typography` scale has no `fontFamily` — every screen renders in the bare OS system font. `SpaceMono` is loaded in `app/_layout.tsx` but never applied anywhere.
- `StreakCard`, `ProgressSummary`, and `LatestPhotoCard` all reuse an identical tinted-circle + Ionicons-glyph + label pattern with no variation.
- Streak copy ("Legendary Dedication — Rewriting History!") reads as generic gamification filler rather than this app's own voice.

## Direction

**Fit Snapshot is a trusted measurement tool, not a gym motivation app.** Its core promise: consistent photos reveal real change, privately and objectively.

Design direction — **"Measured confidence"**, split roughly 70/20/10:
- **70% precise / clinical** — governs navigation, statistics, capture, and comparison. Restrained, data-forward, quiet confidence (measurement instrument, not hype).
- **20% editorial / darkroom** — governs how personal photos are presented, so they feel considered rather than clinical or exposed.
- **10% bold / athletic** — reserved exclusively for streaks, achievements, and milestone moments. Never used for ordinary UI.

Theming: dark is the primary, personality-carrying mode; light is a proper (not afterthought) inverse built from the same tokens.

## Design tokens

### Color

| Token | Hex | Role |
|---|---|---|
| `ink` | `#14161A` | App background (dark mode) |
| `surface` | `#1D2025` | Card / panel background |
| `paper` | `#EDEAE2` | Primary text (dark mode); background (light mode); photo mats |
| `steel` | `#4A5A63` | Dividers, secondary surfaces, hairline borders |
| `mist` | `#8B9198` | Secondary / caption text |
| `brass` (signal) | `#C9A227` | Precision accent — active states, primary actions, data highlights |
| `ember` (milestone) | `#D1603D` | Reserved for streaks/achievements only |

Light mode inverts the base relationship (`paper` becomes background, `ink` becomes text) while `brass`/`ember` keep their values and roles.

This replaces the current single-accent `emerald`/`midnight` system in `constants/Colors.ts`. Semantic roles in the exported theme object (`text`, `background`, `primary`, `cardBackground`, etc.) stay structurally the same so consuming components don't need shape changes — only the values change, plus the new `signal`/`milestone` roles need to be added since today `primary` is overloaded for both.

### Typography

Three roles, replacing the current family-less `typography` scale in `constants/DesignSystem.ts`:

- **Display / editorial** — Fraunces, italic, weight 500. Used for headlines, motivational copy, and anything tied to the photos themselves (captions, comparison labels).
- **Precision / data** — IBM Plex Mono, weight 500/600. Used for every stat, date, timestamp, and label (the "instrument readout" voice).
- **Body** — Inter, weight 400/500. Everything else (descriptions, helper text, settings copy).

Bundled via `@expo-google-fonts/fraunces`, `@expo-google-fonts/ibm-plex-mono`, `@expo-google-fonts/inter` in `app/_layout.tsx`'s `useFonts` call, replacing the currently-unused `SpaceMono` entry.

### Shape & elevation

- Corner radii tighten from the current 16–30px range (`borderRadius.lg`–`xxxl`) to 8–10px — reads as an instrument panel rather than a bubbly consumer card.
- Heavy drop shadows (`elevation.md`, ~15% opacity) are replaced by 1px hairline borders in `steel` at low opacity. Flat, not skeuomorphic.

### Iconography

Standardize on Ionicons `*-outline` variants everywhere — hairline weight matches the precision language. Filled icons are reserved exclusively for the 10% athletic accent (streak flame, achievement badges), always rendered in `ember`.

## Signature element: the contact-sheet frame

Every place a progress photo appears gets the same treatment: a `paper`-colored mat around the photo, small sprocket-hole ticks along the top edge, and a mono caption underneath (e.g. `DAY 1 → DAY 47 · FRONT`). This is the one motif reused everywhere a photo shows up (comparison preview, latest photo card, and eventually gallery in a later pass) — it's what makes the photos feel handled and considered instead of being `<Image>` tags dropped in a card, and it's the throughline the redesign is remembered by.

## Home screen structure (top to bottom)

Replaces the current section order in `app/(tabs)/index.tsx`.

1. **Top bar** — small mono wordmark + hairline divider. Replaces `components/home/Header.tsx`'s gradient hero and italic motivational-quote subtitle entirely (identified as one of the strongest "generic wellness app" tells).
2. **Contact-sheet hero** — best available before/after pair, matted, with mono caption. Replaces `MiniComparisonPreview`'s current plain-card treatment. This is the screen's thesis: the photos, not a stat.
3. **Instrument strip** — a 3-up mono readout (days tracked / consistency % / this week's photo count). Replaces `ProgressSummary` — same underlying data (`totalDays`, `totalPhotos`, `consistency`), no more duplicate stat card later in the scroll.
4. **Next photo reminder** — stays as the primary CTA (`NextPhotoReminder`), restyled: hairline `brass` border, Fraunces italic for the message, mono for the capture action label.
5. **Streak** — downgraded from a full-width hero card (`StreakCard`) to a compact `ember` badge (flame + number) placed inline near the reminder or strip. It's a milestone signal, not a primary metric, and a full card overstates it relative to the 70/20/10 split.
6. **Latest photo** (`LatestPhotoCard`) — restyled with the same contact-sheet/mat treatment as the hero, single photo.
7. **Achievements / weekly chart / consistency heatmap** (`AchievementBadges`, `WeeklyProgressChart`, `ConsistencyHeatmap`, all behind `FeatureGate`) — token-level reskin only in this pass (new colors/type/radii applied to existing structure). Structural redesign of these is explicitly deferred to a follow-up pass.
8. **Tips carousel** (`ShreddedTipsCarousel`) — reskinned to the new palette: mat/paper card instead of the current solid `brass`-equivalent block, Fraunces for the tip headline, Inter for the clarification line.

## Out of scope for this pass

Camera, Gallery, Settings, onboarding carousel, and paywall screens keep their current visuals and continue reading from the same theme object. Because token *values* change but the theme object's *shape* (`theme.primary`, `theme.cardBackground`, etc.) does not, these screens should keep working without breaking — they just won't get the structural treatment (contact-sheet frames, instrument strip, etc.) until their own dedicated pass.

## Open questions / risks for the implementation plan

- Confirm `@expo-google-fonts/fraunces` ships the italic 500 weight needed for the display role (Fraunces is a variable font family; verify the Expo-packaged static weights include it).
- The sprocket-hole/mat "contact sheet" treatment needs a concrete RN implementation (e.g. `react-native-svg` for the ticks, consistent with the existing `components/style/Pattern.tsx` approach) — worth a quick spike before committing to the exact visual before building all consuming components.
- Confirmed via grep: `ProgressSummary` and `StreakCard` are consumed only by `app/(tabs)/index.tsx` today (the only other hits are the usage-example comments in `components/ui/Card.tsx`), so restructuring/downsizing them will not silently break another screen.
