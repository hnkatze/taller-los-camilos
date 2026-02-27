# Animations Specification

## Purpose

Define the behavioral requirements for a GSAP-powered animation system that replaces the existing CSS/IntersectionObserver `.animate-on-scroll` pattern. The system delivers scroll-driven, orchestrated entrance animations across all page sections while maintaining performance on low-end devices and full accessibility compliance.

---

## 1. GSAP Base System

### Requirement: GSAP Loading Strategy

The system MUST load GSAP and the ScrollTrigger plugin via a shared initialization script (`src/scripts/animations.ts`) that is imported in `Layout.astro`. GSAP and ScrollTrigger MUST be installed as npm dependencies (not loaded from a CDN). The ScrollTrigger plugin MUST be registered exactly once via `gsap.registerPlugin(ScrollTrigger)`.

#### Scenario: GSAP initializes on page load

- GIVEN the page has finished loading
- WHEN the GSAP initialization script executes
- THEN GSAP and ScrollTrigger SHALL be registered and available
- AND no duplicate plugin registrations SHALL occur

#### Scenario: GSAP initializes after Astro page transition

- GIVEN the site uses Astro view transitions
- WHEN a page transition completes (`astro:page-load` event)
- THEN all GSAP animations and ScrollTrigger instances SHALL reinitialize
- AND stale ScrollTrigger instances from the previous page SHALL be killed

### Requirement: matchMedia Breakpoints

The system MUST use `gsap.matchMedia()` to define at least three contexts: desktop (min-width: 768px), mobile (max-width: 767px), and reduced-motion (`prefers-reduced-motion: reduce`). Each animation timeline MUST be registered within the appropriate context so GSAP handles creation and teardown automatically on resize or preference change.

#### Scenario: Desktop user views animations

- GIVEN the viewport width is >= 768px
- AND the user has NOT enabled `prefers-reduced-motion`
- WHEN a section scrolls into the viewport
- THEN the full animation (including 3D transforms, parallax, and staggers) SHALL play

#### Scenario: Mobile user views animations

- GIVEN the viewport width is < 768px
- WHEN a section scrolls into the viewport
- THEN computationally expensive animations (parallax, 3D transforms with rotateY/rotateX) MUST be replaced with simpler alternatives (fade + translateY)
- AND the total number of concurrent tweens in any viewport SHALL NOT exceed 6

#### Scenario: Viewport resizes from mobile to desktop

- GIVEN the user is on a mobile viewport with simplified animations
- WHEN the viewport is resized to >= 768px
- THEN `gsap.matchMedia()` SHALL teardown mobile animations and create desktop animations
- AND no orphaned tweens or ScrollTrigger instances SHALL remain

### Requirement: Prefers-Reduced-Motion Support

The system MUST respect the user's `prefers-reduced-motion: reduce` operating system preference. When reduced motion is active, all GSAP animations MUST either be disabled entirely or reduced to a simple opacity fade with no transform movement. No animation SHALL have a duration exceeding 300ms under reduced motion.

#### Scenario: User has reduced motion enabled

- GIVEN the user's OS has `prefers-reduced-motion: reduce` enabled
- WHEN any GSAP animation would normally play
- THEN the animation MUST either not play at all (element appears immediately) or play as a simple opacity transition from 0 to 1 with duration <= 300ms
- AND no translateX, translateY, rotateX, rotateY, scale, or clip-path animation SHALL occur

#### Scenario: User toggles reduced motion while page is open

- GIVEN the page is already loaded with full animations playing
- WHEN the user enables `prefers-reduced-motion: reduce` in their OS settings
- THEN `gsap.matchMedia()` SHALL detect the change and revert all running animations to their end state
- AND no new animated transitions SHALL begin

### Requirement: FOUC Prevention (.gsap-hidden Pattern)

Elements that will be animated by GSAP MUST have a CSS class `.gsap-hidden` applied in the HTML that sets `visibility: hidden`. The GSAP initialization script MUST set these elements to `visibility: visible` when their animation begins. A CSS-only fallback timeout MUST ensure content becomes visible even if JavaScript fails to load.

#### Scenario: GSAP loads successfully

- GIVEN an element has the `.gsap-hidden` class
- WHEN GSAP initializes and sets up the animation for that element
- THEN GSAP SHALL set `visibility: visible` (via `autoAlpha`) as part of the animation's `from` or starting state
- AND no flash of the element in its final position SHALL occur before the animation starts

#### Scenario: JavaScript fails to load

- GIVEN an element has the `.gsap-hidden` class
- AND JavaScript fails to execute (network error, script blocked, etc.)
- WHEN 3 seconds have passed since page load
- THEN a CSS-only fallback rule MUST make all `.gsap-hidden` elements visible
- AND the content SHALL be fully readable and usable without animations

#### Scenario: Content visible to screen readers regardless of animation state

- GIVEN an element has `.gsap-hidden` (visibility: hidden)
- WHEN a screen reader traverses the page
- THEN the element's content SHOULD be accessible via `aria-hidden="false"` or an equivalent technique that does not rely on visibility
- OR the fallback timer SHALL ensure visibility within a timeframe that does not impede screen reader navigation

### Requirement: Legacy Animation System Removal

The existing `.animate-on-scroll` CSS class, its `.is-visible` state class, the `.delay-1/.delay-2/.delay-3` helpers, and the IntersectionObserver script in `Layout.astro` MUST be removed after all components are migrated to GSAP. The Stats component's IntersectionObserver-based counter script MUST also be removed.

#### Scenario: No legacy animation classes remain

- GIVEN all components have been migrated to GSAP
- WHEN the codebase is inspected
- THEN no HTML element SHALL have the class `animate-on-scroll`
- AND the global CSS SHALL NOT contain `.animate-on-scroll`, `.is-visible`, `.delay-1`, `.delay-2`, or `.delay-3` rules
- AND the `initScrollAnimations()` function in `Layout.astro` SHALL be removed
- AND the IntersectionObserver script in `Stats.astro` SHALL be removed

---

## 2. Hero Entrance Animation

### Requirement: Title Word-by-Word Reveal

The Hero `<h1>` text MUST animate word by word in sequence. Each word SHALL fade in and translate upward from below its baseline position. The `<span class="text-welding-orange">` word ("PROFESIONAL") MUST be included in the sequence and MAY have a slightly different easing or color flash to emphasize it.

#### Scenario: Title reveals on page load

- GIVEN the Hero section is visible on initial page load
- WHEN the GSAP hero timeline starts
- THEN each word in the `<h1>` ("SOLDADURA", "PROFESIONAL") SHALL animate in sequence
- AND each word SHALL transition from `opacity: 0; y: 30px` (or similar offset) to `opacity: 1; y: 0`
- AND the stagger between words SHALL be between 0.1s and 0.3s

#### Scenario: Orange accent word gets emphasis

- GIVEN the word "PROFESIONAL" is wrapped in `<span class="text-welding-orange">`
- WHEN this word animates into view
- THEN it SHOULD have a brief scale overshoot (e.g., scale to 1.05 then back to 1) or color flash to draw attention
- AND the emphasis effect MUST NOT last longer than 500ms

### Requirement: CTA Buttons Slide-Up with Bounce

The two CTA buttons ("Contáctenos" and "Ver Servicios") MUST animate after the title sequence completes. Each button SHALL slide up from below with a slight bounce (elastic or back easing). The buttons SHOULD stagger so the primary CTA appears first.

#### Scenario: CTAs appear after title

- GIVEN the title word reveal has completed
- WHEN the CTA portion of the hero timeline plays
- THEN each CTA button SHALL transition from `opacity: 0; y: 40px` to `opacity: 1; y: 0`
- AND the easing SHOULD include a bounce or back effect (e.g., `back.out(1.7)` or `elastic.out(1, 0.5)`)
- AND the primary CTA ("Contáctenos") SHALL appear before or simultaneously with the secondary CTA
- AND a stagger of 0.15s to 0.3s SHALL separate the two buttons

### Requirement: Spark Particles Enhancement

The existing CSS-animated spark particles (`.spark-1` through `.spark-8`) MAY be enhanced with GSAP for more organic, randomized movement. Sparks SHOULD have varied trajectories (not just linear fall). On mobile, the number of active spark particles SHOULD be reduced to 4 or fewer.

#### Scenario: Sparks animate with varied paths on desktop

- GIVEN the viewport is >= 768px
- WHEN the Hero section is visible
- THEN spark particles SHOULD animate with randomized horizontal drift and varied fall speeds
- AND sparks SHOULD loop continuously without visible resets

#### Scenario: Sparks are reduced on mobile

- GIVEN the viewport is < 768px
- WHEN the Hero section is visible
- THEN no more than 4 spark particles SHALL be actively animating
- AND sparks MAY use simpler linear paths (CSS fallback) instead of GSAP randomization

### Requirement: Lightning Icon Flash Effect

The lightning bolt SVG icon (`.icon-glow`) MUST have a brief flash animation at the start of the hero timeline (before or overlapping with the title reveal). The flash SHALL simulate a welding arc striking — a quick bright white or yellow flash that fades to the normal orange glow state.

#### Scenario: Lightning icon flashes on load

- GIVEN the Hero section is loading
- WHEN the hero GSAP timeline begins
- THEN the lightning icon SHALL flash from a high-brightness state (white or bright yellow `filter: brightness(3)` or similar) to its normal orange glow
- AND the flash duration SHALL be between 200ms and 500ms
- AND the existing CSS `icon-pulse` animation SHOULD continue after the initial flash

### Requirement: Hero Timeline Orchestration

All Hero animations (icon flash, title reveal, subtitle, CTAs, sparks) MUST be coordinated via a single GSAP timeline. The sequence order SHALL be: (1) icon flash, (2) title word reveal, (3) subtitle fade-in, (4) CTA slide-up. Sparks MAY run in parallel from the start.

#### Scenario: Hero timeline plays in correct order

- GIVEN the page has loaded
- WHEN the hero timeline plays
- THEN the icon flash SHALL start first (at time 0)
- AND the title word reveal SHALL begin after or overlapping with the icon flash (at ~0.2s to 0.5s)
- AND the subtitle (`<p>` element) SHALL fade in after the title sequence
- AND CTA buttons SHALL slide up after the subtitle
- AND the total hero entrance duration SHALL NOT exceed 3.5 seconds

#### Scenario: Hero does not re-animate on scroll back

- GIVEN the hero entrance has already played
- WHEN the user scrolls down and then back up to the hero
- THEN the hero animation SHALL NOT replay
- AND all hero elements SHALL remain in their final visible state

---

## 3. Gallery Reveal Animation

### Requirement: ScrollTrigger-Driven Image Reveals

Each gallery image card MUST animate into view when it enters the viewport via ScrollTrigger. The reveal effect MUST use a wipe or curtain pattern — either a clip-path reveal (e.g., `clip-path` transitioning from hidden to fully visible) or an overlay element that slides away to uncover the image.

#### Scenario: Gallery image reveals on scroll (desktop)

- GIVEN the viewport is >= 768px
- AND a gallery image card has not yet entered the viewport
- WHEN the user scrolls and the card enters the viewport (crosses the ScrollTrigger start threshold)
- THEN the card SHALL animate from fully hidden to fully visible using a wipe/curtain effect
- AND the reveal direction SHOULD alternate or vary across grid items (e.g., left-to-right, right-to-left)

#### Scenario: Gallery image reveals on scroll (mobile)

- GIVEN the viewport is < 768px
- WHEN a gallery image card enters the viewport
- THEN the card SHALL animate with a simpler reveal (fade + slight translateY) instead of clip-path wipe
- AND the animation duration SHOULD NOT exceed 600ms

### Requirement: Gallery Staggered Grid Entrance

When multiple gallery images become visible simultaneously (e.g., the user scrolls quickly or the grid row enters at once), the images MUST stagger their entrance rather than all appearing at the same instant. The stagger SHALL respect the grid layout order (left-to-right, top-to-bottom).

#### Scenario: Multiple images enter viewport simultaneously

- GIVEN a row of 2-3 gallery images enters the viewport at the same time
- WHEN ScrollTrigger triggers their animations
- THEN each image SHALL begin its reveal with a stagger offset of 0.1s to 0.2s between consecutive images
- AND images in the leftmost column SHALL animate first

### Requirement: Gallery Parallax on Scroll

Gallery images SHOULD have a subtle parallax effect where the image inside the card moves at a slightly different speed than the card container during scrolling. This effect MUST be disabled on viewports < 768px.

#### Scenario: Parallax effect on desktop scroll

- GIVEN the viewport is >= 768px
- AND gallery images are visible on screen
- WHEN the user scrolls
- THEN the `<img>` element inside each gallery card SHOULD translate vertically at a different rate than the page scroll (parallax ratio between 0.9 and 1.1)
- AND the parallax SHALL NOT cause images to overflow their container (overflow: hidden on the card)

#### Scenario: Parallax disabled on mobile

- GIVEN the viewport is < 768px
- WHEN the user scrolls through the gallery
- THEN no parallax effect SHALL be applied to gallery images

---

## 4. Service Cards Animation

### Requirement: Staggered 3D Entrance with Rotation

Service cards (`ServiceCard.astro`, rendered within the Services section grid) MUST animate into view with a 3D entrance effect on desktop. Each card SHALL rotate in from an off-screen position along the Y-axis (perspective rotation) and fade in simultaneously. Alternating cards SHOULD rotate from opposite directions (odd cards from left, even cards from right).

#### Scenario: Service cards enter with 3D rotation on desktop

- GIVEN the viewport is >= 768px
- AND the services section grid enters the viewport
- WHEN ScrollTrigger triggers the service cards animation
- THEN each service card SHALL animate from `opacity: 0; rotateY: -90deg` or `rotateY: 90deg` (alternating) to `opacity: 1; rotateY: 0deg`
- AND the stagger between cards SHALL be between 0.1s and 0.25s
- AND the parent container MUST have `perspective` set (e.g., 1000px) for the 3D effect

#### Scenario: Service cards use simple entrance on mobile

- GIVEN the viewport is < 768px
- WHEN service cards enter the viewport
- THEN each card SHALL animate with `opacity: 0; y: 30px` to `opacity: 1; y: 0` (no 3D rotation)
- AND the stagger SHALL still apply between cards

#### Scenario: Service cards do not re-animate on scroll back

- GIVEN a service card has already animated into view
- WHEN the user scrolls past and returns to the services section
- THEN the card SHALL remain in its final visible state
- AND the animation SHALL NOT replay

---

## 5. Section Title Animations

### Requirement: Clip-Path Welding Cut Reveal

All section titles (`<h2>` elements in Gallery, Services, WhyChooseUs, and Contact sections) MUST animate with a clip-path reveal that simulates a welding cut — the text is progressively revealed from one side as if being cut/welded into existence. The accompanying decorative bar (`<div class="w-24 h-1 bg-welding-orange">`) SHOULD animate by expanding from center to full width.

#### Scenario: Section title reveals via clip-path on desktop

- GIVEN the viewport is >= 768px
- AND a section title has not yet appeared
- WHEN the section title's ScrollTrigger fires
- THEN the `<h2>` text SHALL animate via `clip-path` from fully clipped (e.g., `inset(0 100% 0 0)`) to fully visible (`inset(0 0% 0 0)`)
- AND the reveal direction SHALL be left-to-right (simulating a welding torch path)
- AND the animation duration SHALL be between 0.6s and 1.0s

#### Scenario: Decorative bar expands after title

- GIVEN a section title has just finished its clip-path reveal
- WHEN the title animation completes
- THEN the orange decorative bar below the title SHALL animate from `scaleX(0)` to `scaleX(1)` expanding from center
- AND the bar animation duration SHALL be between 0.3s and 0.5s

#### Scenario: Section title uses simpler animation on mobile

- GIVEN the viewport is < 768px
- WHEN a section title enters the viewport
- THEN the title SHALL animate with a fade + translateY instead of clip-path
- AND the decorative bar expansion SHALL still play

---

## 6. Stats Counter Animation

### Requirement: ScrollTrigger-Driven Number Counter

The stats section numbers (currently animated via a manual IntersectionObserver) MUST be migrated to GSAP. Each stat number SHALL animate from 0 to its target value using `gsap.to()` with a snap modifier for integer-only display. The counter MUST be triggered by ScrollTrigger when the stats section enters the viewport.

#### Scenario: Stats count up when scrolled into view

- GIVEN the stats section has not yet entered the viewport
- WHEN the user scrolls the stats section into view (threshold ~50% visible)
- THEN each stat number (`data-target` attribute) SHALL animate from 0 to its target value
- AND the displayed value SHALL always be an integer (no decimals during animation)
- AND the animation duration SHALL be between 1.5s and 2.5s
- AND the easing SHALL produce an acceleration-deceleration curve (e.g., `power2.out`)

#### Scenario: Stats numbers include proper formatting

- GIVEN a stat target value is 500
- WHEN the counter reaches the target
- THEN the displayed text SHALL be "500" (no comma needed for this range)
- AND the suffix ("+", "%") SHALL remain static and not animate

#### Scenario: Stats stagger their counting

- GIVEN multiple stat counters enter the viewport simultaneously
- WHEN ScrollTrigger fires the stats animation
- THEN each counter SHOULD stagger its start by 0.2s to 0.3s
- AND the leftmost stat SHALL begin counting first

#### Scenario: Stats do not re-count on scroll back

- GIVEN the stats counters have already animated to their target values
- WHEN the user scrolls away and returns
- THEN the counters SHALL remain at their final target values
- AND the counting animation SHALL NOT replay

---

## 7. WhyChooseUs Cards Animation

### Requirement: Scroll-Triggered Sequential Reveal

The four WhyChooseUs reason cards MUST animate into view sequentially (one after another) when the section enters the viewport. Each card SHALL have a distinct entrance with stagger timing. The animation SHOULD convey a "building" metaphor — cards appearing one at a time as if being assembled.

#### Scenario: Cards reveal sequentially on desktop

- GIVEN the viewport is >= 768px
- AND the WhyChooseUs section enters the viewport
- WHEN ScrollTrigger fires
- THEN each reason card SHALL animate from `opacity: 0; y: 40px; scale: 0.95` to `opacity: 1; y: 0; scale: 1`
- AND the stagger between cards SHALL be 0.15s to 0.25s
- AND all four cards SHALL complete their entrance within 1.5s of the first card starting

#### Scenario: Cards reveal on mobile with reduced effect

- GIVEN the viewport is < 768px
- WHEN a WhyChooseUs card enters the viewport
- THEN the card SHALL animate with `opacity: 0; y: 20px` to `opacity: 1; y: 0`
- AND the scale animation SHALL NOT apply on mobile

#### Scenario: Cards do not re-animate on scroll back

- GIVEN the WhyChooseUs cards have already animated into view
- WHEN the user scrolls past and returns to the section
- THEN all cards SHALL remain in their final visible state

---

## 8. Contact Section Animation

### Requirement: Contact Entrance on Scroll

The Contact section's two main content blocks (contact info panel on the left, Google Maps embed on the right) MUST animate into view when the section enters the viewport. The left panel and right panel SHOULD slide in from their respective sides (left from left, right from right) or both fade up with a stagger.

#### Scenario: Contact panels animate on scroll (desktop)

- GIVEN the viewport is >= 768px
- AND the contact section has not yet entered the viewport
- WHEN the user scrolls the contact section into view
- THEN the left contact info panel SHALL animate from `opacity: 0; x: -30px` to `opacity: 1; x: 0`
- AND the right map panel SHALL animate from `opacity: 0; x: 30px` to `opacity: 1; x: 0`
- AND the right panel SHALL start ~0.2s after the left panel

#### Scenario: Contact panels animate on mobile

- GIVEN the viewport is < 768px
- WHEN the contact section enters the viewport
- THEN both panels (stacked vertically on mobile) SHALL animate with `opacity: 0; y: 30px` to `opacity: 1; y: 0`
- AND a stagger of 0.15s to 0.2s SHALL separate the two panels

#### Scenario: Contact section title animates via section title pattern

- GIVEN the contact section has an `<h2>` title
- WHEN the section enters the viewport
- THEN the title SHALL animate per the Section Title clip-path reveal requirement (Requirement 5)
- AND the content panels SHALL begin animating after the title animation starts

---

## 9. Performance Requirements

### Requirement: Frame Rate Target

All GSAP animations MUST maintain a frame rate of at least 30 FPS on mid-range mobile devices (tested via Chrome DevTools with 4x CPU throttle). Animations SHOULD target 60 FPS on desktop.

#### Scenario: Smooth animation on throttled CPU

- GIVEN Chrome DevTools CPU throttling is set to 4x slowdown
- WHEN any scroll-triggered animation plays on a page with all sections loaded
- THEN the frame rate SHALL NOT drop below 30 FPS during the animation
- AND no visible "jank" (frame drops > 50ms) SHALL occur

#### Scenario: Limited concurrent tweens

- GIVEN the user is scrolling through the page
- WHEN multiple ScrollTrigger-driven animations could fire simultaneously
- THEN the system SHOULD limit active tweens so that no more than 8 tweens run concurrently on desktop and no more than 4 on mobile

### Requirement: No Cumulative Layout Shift

GSAP animations MUST NOT cause measurable Cumulative Layout Shift (CLS). Elements that animate MUST have their layout space reserved by CSS before GSAP animates them. Only `transform` and `opacity` properties SHOULD be animated (these are compositor-friendly and do not trigger layout).

#### Scenario: CLS remains below threshold

- GIVEN the page is loaded and the user scrolls through all sections
- WHEN Lighthouse or Web Vitals measures CLS
- THEN the CLS score SHALL remain below 0.1
- AND no layout-triggering properties (width, height, top, left, margin, padding) SHALL be animated by GSAP

### Requirement: Will-Change Management

The system SHOULD NOT apply `will-change` to more than 5 elements simultaneously. If `will-change` is used, it MUST be added just before the animation starts and removed after it completes to avoid excessive GPU memory consumption.

#### Scenario: Will-change is applied judiciously

- GIVEN multiple animated elements exist on the page
- WHEN they are not actively animating
- THEN no more than 2 elements SHALL have `will-change` set
- AND `will-change` SHALL be removed (set to `auto`) after an animation's `onComplete` callback

---

## 10. Accessibility Requirements

### Requirement: No Seizure-Inducing Effects

No animation SHALL flash or strobe more than 3 times per second. The lightning icon flash (Hero) MUST be a single flash, not a repeating strobe.

#### Scenario: Lightning flash does not repeat rapidly

- GIVEN the Hero section loads
- WHEN the lightning flash animation plays
- THEN there SHALL be exactly one flash event
- AND the flash SHALL NOT repeat within 1 second

### Requirement: Content Accessible Without JavaScript

All page content MUST be visible and readable when JavaScript is disabled. The `.gsap-hidden` fallback timer ensures this, but additionally, no content SHALL be permanently hidden behind an animation that requires JS to reveal.

#### Scenario: Page is usable with JS disabled

- GIVEN JavaScript is disabled in the browser
- WHEN the user loads the page
- THEN all text, images, and interactive elements (links, buttons) SHALL be visible
- AND no content SHALL be obscured or invisible due to missing GSAP initialization

### Requirement: Animations Do Not Block Interaction

No animation SHALL prevent the user from clicking links, buttons, or scrolling during playback. All interactive elements MUST remain clickable throughout their entrance animation.

#### Scenario: CTA buttons are clickable during animation

- GIVEN the Hero CTA buttons are mid-animation (sliding up)
- WHEN the user clicks the "Contáctenos" button
- THEN the click SHALL register and navigate to `#contacto`
- AND the animation SHALL NOT block pointer events

---

## 11. Responsive Behavior Summary

### Requirement: Breakpoint Animation Matrix

The following matrix defines which animation features apply at each breakpoint:

| Feature | Mobile (< 768px) | Desktop (>= 768px) |
|---|---|---|
| Hero title word reveal | MUST (simplified: fade only) | MUST (full: fade + translateY) |
| Hero CTA bounce | SHOULD (reduced bounce) | MUST (full bounce easing) |
| Hero sparks (GSAP-enhanced) | MAY (CSS fallback, max 4) | SHOULD (full randomized paths) |
| Hero lightning flash | MUST | MUST |
| Gallery wipe/curtain | MUST NOT (use fade instead) | MUST |
| Gallery parallax | MUST NOT | SHOULD |
| Gallery stagger | MUST (0.1s) | MUST (0.15s) |
| Service card 3D rotation | MUST NOT (use fade+Y) | MUST |
| Section title clip-path | SHOULD NOT (use fade+Y) | MUST |
| Stats counter | MUST | MUST |
| WhyChooseUs scale | MUST NOT | SHOULD |
| Contact slide from sides | MUST NOT (use fade+Y) | MUST |

#### Scenario: Mobile gets simplified animation set

- GIVEN the viewport is < 768px
- WHEN any animation plays
- THEN it SHALL conform to the "Mobile" column in the breakpoint matrix
- AND no 3D transform, parallax, or clip-path animation SHALL execute

#### Scenario: Desktop gets full animation set

- GIVEN the viewport is >= 768px
- AND `prefers-reduced-motion` is NOT set to `reduce`
- WHEN any animation plays
- THEN it SHALL conform to the "Desktop" column in the breakpoint matrix
