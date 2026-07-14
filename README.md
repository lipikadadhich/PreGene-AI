# PreGene-AI — Marketing Site

Pixel-faithful rebuild of the "PreGene-AI" Figma Make landing page: React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui-style primitives + Framer Motion + Lucide icons.

## Getting started

This project was generated in a sandboxed environment without network access, so dependencies have **not** been installed or built/tested with a real `npm install`. Every file was hand-written and individually syntax-checked with esbuild, but you should run a build locally before shipping.

```bash
npm install
npm run dev      # local dev server
npm run build    # type-checks (tsc -b) then production build
npm run preview  # preview the production build
```

## Structure

```
src/
  components/
    layout/         Header, Footer (used on every page)
    sections/        One component per landing-page section
    ui/              Reusable shadcn-style primitives (Button, Card, Badge)
  data/
    content.ts       All copy/content as typed constants — edit here, not in JSX
  lib/
    utils.ts         cn() class-merging helper
  types/
    index.ts         Shared TypeScript interfaces
  App.tsx            Composes the page from sections
  main.tsx           React entry point
  index.css          Tailwind layers + base styles + focus-visible rules
```

## Notes

- **Content is data-driven.** Stats, feature cards, process steps, testimonials, and footer links all live in `src/data/content.ts`, typed via `src/types/index.ts`. Sections map over this data, so adding/editing a card never requires touching JSX.
- **Accessibility:** semantic landmarks (`header`, `nav`, `main`, `footer`), labelled nav regions, visible focus rings (`:focus-visible` in `index.css`), `prefers-reduced-motion` respected globally, and the mobile menu manages `aria-expanded`/`aria-controls`.
- **Responsive:** single-column stacking on mobile, 2-column feature grid on tablet, full multi-column layout at desktop widths (`sm` / `lg` Tailwind breakpoints throughout).
- **Disclaimer copy** ("For investigational use only. Not FDA approved.") is reproduced from the source design's footer — keep it intact if you deploy this, it's load-bearing for a clinical-adjacent product page.
