# Progress KPIs — Design

**Date:** 2026-07-22
**Status:** Approved (design), pending implementation plan
**Related:** [Live Lighting Guidance](2026-07-22-live-lighting-guidance-design.md)
(produces the `Photo.luminance` field the lighting-consistency KPI reads)

## Goal

Surface progress KPIs on the Progress screen, giving the user objective signals about
their tracking habit and photo quality. Ship a no-ML **Tier A** set now, but architect
the KPI engine so pose-based **Tier B** metrics (shoulder-waist ratio, symmetry,
posture) slot in later without rework.

## Scope

- **In:** Tier A KPIs (no ML, no new dependencies) + an extensible KPI engine and
  data model that anticipates Tier B.
- **Out (this spec):** Tier B pose-landmark computation and Tier C segmentation. Their
  *insertion points* are designed here; their implementation is a later spec.

## Tier A KPIs

Computed from photo metadata plus the `Photo.luminance` field from the lighting spec:

| KPI | Definition | Source |
|---|---|---|
| **Lighting consistency** | 0–100% derived from the spread (coefficient of variation) of `luminance` across a pose's photos — lower spread = higher score | `Photo.luminance` |
| **Current streak** | Existing streak metric | reuse `services/streakService.ts` |
| **Average cadence** | Mean/median days between consecutive photos | photo `date` |
| **Angle coverage** | Which of front/side/back are present (optionally "recently") | `Photo.type` |
| **Days tracked** | Span from first to most recent photo | photo `date` |

- **Lighting consistency** shows "—" until enough photos carry `luminance` (i.e. until
  the lighting feature has been used a few times). It never blocks the other KPIs.
- Every KPI except lighting consistency is fully independent of the lighting spec, so
  this feature can ship before, after, or in parallel with it.

## Architecture — extensible KPI engine

### KPI as a pure function

Each KPI is a pure function of the photo set (and options), returning a typed result:

```ts
type KpiResult = {
  id: string;            // e.g. "lighting-consistency"
  value: number | null;  // null => not enough data => render "—"
  display: string;       // preformatted, e.g. "87%", "12 days", "every 4 days"
  available: boolean;    // false => hide or dim
};

type KpiFn = (photos: Photo[], opts?: KpiOptions) => KpiResult;
```

KPIs are collected in a **registry** (an ordered list of `KpiFn`). The Progress UI
maps over the registry and renders whatever each function returns. Adding a KPI = add a
function to the registry; no UI change required for a new metric of the same shape.

### Tier B insertion points (designed, not built)

- `Photo` carries **optional analysis fields**: `luminance?` today, `landmarks?` later
  (a normalized pose-landmark payload). Adding `landmarks?` is additive.
- Tier B KPIs (shoulder-waist ratio, symmetry, posture) are simply new `KpiFn`s added
  to the registry that read `photo.landmarks`. They return `available: false` until
  landmark data exists, so they render as "—" without special-casing the UI.
- No Tier A code changes to add Tier B — that is the point of the registry + pure-fn
  shape.

## Data flow

1. Progress screen reads photos from `usePhotos()` (already wired).
2. A `useKpis(photos)` hook runs the registry (memoized on the photo set) and returns
   `KpiResult[]`.
3. A KPI display component renders the results (label + value), consistent with the
   existing instrument-panel visual language (mono labels, `StreakCard`-style tiles).

## UI placement

- KPIs render on the **Progress** screen (`app/(tabs)/progress.tsx`), above or beside
  the existing per-pose `PhotoMorph`/tab-bar section.
- Reuse existing card/typography primitives (`components/ui/Card`, `StreakCard`,
  `preciseType`) so it matches current styling; no new visual system.
- New KPI labels go through `localization/translations.ts` like the rest of the app.

## Error handling & edge cases

- **No photos / one photo** — cadence, days-tracked, streak, and consistency return
  `null` → "—"; angle coverage still renders what exists.
- **All legacy photos (no `luminance`)** — lighting consistency is "—"; everything else
  works.
- KPI functions must be **total** (never throw) — a bad/partial photo record yields
  `available: false`, not a crash.

## Testing

- Unit-test each `KpiFn` in isolation with crafted photo sets: empty, single photo,
  multi-pose, missing `luminance`, and known-answer cadence/consistency cases.
- Test the registry/`useKpis` aggregation returns one result per registered KPI in
  order.
- Confirm a stub Tier B `KpiFn` reading `landmarks` returns `available: false` on
  today's data (proves the extension point works without landmark data).

## Out of scope (this spec)

- Actual pose-landmark or segmentation ML (Tier B / Tier C).
- Historical backfill of `luminance` for legacy photos (declined the pixel dependency
  in the lighting spec).
