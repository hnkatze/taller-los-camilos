# Proposal: GSAP Scroll-Driven Animations

## Intent

The current animation system is limited to a single `fadeUp` pattern applied uniformly across all components via a shared `.animate-on-scroll` class and basic IntersectionObserver. This creates a repetitive, underwhelming experience that doesn't match the craftsmanship identity of a welding workshop.

GSAP (GreenSock Animation Platform) with ScrollTrigger enables dramatic, scroll-driven animations — word reveals, parallax, staggered entrances, 3D transforms — that CSS alone cannot deliver reliably across browsers. The goal is to transform the site from "functional" to "memorable" while keeping performance safe for low-end phones common in Honduras.

## Scope

### In Scope

- Install GSAP + ScrollTrigger (free tier, ~33KB gzipped)
- Hero entrance: word-by-word title reveal, CTA slide-up, spark particles enhancement, lightning flash
- Gallery: wipe/curtain reveal on scroll, parallax depth, staggered grid entrance
- Service cards: staggered 3D entrance with alternating direction
- Section titles: clip-path welding-cut reveal animation
- Stats counters: ScrollTrigger-driven slot-machine counting (replace manual IntersectionObserver)
- WhyChooseUs cards: scroll-pinned sequential reveal
- Contact section: entrance animation
- `prefers-reduced-motion` support via `gsap.matchMedia()`
- Mobile performance guard via `gsap.matchMedia()` (reduce/disable heavy animations on small screens)
- CLS prevention: CSS reserves layout space before GSAP animates
- Remove old `.animate-on-scroll` system after migration

### Out of Scope

- Image hosting migration (images on postimg.cc — separate concern)
- Header responsive hamburger menu (separate change)
- Smooth scroll library integration (Lenis) — evaluate after GSAP is in place
- Section separator SVG parallax — deferred to a follow-up if base animations perform well
- Any server-side rendering changes
- Content or copy changes

## Approach

**GSAP Selective Strategy**: Use GSAP only where CSS cannot deliver the desired effect. Keep CSS for hover states, simple transitions, and Tailwind utility animations (`animate-spin`, `animate-pulse`).

1. **Infrastructure**: Add `gsap` as an npm dependency. Load GSAP + ScrollTrigger via a shared initialization script in `Layout.astro`. Register the ScrollTrigger plugin once.
2. **Animation utility**: Create a small shared script (`src/scripts/animations.ts`) that registers GSAP plugins, sets up `gsap.matchMedia()` contexts for desktop/mobile/reduced-motion, and exports reusable timeline factories.
3. **Component migration**: Each component gets a `<script>` block (Astro client-side) that imports from the shared utility and defines its specific animation timeline. Migrate one component at a time, starting with Hero (highest visual impact).
4. **CSS cleanup**: Remove the global `.animate-on-scroll` class and its IntersectionObserver script after all components are migrated.
5. **Performance validation**: Test on throttled CPU (Chrome DevTools 4x slowdown) and verify no layout shifts via CLS measurement.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `gsap` dependency |
| `src/layouts/Layout.astro` | Modified | Add GSAP script initialization |
| `src/scripts/animations.ts` | New | Shared GSAP setup, matchMedia contexts, timeline factories |
| `src/components/Hero.astro` | Modified | Replace CSS keyframe animations with GSAP timeline (word reveal, CTA, sparks) |
| `src/components/Gallery.astro` | Modified | Add ScrollTrigger wipe reveals, parallax, staggered grid |
| `src/components/Services.astro` | Modified | Add staggered entrance for service cards container |
| `src/components/ServiceCard.astro` | Modified | Add 3D entrance animation via GSAP |
| `src/components/Stats.astro` | Modified | Replace IntersectionObserver counter with ScrollTrigger + GSAP number tween |
| `src/components/WhyChooseUs.astro` | Modified | Add scroll-pinned sequential card reveal |
| `src/components/Contact.astro` | Modified | Add entrance animation |
| `src/styles/global.css` | Modified | Remove `.animate-on-scroll` system, add GSAP base styles (visibility for FOUC prevention) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Poor performance on low-end phones (Honduras market) | High | Use `gsap.matchMedia()` to disable heavy animations (parallax, 3D transforms) on screens < 768px; limit concurrent tweens |
| Cumulative Layout Shift (CLS) from GSAP transforms | Medium | Set initial CSS state (opacity, transform) before GSAP runs; use `will-change` sparingly; reserve space with CSS dimensions |
| Flash of unstyled content (FOUC) before GSAP loads | Medium | Add `.gsap-hidden { visibility: hidden }` in CSS; GSAP sets `visibility: visible` on init; fallback timeout ensures content shows if JS fails |
| Bundle size increase (~33KB gzipped) | Low | GSAP is well-optimized; lazy-load via dynamic import if needed; tree-shake unused plugins |
| ScrollTrigger conflicts with native scroll behavior | Low | Avoid scroll-jacking; use `scrub` sparingly; test on iOS Safari (known quirks) |
| Animation overload — too much movement feels chaotic | Medium | Apply animations with restraint; use consistent easing (`power2.out` family); stagger timings so only one "hero" animation plays at a time per viewport |

## Rollback Plan

1. Remove the `gsap` dependency from `package.json` and run `npm install`
2. Delete `src/scripts/animations.ts`
3. Revert each component's `<script>` block to the previous IntersectionObserver-based `.animate-on-scroll` pattern
4. Restore the `.animate-on-scroll` CSS class and global observer script in `global.css` / `Layout.astro`
5. Restore CSS `@keyframes` in `Hero.astro` for spark animations

Since each component is migrated independently, partial rollback (reverting individual components) is also possible.

## Dependencies

- `gsap` npm package (v3.x, free license covers all planned features)
- ScrollTrigger plugin (included in free GSAP, registered via `gsap.registerPlugin()`)
- No external CDN — bundle via npm for reliability

## Success Criteria

- [ ] Hero section has a multi-step entrance animation (title word reveal, CTA bounce, sparks) that plays on page load
- [ ] Gallery images reveal with a scroll-driven wipe/curtain effect and stagger
- [ ] Service cards enter with a staggered 3D animation on scroll
- [ ] Section titles animate with a clip-path reveal on scroll
- [ ] Stats counters animate from 0 to target value when scrolled into view (slot-machine style)
- [ ] WhyChooseUs cards reveal sequentially as user scrolls through the section
- [ ] All animations respect `prefers-reduced-motion` (reduced to simple fades or disabled entirely)
- [ ] No animation runs on mobile < 768px that causes jank (tested at 4x CPU throttle)
- [ ] No measurable CLS increase (Lighthouse CLS score stays < 0.1)
- [ ] Old `.animate-on-scroll` system is fully removed
- [ ] Site remains functional with JavaScript disabled (content visible, no layout breakage)
