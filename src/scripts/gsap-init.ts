import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Plugin registration (one-time, idempotent)
gsap.registerPlugin(ScrollTrigger);

// -- Easing constants --
export const EASE = {
  entrance: 'power2.out',
  exit: 'power2.in',
  emphasis: 'power2.inOut',
  bounce: 'back.out(1.7)',
  counter: 'power1.out',
} as const;

// -- Timing constants --
export const DURATION = {
  fast: 0.4,
  default: 0.8,
  slow: 1.2,
  counter: 2,
} as const;

// -- Stagger constants --
export const STAGGER = {
  default: 0.1,
  cards: 0.15,
  words: 0.08,
} as const;

// -- ScrollTrigger default config factory --
export function defaultScrollTrigger(trigger: string | Element): ScrollTrigger.Vars {
  return {
    trigger,
    start: 'top 85%',
    toggleActions: 'play none none none',
  };
}

// -- Reusable: Section title clip-path reveal --
// Applies to Gallery, Services, WhyChooseUs, Contact section headings
export function animateSectionTitle(
  headingSelector: string,
  underlineSelector?: string
): void {
  const heading = document.querySelector(headingSelector);
  if (!heading) return;

  if (isReducedMotion()) {
    gsap.set(heading, { visibility: 'visible' });
    gsap.from(heading, {
      opacity: 0,
      duration: 0.3,
      scrollTrigger: defaultScrollTrigger(heading),
    });

    if (underlineSelector) {
      const underline = document.querySelector(underlineSelector);
      if (underline) {
        gsap.set(underline, { visibility: 'visible' });
        gsap.from(underline, {
          opacity: 0,
          duration: 0.3,
          scrollTrigger: defaultScrollTrigger(heading),
        });
      }
    }
    return;
  }

  // Desktop: clip-path "welding cut" reveal from center
  // Mobile: fade + translateY (clip-path can be expensive on low-end devices)
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  gsap.set(heading, { visibility: 'visible' });

  if (isMobile) {
    gsap.from(heading, {
      y: 20,
      opacity: 0,
      duration: DURATION.default,
      ease: EASE.entrance,
      scrollTrigger: defaultScrollTrigger(heading),
    });
  } else {
    gsap.from(heading, {
      clipPath: 'inset(0 50% 0 50%)',
      duration: DURATION.default,
      ease: EASE.emphasis,
      scrollTrigger: defaultScrollTrigger(heading),
    });
  }

  if (underlineSelector) {
    const underline = document.querySelector(underlineSelector);
    if (underline) {
      gsap.set(underline, { visibility: 'visible' });
      gsap.from(underline, {
        scaleX: 0,
        duration: 0.6,
        ease: EASE.entrance,
        delay: 0.3,
        scrollTrigger: defaultScrollTrigger(heading),
      });
    }
  }
}

// -- Reduced motion detector --
export function isReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// -- FOUC helper: reveal elements by setting visibility to visible --
export function reveal(elements: string | Element | Element[] | NodeListOf<Element>): void {
  gsap.set(elements, { visibility: 'visible' });
}

// Re-export for component convenience
export { gsap, ScrollTrigger };
