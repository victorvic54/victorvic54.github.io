# Victor Varian's Portfolio Website

## Overview
A cosmic-themed, responsive portfolio built with React, Framer Motion, and a custom
zero-dependency 3D starfield engine. Content is synced with `Resume_Victor.pdf`.

## Run locally
```bash
npm install
npm run dev      # dev server
npm run build    # production build into dist/
npm run preview  # serve the production build
```

## Deployment
Pushing to `master` triggers `.github/workflows/deploy.yml`, which builds with Vite and
publishes `dist/` to GitHub Pages. Files in `public/` (including `Resume_Victor.pdf`)
are copied into `dist/` at build time, so the résumé is downloadable at
`victorvic54.github.io/Resume_Victor.pdf`.

## Signature visuals
- **`src/CosmicCanvas.jsx`** — full-page 3D starfield on a `<canvas>`: perspective-projected
  stars, constellation lines (spatial-grid linking), shooting stars, mouse-depth parallax,
  and a warp-streak effect driven by scroll velocity. No WebGL, no dependencies.
  Automatically reduces star count on touch devices, pauses when the tab is hidden, and
  renders a static sky under `prefers-reduced-motion`.
- **`src/TiltCard.jsx`** — 3D tilt-toward-cursor cards with a tracking glare highlight
  (stats, education, achievements). Inert on touch devices.
- **Aurora blobs, grid overlay, film-grain noise** — layered fixed backgrounds in CSS.
- **Hero** — per-letter 3D flip-in of the name with a continuous gradient across letters,
  plus a typewriter role rotation.
- **Orbit system** — pure-CSS 3D gyroscope rings in the About section.

## Sections
1. **Hero** — name, rotating roles, CTAs (Connect / Email), socials
2. **Stats** — 4+ years experience, 10B+ rows migrated, 88% storage saved, top 1% trading
3. **About** — bio synced with resume + honest "weaknesses" note
4. **Experience** — Airwallex (BE SWE, current), Shopee (BE SWE), Sensetime, Sea, Shopee (DS),
   SAP ML Foundation
5. **Education** — NUS BComp Hons (Distinction), SE & AI major, tuition grant + highlights
6. **Tech stack** — languages, backend/infra, databases, frontend/mobile, ML & tooling
7. **Achievements** — IMC Prosperity 3.0/2.0, Grab, NUS DS, JP Morgan CFG, Shopee Code
   League ×2, SMO Silver
8. **Contact** — email + LinkedIn, availability badge
9. **Footer** — nav + socials

## Design system
Design tokens live in `src/index.css` (`--cyan`, `--violet`, `--pink`, `--gold`, glass
surfaces, fonts). Layout and components are in `src/App.css`. Fonts: Space Grotesk
(display) + Inter (body) via Google Fonts.

Accessibility & UX: mobile-first breakpoints (960px / 640px), no horizontal overflow at
390px, `prefers-reduced-motion` support throughout, focus-visible outlines, aria-labels
on icon links.

## Contact info (from resume)
- **Email:** victor.vic11@yahoo.com
- **LinkedIn:** linkedin.com/in/victor-varian
- **GitHub:** github.com/victorvic54
- **Kaggle:** kaggle.com/victorvic

## Updating content
All content is data-driven at the top of `src/App.jsx` (`EXPERIENCES`, `ACHIEVEMENTS`,
`TECH_STACK`, `STATS`, `EDUCATION_HIGHLIGHTS`, `ROLES`, `SOCIALS`). To refresh the résumé,
replace both `Resume_Victor.pdf` (repo root) and `public/Resume_Victor.pdf`.
