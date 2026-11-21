# 02: Tech stack and code structure

## Chosen approach

Hand-built SVG inside a React component, styled with Tailwind v4 theme tokens. Motion for React is used for animation in phase 2 (and for an optional idle float in phase 1).

Why this approach (decided by the team after comparing Rive, Lottie and CSS-only):
- Everything lives in the repo as readable code. The jury reviews the code.
- No external editor, account or license. Claude Code can build and change it end to end.
- The bubble is a simple geometric character, so no skeletal rigging is needed.
- SVG paths can later be morphed for fluid squash and stretch between states.

Frontend preference from the competition brief: React / Next.js. Responsive web app.

## This project (verified 2026-11-21)

This repo is a standalone sandbox for the mascot, separate from the team app.

- Next.js 16.4 with the App Router, no `src/` folder, Turbopack. Next generated `AGENTS.md`: read the bundled docs in `node_modules/next/dist/docs/` before writing Next.js code.
- React 19.3, TypeScript 5.9 (strict), package manager **npm**.
- Tailwind CSS 4.3, wired through the `@tailwindcss/turbopack` loader in `next.config.ts` (there is no PostCSS config). Global stylesheet: `app/globals.css`.
- Installed for the mascot: `motion` 14, `flubber` 0.4.2 (+ `@types/flubber`; no release since 2022, but it works); dev: `playwright` 1.65 with Chromium downloaded, `pixelmatch` 8 (ESM only, ships its own types), `pngjs` 7 (+ `@types/pngjs`), `tsx` 4 to run TypeScript scripts.

## Libraries

| Library | Purpose | Phase |
|---|---|---|
| React + Next.js (App Router) | app framework | 1 |
| Tailwind CSS v4 | color tokens, sizing, layout of the preview page | 1 |
| `motion` (Motion for React, formerly Framer Motion) | animations, springs, idle float | 1 (optional), 2 |
| `flubber` | interpolating between different SVG body paths (shape morphing) | 2 only |
| `pixelmatch` + `pngjs` (dev only) | pixel diff of screenshot vs reference | 1 |
| Playwright (dev only) | rendering the preview page and the reference JPEG, taking screenshots | 1 |

Do not add other animation libraries (GSAP, Lottie, Rive, react-spring) without a written reason in the report.

### Motion for React: essentials

- Install: `npm install motion`. Import from `"motion/react"`, e.g. `import { motion } from "motion/react"`.
- Supports React 18 and 19 (this project: 19.3).
- Next.js App Router: files using Motion components must be client components (`"use client"` at the top). Alternative from the Motion docs: `import * as motion from "motion/react-client"` lets a server component use `motion.*` elements and ships less JS.
- Every SVG element has a motion counterpart: `motion.svg`, `motion.g`, `motion.path`, `motion.circle`, `motion.ellipse`.
- Respect reduced motion with the `useReducedMotion()` hook (check the current docs for the exact API before using it).
- Motion offers an official AI Kit for coding agents (`npx motion-ai`) with a `/motion` skill and docs MCP. Best practices and docs search are free. On this machine the skill is installed (`~/.claude/skills/motion`) and the `motion` docs MCP is connected.

### Tailwind v4 tokens

Tailwind v4 is configured in CSS with `@theme`. Every `--color-*` variable becomes utilities (`fill-*`, `stroke-*`, `bg-*`) and is also available as a normal CSS variable.

Add to the global stylesheet `app/globals.css` as a separate plain `@theme` block (the file already has a `@theme inline` block from the Next template; `inline` is only needed when a token points at another CSS variable, and ours are literal values):

```css
@theme {
  /* Bąbelek mascot: values measured from design/mascot/base.jpg */
  --color-babelek-fill: #A3DAB3;
  --color-babelek-rim: #338C5C;      /* rim and arms */
  --color-babelek-ink: #1E3D5C;      /* pupils, mouth */
  --color-babelek-shine: #FFFFFF;    /* highlights, eye whites, catchlights */
  --color-babelek-shadow: #D1D1D1;   /* ground shadow */
}
```

In the SVG use either utilities (`className="fill-babelek-fill"`) or variables (`fill="var(--color-babelek-fill)"`). Pick one style and use it consistently. (Tailwind v4 is verified for this project, so no `tailwind.config` is needed.)

## Suggested file structure

```
components/mascot/
  Babelek.tsx          // public component
  parts.tsx            // small presentational parts: Body, Rim, Highlights, Eyes, Mouth, Arms, Shadow
  geometry.ts          // all numbers: viewBox, centers, radii, path data, with comments
  types.ts             // props and (later) state names
app/mascot/page.tsx    // preview page
design/mascot/
  base.jpg             // reference (2048 × 2048 JPEG)
  REPORT.md            // visual diff results and known differences
  diff/                // current.png and diff.png, written by the diff script
scripts/
  mascot-diff.ts       // screenshot + pixel diff (see 03-visual-verification.md), run with tsx
```

Keep all magic numbers in `geometry.ts`, grouped by part, each with a short comment (`// right arm: drop hanging from body edge at y≈1020`).

## Component API (phase 1)

```tsx
type BabelekProps = {
  size?: number | string;     // width; height follows the viewBox ratio
  className?: string;
  title?: string;             // accessible name; if omitted, render aria-hidden
  float?: boolean;            // subtle idle float, default false
};
```

- Root: `<svg viewBox=... role="img" aria-label={title}>` or `aria-hidden="true"` when no title.
- No external image, no `<foreignObject>`, no filters.
- Server rendering must work: if Motion is used, isolate it in a client component.

## Prepare for phase 2 (do not implement yet)

Structure the code so states can be added later without a rewrite:
- Each animatable part is its own `<g>` with a stable `id` and a transform origin that makes sense (e.g. arm pivot at its base, eye center for blinking).
- Body outline stored as one path string in `geometry.ts`, so later states can provide alternative body paths to morph between (Motion + flubber).
- Face parts positioned relative to the body center, not absolute, where practical.
