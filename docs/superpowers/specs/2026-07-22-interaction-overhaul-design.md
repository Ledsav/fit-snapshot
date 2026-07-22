# Interaction Overhaul: Component & UX Coherence

**Date:** 2026-07-22
**Status:** Approved (design confirmed via interactive prototype artifact)
**Scope:** App-wide interaction layer — shared primitives, the comparison surface, and screen composition.

## Background

Two prior passes shipped the "Measured Confidence" visual identity: the Home tab redesign
(`2026-07-21-measured-confidence-home-redesign`) and the app-wide token rollout
(`2026-07-22-measured-confidence-app-wide-rollout`). Both were **chrome-level** — palette, type, card
borders, section labels. The functional components *inside* those frames were never touched, so the app now
carries two design systems layered on top of each other, and several interaction problems remain unaddressed.

This overhaul fixes the component and interaction layer. Direction was confirmed with the user against an
interactive prototype (published this session). The user selected, explicitly:

- **Scope:** full interaction overhaul (primitives + comparison + all screen composition).
- **Premium model:** *unify + soften* — one consistent premium pattern everywhere, less intrusive, discoverable
  but not nagging, and every locked tap opens the same paywall.
- **Comparison model:** *one primary + secondary actions* — the drag slider is the single primary comparison
  (shared Home + Progress); side-by-side / grid / GIF become clearly-labeled secondary views; "change photos"
  becomes a distinct action, not a fake mode.

## Problems being solved

1. **Two button systems.** `components/ui/Button.tsx` still renders drop shadows + sans-serif bold + rounded
   corners (the pre-redesign language). A second, mono/hairline button style was hand-built inline in
   `camera.tsx` and `PaywallModal.tsx` during the last pass. They look nothing alike.
2. **Premium appears five different ways** — `FeatureGate`'s brass-bordered blur card, PhotoMorph's inline
   mode-pill lock badges, the Settings upgrade card, the full Paywall modal, and the camera limit banner. And
   some locked controls (PhotoMorph mode switcher) **silently no-op on tap** — reads as broken.
3. **`FeatureGate` is fully old-design** — 2px brass border on a non-actionable card, `fontWeight:'bold'`, raw
   `fontSize`, filled star icon (violates "filled icons only for streak/achievement"). Shown all over Home.
4. **The comparison interaction exists twice** — Home's `MiniComparisonPreview` and Progress's `PhotoMorph`
   slider — built separately, drifting apart.
5. **PhotoMorph crams 5 things into one switcher** as co-equal, and one ("Select") is an action that navigates
   away, not a view. Its whole body is still old-design (3px brass frames, heavy shadows, gradient GIF cards).
6. **Home is a widget stack**, not a composition — no grouping, premium locks interrupt mid-scroll, streak
   badge floats with no context.
7. **Camera** crowds the viewfinder with three separate floating control clusters.
8. **Gallery** shows a destructive delete-X on every thumbnail at all times — browsing is one mis-tap from
   data loss.
9. **A dev-only "Test Premium" toggle ships in the real Settings list.**

## Design system (unchanged, reused)

All tokens already exist from prior passes and are reused verbatim:
`constants/Colors.ts` (ink/surface/paper/steel/mist/brass/ember + semantic + `withOpacity`/`overlayOpacity`),
`constants/DesignSystem.ts` (`fontFamily` = Fraunces/IBM Plex Mono/Inter, `preciseType`, `spacing`,
`borderRadius`). Conventions carried forward: **brass = actionable/selected/data-highlight only**; **steel =
plain rows/hairlines**; **ember = streak/achievement milestones only**; **filled icons only for
streak/achievement**, outline everywhere else; **font sizes come from `preciseType`, never raw literals when a
matching token exists** (this rule cost four follow-up fixes last pass — enforce from the start).

---

## Sub-project A — Shared primitives & the premium pattern

**Dependency root. Ship first — B and C consume it.**

### A1. Unified Button (`components/ui/Button.tsx`)

Rebuild the shared Button in the Measured Confidence language and make it the *only* button system.

- **Variants:** `primary` (brass fill, `#14161A` label — the one action that matters per view), `ghost`
  (transparent, hairline border in `steel`, `paper` label — secondary), `danger` (transparent, `brick`
  border + label — destructive), `secondary` (kept for compatibility; steel-toned). Retain `disabled` and
  `loading` states.
- **Type:** mono, uppercase, letter-spaced label via `fontFamily.mono` + `preciseType.badgeLabel` — never
  the old `typography.body`/`h4` sans scale.
- **No drop shadow.** Remove `elevation.md` from all variants. Press feedback is a spring-scale
  (`transform: scale(0.97)` on press, or `activeOpacity`), not a shadow lift.
- **Shape:** `borderRadius.sm` (8px), not the old 14px.
- **Migration:** replace the inline button JSX/styles in `camera.tsx` (confirm screen retake/confirm) and
  `PaywallModal.tsx` (purchase button) with this primitive, so there is exactly one button implementation.

### A2. Unified premium lock (`components/monetization/FeatureGate.tsx` + a new `PremiumLock` row)

Replace the brass-bordered blur card with one quiet, consistent, always-actionable pattern.

- **The lock is a single hairline row**: a muted glyph (outline, `mist`), the feature name (`paper`, body),
  an optional one-line mono sub-label (`mist`), and a small **`PRO`** chip (mono, brass hairline pill). No
  2px brass border, no blur overlay, no filled star, no bespoke per-screen layout.
- **Tapping any locked surface opens the one shared paywall sheet** — this is the single most important
  behavioral fix. It also eliminates the dead-tap no-op bug in PhotoMorph.
- `FeatureGate`'s `showPreview` blur-card path is removed in favor of the row; the `hasAccess` pass-through
  and `PaywallModal` wiring stay. Where a gate currently wraps a whole premium widget on Home
  (achievements/chart/heatmap), it collapses to a `PremiumLock` row (composition detail finished in C).
- **Softened, per the user's choice:** premium stays discoverable but never blurs/interrupts; on Home it
  consolidates toward a single "Pro" group rather than multiple full locked cards mid-scroll (C-level).

### A3. Premium UX bugs fixed in this layer

- Locked taps → open paywall (never silent no-op).
- One paywall entry point/component reused everywhere (`source` param retained for analytics).

---

## Sub-project B — The comparison surface

**Core value. Depends on A.**

### B1. Shared before/after slider (new `components/progress/BeforeAfterSlider.tsx`)

One component, used by **both** Home's `MiniComparisonPreview` and Progress's `PhotoMorph`.

- **Wipe reveal**, not the current opacity crossfade: a draggable divider (brass, 2px) with a round brass
  knob splits before (left) from after (right) via `clip-path`/overlay. Confirmed with user as a deliberate
  interaction improvement — partial progress is legible where crossfade is muddy.
- Wrapped in the contact-sheet mat (ticks + mono caption `DATE → DATE · ANGLE · N DAYS`), matching every
  other photo surface in the app.
- Props: the two photos + caption; owns its own drag state (PanResponder/Reanimated, matching the codebase's
  existing gesture approach).
- `MiniComparisonPreview` and PhotoMorph's slider mode both render this instead of their own copies.

### B2. PhotoMorph restructure (`components/progress/PhotoMorph.tsx`, `app/(tabs)/progress.tsx`)

- **Slider is the primary surface** — fills the stage by default.
- **Secondary views** (side-by-side / grid / GIF) become a labeled `VIEW` action group *below* the stage, not
  co-equal tabs in one switcher. Locked ones carry the `PRO` chip and open the paywall on tap (via A).
- **"Change photos" becomes a distinct action** (top-bar `CHANGE ▸`), separated from view selection — it is a
  different kind of decision (which photos vs. how to view them).
- Migrate all remaining old chrome to the flat instrument language: 3px brass image frames → contact-sheet
  mat; drop shadows removed; gradient GIF result cards → flat mat cards; rounded time-difference chips →
  mono caption; colored mode pills → the new secondary-action group.

---

## Sub-project C — Screen composition & control layout

**Composition. Depends on A + B.**

### C1. Home (`app/(tabs)/index.tsx`)

- **Labeled zones** give the scroll rhythm: `THIS WEEK` (instrument strip), `LATEST` (matted photo), `PRO`
  (single quiet premium group), with the reminder as the one loud CTA up top.
- **Streak gets context** — "7-day streak · best: N" — instead of a bare floating number.
- **Premium consolidates to one quiet `PremiumLock` group near the bottom** — no more two full locked cards
  interrupting the middle of the scroll.

### C2. Camera (`app/(tabs)/camera.tsx`)

- Consolidate the three floating control clusters into **one bottom control bar** (flash / timer / flip /
  import balanced around the shutter) plus the angle selector alone at top (shared pill component).
- Shutter ring in brass. Frame guide stays unobstructed. (Confirm screen already done in A migration.)

### C3. Gallery (`app/(tabs)/gallery.tsx`)

- **Split browse from manage.** Browse mode: clean matted thumbnails + mono date caption, tap opens
  full-screen, no destructive controls. **Manage mode** (explicit "Select" toggle): checkable tiles +
  batched delete. Deletion is no longer a hair-trigger on every tile.

### C4. Settings (`app/(tabs)/settings.tsx`)

- **Remove the dev "Test Premium" toggle** from the shipped product (move behind a real dev-only flag).
- Pro card uses A's pattern + the shared Button instead of a bespoke gradient block.
- Convert remaining `theme.primary + '20'`-style opacity-string hacks (account/dev blocks) to `withOpacity`.

---

## Sequencing & delivery

Three plans, one per sub-project, executed in order (A → B → C). Each is independently shippable and
individually reviewed. A is the dependency root; building it first means B and C inherit the new Button and
premium pattern rather than re-inventing them.

## Out of scope

- No new features or navigation. No backend/data changes. Purchase flow logic (`handlePurchase`), photo
  storage, streak service, localization *values* (new keys may be added) are untouched except where a task
  explicitly restyles their presentation.
- GIF *generation* logic is untouched; only its result-card presentation restyles (B2).

## Risks / notes for planning

- `PhotoMorph.tsx` is the largest, most feature-dense component in the app (5 modes, premium gating,
  GIF service, media-library saves). B2 is the highest-risk task — plan it in small, independently testable
  steps and keep the gesture/GIF/save logic byte-stable while only the presentation changes.
- Pre-existing unrelated WIP is uncommitted in the working tree (`app.json`, `app/(tabs)/gallery.tsx`,
  `localization/translations.ts`, a logo asset). Any task touching `gallery.tsx` or `translations.ts` must
  stash/restore that WIP around its own commit (procedure proven in the prior rollout).
- Enforce the "no raw font literal when a `preciseType` token exists" rule in every task brief from the
  start — it caused four follow-up fixes last pass.
