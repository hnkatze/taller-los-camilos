# Design: GSAP Scroll-Driven Animations

## Technical Approach

Replace the existing single-pattern `animate-on-scroll` system (CSS transitions + IntersectionObserver) with GSAP + ScrollTrigger, providing unique per-component animations while maintaining performance on low-end phones common in Honduras. GSAP is loaded as an npm dependency, initialized once in a shared script, and each component defines its own animation via Astro `<script>` blocks that import from the shared module. A CSS-first FOUC prevention strategy ensures content is never invisible if JS fails.

## 1. GSAP Loading Architecture

### Package Installation

```
npm install gsap
```

GSAP v3.x free tier includes ScrollTrigger. No CDN, no external dependencies.

### Initialization Flow

```
Page Load
  │
  ├─ CSS loads → .gsap-hidden { visibility: hidden } applied
  │
  ├─ Astro bundles GSAP as ES module (via <script> tags, NOT is:inline)
  │
  ├─ src/scripts/gsap-init.ts executes:
  │   ├─ gsap.registerPlugin(ScrollTrigger)
  │   ├─ gsap.matchMedia() contexts created
  │   ├─ prefers-reduced-motion context registered
  │   └─ exports ready for component scripts
  │
  ├─ Component <script> tags execute:
  │   ├─ import from gsap-init.ts
  │   ├─ Define component-specific timelines/triggers
  │   └─ gsap.set() removes .gsap-hidden (visibility: visible)
  │
  └─ Fallback timeout (3s) removes .gsap-hidden via CSS class if JS never runs
```

### FOUC Prevention Strategy

**CSS layer** (in `global.css`):

```css
/* Hide elements that GSAP will animate — prevents flash of final state */
.gsap-hidden {
  visibility: hidden;
}

/* Fallback: if JS never loads, show content after 3s */
@media (scripting: none) {
  .gsap-hidden {
    visibility: visible !important;
  }
}
```

**JS fallback** (in `Layout.astro` `<script>` block):

```typescript
// Safety net: ensure content is visible even if GSAP fails to initialize
setTimeout(() => {
  document.querySelectorAll('.gsap-hidden').forEach(el => {
    el.classList.remove('gsap-hidden');
  });
}, 3000);
```

**Per-component**: Each component's GSAP animation calls `gsap.set(target, { visibility: 'visible' })` as the first step before animating, removing the hidden state immediately when that component's animation starts.

### Script Strategy: Astro Module Scripts (NOT `is:inline`)

Astro `<script>` tags (without `is:inline`) are processed by Vite, which means:
- Tree-shaking of unused GSAP features
- Bundle deduplication (GSAP imported in 8 components = 1 bundle chunk)
- Proper ES module loading with `type="module"`

`is:inline` would bypass Vite bundling and require manual `<script src>` management. This is undesirable for a library like GSAP.

### Bundle Size Impact

| Asset | Size (gzip) |
|-------|-------------|
| gsap core | ~24KB |
| ScrollTrigger | ~9KB |
| **Total added** | **~33KB** |

Since this is a single-page static site, the entire GSAP bundle loads once and is cached. The trade-off is acceptable for the animation quality improvement.

## 2. Animation System Architecture

### Shared Script: `src/scripts/gsap-init.ts`

This file is the single source of truth for GSAP configuration. All component scripts import from here.

```
src/scripts/gsap-init.ts
  ├─ Registers ScrollTrigger plugin
  ├─ Exports GSAP defaults (easing, durations)
  ├─ Exports matchMedia breakpoint helper
  ├─ Exports reduced-motion detection
  └─ Exports reusable timeline factories (section title reveal, etc.)
```

### Shared Easing Family

All animations use the `power2` family for a consistent, crafted feel:

| Use Case | Easing | Rationale |
|----------|--------|-----------|
| Entrance (elements appearing) | `power2.out` | Fast start, gentle deceleration — feels natural |
| Exit (elements leaving) | `power2.in` | Slow start, fast exit — feels intentional |
| Emphasis (attention grab) | `power2.inOut` | Smooth in both directions |
| Bounce/playful (CTA) | `back.out(1.7)` | Slight overshoot — draws attention to interactive elements |
| Counter number tween | `power1.out` | Gentle deceleration for readability |

### Shared Timing Conventions

| Property | Value | Rationale |
|----------|-------|-----------|
| Default duration | `0.8s` | Perceptible but not slow |
| Fast duration | `0.4s` | For subtle micro-interactions |
| Slow duration | `1.2s` | For hero/dramatic reveals |
| Default stagger | `0.1s` | Between sibling elements |
| Card stagger | `0.15s` | Slightly more pronounced for cards |
| ScrollTrigger scrub duration | `0.5s` (smoothing) | When using `scrub: 0.5` |

### gsap.matchMedia() Setup

```typescript
const mm = gsap.matchMedia();

mm.add({
  isDesktop: '(min-width: 1024px)',
  isTablet: '(min-width: 768px) and (max-width: 1023px)',
  isMobile: '(max-width: 767px)',
  isReduced: '(prefers-reduced-motion: reduce)',
}, (context) => {
  const { isDesktop, isTablet, isMobile, isReduced } = context.conditions!;

  // Each component checks these flags to adjust animations
  // isReduced: skip all transforms, only do simple opacity fade (0.3s)
  // isMobile: disable parallax, 3D transforms, reduce stagger counts
  // isTablet: disable parallax, keep simple transforms
  // isDesktop: full animations
});
```

### prefers-reduced-motion Handling

When `isReduced` is true:
- All animations reduce to `opacity: 0 → 1` with `duration: 0.3s`
- No transforms (translateY, scale, rotateX, clip-path) are applied
- ScrollTrigger still fires (for counter counting, class toggling) but animation is minimal
- Sparks in Hero are hidden via CSS (`display: none`)
- No pinning in WhyChooseUs

### ScrollTrigger Defaults

| Property | Default Value | Notes |
|----------|---------------|-------|
| `start` | `'top 85%'` | Triggers when top of element hits 85% of viewport (within view but not at very bottom) |
| `end` | `'bottom 20%'` | End when bottom of element reaches 20% from top |
| `toggleActions` | `'play none none none'` | Play once on enter, don't reverse (matches current `animate-on-scroll` behavior) |
| `scrub` | `false` (default), `0.5` where specified | Only Gallery parallax and WhyChooseUs pinning use scrub |
| `markers` | `false` (only in dev) | Debug helper |

## 3. Component Animation Design

### 3.1 Hero Entrance Animation

**Target elements** (CSS selectors based on current `Hero.astro` HTML):

| Selector | Animation |
|----------|-----------|
| `.icon-glow` | Scale from 0 + fade in |
| `h1` (split into words) | Word-by-word reveal from below with stagger |
| `h1 span.text-welding-orange` | Extra emphasis: slight scale pulse after reveal |
| `section > .relative.z-10 p` | Slide up from 30px + fade in |
| `section > .relative.z-10 .flex a` | Staggered slide up from 20px + fade in |
| `.sparks-container .spark` | Enhanced with GSAP random positioning (replace CSS animation) |
| `.absolute.bottom-8` (scroll indicator) | Delayed fade in (after main content animates) |
| Decorative blurs (`.bg-welding-orange\\/20`, `.bg-forge-yellow\\/10`) | Subtle parallax drift on load |

**Timeline orchestration**:

```
tl (Hero timeline, plays on page load, no ScrollTrigger)
  │
  t=0.0  ── Lightning flash: full-screen white overlay (0 → 0.3 opacity → 0), 0.15s
  t=0.1  ── Icon scale from 0 to 1 + fade in, duration 0.6s, ease back.out(1.7)
  t=0.4  ── H1 words reveal: each word from y:40, opacity:0, stagger 0.08s, duration 0.6s
  t=0.8  ── Orange span pulse: scale 1 → 1.05 → 1, duration 0.3s
  t=0.9  ── Paragraph slide up from y:30, opacity:0, duration 0.6s
  t=1.1  ── CTA buttons stagger from y:20, opacity:0, stagger 0.12s, duration 0.5s
  t=1.5  ── Scroll indicator fade in, duration 0.4s
  t=0.3  ── (parallel) Decorative blur orbs subtle float, duration 3s, repeat -1
```

**Spark enhancement**: Replace CSS `@keyframes fall` with GSAP-controlled random spark paths. Each spark gets randomized `x`, `duration`, and `delay` via `gsap.utils.random()`. This creates more organic, less repetitive spark movement.

**Mobile behavior**: Same timeline but:
- No lightning flash
- No decorative blur parallax
- Spark animation kept (lightweight, CSS-driven fallback acceptable)
- Reduced word stagger: `0.05s` instead of `0.08s` (faster overall)

**Reduced motion**: Simple fade-in of entire `.relative.z-10` block, `0.3s`. Sparks hidden.

### 3.2 Section Title Clip-Path Reveal

**Applies to**: All section `<h2>` elements in Gallery, Services, WhyChooseUs, Contact.

**Target elements**:

| Component | Selector |
|-----------|----------|
| Gallery | `#galeria .text-center h2` |
| Services | `#servicios .text-center h2` |
| WhyChooseUs | `#por-que-elegirnos .text-center h2` |
| Contact | `#contacto .text-center h2` |

**Animation**:

```typescript
// "Welding cut" reveal — a horizontal line expanding from center
gsap.from(heading, {
  clipPath: 'inset(0 50% 0 50%)',  // Hidden: clipped to zero-width center line
  duration: 0.8,
  ease: 'power2.inOut',
  scrollTrigger: { trigger: heading, start: 'top 85%' }
});
```

Also animate the orange underline (`div.w-24.h-1.bg-welding-orange`):

```typescript
gsap.from(underline, {
  scaleX: 0,
  duration: 0.6,
  ease: 'power2.out',
  delay: 0.3,  // After heading reveal starts
  scrollTrigger: { trigger: heading, start: 'top 85%' }
});
```

**Mobile**: Same animation, no changes needed (lightweight).

**Reduced motion**: Simple opacity fade, no clip-path.

### 3.3 Gallery Wipe/Stagger Entrance

**Target elements** (from `Gallery.astro`):

| Selector | Animation |
|----------|-----------|
| `#galeria .grid > div` (each gallery item) | Staggered entrance with curtain wipe |
| `#galeria .grid > div img` | Subtle parallax shift within container |
| `#galeria p.text-center` (bottom text) | Fade up |

**Animation**:

```typescript
// Gallery items: staggered curtain wipe from left
gsap.from('#galeria .grid > div', {
  clipPath: 'inset(0 100% 0 0)',  // Wiped from right
  opacity: 0,
  duration: 0.8,
  stagger: {
    amount: 0.8,      // Total stagger time across all items
    grid: 'auto',
    from: 'start',
  },
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#galeria .grid',
    start: 'top 80%',
  }
});
```

**Parallax depth** (desktop only):

```typescript
// Images inside gallery items move slightly on scroll for depth effect
gsap.to('#galeria .grid > div img', {
  yPercent: -10,
  ease: 'none',
  scrollTrigger: {
    trigger: '#galeria .grid',
    start: 'top bottom',
    end: 'bottom top',
    scrub: 0.5,
  }
});
```

**Mobile behavior**:
- No parallax (`scrub` animation skipped)
- Simpler entrance: `opacity: 0, y: 30` instead of `clipPath` wipe (less GPU-intensive)
- Stagger amount reduced to `0.4s`

**Reduced motion**: Simple opacity fade, `0.3s`, stagger `0.05s`.

### 3.4 Service Cards Staggered 3D Entrance

**Target elements** (from `Services.astro`):

| Selector | Animation |
|----------|-----------|
| `#servicios .grid > div` (wrapper divs around each `ServiceCard`) | 3D rotate + stagger |
| `.service-card` (inside each wrapper) | Inherits transform from parent |

**Animation** (desktop):

```typescript
gsap.from('#servicios .grid > div', {
  rotateX: 15,
  y: 60,
  opacity: 0,
  duration: 0.8,
  stagger: 0.15,
  ease: 'power2.out',
  transformPerspective: 800,
  transformOrigin: 'center bottom',
  scrollTrigger: {
    trigger: '#servicios .grid',
    start: 'top 80%',
  }
});
```

**Alternating direction** (optional enhancement for desktop):

```typescript
// Even cards come from left, odd from right
'#servicios .grid > div'.forEach((card, i) => {
  gsap.from(card, {
    x: i % 2 === 0 ? -40 : 40,
    rotateY: i % 2 === 0 ? -5 : 5,
    // ... rest same
  });
});
```

**Mobile behavior**:
- No 3D transforms (`rotateX`, `rotateY` removed)
- Simple `y: 30, opacity: 0` entrance
- Stagger `0.1s`

**Reduced motion**: Simple opacity fade.

### 3.5 Stats Counter Animation

**Target elements** (from `Stats.astro`):

| Selector | Animation |
|----------|-----------|
| `.stat-number` | GSAP number tween (replaces IntersectionObserver) |
| `.stat-item` | Scale + fade entrance |

**Animation**:

```typescript
// Replace the entire manual IntersectionObserver + requestAnimationFrame
// counter with GSAP's built-in number tweening

document.querySelectorAll('.stat-number').forEach(counter => {
  const target = parseInt(counter.dataset.target || '0');

  // Entrance animation for the stat-item container
  gsap.from(counter.closest('.stat-item')!, {
    scale: 0.8,
    opacity: 0,
    duration: 0.6,
    ease: 'back.out(1.4)',
    scrollTrigger: {
      trigger: counter.closest('.stat-item'),
      start: 'top 85%',
    }
  });

  // Number counting animation
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration: 2,
    ease: 'power1.out',
    scrollTrigger: {
      trigger: counter,
      start: 'top 85%',
    },
    onUpdate: () => {
      counter.textContent = Math.floor(obj.val).toString();
    }
  });
});
```

**Mobile behavior**: Same animation (lightweight, no transforms to worry about).

**Reduced motion**: Counter still counts (accessible, no motion issue), but `scale` entrance is replaced with opacity-only.

### 3.6 WhyChooseUs Sequential Card Reveal

**Target elements** (from `WhyChooseUs.astro`):

| Selector | Animation |
|----------|-----------|
| `#por-que-elegirnos .grid > div` (4 reason cards) | Sequential reveal with stagger |
| Each card's icon container (`.w-16.h-16`) | Scale-in after card appears |

**Animation** (desktop):

```typescript
// Cards enter from below with stagger
gsap.from('#por-que-elegirnos .grid > div', {
  y: 60,
  opacity: 0,
  duration: 0.7,
  stagger: 0.15,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#por-que-elegirnos .grid',
    start: 'top 80%',
  }
});

// Icons scale in after their parent card appears
gsap.from('#por-que-elegirnos .grid > div .w-16', {
  scale: 0,
  duration: 0.5,
  stagger: 0.15,
  ease: 'back.out(1.7)',
  scrollTrigger: {
    trigger: '#por-que-elegirnos .grid',
    start: 'top 75%',
  }
});
```

**Scroll-pinned variant** (desktop only, optional — evaluate during implementation):

The proposal mentions "scroll-pinned sequential reveal." A full pin would freeze the section while cards reveal one by one. This risks feeling like scroll-jacking on a small site. **Recommendation**: Use a standard staggered entrance with generous stagger (`0.2s`) instead of pinning. If the user wants the pinned effect, it can be added as a follow-up.

**Mobile behavior**:
- Standard stagger (cards in a single column)
- No icon scale-in (just fade with parent)
- Stagger `0.1s`

**Reduced motion**: Simple opacity fade.

### 3.7 Contact Section Entrance

**Target elements** (from `Contact.astro`):

| Selector | Animation |
|----------|-----------|
| `#contacto .grid > div:first-child` (left column: contact info + hours) | Slide from left |
| `#contacto .grid > div:last-child` (right column: map) | Slide from right |
| `#contacto .bg-steel` (contact info card) | Slight delay within left column |

**Animation**:

```typescript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#contacto .grid',
    start: 'top 80%',
  }
});

// Left column slides from left
tl.from('#contacto .grid > div:first-child', {
  x: -50,
  opacity: 0,
  duration: 0.8,
  ease: 'power2.out',
});

// Right column slides from right (slight overlap)
tl.from('#contacto .grid > div:last-child', {
  x: 50,
  opacity: 0,
  duration: 0.8,
  ease: 'power2.out',
}, '-=0.5');
```

**Mobile behavior**:
- Both columns stack vertically, so both use `y: 30, opacity: 0` instead of `x` translations
- Stagger `0.2s` between them

**Reduced motion**: Simple opacity fade.

### 3.8 Hero Sparks Enhancement

**Target elements**: `.sparks-container .spark` (8 spark divs).

**Current state**: CSS `@keyframes fall` with fixed positions and durations per spark.

**GSAP replacement**:

```typescript
document.querySelectorAll('.spark').forEach(spark => {
  // Randomized spark path
  gsap.fromTo(spark, {
    y: gsap.utils.random(-50, -20),
    x: gsap.utils.random(-30, 30),
    opacity: 1,
    scale: gsap.utils.random(0.5, 1.5),
  }, {
    y: '100vh',
    x: `+=${gsap.utils.random(-60, 60)}`,
    rotation: gsap.utils.random(360, 720),
    opacity: 0,
    duration: gsap.utils.random(2, 4),
    ease: 'none',
    repeat: -1,
    delay: gsap.utils.random(0, 2),
  });
});
```

This creates more organic movement than the fixed CSS keyframes. Each spark gets its own random trajectory.

**Mobile**: Keep CSS fallback sparks (lighter on GPU). Only enhance with GSAP on desktop.

**Reduced motion**: Hide sparks entirely (`display: none` via matchMedia CSS).

## 4. Architecture Decisions

### ADR-1: Component-Local Scripts vs Centralized Animation Controller

**Choice**: Hybrid — shared init module (`src/scripts/gsap-init.ts`) + component-local `<script>` tags.

**Alternatives considered**:
1. **Fully centralized** (`src/scripts/animations.ts` knows about all components): Tight coupling, harder to maintain, one file grows huge.
2. **Fully distributed** (each component imports GSAP directly, no shared module): Duplicated setup code, inconsistent defaults, no shared easing/timing constants.

**Rationale**: The shared init module handles plugin registration, matchMedia setup, and exports constants/helpers. Each component's `<script>` tag imports what it needs and defines its own animation. This follows Astro's component-colocation pattern — the animation lives next to the markup it animates. Vite deduplicates the GSAP import across all component scripts into a single chunk.

### ADR-2: ScrollTrigger Scrub vs Toggle Animations

**Choice**: Toggle (`play once`) as the default. Scrub only for Gallery parallax.

**Alternatives considered**:
1. **Scrub everywhere**: Animations tied to scroll position. Feels interactive but can be janky on low-end devices and disorienting on touch screens.
2. **Toggle everywhere**: Animations play once when scrolled into view. Predictable, performant.
3. **Mixed**: Toggle for entrances, scrub for parallax/depth effects.

**Rationale**: Toggle animations (option 3 hybrid) match the current `animate-on-scroll` behavior users expect — content appears as you scroll down. Scrub is only used for the Gallery image parallax where the scroll-linked movement adds genuine depth. The WhyChooseUs pinning from the proposal is deferred (see section 3.6 rationale). This keeps the site feeling polished without scroll-jacking.

### ADR-3: Astro `is:inline` vs Module Script for GSAP

**Choice**: Standard Astro `<script>` tags (Vite-processed ES modules).

**Alternatives considered**:
1. **`is:inline`**: Script embedded directly in HTML, no Vite processing. Would require loading GSAP via CDN `<script>` tag or manual bundling. No tree-shaking, no deduplication.
2. **Module `<script>`** (default in Astro): Vite bundles, tree-shakes, and deduplicates. GSAP installed via npm.

**Rationale**: Module scripts let Vite handle GSAP bundling optimally. Since GSAP is imported in multiple component scripts, Vite creates a single shared chunk. Tree-shaking removes unused GSAP utilities. The only downside is that module scripts are deferred (execute after HTML parsing), but this is actually desirable — it ensures DOM elements exist before GSAP queries them.

### ADR-4: CSS Initial States (`.gsap-hidden`) vs `gsap.set()` for Starting Positions

**Choice**: CSS `.gsap-hidden` class for visibility + `gsap.set()` for transform starting positions.

**Alternatives considered**:
1. **CSS-only initial states**: Set `opacity: 0; transform: translateY(30px)` in CSS. Problem: if JS fails, content stays invisible forever.
2. **`gsap.set()` only**: Set all initial states via JS. Problem: brief flash of content in final position before GSAP loads (FOUC).
3. **Hybrid**: CSS handles `visibility: hidden` (safe fallback with timeout), GSAP `.set()` handles transform starting positions immediately before `.from()` tweens.

**Rationale**: The hybrid approach gives the best of both worlds. CSS `visibility: hidden` prevents FOUC without risking permanent invisibility (the 3s timeout + `@media (scripting: none)` fallback ensures content shows). GSAP `.set()` positions elements for animation start (e.g., `y: 60, opacity: 0`) immediately before the tween, which happens in the same script execution frame — no visual flash. This is GSAP's recommended pattern.

## 5. Data Flow

```
Page Load
  │
  ├─ Browser parses HTML
  │   └─ CSS applies .gsap-hidden → elements hidden
  │
  ├─ Vite-bundled JS loads (deferred module)
  │   │
  │   ├─ gsap-init.ts executes FIRST (shared chunk)
  │   │   ├─ gsap.registerPlugin(ScrollTrigger)
  │   │   ├─ Create matchMedia contexts
  │   │   └─ Export defaults, helpers
  │   │
  │   ├─ Hero.astro <script> executes
  │   │   ├─ import { ... } from gsap-init
  │   │   ├─ gsap.set(targets, { visibility: 'visible' })
  │   │   └─ Build & play Hero timeline
  │   │
  │   ├─ Stats.astro <script> executes
  │   │   ├─ gsap.set(targets, { visibility: 'visible' })
  │   │   └─ Create ScrollTrigger for counters
  │   │
  │   └─ [... other component scripts ...]
  │
  ├─ User scrolls
  │   ├─ ScrollTrigger fires for Gallery → wipe animation plays
  │   ├─ ScrollTrigger fires for Services → 3D entrance plays
  │   ├─ ScrollTrigger fires for Stats → counter starts
  │   └─ [... etc ...]
  │
  └─ Fallback timeout (3s)
      └─ Removes .gsap-hidden if any remain (JS failure safety)
```

## 6. File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add `gsap` to `dependencies` |
| `src/scripts/gsap-init.ts` | Create | Shared GSAP setup: plugin registration, matchMedia contexts, easing/timing constants, reusable animation factories (section title reveal) |
| `src/styles/global.css` | Modify | Remove `.animate-on-scroll`, `.is-visible`, `.delay-*` classes. Add `.gsap-hidden` class and `@media (scripting: none)` fallback. Keep `.metal-texture`, font faces, and theme. |
| `src/layouts/Layout.astro` | Modify | Remove IntersectionObserver `<script>` block. Add GSAP fallback timeout script. |
| `src/components/Hero.astro` | Modify | Add `.gsap-hidden` to animated elements. Add `<script>` importing from `gsap-init.ts` with Hero timeline. Replace CSS spark keyframes with GSAP-driven sparks (desktop) while keeping CSS fallback (mobile). Remove `icon-pulse` CSS keyframe (replaced by GSAP). |
| `src/components/Gallery.astro` | Modify | Remove `animate-on-scroll` and `delay-*` classes. Add `.gsap-hidden` to grid items. Add `<script>` with curtain wipe + parallax animations. |
| `src/components/Services.astro` | Modify | Remove `animate-on-scroll` and `delay-*` wrapper divs. Add `.gsap-hidden` to grid children. Add `<script>` with 3D staggered entrance. |
| `src/components/ServiceCard.astro` | Modify | No animation changes (parent handles entrance). Keep hover CSS. |
| `src/components/Stats.astro` | Modify | Remove entire `<script>` block (IntersectionObserver counter). Add new `<script>` with GSAP number tween + ScrollTrigger. Add `.gsap-hidden` to stat items. |
| `src/components/WhyChooseUs.astro` | Modify | Remove `animate-on-scroll` and `delay-*` classes. Add `.gsap-hidden` to cards. Add `<script>` with sequential card reveal + icon scale-in. |
| `src/components/Contact.astro` | Modify | Remove `animate-on-scroll` and `delay-*` classes. Add `.gsap-hidden` to grid columns. Add `<script>` with left/right slide entrance. |

## 7. Interfaces / Contracts

### `src/scripts/gsap-init.ts` — Exported API

```typescript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Plugin registration (side effect on import)
gsap.registerPlugin(ScrollTrigger);

// ── Easing constants ──
export const EASE = {
  entrance: 'power2.out',
  exit: 'power2.in',
  emphasis: 'power2.inOut',
  bounce: 'back.out(1.7)',
  counter: 'power1.out',
} as const;

// ── Timing constants ──
export const DURATION = {
  fast: 0.4,
  default: 0.8,
  slow: 1.2,
  counter: 2,
} as const;

export const STAGGER = {
  default: 0.1,
  cards: 0.15,
  words: 0.08,
} as const;

// ── ScrollTrigger default config factory ──
export function defaultScrollTrigger(trigger: string | Element): ScrollTrigger.Vars {
  return {
    trigger,
    start: 'top 85%',
    toggleActions: 'play none none none',
  };
}

// ── Reusable: Section title clip-path reveal ──
export function animateSectionTitle(
  headingSelector: string,
  underlineSelector?: string
): void {
  const heading = document.querySelector(headingSelector);
  if (!heading) return;

  gsap.set(heading, { visibility: 'visible' });
  gsap.from(heading, {
    clipPath: 'inset(0 50% 0 50%)',
    duration: DURATION.default,
    ease: EASE.emphasis,
    scrollTrigger: defaultScrollTrigger(heading),
  });

  if (underlineSelector) {
    const underline = document.querySelector(underlineSelector);
    if (underline) {
      gsap.set(underline, { visibility: 'visible' });
      gsap.from(underline, {
        scaleX: 0,
        duration: 0.6,
        ease: EASE.entrance,
        scrollTrigger: {
          ...defaultScrollTrigger(heading),
          // Shares trigger with heading
        },
        delay: 0.3,
      });
    }
  }
}

// ── Reduced motion detector ──
export function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── FOUC helper: reveal elements ──
export function reveal(elements: string | Element | Element[] | NodeListOf<Element>): void {
  gsap.set(elements, { visibility: 'visible' });
}

// Re-export for convenience
export { gsap, ScrollTrigger };
```

### Component Script Pattern

Each component follows this pattern:

```typescript
// In component <script> tag
import {
  gsap, ScrollTrigger, reveal, isReducedMotion,
  EASE, DURATION, STAGGER, defaultScrollTrigger, animateSectionTitle,
} from '../scripts/gsap-init';

function initComponentAnimation() {
  const targets = document.querySelectorAll('.component-target');
  if (!targets.length) return;

  reveal(targets);

  if (isReducedMotion()) {
    gsap.from(targets, { opacity: 0, duration: 0.3 });
    return;
  }

  // Full animation...
}

// Run on load and on Astro page transitions
document.addEventListener('DOMContentLoaded', initComponentAnimation);
document.addEventListener('astro:page-load', initComponentAnimation);
```

## 8. Integration with Existing Code

### CSS to Remove from `global.css`

```css
/* DELETE — lines 84-99 */
.animate-on-scroll { ... }
.animate-on-scroll.is-visible { ... }
.animate-on-scroll.delay-1 { ... }
.animate-on-scroll.delay-2 { ... }
.animate-on-scroll.delay-3 { ... }
```

### CSS to Add to `global.css`

```css
/* GSAP FOUC prevention */
.gsap-hidden {
  visibility: hidden;
}

@media (scripting: none) {
  .gsap-hidden {
    visibility: visible !important;
  }
}
```

### JavaScript to Remove from `Layout.astro`

```typescript
// DELETE — entire <script> block (lines 168-190)
function initScrollAnimations() { ... }
document.addEventListener('DOMContentLoaded', initScrollAnimations);
document.addEventListener('astro:page-load', initScrollAnimations);
```

### JavaScript to Remove from `Stats.astro`

```typescript
// DELETE — entire <script> block (lines 36-78)
function animateCounters() { ... }
```

### CSS to Remove from `Hero.astro`

```css
/* DELETE — .icon-glow @keyframes icon-pulse (GSAP replaces this) */
/* DELETE — .spark-N individual timing rules (GSAP randomizes) */
/* DELETE — @keyframes fall (GSAP replaces this) */
/* KEEP — .sparks-container, .spark base styles (position, size, gradient) */
/* KEEP — .spark::after (trail effect) */
```

### HTML Class Changes Across Components

| Component | Remove Classes | Add Classes |
|-----------|---------------|-------------|
| Gallery.astro | `animate-on-scroll`, `delay-1`, `delay-2`, `delay-3` from grid items and bottom text | `gsap-hidden` on grid items |
| Services.astro | `animate-on-scroll` from title container; remove `animate-on-scroll delay-*` wrapper divs around cards entirely (GSAP targets the grid children directly) | `gsap-hidden` on title container and grid children |
| WhyChooseUs.astro | `animate-on-scroll`, `delay-1` through `delay-4` from cards and title | `gsap-hidden` on title container and cards |
| Contact.astro | `animate-on-scroll`, `delay-1`, `delay-2` from all elements | `gsap-hidden` on title container and grid columns |
| Hero.astro | No `animate-on-scroll` to remove (Hero doesn't use it) | `gsap-hidden` on `.relative.z-10` content block |

### Transition Strategy (Old to New)

The migration is a clean swap — not an incremental overlay:

1. Install GSAP dependency
2. Create `src/scripts/gsap-init.ts`
3. Update `global.css`: remove old classes, add new `.gsap-hidden`
4. Update `Layout.astro`: remove old observer, add fallback timeout
5. Migrate each component one at a time (remove old classes, add `.gsap-hidden`, add `<script>`)
6. Verify at each step that the component animates correctly

Since the old system is purely additive CSS classes + a single IntersectionObserver, removing it and replacing it is safe. There is no state persistence or data dependency between the old and new systems.

## 9. Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Visual | Each component animation plays correctly | Manual: open dev server, scroll through page, verify each animation fires once |
| Responsive | Animations adapt at 320px, 768px, 1024px, 1440px | Chrome DevTools responsive mode; verify mobile simplifications |
| Performance | No jank on 4x CPU throttle | Chrome DevTools Performance panel: record scroll, check for long frames (>16ms) |
| CLS | No layout shift from GSAP | Lighthouse: verify CLS < 0.1; visually confirm no "jumping" content |
| Reduced motion | Animations respect `prefers-reduced-motion` | Chrome DevTools > Rendering > Emulate CSS media feature `prefers-reduced-motion: reduce` |
| JS disabled | Content visible with no JS | Chrome DevTools > Settings > Disable JavaScript; verify all content shows |
| Fallback timeout | Content shows if GSAP fails | Temporarily break GSAP import; verify 3s timeout reveals content |
| iOS Safari | ScrollTrigger works correctly | Test on real iOS device or BrowserStack; known quirks with scroll events |

## 10. Migration / Rollout

No data migration required. This is a front-end presentation change only.

**Rollout is atomic**: All changes ship together. The old animation system is fully replaced by the new one. Partial deployment (half old, half new) is not supported because the global CSS classes and the Layout.astro observer are shared infrastructure.

**Rollback**: Per the proposal, revert the commit(s). Each component can also be individually rolled back by restoring its previous `animate-on-scroll` classes and removing its GSAP `<script>` block, but the global CSS and Layout.astro changes must match.

## 11. Open Questions

- [x] Should WhyChooseUs use scroll-pinning? **Decision: No. Use standard staggered entrance. Pinning feels like scroll-jacking on a small single-page site. Can revisit as a follow-up.**
- [ ] Should sparks be GSAP-only or keep CSS fallback on mobile? **Recommendation: Keep CSS sparks on mobile (lighter), GSAP only on desktop.** Needs user confirmation.
- [ ] Does the site use Astro view transitions? The existing code listens for `astro:page-load`, suggesting it might. If view transitions are enabled, GSAP ScrollTrigger instances need `ScrollTrigger.refresh()` after each transition. **Check `astro.config.mjs` — currently no view transitions integration detected, but the event listeners are defensive.**
