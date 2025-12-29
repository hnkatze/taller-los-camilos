# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro 5 project using the basics starter template. Astro is a static site generator that supports multiple UI frameworks and uses file-based routing.

## Commands

- `npm run dev` - Start development server at localhost:4321
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally

## Architecture

**File-based routing**: Pages in `src/pages/` become routes (e.g., `src/pages/index.astro` → `/`)

**Component structure**:
- `src/layouts/` - Page wrapper components (Layout.astro provides the HTML shell)
- `src/components/` - Reusable UI components (.astro files)
- `src/assets/` - Images and assets processed by Astro's build
- `public/` - Static files served as-is (favicon, etc.)

**Astro component format**: `.astro` files use frontmatter (`---`) for imports and server-side JS, followed by HTML template with `<style>` blocks for scoped CSS.

## Configuration

- `astro.config.mjs` - Astro configuration (integrations, build options)
- `tsconfig.json` - Extends `astro/tsconfigs/strict` for TypeScript
