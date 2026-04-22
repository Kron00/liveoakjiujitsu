# Programs Section Redesign — Sprouts First

**Status:** Draft for review
**Date:** 2026-04-22
**Scope:** Homepage `#programs` section on `src/pages/index.astro`

---

## Goal

Replace the current uniform 3-card programs grid with an **editorial bento showcase** — one full-width section per program, each using 4–6 photos in an asymmetric collage composition with the program's description embedded in the layout.

Start with the **Sprouts** section. Youth and Adult/Teen will follow the same pattern in later passes once their photos arrive.

## Why

The current grid treats all three programs as visually equal catalog items with a single hero image apiece. That makes it hard to:

- Show the *character* of each program (Sprouts = warm/joyful; Youth = focused; Adult = technical)
- Justify the new priority order — Sprouts first demands a section that feels worth leading with
- Use the new photography the owner has in Google Drive — we have many good shots per program but only one slot each to show them

Editorial bento gives each program its own visual identity while keeping a consistent structural rhythm (hero + candids + copy + stats).

## Out of Scope

- Youth and Adult/Teen section redesigns (deferred — separate passes once photos arrive)
- Dedicated per-program pages (considered and rejected — site is single-page; revisit later if SEO demands it)
- Schedule/pricing/FAQ sections (unchanged)
- Any content outside the `#programs` section
- Photo editing, cropping, or optimization (assumed done out-of-band; we reference filenames)

## Current State

File: `src/pages/index.astro` lines ~3724–3770.

```html
<section id="programs" class="programs-section">
  <div class="container">
    <span class="section-label">REACH YOUR GOALS</span>
    <h2>Brazilian Jiu Jitsu Programs for Every Age in Fairfield</h2>
    <p class="section-subtitle">...</p>
    <div class="programs__grid">
      <!-- 3 × .program-card: Adult, Youth, Sprouts -->
    </div>
    <p class="programs__note">Competition team members...</p>
  </div>
</section>
```

Styles live inline in the same file (`<style is:global>` block starting ~line 51). CSS variables in `:root` — red brand color is `--color-gold: #c10c10`, light theme (`--color-dark: #f5f5f5`).

## New Design — Sprouts Section

### Structure (desktop, ≥1024px)

```
┌────────────────────────────────────────────────────────────────────┐
│  01 · SPROUTS PROGRAM                          AGES 3–5            │
│                                                                    │
│  Their first taste of the mat.                                     │
│  ───────────────────────────────────────────────────               │
├────────────────────────────────────┬───────────────────────────────┤
│                                    │  ┌─────────────────────────┐  │
│                                    │  │                         │  │
│                                    │  │   [PHOTO B: belt        │  │
│                                    │  │    tying — square]      │  │
│                                    │  │                         │  │
│    [PHOTO A: coach teaching        │  └─────────────────────────┘  │
│     the little girl — tall,        │                               │
│     dominant hero]                 │  Sprouts is an excellent      │
│                                    │  opportunity for your child   │
│                                    │  to learn the fundamentals    │
│                                    │  of BJJ, Judo and Wrestling   │
│                                    │  through animal movements     │
│                                    │  and games. [full desc]       │
│                                    │                               │
├────────────────┬───────────────────┼───────────────────────────────┤
│                │                   │  ┌─────────────────────────┐  │
│  [PHOTO C:     │  [PHOTO D:        │  │  Ages 3–5                │  │
│   laughing     │   listening       │  │  Small class sizes       │  │
│   kids —       │   circle —        │  │  Live Scanned staff      │  │
│   square]      │   landscape]      │  │  White → Grey belts      │  │
│                │                   │  │  Compass Charter vendor  │  │
│                │                   │  └─────────────────────────┘  │
└────────────────┴───────────────────┴───────────────────────────────┘
```

The header sits **above** the grid as a sibling element (flex row: eyebrow left, age tag right, title on its own line below). The grid itself is **12 columns, auto rows**, gap of `var(--space-md)`:

| Grid cell | Cols | Rows | Notes |
|---|---|---|---|
| Photo A (hero — coach teaching) | 1–7 | 1–2 | Tall, spans 2 rows |
| Photo B (belt tying) | 8–12 | 1 | Square-ish, top right |
| Description block | 8–12 | 2 | Copy sits under Photo B |
| Photo C (laughing kids) | 1–4 | 3 | Square |
| Photo D (listening circle) | 5–7 | 3 | Landscape |
| Stats card | 8–12 | 3 | Bulleted list with red markers |

Column totals per row: row 1 → 7+5=12 ✓; row 2 → 7+5=12 ✓; row 3 → 4+3+5=12 ✓.

### Structure (tablet, 640–1023px)

- Hero photo becomes full-width at top
- Description + stats stack in a 2-column row below
- Candid photos (B, C, D) in a 3-up strip at bottom

### Structure (mobile, <640px)

Stack linearly:

1. Section header
2. Photo A (hero, full width, aspect 4:5)
3. Description paragraph
4. Photo B (full width, aspect 4:3)
5. Photo C + Photo D side-by-side (2-column mini-grid)
6. Stats card

No horizontal scroll. No carousel. Every photo visible by scrolling.

### Photo Selection (Sprouts)

From the 7 photos provided, **use 4** in the bento grid:

| Label | Content | Filename (to add) |
|---|---|---|
| Photo A (hero) | Coach sitting on mat instructing little girl in black/red gi, diverse group of kids around | `sprouts-01-hero-teaching.jpg` |
| Photo B (accent) | Coach tying white belt on little girl in pink gi | `sprouts-02-belt-tying.jpg` |
| Photo C (candid) | Two young kids laughing, one climbing on the other's back | `sprouts-03-laughing.jpg` |
| Photo D (candid) | Kids sitting cross-legged in a circle listening to coaches | `sprouts-04-circle.jpg` |

**Skipped** and why:
- Purple-belt-rolling shot and two-boys-takedown shot → look like Youth-aged kids, saved for the Youth pass
- Group warmup with storefront window visible → nice shot but the composition doesn't fit a grid cell cleanly; keep as an option if we add a 5th photo later

Files must be placed at `public/assets/images/sprouts-0N-*.jpg`.

### Copy

**Eyebrow:** `01 · SPROUTS PROGRAM`
**Title:** `Their first taste of the mat.`
**Age tag:** `AGES 3–5`

**Description** (keep existing copy, minor tightening):
> Sprouts is an excellent opportunity for your child to learn the fundamentals of BJJ, Judo, and Wrestling through animal movements and games. Students primarily learn takedowns, passing, sweeps, controls, and beginner submissions. For many of our Sprouts, this is their first experience of an organized sport — so we lean hard into positive reinforcement, modeling, and rewards. All staff are Live Scanned for your child's safety.

**Stats card bullets:**
- Ages 3–5
- Small class sizes, big attention
- Live Scanned instructors
- White → Grey belt progression
- Compass Charter vendor · E-Voucher accepted

### Visual Treatment

- **Section background:** Dark break from the light-theme page — `#0f0f0f` (near-black) full-bleed section. Red/black mat photos will pop against it.
- **Eyebrow number "01":** Rendered as the eyebrow label AND as a large ghosted display numeral (Cormorant Garamond, ~12rem, `opacity: 0.04`, positioned absolutely behind the grid) — adds editorial magazine feel without screaming.
- **Title:** `var(--font-display)` (Cormorant Garamond), italic 500 weight, `var(--text-5xl)`. White.
- **Age tag:** Small monospace-style uppercase label, right-aligned in header row. Red (`--color-gold`) with thin border.
- **Photos:** Zero border radius on hero (A) for cinematic feel; small radius (`--border-radius-lg`) on candids (B, C, D). All with subtle `box-shadow` for lift.
- **Hover on hero:** 1.03× scale over 600ms with `var(--ease-smooth)`.
- **Stats card:** Dark elevated surface (`#1a1a1a`), red left-border rule (3px, `--color-gold`), red round bullet markers. Outfit font, 300 weight.
- **Reveal animation:** Reuse existing `.reveal` class — fade-up on scroll, staggered.

### Typography Hierarchy

```
EYEBROW      → text-xs, uppercase, letter-spacing 0.2em, color-text-faint
TITLE        → text-5xl, display italic, white
AGE TAG      → text-xs, uppercase, letter-spacing 0.15em, gold
DESCRIPTION  → text-base, body, line-height 1.7, color-text-muted (on dark: #aaa)
STATS ITEMS  → text-sm, body, white
```

## Implementation Notes

### File changes (scope)

**Only `src/pages/index.astro` is touched** for this pass. No new components/files. Reason: the site keeps everything inline per existing convention; splitting into components now is a separate refactor.

Add new images to `public/assets/images/sprouts-*.jpg` (5 files).

### CSS approach

Add a new block **alongside** (not replacing) the current `.programs-section` styles. Naming:

- `.program-showcase` — the new full-width section wrapper
- `.program-showcase--sprouts` — variant for color/spacing tweaks per program
- `.program-showcase__header` — eyebrow + title + age tag row
- `.program-showcase__grid` — the 12-col bento grid
- `.program-showcase__photo` + `--hero`, `--accent`, `--candid` modifiers
- `.program-showcase__copy` — description block
- `.program-showcase__stats` — bulleted stats card
- `.program-showcase__numeral` — the giant ghosted "01" background element

The existing `.programs-section`, `.programs__grid`, `.program-card` classes **stay in the stylesheet** until Youth and Adult migrations are done, at which point the old classes get deleted in the final pass.

### HTML structure

```html
<section id="programs" class="programs-section">
  <div class="container">
    <span class="section-label">REACH YOUR GOALS</span>
    <h2 class="section-heading">Brazilian Jiu Jitsu Programs for Every Age in Fairfield</h2>
    <p class="section-subtitle">…</p>
  </div>

  <!-- Sprouts: new editorial bento, full-bleed dark background -->
  <div class="program-showcase program-showcase--sprouts reveal">
    <span class="program-showcase__numeral" aria-hidden="true">01</span>
    <div class="container">
      <header class="program-showcase__header">
        <span class="program-showcase__eyebrow">01 · Sprouts Program</span>
        <h3 class="program-showcase__title">Their first taste of the mat.</h3>
        <span class="program-showcase__age-tag">Ages 3–5</span>
      </header>

      <div class="program-showcase__grid">
        <figure class="program-showcase__photo program-showcase__photo--hero">…</figure>
        <figure class="program-showcase__photo program-showcase__photo--accent">…</figure>
        <div class="program-showcase__copy">…</div>
        <figure class="program-showcase__photo program-showcase__photo--candid">…</figure>
        <figure class="program-showcase__photo program-showcase__photo--candid">…</figure>
        <ul class="program-showcase__stats">…</ul>
      </div>
    </div>
  </div>

  <!-- Youth + Adult: old cards kept until their redesign passes; rendered 2-up -->
  <div class="container">
    <div class="programs__grid programs__grid--two-up">
      <article class="program-card reveal"><!-- Youth --></article>
      <article class="program-card reveal"><!-- Adult & Teen --></article>
    </div>
    <p class="programs__note">…</p>
  </div>
</section>
```

Note: the outer element is still `<section id="programs" class="programs-section">` — we do not rename it — so the nav anchor (`href="#programs"`) and existing CSS targeting that ID keep working. The inner `.program-showcase` is a `<div>` (not a nested `<section>`) to avoid outline ambiguity; its `<header>` + heading still give it proper landmark semantics.

### Priority-order change & mixed-layout coexistence

Sprouts becomes a full-width editorial bento at the top. Youth and Adult remain as old `.program-card` items *below* it, now in a **2-column grid** (not 3), so the pair reads as a visually balanced row rather than a gapped-out remnant of the old 3-col layout.

Visual order on the page:

1. Section header (existing: "REACH YOUR GOALS" eyebrow + H2 + subtitle)
2. Sprouts editorial bento (new, full-width)
3. A 2-col grid containing Youth card + Adult card (old style, reordered)
4. `programs__note` paragraph (existing)

This way the priority reorder lands immediately and the transitional state looks intentional, not half-migrated. The 2-col layout is purely a CSS override on `.programs__grid` when it contains only two `.program-card` children — add a modifier class `.programs__grid--two-up` or use `:has(> .program-card:nth-child(2):last-child)` (use the modifier class; cleaner and broader browser support).

### Reveal / motion

- Reuse existing `IntersectionObserver` and `.reveal` class (lines ~4910–4945 of index.astro)
- Staggered reveal of child elements already works there — verify the observer picks up our new `.program-showcase` elements. If needed, add `.program-showcase` to the selector list.

### Performance

- All 5 Sprouts photos need `loading="lazy"` except Photo A (hero), which gets `loading="eager"` if the section is within the initial viewport on tall screens. Otherwise lazy.
- Specify `width` and `height` attributes to prevent layout shift.
- Existing site uses plain `.jpeg`/`.jpg` — match that; no AVIF/WebP conversion in this pass.

### Accessibility

- All photos get descriptive `alt` text (not "sprouts-01")
- Hero photo `alt`: "A coach sits on the mat demonstrating a technique to a young student in a black and red gi, with other Sprouts students watching"
- Each photo is wrapped in `<figure>`; decorative numeral "01" gets `aria-hidden="true"`
- Color contrast: white body text on `#0f0f0f` → passes WCAG AAA
- Stats list uses `<ul>` with real `<li>`s, not divs

### SEO impact

- Kept the `#programs` anchor — existing nav links (`href="#programs"`) still work
- Kept the H2 section heading — same keywords
- Schema.org JSON-LD references to Sprouts (lines ~3157, ~3275) are unchanged — names/descriptions still match
- New content is richer text → net positive for SEO

## Testing

- [ ] Visual check at desktop (1440), laptop (1280), tablet (768), mobile (390)
- [ ] Photos load with correct aspect ratios, no layout shift (Lighthouse CLS = 0)
- [ ] Reveal-on-scroll fires for the new section
- [ ] Nav link `#programs` still scrolls to the top of the programs section
- [ ] Build succeeds (`npm run build`)
- [ ] `npm run test` passes (Node test runner)

## Rollout

Single commit on a feature branch:
1. Add 5 photo files to `public/assets/images/`
2. Update `src/pages/index.astro` — reorder, insert Sprouts bento, add CSS
3. Build + visual QA
4. Open PR

Youth and Adult passes are separate PRs so each one can be reviewed on its own.

## Open Questions

None gating implementation. Worth noting for future passes:

1. When Youth and Adult passes land, the final pass should **delete** the old `.program-card`, `.programs__grid` CSS blocks (currently lines ~986–1079 and mobile overrides) to avoid dead code.
2. If the three stacked editorial sections become too long vertically on mobile, consider an accordion-per-program pattern. Not needed yet.
3. The `programs__note` paragraph about the competition team feels out of place once Sprouts leads (Sprouts doesn't have a comp team). Consider moving it to live under the Adult section instead of at the bottom of the whole programs area. Revisit in the Adult pass.
