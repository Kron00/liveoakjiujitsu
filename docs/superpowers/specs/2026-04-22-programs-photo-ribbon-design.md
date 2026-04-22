# Programs Section — Text-Only Cards + Scrolling Photo Ribbon

**Date:** 2026-04-22
**File affected:** `src/pages/index.astro`
**Section affected:** `<section id="programs" class="programs-section">` (heading: "Brazilian Jiu Jitsu Programs for Every Age in Fairfield")

## Goal

Simplify the three program cards to pure text blocks and replace the three per-card image carousels with a single full-bleed scrolling photo ribbon below the card grid. The ribbon matches the existing testimonial-ribbon pattern so the page feels cohesive.

## Current State

Each of the three program cards (`.program-card`) contains:

- `.program-card__media` — a `.program-carousel` with 3–5 slides, nav dots, and 5s autoplay
- `.program-card__body` — eyebrow, title, description

Three carousels drive 13 total images (5 Adult, 3 Youth, 5 Sprouts) plus dot controls and autoplay JS.

## Target State

### Section layout (top to bottom)

1. `.container` — section label, heading, subtitle, grid of 3 **text-only** cards
2. **New** `.programs-ribbon` — full-bleed, outside `.container`, scrolls horizontally
3. `.container` — closing `.programs__note` paragraph (unchanged)

### Card changes

- Remove `.program-card__media` (the entire carousel wrapper) from all 3 cards
- Keep `.program-card__body` exactly as-is — eyebrow, title, description
- Card copy: unchanged

### Ribbon markup

Full-bleed wrapper outside `.container`, mirroring the testimonial ribbon:

```html
<div class="programs-ribbon">
  <ul class="programs-ribbon__track">
    <!-- Set 1: 13 slides -->
    <li class="programs-ribbon__slide">
      <img src="assets/images/programs-carousel/adult-1.jpeg" alt="..." />
    </li>
    <!-- … 12 more … -->

    <!-- Set 2: 13 duplicates, aria-hidden for seamless loop -->
    <li class="programs-ribbon__slide" aria-hidden="true">
      <img src="assets/images/programs-carousel/adult-1.jpeg" alt="" loading="lazy" />
    </li>
    <!-- … 12 more … -->
  </ul>
</div>
```

### Slide order (interleaved so age groups alternate)

Set 1 order: `adult-1, youth-1, sprouts-1, adult-2, youth-2, sprouts-2, adult-3, youth-3, sprouts-3, adult-4, sprouts-4, adult-5, sprouts-5`

Set 2 is an exact duplicate of Set 1, with `aria-hidden="true"` on each `<li>` and empty `alt=""` on each `<img>` so assistive tech doesn't hear the images twice.

### Loading strategy

- First slide (`adult-1`): eager-loaded (default)
- All other Set 1 slides: `loading="lazy"`
- All Set 2 slides: `loading="lazy"`, empty `alt`, `aria-hidden="true"` on the `<li>`

### Alt text

Re-use the existing alt text from the current carousel slides verbatim for Set 1. Set 2 gets `alt=""` (decorative duplicate).

### Ribbon styles (new CSS — mirrors `.testimonial-ribbon` pattern)

```css
/* ---- Programs Photo Ribbon / Marquee ---- */
.programs-ribbon {
  margin-top: var(--space-2xl);
  overflow: hidden;
  position: relative;
  width: 100%;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
}

.programs-ribbon__track {
  display: flex;
  gap: var(--space-lg);
  width: max-content;
  animation: programsRibbonScroll 150s linear infinite;
  padding: 1rem 0;
  margin: 0;
  list-style: none;
}

@media (hover: hover) {
  .programs-ribbon:hover .programs-ribbon__track {
    animation-play-state: paused;
  }
}

@keyframes programsRibbonScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.programs-ribbon__slide {
  flex: 0 0 clamp(280px, 26vw, 380px);
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
  background: var(--color-border-light);
}

.programs-ribbon__slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

@media (min-width: 769px) {
  .programs-ribbon__track {
    animation-duration: 170s;
  }
}
```

Timing note: 150s mobile / 170s desktop is slightly slower than the testimonial ribbon (120s / 140s) so photos breathe.

### Ribbon JavaScript (new — mirrors testimonial pattern)

```javascript
var programsRibbon = document.querySelector('.programs-ribbon');

if (programsRibbon) {
  var programsTrack = programsRibbon.querySelector('.programs-ribbon__track');
  var programsMobileOff = window.matchMedia('(max-width: 768px)');

  if (programsTrack) {
    programsRibbon.addEventListener('touchstart', function() {
      if (programsMobileOff.matches) return;
      programsTrack.style.animationPlayState = 'paused';
    }, { passive: true });

    programsRibbon.addEventListener('touchend', function() {
      if (programsMobileOff.matches) return;
      setTimeout(function() {
        programsTrack.style.animationPlayState = 'running';
      }, 3000);
    }, { passive: true });
  }
}
```

## What gets removed

### HTML (inside each of the 3 program cards)
- The entire `<div class="program-card__media">` block, including the `.program-carousel`, `.program-carousel__track`, `.program-carousel__slide` `<li>`s, and `.program-carousel__dots` container.

### CSS (only if grep confirms no other section uses them)
- `.program-card__media`
- `.program-carousel`
- `.program-carousel__track`
- `.program-carousel__slide`
- `.program-carousel__dots`
- `.program-carousel__dot`
- Any carousel-specific responsive rules

### JavaScript (only if it's scoped to `.program-carousel` and nothing else)
- Per-card carousel autoplay timer
- Dot click handlers
- Any slide-change logic

Implementation step must verify via grep that these selectors and JS hooks aren't referenced anywhere outside the programs section before deleting. If they are, leave the CSS/JS alone and only delete the HTML.

## What is preserved

- All image files in `assets/images/programs-carousel/` stay on disk.
- Section label, heading, subtitle, `.programs__note`, and all card copy are unchanged.
- All other sections (Hero, Coaches, Testimonials, Footer, etc.) are untouched.
- The existing `.program-card` / `.program-card__body` / `.program-card__eyebrow` / `.program-card__title` / `.program-card__desc` CSS stays — cards will now simply lack media on top, so verify their top padding still looks right once media is gone.

## Accessibility

- Set 1 slides keep their descriptive alt text.
- Set 2 slides use `aria-hidden="true"` on the `<li>` and empty `alt=""` on the `<img>` so screen readers don't read duplicates.
- Ribbon pauses on hover (pointer devices).
- Ribbon pauses for 3 seconds after a touch interaction.
- No `prefers-reduced-motion` rule is currently on the testimonial ribbon, so the photo ribbon matches (no new a11y regression introduced, but not an improvement either — flag for future pass if desired).

## Responsive behavior

- Ribbon is full-bleed at all widths.
- Slide width is fluid (`clamp(280px, 26vw, 380px)`), so the number of visible slides adapts to screen size.
- Cards above stack on mobile via existing `.programs__grid` rules (unchanged).

## Out of scope

- Changing card copy, headings, or the closing note.
- Adding new photos or sourcing new imagery.
- Modifying other sections.
- Adding `prefers-reduced-motion` support to either ribbon (noted as future work).
- Making the ribbon images clickable or linked.

## Verification plan

After implementation:

1. Visually inspect the programs section in the dev server at desktop and mobile widths.
2. Confirm ribbon scrolls smoothly, loops seamlessly, and fades at both edges.
3. Confirm hover on desktop pauses the ribbon.
4. Confirm touch on mobile pauses briefly, then resumes after 3s.
5. Confirm all 3 cards render cleanly without the media block (no broken top spacing).
6. Confirm no console errors from any orphaned carousel JS.
7. Confirm no visual regressions in the Coaches or Testimonials sections directly below.
