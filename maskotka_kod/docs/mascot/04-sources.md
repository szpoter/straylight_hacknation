# 04: Sources and how to research further

Check the official docs before using an API you are not certain about. Libraries change; your training data may be outdated.

## Design principles

- Duolingo: Shape language, Duolingo's art style: https://blog.duolingo.com/shape-language-duolingos-art-style/
- Duolingo: Building character (how characters share Duo's shapes): https://blog.duolingo.com/building-character/
- Duolingo: Reshaping Duo (silhouette first, details second): https://blog.duolingo.com/reshaping-duo/
- Josh W. Comeau: Squash and Stretch, interactive article on making motion feel alive (for phase 2): https://www.joshwcomeau.com/animation/squash-and-stretch/

## Motion for React

- Installation (incl. Next.js notes: `"use client"` or `motion/react-client`): https://motion.dev/docs/react-installation
- Get started: https://motion.dev/docs/react
- SVG animation guide (motion.path, motion.circle, viewBox, line drawing, morphing): https://motion.dev/docs/react-svg-animation
- Path morphing with flubber, example and source (phase 2): https://motion.dev/examples/react-path-morphing (the old `/tutorials/react-path-morphing` URL redirects here)
- Motion AI Kit for coding agents (`npx motion-ai`, /motion skill, docs MCP): https://motion.dev/docs/ai-kit

## Tailwind CSS v4

- Theme variables (`@theme`): https://tailwindcss.com/docs/theme
- Tailwind v4 release post (CSS-first config): https://tailwindcss.com/blog/tailwindcss-v4

## Visual verification

- Playwright MCP (Microsoft): https://github.com/microsoft/playwright-mcp
- Playwright screenshots and visual comparisons: https://playwright.dev/docs/screenshots and https://playwright.dev/docs/test-snapshots
- pixelmatch: https://github.com/mapbox/pixelmatch

## Inspiration: SVG characters built in code

- Codrops: Reverse-engineering Claude AI's mascot animations with SVG and GSAP (a mascot rebuilt in React + SVG purely in code): https://tympanus.net/codrops/2026/05/05/reverse-engineering-claude-ais-mascot-animations-with-svg-and-gsap/ (blocks scripted requests with 403; open it in a browser or through the Playwright MCP)

## How to research further

1. Official docs first (links above). Many doc sites offer `llms.txt` or markdown versions of pages; use them if available (for example Motion pages work with a `.md` suffix: https://motion.dev/docs/react-installation.md).
2. If the Motion AI Kit MCP is installed, use its docs search for Motion questions.
3. For a technique (e.g. drawing a crescent with rounded ends, egg-shaped Bézier curves), search for a reputable explanation or MDN (https://developer.mozilla.org/en-US/docs/Web/SVG) and test it on the preview page.
4. Note in `REPORT.md` any important decision that came from research, with the link.
