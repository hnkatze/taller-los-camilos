# Taller Los Camilos

Professional landing page for a family-owned welding workshop based in Bonito Oriental, Colón, Honduras. The workshop, named in honor of owner Don Héctor's father and son — both named Camilo — specializes in welding services, cattle troughs, metal roofing, agricultural machinery repair, and cattle scales.

[![Astro](https://img.shields.io/badge/Astro-5-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![GSAP](https://img.shields.io/badge/GSAP-3-88CE02?logo=greensock&logoColor=white)](https://gsap.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

## Overview

A single-page marketing website designed to establish the workshop's online presence and drive customer contact via WhatsApp — the primary communication channel in Honduras. The site features scroll-driven animations, a photo gallery with lightbox, an embedded map, and comprehensive local SEO optimized for the Colón department region.

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [Astro](https://astro.build) | 5 | Static site generator, file-based routing |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utility-first styling with `@theme` CSS variables |
| [GSAP](https://gsap.com) + ScrollTrigger | 3 | Scroll-driven animations, counters, parallax |
| [astro-icon](https://github.com/natemoo-re/astro-icon) | 1 | SVG icon component with Lucide icon set |
| TypeScript | strict | Type-safe scripting throughout |

No UI framework is used. All components are pure Astro with vanilla TypeScript.

---

## Features

### Animations
- GSAP entrance timeline on the hero section (staggered text, badge, CTA)
- Scroll-triggered reveals for all content sections
- Clip-path "welding cut" heading animation on desktop
- Animated stat counters (years of experience, projects completed, etc.)
- `gsap.matchMedia()` for device-appropriate behavior: simplified on mobile, fully disabled when `prefers-reduced-motion` is set
- FOUC prevention via `.gsap-hidden` CSS class with a 3-second fallback timer

### Design
- Mobile-first responsive layout
- Custom industrial color palette: `charcoal`, `steel`, `welding-orange`, `forge-yellow`
- Subtle metallic texture overlay via CSS `repeating-linear-gradient`
- Self-hosted fonts: Oswald (headings) and Inter (body)
- Fixed header with scroll-spy navigation and hamburger menu on mobile

### SEO
- Schema.org `LocalBusiness` JSON-LD structured data
- OpenGraph and Twitter Card meta tags
- Geographic meta tags (`geo.region`, `geo.placename`) for local search
- Canonical URL, robots meta, language and keywords meta
- Google Site Verification

### Contact and Conversion
- Floating WhatsApp button (persistent CTA across all sections)
- Per-service WhatsApp CTAs with pre-filled message templates
- Lazy-loaded Google Maps embed for the workshop location
- Business hours, phone number, and address in the contact section

### Accessibility
- Semantic HTML5 landmarks (`<main>`, `<header>`, `<nav>`, `<section>`, `<footer>`)
- ARIA labels on icon-only buttons and the mobile menu toggle
- Keyboard navigation with visible focus styles
- Focus trap and focus restoration on the mobile navigation menu
- `prefers-reduced-motion` respected at both CSS and JavaScript level
- Decorative images marked with `alt=""` and `aria-hidden="true"`

---

## Project Structure

```
taller-los-camilos/
├── public/
│   ├── favicon.svg
│   └── fonts/                     # Self-hosted Oswald and Inter font files
├── src/
│   ├── components/
│   │   ├── Header.astro           # Fixed nav with hamburger menu and scroll-spy
│   │   ├── Hero.astro             # Full-screen hero with GSAP entrance timeline
│   │   ├── Stats.astro            # Animated stat counters section
│   │   ├── WhyChooseUs.astro      # Trust signals and differentiators section
│   │   ├── Services.astro         # Service catalog with per-service WhatsApp CTAs
│   │   ├── ServiceCard.astro      # Individual service card component
│   │   ├── Gallery.astro          # Bento-grid photo gallery with lightbox viewer
│   │   ├── Contact.astro          # Contact info and lazy-loaded Google Maps embed
│   │   ├── Footer.astro           # Three-column footer with links and legal text
│   │   └── WhatsAppButton.astro   # Floating WhatsApp CTA (rendered in layout)
│   ├── layouts/
│   │   └── Layout.astro           # HTML shell: SEO meta, fonts, JSON-LD, GSAP fallback
│   ├── pages/
│   │   └── index.astro            # Single page composing all sections in order
│   ├── scripts/
│   │   └── gsap-init.ts           # Shared GSAP setup: easing, timing, stagger, factories
│   └── styles/
│       └── global.css             # @theme color and font variables, FOUC helpers, metal texture
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or higher
- npm 9 or higher

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd taller-los-camilos

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The site will be available at `http://localhost:4321`.

### Production Build

```bash
# Build the static site to ./dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server at `localhost:4321` |
| `npm run build` | Build production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands directly |

---

## Configuration

The site URL and contact details are defined in `src/layouts/Layout.astro`:

```typescript
const siteUrl = "https://tallerloscamilos.com";
const phone = "+50499505549";
```

The color palette and typography are defined in `src/styles/global.css` using Tailwind 4 `@theme` variables:

```css
@theme {
  --color-charcoal: #1C1C1C;
  --color-steel: #2D2D2D;
  --color-welding-orange: #F97316;
  --color-forge-yellow: #FBBF24;
  --font-heading: 'Oswald', sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
}
```

GSAP timing and easing constants are centralized in `src/scripts/gsap-init.ts` and imported by each component that uses animations.

---

## License

MIT
