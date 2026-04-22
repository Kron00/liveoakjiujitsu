# Sprouts Editorial Bento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the uniform 3-card Programs grid on the homepage with an editorial bento showcase for the Sprouts program, lead with Sprouts in the priority order, and keep Youth + Adult as existing cards in a new 2-up subgrid until their own redesign passes.

**Architecture:** All changes live in `src/pages/index.astro` (Astro single-file page with inline `<style is:global>` and inline `<script is:inline>`). Four new photo files are added to `public/assets/images/`. New CSS classes (`.program-showcase*`) live alongside the existing `.program-card*` CSS. Existing `#programs` anchor, H2 heading, and Schema.org JSON-LD are preserved.

**Tech Stack:** Astro 6.x, vanilla CSS (no framework, custom properties in `:root`), vanilla JS (IntersectionObserver). Build: `npm run build`. Dev: `npm run dev` (port 4321). Visual QA: Playwright MCP tools.

**Spec:** `docs/superpowers/specs/2026-04-22-programs-redesign-sprouts-first-design.md`

**Breakpoint reconciliation:** The spec proposes breakpoints at 1024px and 640px. The existing codebase uses 1024px, 768px, and 480px consistently (see lines 2637, 2693, 2889 of `src/pages/index.astro`). The plan uses the **existing** breakpoints — 1024px for tablet, 768px for mobile, 480px for small mobile — to keep responsive rules co-located with the site's existing media-query blocks.

---

## File Structure

**Modified:**
- `src/pages/index.astro` — add ~180 lines of CSS (two blocks: base rules after line ~1080, responsive rules inside existing `@media (max-width: 1024px)` and `@media (max-width: 768px)` blocks), replace ~45 lines of HTML in the `#programs` section (lines ~3724–3770), update ~1 line of JS in the reveal observer selector list (line ~4916).

**Created:**
- `public/assets/images/sprouts-01-hero-teaching.jpg` — coach teaching little girl (hero)
- `public/assets/images/sprouts-02-belt-tying.jpg` — belt tying ritual (accent)
- `public/assets/images/sprouts-03-laughing.jpg` — two kids laughing (candid)
- `public/assets/images/sprouts-04-circle.jpg` — listening circle (candid)

**Unchanged:** Everything else — Schema.org JSON-LD, nav, hero, about, coaches, schedule, pricing, signup, FAQ, footer.

---

## Task 1: Verify photos are in place

**Files:**
- Check: `public/assets/images/sprouts-01-hero-teaching.jpg`
- Check: `public/assets/images/sprouts-02-belt-tying.jpg`
- Check: `public/assets/images/sprouts-03-laughing.jpg`
- Check: `public/assets/images/sprouts-04-circle.jpg`

This task is a **prerequisite check**, not an implementation step. The owner places photos from Google Drive. If any file is missing, halt and ask the owner for the missing files before proceeding.

- [ ] **Step 1: Check all four files exist**

Run: `ls public/assets/images/sprouts-*.jpg`

Expected output:
```
public/assets/images/sprouts-01-hero-teaching.jpg
public/assets/images/sprouts-02-belt-tying.jpg
public/assets/images/sprouts-03-laughing.jpg
public/assets/images/sprouts-04-circle.jpg
```

If any file is missing, stop and ask the owner to provide the missing image(s). Do not proceed to Task 2.

- [ ] **Step 2: Verify file sizes are reasonable**

Run: `ls -lh public/assets/images/sprouts-*.jpg`

Expected: Each file between ~100KB and ~2MB. If a file is <10KB or >5MB, flag the outlier and ask the owner whether the photo should be re-exported.

- [ ] **Step 3: Verify JPEG integrity**

Run: `file public/assets/images/sprouts-*.jpg`

Expected: each line contains `JPEG image data`. If any file reports a different type, ask the owner to re-export.

- [ ] **Step 4: No commit — prerequisite only**

No commit for this task. Proceed to Task 2.

---

## Task 2: Add base CSS for `.program-showcase` (desktop)

**Files:**
- Modify: `src/pages/index.astro` — insert new CSS block immediately **after** the closing brace of `.programs__note` (currently line ~1084, just before the schedule section's CSS starts)

The new styles are co-located with the existing `.programs-section` styles. All classes are new; no existing rules change.

- [ ] **Step 1: Locate insertion point**

Run: `grep -n "programs__note" src/pages/index.astro`

Expected output includes a line like: `1080:    .programs__note {` and a close-brace around line ~1084. The insertion point is the first blank line *after* the closing brace of `.programs__note`.

- [ ] **Step 2: Insert the new CSS block**

Using the Edit tool, insert this block after the closing brace of `.programs__note`:

```css
    /* ================================================================
       PROGRAM SHOWCASE — Editorial bento layout (new; Sprouts first)
       Sibling to .programs-section; dark full-bleed break from light theme.
       ================================================================ */
    .program-showcase {
      position: relative;
      background: #0f0f0f;
      color: #ffffff;
      padding: clamp(4rem, 8vw, 7rem) 0;
      overflow: hidden;
      margin: clamp(3rem, 6vw, 5rem) 0;
    }

    .program-showcase__numeral {
      position: absolute;
      top: -0.15em;
      right: -0.05em;
      font-family: var(--font-display);
      font-size: clamp(10rem, 22vw, 22rem);
      font-weight: 500;
      line-height: 1;
      color: #ffffff;
      opacity: 0.04;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }

    .program-showcase .container {
      position: relative;
      z-index: 1;
    }

    .program-showcase__header {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: baseline;
      gap: var(--space-md);
      margin-bottom: clamp(2rem, 4vw, 3rem);
      padding-bottom: var(--space-md);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .program-showcase__eyebrow {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 500;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.55);
      grid-column: 1;
      grid-row: 1;
    }

    .program-showcase__age-tag {
      font-family: var(--font-body);
      font-size: var(--text-xs);
      font-weight: 500;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--color-gold);
      border: 1px solid var(--color-gold);
      padding: 0.4em 0.8em;
      border-radius: 2px;
      grid-column: 2;
      grid-row: 1;
      white-space: nowrap;
    }

    .program-showcase__title {
      font-family: var(--font-display);
      font-style: italic;
      font-weight: 500;
      font-size: var(--text-5xl);
      line-height: 1.1;
      color: #ffffff;
      grid-column: 1 / -1;
      grid-row: 2;
      margin-top: var(--space-xs);
    }

    .program-showcase__grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      grid-auto-rows: minmax(0, auto);
      gap: var(--space-md);
    }

    .program-showcase__photo {
      position: relative;
      overflow: hidden;
      margin: 0;
      background: #1a1a1a;
    }

    .program-showcase__photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.6s var(--ease-smooth);
    }

    .program-showcase__photo--hero {
      grid-column: 1 / span 7;
      grid-row: 1 / span 2;
      aspect-ratio: 4 / 5;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .program-showcase__photo--hero:hover img {
      transform: scale(1.03);
    }

    .program-showcase__photo--accent {
      grid-column: 8 / span 5;
      grid-row: 1;
      aspect-ratio: 4 / 3;
      border-radius: var(--border-radius-lg);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .program-showcase__photo--candid {
      border-radius: var(--border-radius-lg);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .program-showcase__photo--candid:nth-of-type(3) {
      grid-column: 1 / span 4;
      grid-row: 3;
      aspect-ratio: 1 / 1;
    }

    .program-showcase__photo--candid:nth-of-type(4) {
      grid-column: 5 / span 3;
      grid-row: 3;
      aspect-ratio: 4 / 3;
    }

    .program-showcase__copy {
      grid-column: 8 / span 5;
      grid-row: 2;
      display: flex;
      align-items: center;
      font-family: var(--font-body);
      font-size: var(--text-base);
      font-weight: 300;
      line-height: 1.75;
      color: rgba(255, 255, 255, 0.75);
    }

    .program-showcase__copy p {
      margin: 0;
    }

    .program-showcase__stats {
      grid-column: 8 / span 5;
      grid-row: 3;
      list-style: none;
      margin: 0;
      padding: clamp(1.25rem, 2vw, 1.75rem);
      background: #1a1a1a;
      border-left: 3px solid var(--color-gold);
      border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
      font-family: var(--font-body);
      font-size: var(--text-sm);
      font-weight: 300;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      justify-content: center;
    }

    .program-showcase__stats li {
      position: relative;
      padding-left: 1.1em;
    }

    .program-showcase__stats li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.55em;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-gold);
    }

    /* Two-up modifier for the remaining old-style cards (Youth + Adult)
       while Sprouts leads with the new bento. Delete this rule once Youth
       and Adult pass migrations are complete. */
    .programs__grid--two-up {
      grid-template-columns: repeat(2, 1fr);
      max-width: 960px;
      margin-left: auto;
      margin-right: auto;
    }
```

- [ ] **Step 3: Verify build succeeds**

Run: `npm run build`

Expected: Build completes without errors. Output ends with something like `[build] Complete!`. No CSS parse errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "$(cat <<'EOF'
style: add program-showcase CSS for editorial bento layout

Introduces .program-showcase and its BEM children for the new
Sprouts-first Programs section. Co-located with existing
.programs-section CSS; no existing rules modified. Also adds
.programs__grid--two-up modifier for the transitional Youth+Adult
row.
EOF
)"
```

---

## Task 3: Replace programs section HTML

**Files:**
- Modify: `src/pages/index.astro` lines ~3724–3770

Rewrite the `#programs` section body to: keep the section heading intact, insert the Sprouts bento, re-order Youth and Adult cards in a 2-up subgrid below.

- [ ] **Step 1: Re-read the current programs section**

Run: `sed -n '3724,3770p' src/pages/index.astro`

Confirm the current structure matches what was documented in the spec. If line numbers have drifted, locate the section using: `grep -n 'id="programs"' src/pages/index.astro`.

- [ ] **Step 2: Replace the programs section body**

Using the Edit tool, replace the entire block from `<section id="programs" class="programs-section">` through its closing `</section>` with:

```html
<!-- ========== PROGRAMS SECTION ========== -->
<section id="programs" class="programs-section">
  <div class="container">

    <span class="section-label">REACH YOUR GOALS</span>

    <h2 class="section-heading">Brazilian Jiu Jitsu Programs for Every Age in Fairfield</h2>

    <p class="section-subtitle">We have multiple programs that will keep you motivated and inspired to keep coming back for more.</p>

  </div>

  <!-- Program 1 — Sprouts (new editorial bento) -->
  <div class="program-showcase program-showcase--sprouts reveal">
    <span class="program-showcase__numeral" aria-hidden="true">01</span>
    <div class="container">

      <header class="program-showcase__header">
        <span class="program-showcase__eyebrow">01 · Sprouts Program</span>
        <span class="program-showcase__age-tag">Ages 3–5</span>
        <h3 class="program-showcase__title">Their first taste of the mat.</h3>
      </header>

      <div class="program-showcase__grid">

        <figure class="program-showcase__photo program-showcase__photo--hero">
          <img src="assets/images/sprouts-01-hero-teaching.jpg"
               alt="A coach sits on the mat demonstrating a technique to a young student in a black and red gi, with other Sprouts students watching"
               width="1200" height="1500" loading="lazy" decoding="async">
        </figure>

        <figure class="program-showcase__photo program-showcase__photo--accent">
          <img src="assets/images/sprouts-02-belt-tying.jpg"
               alt="A coach in a white gi kneels to tie a white belt on a young student wearing a pink gi"
               width="1200" height="900" loading="lazy" decoding="async">
        </figure>

        <div class="program-showcase__copy">
          <p>Sprouts is an excellent opportunity for your child to learn the fundamentals of BJJ, Judo, and Wrestling through animal movements and games. Students primarily learn takedowns, passing, sweeps, controls, and beginner submissions. For many of our Sprouts, this is their first experience of an organized sport — so we lean hard into positive reinforcement, modeling, and rewards. All staff are Live Scanned for your child's safety.</p>
        </div>

        <figure class="program-showcase__photo program-showcase__photo--candid">
          <img src="assets/images/sprouts-03-laughing.jpg"
               alt="Two young Sprouts students laughing, one climbing playfully onto the back of the other during class"
               width="1000" height="1000" loading="lazy" decoding="async">
        </figure>

        <figure class="program-showcase__photo program-showcase__photo--candid">
          <img src="assets/images/sprouts-04-circle.jpg"
               alt="Young Sprouts students seated in a circle listening attentively to their coaches at the start of class"
               width="1200" height="900" loading="lazy" decoding="async">
        </figure>

        <ul class="program-showcase__stats">
          <li>Ages 3 to 5</li>
          <li>Small class sizes, big attention</li>
          <li>Live Scanned instructors</li>
          <li>White to Grey belt progression</li>
          <li>Compass Charter vendor · E-Voucher accepted</li>
        </ul>

      </div>

    </div>
  </div>

  <!-- Programs 2 & 3 — Youth and Adult (old card style, 2-up, reordered).
       Will be migrated to .program-showcase in future passes. -->
  <div class="container">

    <div class="programs__grid programs__grid--two-up">

      <!-- Program 2 — Youth & Teen -->
      <article class="program-card reveal" style="--program-focus: 50% 40%; --program-focus-mobile: 50% 40%;">
        <div class="program-card__image" style="background-image: url('assets/images/programs-youth.jpg');">
          <h3 class="program-card__title">Youth &amp; Teen Program and Comp Team (Ages 6 to 17)</h3>
        </div>
        <div class="program-card__content">
          <p class="program-card__desc">Youth Program fundamentals and advanced BJJ technique taught along with strength and confidence building. Significant attention is placed on anti bullying and emotional regulation. Our philosophy is that Brazilian Jiu Jitsu is seen as a means to individual development, leadership and personal control. Body awareness, respect, discipline, and responsibility are core values taught within all of our kid's programs. All staff are Live Scanned to ensure your child's safety. We are a vendor through Compass Charter School and accept E Vouchers.</p>
        </div>
      </article>

      <!-- Program 3 — BJJ Adult Program and Comp Team -->
      <article class="program-card reveal" style="--program-focus: 55% 34%; --program-focus-mobile: 55% 28%;">
        <div class="program-card__image" style="background-image: url('assets/images/programs-bjj.jpeg');">
          <h3 class="program-card__title">BJJ Adult Program and Competition Team</h3>
        </div>
        <div class="program-card__content">
          <p class="program-card__desc">A mix of modern and old school techniques, rooted in self defense and competition tested. We teach white belts leg locks because it's not just the future of BJJ, but the now. We offer Gi, No Gi, Fundamentals, Women's Only Seminars, Judo and Wrestling Takedowns.</p>
        </div>
      </article>

    </div>

    <p class="programs__note">Competition team members at the adult and youth levels get instruction, strategy building, personalized game plans, and cardio maximizing support throughout their competition journey. We also offer private and semi private training with IBJJF certified instructors to elevate your skills.</p>

  </div>

</section>
```

Note: the Youth card description contains the character `'` (right single quote) in "kid's" — keep it as-is to match the existing copy. The Adult card description uses the ASCII `'` (U+0027) before "not" and "Women's" — also keep as-is.

- [ ] **Step 3: Verify build succeeds**

Run: `npm run build`

Expected: build completes without errors. If any HTML parse error, re-check the replaced block.

- [ ] **Step 4: Verify no existing test regressions**

Run: `npm test`

Expected: existing `tests/api-security.test.js` passes. This suite tests the API layer only and should be unaffected, but running confirms no accidental breakage.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "$(cat <<'EOF'
feat: reorder programs and add Sprouts editorial bento

Sprouts now leads the Programs section with the new editorial bento
layout (hero + accent + two candids + stats). Youth and Adult remain
as existing card components in a new 2-up subgrid, reordered so Youth
precedes Adult. The #programs anchor, H2 heading, and programs__note
text are unchanged.
EOF
)"
```

---

## Task 4: Add responsive CSS for tablet (≤1024px) and mobile (≤768px)

**Files:**
- Modify: `src/pages/index.astro` — insert rules inside the existing `@media (max-width: 1024px)` block (starts line ~2637) and the existing `@media (max-width: 768px)` block (starts line ~2808 for programs)

Use existing breakpoints to keep responsive rules co-located.

- [ ] **Step 1: Locate the 1024px breakpoint block for programs**

Run: `grep -n '@media (max-width: 1024px)' src/pages/index.astro`

Expected: first match around line 2637. Scan within that block for existing program rules — the programs grid currently has **no** 1024px override (it only stacks at 768px), so we insert a new rule near related program styles.

- [ ] **Step 2: Insert tablet rules inside the `@media (max-width: 1024px)` block**

Find a position inside the `@media (max-width: 1024px)` block (the block that starts at the line reported by Step 1). Add these rules. A safe spot is near the end of that block, just before its closing `}`:

```css
      /* Program showcase — tablet */
      .program-showcase__grid {
        grid-template-columns: repeat(6, 1fr);
        grid-auto-rows: auto;
      }

      .program-showcase__photo--hero {
        grid-column: 1 / -1;
        grid-row: 1;
        aspect-ratio: 16 / 10;
      }

      .program-showcase__photo--accent {
        grid-column: 1 / span 3;
        grid-row: 2;
        aspect-ratio: 4 / 3;
      }

      .program-showcase__copy {
        grid-column: 4 / span 3;
        grid-row: 2;
      }

      .program-showcase__photo--candid:nth-of-type(3) {
        grid-column: 1 / span 3;
        grid-row: 3;
        aspect-ratio: 4 / 3;
      }

      .program-showcase__photo--candid:nth-of-type(4) {
        grid-column: 4 / span 3;
        grid-row: 3;
        aspect-ratio: 4 / 3;
      }

      .program-showcase__stats {
        grid-column: 1 / -1;
        grid-row: 4;
      }

      .program-showcase__title {
        font-size: var(--text-4xl);
      }
```

- [ ] **Step 3: Locate the 768px breakpoint block and the programs__grid rule**

Run: `grep -n '.programs__grid {' src/pages/index.astro`

You should see the base rule (~line 986) and a tablet/mobile override inside `@media (max-width: 768px)` (~line 2808). We'll add new rules **inside** the `@media (max-width: 768px)` block, near that existing override.

- [ ] **Step 4: Insert mobile rules inside the `@media (max-width: 768px)` block**

Add these rules just after the existing `.programs__grid { grid-template-columns: 1fr; ... }` override inside the `@media (max-width: 768px)` block:

```css
      /* Program showcase — mobile */
      .program-showcase {
        padding: clamp(3rem, 10vw, 4rem) 0;
        margin: clamp(2rem, 6vw, 3rem) 0;
      }

      .program-showcase__numeral {
        font-size: clamp(8rem, 36vw, 14rem);
      }

      .program-showcase__header {
        grid-template-columns: 1fr;
        align-items: start;
      }

      .program-showcase__age-tag {
        grid-column: 1;
        grid-row: 2;
        justify-self: start;
      }

      .program-showcase__title {
        grid-row: 3;
        font-size: var(--text-3xl);
      }

      .program-showcase__grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-sm);
      }

      .program-showcase__photo--hero {
        grid-column: 1 / -1;
        grid-row: auto;
        aspect-ratio: 4 / 5;
      }

      .program-showcase__copy {
        grid-column: 1 / -1;
        grid-row: auto;
      }

      .program-showcase__photo--accent {
        grid-column: 1 / -1;
        grid-row: auto;
        aspect-ratio: 4 / 3;
      }

      .program-showcase__photo--candid:nth-of-type(3),
      .program-showcase__photo--candid:nth-of-type(4) {
        grid-column: span 1;
        grid-row: auto;
        aspect-ratio: 1 / 1;
      }

      .program-showcase__stats {
        grid-column: 1 / -1;
        grid-row: auto;
      }

      /* Two-up grid collapses to single column on mobile like the old 3-up did */
      .programs__grid--two-up {
        grid-template-columns: 1fr;
      }
```

- [ ] **Step 5: Verify build succeeds**

Run: `npm run build`

Expected: build completes without errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro
git commit -m "$(cat <<'EOF'
style: add responsive breakpoints for Sprouts bento

Tablet (≤1024px): collapses 12-col grid to 6-col, stacks hero above
the accent/copy row and candids/stats rows. Mobile (≤768px): stacks
linearly with candids in a 2-col mini-grid; the two-up Youth/Adult
row collapses to single column to match existing card behavior.
EOF
)"
```

---

## Task 5: Update the reveal IntersectionObserver to include new elements

**Files:**
- Modify: `src/pages/index.astro` line ~4916 (inside the IntersectionObserver callback's child-stagger selector)

The current observer staggers children matching `.step-card, .struggle__card, .program-card`. Add `.program-showcase__photo` so the bento's photos fade in with the same staggered animation when the showcase enters the viewport.

- [ ] **Step 1: Locate the selector to modify**

Run: `grep -n "'.step-card, .struggle__card, .program-card'" src/pages/index.astro`

Expected: exactly one match, around line 4916.

- [ ] **Step 2: Update the selector**

Using the Edit tool, change the line:

```javascript
        const children = entry.target.querySelectorAll('.step-card, .struggle__card, .program-card');
```

to:

```javascript
        const children = entry.target.querySelectorAll('.step-card, .struggle__card, .program-card, .program-showcase__photo');
```

- [ ] **Step 3: Verify build succeeds**

Run: `npm run build`

Expected: build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "$(cat <<'EOF'
feat: include program-showcase photos in reveal stagger

The IntersectionObserver that staggers card reveals now also applies
staggered animation delay to .program-showcase__photo children when
a .program-showcase section enters the viewport. Matches the existing
card-grid animation cadence.
EOF
)"
```

---

## Task 6: Visual QA at four viewport widths

**Files:**
- No file changes in this task (QA only). Any issues found are captured as fix steps within this task.

This task uses the Playwright MCP tools to take screenshots. No Playwright install in `node_modules` — we rely exclusively on `mcp__plugin_playwright_playwright__*` tools loaded via ToolSearch.

- [ ] **Step 1: Start the dev server in the background**

Run (in background): `npm run dev`

Expected: server starts and reports `http://localhost:4321` (default Astro port). Wait ~3 seconds for startup, then verify by running: `curl -sI http://localhost:4321/ | head -5`. Expected: `HTTP/1.1 200 OK`.

If the port is in use, kill the prior process: `lsof -ti:4321 | xargs kill -9` and re-run.

- [ ] **Step 2: Load Playwright MCP tools**

Use the ToolSearch tool with query: `select:mcp__plugin_playwright_playwright__browser_navigate,mcp__plugin_playwright_playwright__browser_resize,mcp__plugin_playwright_playwright__browser_take_screenshot,mcp__plugin_playwright_playwright__browser_close,mcp__plugin_playwright_playwright__browser_snapshot`

- [ ] **Step 3: Screenshot at desktop 1440×900**

Use `mcp__plugin_playwright_playwright__browser_resize` with `{ "width": 1440, "height": 900 }`.
Use `mcp__plugin_playwright_playwright__browser_navigate` to go to `http://localhost:4321/#programs`.
Wait for page load (tool waits by default).
Use `mcp__plugin_playwright_playwright__browser_take_screenshot` with `{ "filename": "sprouts-qa-desktop-1440.png", "fullPage": false }`.

Expected visual checks:
- Eyebrow "01 · SPROUTS PROGRAM" top-left
- Age tag "AGES 3–5" top-right
- Title "Their first taste of the mat." below header, white, italic serif
- Hero photo (coach teaching) occupies left ~7/12 of the grid
- Belt-tying photo top-right
- Description block under belt-tying photo
- Laughing kids + listening circle photos bottom-left (square + landscape)
- Stats card bottom-right with red bullet markers
- Giant faint "01" ghost numeral visible upper-right

- [ ] **Step 4: Screenshot at laptop 1280×800**

Resize to 1280×800. Take screenshot `sprouts-qa-laptop-1280.png`.

Expected: same 12-col desktop layout as 1440. If the grid starts feeling cramped or text wraps awkwardly, note it but do not fix in this pass (cramped state is the price of a 12-col grid at 1280 — acceptable).

- [ ] **Step 5: Screenshot at tablet 768×1024 (portrait)**

Resize to 768×1024. Take screenshot `sprouts-qa-tablet-768.png`.

At 768px exact, the `max-width: 768px` media query activates. Expected:
- Hero photo full-width at top
- Belt-tying photo + description in a 2-col row
- Two candid photos + stats stacked below

If you land at exactly 768px width, the tablet rules (`@media max-width: 1024px`) should *also* apply because 768 ≤ 1024. Both blocks stack in cascade order; the 768 rules win since they come later in the stylesheet. Verify this by confirming the hero is full-width (from the tablet block) AND stacking is linear (from the mobile block).

- [ ] **Step 6: Screenshot at mobile 390×844 (iPhone 14 size)**

Resize to 390×844. Take screenshot `sprouts-qa-mobile-390.png`.

Expected:
- Header stacks vertically: eyebrow → age tag → title
- Hero photo full-width, tall (4:5)
- Description paragraph below
- Belt-tying photo full-width
- Two candids side-by-side in 2-col mini-grid
- Stats card full-width
- Youth and Adult cards below stack single-column (from existing `.programs__grid--two-up { grid-template-columns: 1fr }` rule)

- [ ] **Step 7: Verify nav anchor still works**

Still at mobile 390 viewport, navigate to `http://localhost:4321/` (root), scroll to top. In the Playwright snapshot, find the "Programs" nav link. Click it. Expected: viewport scrolls to the start of the `#programs` section — the `REACH YOUR GOALS` eyebrow + H2 should be visible at the top of the viewport after scroll settles.

If the anchor jumps past the section (e.g., lands in the Sprouts bento), investigate whether the `scroll-margin-top` handling or nav-offset CSS needs updating. No fix is expected — this is a regression check.

- [ ] **Step 8: Close the browser and stop the dev server**

Use `mcp__plugin_playwright_playwright__browser_close`.

Kill the dev server: `lsof -ti:4321 | xargs kill -9`.

- [ ] **Step 9: Review screenshots, apply fixes if needed**

Inspect the four screenshots against the spec's visual treatment section (spec lines 153–162). If any of the following are wrong, return to the relevant task and fix:

- Hero photo not dominant on desktop → revisit Task 2, check `.program-showcase__photo--hero` grid-column/grid-row
- Stats card missing red left border → check Task 2, `.program-showcase__stats` rule
- Candids clipping weirdly → check object-fit in Task 2, `.program-showcase__photo img`
- Ghost "01" numeral not visible → check Task 2, `.program-showcase__numeral` opacity (should be 0.04; bump to 0.06 if it reads totally invisible on-screen)
- Nav anchor broken → check Task 3 HTML; the outer `<section id="programs">` must remain unchanged

If fixes applied, commit them:

```bash
git add src/pages/index.astro
git commit -m "fix: address visual QA feedback in Sprouts showcase"
```

If no fixes needed, skip the commit for this task.

---

## Task 7: Accessibility audit

**Files:**
- No file changes unless issues found

- [ ] **Step 1: Inventory alt text**

Run: `grep -n 'sprouts-0[1-4]' src/pages/index.astro`

Expected: 4 `<img>` tags, each with a `src` attribute pointing to a Sprouts photo AND an `alt` attribute with a descriptive sentence (not just a filename). Visually inspect: none of the alts should be empty `alt=""`, and none should be `alt="sprouts-01"` etc.

Expected alt text per photo (from Task 3):
- `sprouts-01-hero-teaching.jpg`: "A coach sits on the mat demonstrating a technique to a young student in a black and red gi, with other Sprouts students watching"
- `sprouts-02-belt-tying.jpg`: "A coach in a white gi kneels to tie a white belt on a young student wearing a pink gi"
- `sprouts-03-laughing.jpg`: "Two young Sprouts students laughing, one climbing playfully onto the back of the other during class"
- `sprouts-04-circle.jpg`: "Young Sprouts students seated in a circle listening attentively to their coaches at the start of class"

- [ ] **Step 2: Verify decorative elements are hidden from ATs**

Run: `grep -n 'program-showcase__numeral' src/pages/index.astro`

Expected: exactly one `<span class="program-showcase__numeral" aria-hidden="true">01</span>` in the HTML. The `aria-hidden="true"` ensures screen readers skip the decorative "01".

- [ ] **Step 3: Verify heading hierarchy**

Run: `grep -n -E '<h[1-6]' src/pages/index.astro | head -30`

Expected near the programs section:
- `<h2 class="section-heading">Brazilian Jiu Jitsu Programs...</h2>` (the existing section heading)
- `<h3 class="program-showcase__title">Their first taste of the mat.</h3>` (new)
- `<h3 class="program-card__title">Youth &amp; Teen Program...</h3>` (existing, now reordered)
- `<h3 class="program-card__title">BJJ Adult Program...</h3>` (existing, now reordered)

All three programs use `<h3>` under the `<h2>` — no heading-level skips.

- [ ] **Step 4: Verify color contrast**

The Sprouts section uses:
- White body text (`#ffffff`) on `#0f0f0f` — contrast ratio 20.29:1 (passes WCAG AAA)
- Muted white (`rgba(255, 255, 255, 0.75)`) on `#0f0f0f` — contrast ratio ~15:1 (passes AAA)
- Red age tag (`#c10c10`) border + text on `#0f0f0f` — contrast ratio ~7.5:1 (passes AA for text, AAA for large)

No action needed; documented here for the review record.

- [ ] **Step 5: Commit — no-op if no fixes**

If Steps 1–4 revealed no issues, no commit. If any issues found, fix in `src/pages/index.astro` and commit:

```bash
git add src/pages/index.astro
git commit -m "a11y: fix [specific issue] in Sprouts showcase"
```

---

## Task 8: Final build + test + status check

**Files:**
- No file changes

Final verification before handing off.

- [ ] **Step 1: Clean build**

Run: `rm -rf dist && npm run build`

Expected: build succeeds with no errors. Output directory `dist/` contains built assets including the 4 new Sprouts photos under `dist/assets/images/`.

Verify photos copied: `ls dist/assets/images/sprouts-*.jpg`

Expected: all 4 photo files present in dist.

- [ ] **Step 2: Run existing tests**

Run: `npm test`

Expected: `tests/api-security.test.js` passes. If it fails, the failure is unrelated to this change — capture the output and investigate separately.

- [ ] **Step 3: Git status should be clean**

Run: `git status`

Expected: `nothing to commit, working tree clean`. All task commits are already made.

- [ ] **Step 4: Git log shows the task commits**

Run: `git log --oneline -10`

Expected (in this order, most recent first):
- `feat: include program-showcase photos in reveal stagger`
- `style: add responsive breakpoints for Sprouts bento`
- `feat: reorder programs and add Sprouts editorial bento`
- `style: add program-showcase CSS for editorial bento layout`
- `Capture Youth and Adult photo selections in Sprouts spec` (pre-existing)
- `Add design spec for Sprouts-first programs redesign` (pre-existing)

Plus possibly: QA fix commit(s) from Task 6 Step 9 or Task 7 Step 5 if issues were found.

- [ ] **Step 5: Summary for the owner**

Compose a short summary message for the repo owner covering:
- What shipped: Sprouts editorial bento, reordered priority, Youth/Adult in 2-up subgrid
- What's still pending: Youth redesign pass, Adult redesign pass (photos already curated in the spec)
- Where to preview: dev server (`npm run dev`) or Vercel preview (depending on project deploy setup)
- Any QA notes from Task 6 or Task 7

No commit. Task complete.

---

## Success Criteria

The plan is complete when all of the following are true:

- [ ] 4 Sprouts photos exist in `public/assets/images/` and copy to `dist/assets/images/` on build
- [ ] `#programs` section on the homepage renders as: section header → Sprouts bento → Youth+Adult 2-up row → programs__note
- [ ] `npm run build` succeeds with no errors
- [ ] `npm test` (existing API security tests) passes
- [ ] Visual QA screenshots captured at 1440, 1280, 768, 390 viewports
- [ ] Nav link `href="#programs"` still scrolls to the section top
- [ ] All Sprouts images have descriptive alt text
- [ ] Decorative numeral has `aria-hidden="true"`
- [ ] Youth/Adult photos and deferred pass captured in the spec's "Future Passes" section (already done during brainstorming)
- [ ] Git log shows 4 atomic commits for tasks 2–5, plus optional QA-fix commits

## Out of Scope Reminders

These were explicitly excluded in the spec and are **not** part of this plan:

- Youth and Adult/Teen section redesigns (separate passes)
- Photo optimization or format conversion (JPG as-is)
- Removal of old `.program-card` CSS rules (wait for Youth+Adult passes)
- Dedicated per-program pages
- Changes to Schema.org JSON-LD, FAQ, schedule, pricing, signup, or any other section

## Rollback

If something breaks post-merge:

```bash
git revert <commit-sha-of-reorder-and-bento>
git revert <commit-sha-of-css>
git revert <commit-sha-of-responsive>
git revert <commit-sha-of-reveal>
```

Revert in reverse-chronological order (last commit first). Or revert the entire range with `git revert <oldest>..<newest>`. The photo files in `public/assets/images/` are safe to leave (unreferenced = no impact).
