# Specs: gsap-animations

## Overview

Full specification for the GSAP scroll-driven animation system. This is a NEW domain (no prior animation specs existed), so all requirements are additions.

## Spec Files

| Domain | Path | Type | Requirements | Scenarios |
|--------|------|------|-------------|-----------|
| animations | `specs/animations/spec.md` | New (Full) | 18 requirements | 42 scenarios |

## Domain Breakdown

### animations (18 requirements, 42 scenarios)

| # | Requirement | Scenarios | Strength |
|---|------------|-----------|----------|
| 1.1 | GSAP Loading Strategy | 2 | MUST |
| 1.2 | matchMedia Breakpoints | 3 | MUST |
| 1.3 | Prefers-Reduced-Motion Support | 2 | MUST |
| 1.4 | FOUC Prevention (.gsap-hidden) | 3 | MUST |
| 1.5 | Legacy Animation System Removal | 1 | MUST |
| 2.1 | Title Word-by-Word Reveal | 2 | MUST |
| 2.2 | CTA Buttons Slide-Up with Bounce | 1 | MUST |
| 2.3 | Spark Particles Enhancement | 2 | MAY/SHOULD |
| 2.4 | Lightning Icon Flash Effect | 1 | MUST |
| 2.5 | Hero Timeline Orchestration | 2 | MUST |
| 3.1 | ScrollTrigger-Driven Image Reveals | 2 | MUST |
| 3.2 | Gallery Staggered Grid Entrance | 1 | MUST |
| 3.3 | Gallery Parallax on Scroll | 2 | SHOULD |
| 4.1 | Staggered 3D Entrance with Rotation | 3 | MUST |
| 5.1 | Clip-Path Welding Cut Reveal | 3 | MUST |
| 6.1 | ScrollTrigger-Driven Number Counter | 4 | MUST |
| 7.1 | Scroll-Triggered Sequential Reveal | 3 | MUST |
| 8.1 | Contact Entrance on Scroll | 3 | MUST |
| 9.1 | Frame Rate Target | 2 | MUST |
| 9.2 | No Cumulative Layout Shift | 1 | MUST |
| 9.3 | Will-Change Management | 1 | SHOULD |
| 10.1 | No Seizure-Inducing Effects | 1 | MUST |
| 10.2 | Content Accessible Without JavaScript | 1 | MUST |
| 10.3 | Animations Do Not Block Interaction | 1 | MUST |
| 11.1 | Breakpoint Animation Matrix | 2 | MUST |

## Coverage

- **Happy paths**: Covered for all 8 animation deliverables + base system
- **Edge cases**: Covered (JS disabled, reduced motion toggle mid-session, resize across breakpoints, scroll back behavior, simultaneous triggers)
- **Error states**: Covered (JS failure fallback, performance degradation on low-end devices)
- **Accessibility**: Covered (reduced motion, seizure prevention, no-JS content visibility, pointer event availability during animations)
- **Responsive**: Covered (mobile vs desktop matrix with explicit MUST/MUST NOT per feature)

## Next Step

Ready for design (`sdd-design`). The design phase should define the animation utility architecture (`src/scripts/animations.ts`), timeline factory patterns, and the component-level integration approach.
