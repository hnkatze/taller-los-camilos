# Tasks: GSAP Scroll-Driven Animations

## Phase 1: Infrastructure & Foundation

- [x] 1.1 **Install GSAP dependency**
  - Run `npm install gsap` to add GSAP v3.x (includes ScrollTrigger) to `package.json`
  - Verify `gsap` appears in `dependencies` (not `devDependencies`)
  - **Files**: `package.json`, `package-lock.json`
  - **Specs**: 1.1 (GSAP Loading Strategy)

- [x] 1.2 **Create shared GSAP initialization module**
  - Create `src/scripts/gsap-init.ts` with:
    - `gsap.registerPlugin(ScrollTrigger)` (one-time registration)
    - Easing constants (`EASE` object: `entrance`, `exit`, `emphasis`, `bounce`, `counter`)
    - Timing constants (`DURATION` object: `fast: 0.4`, `default: 0.8`, `slow: 1.2`, `counter: 2`)
    - Stagger constants (`STAGGER` object: `default: 0.1`, `cards: 0.15`, `words: 0.08`)
    - `defaultScrollTrigger(trigger)` factory returning `{ trigger, start: 'top 85%', toggleActions: 'play none none none' }`
    - `animateSectionTitle(headingSelector, underlineSelector?)` reusable factory for clip-path reveal + bar expansion
    - `isReducedMotion()` helper using `window.matchMedia`
    - `reveal(elements)` helper that calls `gsap.set(elements, { visibility: 'visible' })`
    - Re-export `gsap` and `ScrollTrigger` for component convenience
  - **Files**: `src/scripts/gsap-init.ts` (new)
  - **Specs**: 1.1 (Loading Strategy), 1.2 (matchMedia Breakpoints), 1.3 (Reduced Motion)
  - **Design**: Section 2 (Animation System Architecture), Section 7 (Interfaces/Contracts)

- [x] 1.3 **Add FOUC prevention CSS to global.css**
  - Remove old animation system CSS: `.animate-on-scroll`, `.animate-on-scroll.is-visible`, `.delay-1`, `.delay-2`, `.delay-3` (lines 84-99 of `src/styles/global.css`)
  - Add new `.gsap-hidden { visibility: hidden; }` class
  - Add `@media (scripting: none) { .gsap-hidden { visibility: visible !important; } }` fallback
  - Keep `.metal-texture`, font faces, `@theme`, and all other CSS unchanged
  - **Files**: `src/styles/global.css`
  - **Specs**: 1.4 (FOUC Prevention), 1.5 (Legacy System Removal)
  - **Design**: Section 1 (FOUC Prevention Strategy), Section 8 (Integration)

- [x] 1.4 **Update Layout.astro: add GSAP fallback timeout** (old observer kept for Phase 2 compatibility)
  - Remove the entire `<script>` block (lines 168-190) containing `initScrollAnimations()` and its IntersectionObserver
  - Add a new `<script>` block with a 3-second fallback timeout that removes `.gsap-hidden` from all elements if GSAP fails to load
  - The fallback script should use `setTimeout(() => { document.querySelectorAll('.gsap-hidden').forEach(el => el.classList.remove('gsap-hidden')); }, 3000);`
  - **Files**: `src/layouts/Layout.astro`
  - **Specs**: 1.4 (FOUC Prevention — JS failure scenario), 1.5 (Legacy System Removal — `initScrollAnimations` removal)
  - **Design**: Section 1 (Initialization Flow), Section 8 (JS to remove from Layout.astro)

## Phase 2: Component Animations (by priority)

- [x] 2.1 **Hero.astro — GSAP entrance timeline**
  - Add `gsap-hidden` class to the `.relative.z-10` content block (the main content wrapper at line 32)
  - Add a `<script>` block (NOT `is:inline`) that imports from `../scripts/gsap-init`
  - Build a single GSAP timeline (no ScrollTrigger — plays on page load):
    - t=0.0: Lightning flash — animate `.icon-glow` with `filter: brightness(3)` fading to normal, duration 0.3s
    - t=0.1: Icon scale from 0 to 1 + fade in, duration 0.6s, ease `back.out(1.7)`
    - t=0.4: H1 word-by-word reveal — wrap each word in a `<span>`, stagger from `y:40, opacity:0`, stagger 0.08s, duration 0.6s
    - t=0.8: Orange "PROFESIONAL" span scale pulse (1 -> 1.05 -> 1), duration 0.3s
    - t=0.9: Paragraph (`<p>`) slide up from `y:30, opacity:0`, duration 0.6s
    - t=1.1: CTA buttons stagger from `y:20, opacity:0`, stagger 0.12s, duration 0.5s, ease `back.out(1.7)`
    - t=1.5: Scroll indicator (`.absolute.bottom-8`) fade in, duration 0.4s
  - Ensure hero timeline does NOT re-animate on scroll back (`once: true` behavior)
  - Mobile: Same timeline but skip lightning flash, reduce word stagger to 0.05s
  - Reduced motion: Simple fade-in of entire `.relative.z-10` block, 0.3s
  - Ensure CTA buttons remain clickable during animation (no `pointer-events: none`)
  - **Files**: `src/components/Hero.astro`
  - **Specs**: 2.1 (Title Word Reveal), 2.2 (CTA Bounce), 2.4 (Lightning Flash), 2.5 (Timeline Orchestration), 10.1 (No Seizure Effects — single flash only), 10.3 (Animations Don't Block Interaction)
  - **Design**: Section 3.1 (Hero Entrance Animation)

- [x] 2.2 **Hero.astro — Spark particles GSAP enhancement (desktop only)**
  - In the same `<script>` block (or extending it), add GSAP-driven spark paths for desktop only
  - Replace CSS `@keyframes fall` with GSAP `fromTo()` per spark using `gsap.utils.random()` for `x`, `duration`, `delay`, `rotation`
  - Each spark: randomized start position, horizontal drift, varied fall speed, infinite repeat
  - Mobile (<768px): Keep existing CSS spark animation (max 4 visible sparks), do not load GSAP sparks
  - Reduced motion: Hide sparks entirely via `display: none`
  - Remove from `<style>` block: `.spark-1` through `.spark-8` individual timing rules, `@keyframes fall`
  - Keep: `.sparks-container` base styles, `.spark` base styles (position, size, gradient), `.spark::after` trail effect
  - **Files**: `src/components/Hero.astro`
  - **Specs**: 2.3 (Spark Particles Enhancement), 11.1 (Mobile max 4 sparks)
  - **Design**: Section 3.8 (Hero Sparks Enhancement)

- [x] 2.3 **Gallery.astro — Section title clip-path reveal**
  - Remove `animate-on-scroll` class from the title container (`div.text-center.mb-12` at line 57)
  - Add `gsap-hidden` class to the `<h2>` and the orange underline `<div class="w-24 h-1 bg-welding-orange">`
  - Add a `<script>` block that imports `animateSectionTitle` from `../scripts/gsap-init`
  - Call `animateSectionTitle('#galeria .text-center h2', '#galeria .text-center .w-24')` (or equivalent selectors)
  - Desktop: clip-path `inset(0 50% 0 50%)` -> `inset(0 0% 0 0%)`, duration 0.8s, ease `power2.inOut`
  - Mobile: fade + translateY instead of clip-path
  - Reduced motion: simple opacity fade 0.3s
  - **Files**: `src/components/Gallery.astro`
  - **Specs**: 5.1 (Clip-Path Welding Cut Reveal — all 3 scenarios)
  - **Design**: Section 3.2 (Section Title Clip-Path Reveal)

- [x] 2.4 **Gallery.astro — ScrollTrigger wipe reveals + staggered grid entrance**
  - Remove `animate-on-scroll` and `delay-${(index % 3) + 1}` classes from each grid item (line 67)
  - Add `gsap-hidden` class to each grid item (`#galeria .grid > div`)
  - Remove `animate-on-scroll` class from bottom text `<p>` (line 86); add `gsap-hidden` instead
  - In the same `<script>` block, add:
    - Desktop: curtain wipe via `clipPath: 'inset(0 100% 0 0)'` -> visible, stagger `amount: 0.8` across grid items, ease `power2.out`
    - Mobile: simpler entrance `opacity: 0, y: 30` instead of clip-path, stagger amount 0.4s
    - Bottom text: fade up with slight delay
  - ScrollTrigger trigger: `#galeria .grid`, start: `top 80%`
  - Reduced motion: simple opacity fade 0.3s, stagger 0.05s
  - **Files**: `src/components/Gallery.astro`
  - **Specs**: 3.1 (ScrollTrigger Image Reveals — desktop and mobile scenarios), 3.2 (Staggered Grid Entrance)
  - **Design**: Section 3.3 (Gallery Wipe/Stagger Entrance)

- [x] 2.5 **Gallery.astro — Parallax depth effect (desktop only)**
  - In the same `<script>`, add a parallax effect for images inside gallery cards
  - Use `gsap.to('#galeria .grid > div img', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '#galeria .grid', start: 'top bottom', end: 'bottom top', scrub: 0.5 } })`
  - Ensure gallery card containers have `overflow: hidden` (already present via `overflow-hidden` class)
  - Mobile (<768px): Skip this animation entirely (no parallax)
  - Reduced motion: Skip this animation entirely
  - **Files**: `src/components/Gallery.astro`
  - **Specs**: 3.3 (Gallery Parallax on Scroll — both scenarios)
  - **Design**: Section 3.3 (Parallax depth)

- [x] 2.6 **Services.astro — Section title + staggered 3D card entrance**
  - Remove `animate-on-scroll` class from title container (`div.text-center.mb-12` at line 53)
  - Remove the `animate-on-scroll delay-${...}` wrapper divs around each `<ServiceCard>` (lines 62-68) — GSAP targets grid children directly; replace with plain `<div>` wrappers (or unwrap if possible)
  - Add `gsap-hidden` class to the `<h2>`, underline div, and each grid child
  - Add `<script>` block:
    - Call `animateSectionTitle('#servicios .text-center h2', '#servicios .text-center .w-24')`
    - Desktop: 3D entrance with `rotateX: 15, y: 60, opacity: 0`, `transformPerspective: 800`, `transformOrigin: 'center bottom'`, stagger 0.15s, ease `power2.out`
    - Mobile: simple `y: 30, opacity: 0` (no 3D transforms), stagger 0.1s
    - Reduced motion: simple opacity fade 0.3s
  - ScrollTrigger trigger: `#servicios .grid`, start: `top 80%`
  - Ensure cards do not re-animate on scroll back (toggleActions: `play none none none`)
  - **Files**: `src/components/Services.astro`
  - **Specs**: 4.1 (Staggered 3D Entrance — all 3 scenarios), 5.1 (Section title)
  - **Design**: Section 3.4 (Service Cards Staggered 3D Entrance)

- [x] 2.7 **Stats.astro — GSAP-driven number counter replacing IntersectionObserver**
  - Remove the entire existing `<script>` block (lines 36-78) with `animateCounters()` and IntersectionObserver
  - Add `gsap-hidden` class to each `.stat-item` div
  - Add new `<script>` block:
    - Import from `../scripts/gsap-init`
    - For each `.stat-number`, create a GSAP number tween: `gsap.to(obj, { val: target, duration: 2, ease: EASE.counter, onUpdate: () => counter.textContent = Math.floor(obj.val).toString() })`
    - ScrollTrigger on each counter: trigger the `.stat-item`, start `top 85%`
    - Stagger counter starts by 0.2s-0.3s (leftmost first)
    - Entrance animation for `.stat-item` container: `scale: 0.8, opacity: 0`, ease `back.out(1.4)`, duration 0.6s
    - Counters must NOT re-count on scroll back
  - Mobile: same animation (lightweight)
  - Reduced motion: counter still counts (no motion concern), but `scale` entrance replaced with opacity-only
  - Ensure suffix ("+", "%") remains static and does not animate
  - **Files**: `src/components/Stats.astro`
  - **Specs**: 6.1 (ScrollTrigger-Driven Number Counter — all 4 scenarios)
  - **Design**: Section 3.5 (Stats Counter Animation)

- [x] 2.8 **WhyChooseUs.astro — Sequential card reveal + icon scale-in**
  - Remove `animate-on-scroll` class from title container (`div.text-center.mb-12` at line 35)
  - Remove `animate-on-scroll delay-${index + 1}` from each card div (line 47)
  - Add `gsap-hidden` to the `<h2>`, underline div, and each card
  - Add `<script>` block:
    - Call `animateSectionTitle('#por-que-elegirnos .text-center h2', '#por-que-elegirnos .text-center .w-24')`
    - Desktop: Cards from `y: 60, opacity: 0`, stagger 0.15s, duration 0.7s, ease `power2.out`. Icon containers (`div.w-16.h-16`) scale from 0, stagger 0.15s, duration 0.5s, ease `back.out(1.7)`, triggered slightly after cards
    - Mobile: Cards from `y: 20, opacity: 0`, no scale animation, stagger 0.1s
    - Reduced motion: simple opacity fade
  - ScrollTrigger trigger: `#por-que-elegirnos .grid`, start: `top 80%`
  - All four cards must complete entrance within 1.5s of the first card starting
  - Cards must not re-animate on scroll back
  - No scroll-pinning (per design ADR decision)
  - **Files**: `src/components/WhyChooseUs.astro`
  - **Specs**: 7.1 (Scroll-Triggered Sequential Reveal — all 3 scenarios), 5.1 (Section title)
  - **Design**: Section 3.6 (WhyChooseUs Sequential Card Reveal)

- [x] 2.9 **Contact.astro — Entrance animation with directional slides**
  - Remove `animate-on-scroll` from title container (`div.text-center.mb-12` at line 18)
  - Remove `animate-on-scroll delay-1` from left column (line 27)
  - Remove `animate-on-scroll delay-2` from right column (line 94)
  - Add `gsap-hidden` to the `<h2>`, underline div, and both grid columns
  - Add `<script>` block:
    - Call `animateSectionTitle('#contacto .text-center h2', '#contacto .text-center .w-24')`
    - Desktop: Left column from `x: -50, opacity: 0`, right column from `x: 50, opacity: 0`, staggered with ~0.2s overlap, duration 0.8s, ease `power2.out`
    - Mobile: Both columns (stacked) from `y: 30, opacity: 0`, stagger 0.2s
    - Reduced motion: simple opacity fade
  - Use a GSAP timeline with ScrollTrigger, trigger: `#contacto .grid`, start: `top 80%`
  - Section title must animate before content panels begin
  - **Files**: `src/components/Contact.astro`
  - **Specs**: 8.1 (Contact Entrance on Scroll — all 3 scenarios), 5.1 (Section title)
  - **Design**: Section 3.7 (Contact Section Entrance)

## Phase 3: Cleanup, Accessibility & Verification

- [x] 3.1 **Remove all remaining legacy animation artifacts**
  - Search entire codebase for any remaining `animate-on-scroll`, `is-visible`, `delay-1`, `delay-2`, `delay-3` class references
  - Verify no HTML element uses these classes
  - Verify `global.css` no longer contains those rules (should be done in 1.3, but verify)
  - Verify `Layout.astro` no longer has `initScrollAnimations()` (should be done in 1.4, but verify)
  - Verify `Stats.astro` no longer has IntersectionObserver script (should be done in 2.7, but verify)
  - Remove any now-unused CSS `@keyframes` from `Hero.astro` that GSAP replaces (verify in 2.2)
  - **Files**: All component files, `global.css`, `Layout.astro`
  - **Specs**: 1.5 (Legacy Animation System Removal)

- [x] 3.2 **Verify prefers-reduced-motion compliance across all components**
  - In Chrome DevTools > Rendering > Emulate `prefers-reduced-motion: reduce`
  - Verify each component: Hero, Gallery, Services, Stats, WhyChooseUs, Contact
  - Confirm: no translateX/Y, rotateX/Y, scale, or clip-path animations play
  - Confirm: only opacity transitions (max 300ms) or instant visibility
  - Confirm: sparks are hidden
  - Confirm: counters still count (counting is not a motion concern)
  - **Specs**: 1.3 (Prefers-Reduced-Motion — both scenarios), 10.1 (No Seizure Effects)
  - **Design**: Section 2 (prefers-reduced-motion handling)

- [x] 3.3 **Verify responsive behavior at all breakpoints**
  - Test at 320px (small mobile): all animations use simplified mobile variants (fade + translateY only)
  - Test at 768px (tablet/desktop threshold): 3D transforms, clip-path, parallax, directional slides activate
  - Test at 1024px (desktop): full animation set plays
  - Test at 1440px (large desktop): no layout issues, animations scale properly
  - Verify mobile: no parallax, no 3D transforms, no clip-path, max 4 sparks, no directional slides
  - Verify desktop: full animations per the breakpoint matrix (Spec 11.1)
  - **Specs**: 1.2 (matchMedia Breakpoints — all 3 scenarios), 11.1 (Breakpoint Animation Matrix — both scenarios)

- [x] 3.4 **Verify FOUC prevention and JS-disabled fallback**
  - Test with JS enabled: elements should be hidden briefly then animate in (no flash of final position)
  - Test with JS disabled (Chrome DevTools > Settings > Disable JavaScript): all content must be visible and usable
  - Test GSAP failure scenario: temporarily break the import, verify 3s timeout reveals all content
  - Verify `@media (scripting: none)` CSS fallback works
  - **Specs**: 1.4 (FOUC Prevention — all 3 scenarios), 10.2 (Content Accessible Without JS)

- [x] 3.5 **Performance verification**
  - Enable Chrome DevTools CPU throttling (4x slowdown)
  - Scroll through entire page, record Performance panel
  - Verify no frame drops below 30 FPS during any animation
  - Verify no long frames (>50ms) visible in the timeline
  - Check that no more than 8 concurrent tweens run on desktop, 4 on mobile
  - Run Lighthouse: verify CLS score < 0.1
  - Confirm only `transform` and `opacity` properties are animated (no layout-triggering props)
  - Verify `will-change` is not applied to more than 5 elements simultaneously
  - **Specs**: 9.1 (Frame Rate Target — both scenarios), 9.2 (No CLS), 9.3 (Will-Change Management)

- [x] 3.6 **Verify animations play once and don't block interaction**
  - Scroll through all sections, then scroll back up
  - Confirm NO animation replays on scroll back (Hero, Gallery, Services, Stats, WhyChooseUs, Contact)
  - Confirm all elements remain in their final visible state after animation
  - Click CTA buttons during Hero entrance animation — verify clicks register
  - Click all links/buttons during any animation — verify pointer events are not blocked
  - **Specs**: 2.5 (Hero does not re-animate), 4.1 (Service cards don't re-animate), 6.1 (Stats don't re-count), 7.1 (WhyChooseUs cards don't re-animate), 10.3 (Animations Don't Block Interaction)
