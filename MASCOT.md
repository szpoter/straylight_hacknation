# Mascot "Bąbelek": main brief for Claude Code

> Paste this into the project's `CLAUDE.md` or keep it as `MASCOT.md` in the repo root and reference it from `CLAUDE.md`.
> Detailed knowledge lives in `docs/mascot/`. Read the relevant file before working on that part.

## What we are building

The ZUS hackathon app (HackNation, React/Next.js + Tailwind CSS) has a mascot: **Bąbelek**, a living soap bubble.
"Bąbelek" in Polish means both "little bubble" and is a cute word for a baby, which fits a guide for future parents.

The mascot must exist **entirely as code in this repo**: a React component rendering hand-built, geometric SVG.
Nobody on the team draws or animates by hand. No external animation editors, no image files at runtime.

## Status (2026-11-21)

- Phase 1 (the base pose below) is done: see `design/mascot/REPORT.md`.
- Phase 2 has started: the idle life (`<Babelek animated />`: float, a fluid body with random waves running along the whole outline, blinking, glancing) is done, and so is the travelling drop (`travel`, `heading`) with two demos: `/mascot/roadmap` and `/mascot/hero`. Other states (hello, success, sorry, …) and switching between them are next; agree on the list of states with the team before building them.

## Phase 1 scope

**Goal: reproduce the base pose (`design/mascot/base.jpg`) as faithfully as possible.**

In scope:
- A `<Babelek />` React component (SVG) that matches the reference base image.
- Colors exposed as Tailwind v4 theme tokens.
- A `/mascot` preview page showing the component large, next to the reference image, plus at small sizes (48px, 96px, 256px).
- A repeatable visual check (screenshot vs reference, pixel diff) and a short report of the remaining differences.

Out of scope for now (do NOT build yet):
- Other states (hello, success, sorry, etc.), state switching, morphing between body shapes.
- Animations beyond an optional, very subtle idle float that can be turned off. Default: off.

Build the component so states can be added later without a rewrite (see `docs/mascot/02-tech-stack.md`, "Prepare for phase 2").

## Files to read

| File | Read it when |
|---|---|
| `docs/mascot/01-design-spec.md` | Before drawing anything. Style rules, anatomy, measured coordinates and colors from the reference. |
| `docs/mascot/02-tech-stack.md` | Before writing the component. Libraries, file structure, Tailwind tokens, Next.js specifics. |
| `docs/mascot/03-visual-verification.md` | Before claiming it matches. How to screenshot, diff and iterate. |
| `docs/mascot/04-sources.md` | When you need docs or examples. Curated links, plus how to research further. |

Reference images live in `design/mascot/`:
- `base.jpg`: THE reference for phase 1 (2048 × 2048 JPEG; bubble floating, arms down, calm smile).
- Other images in that folder are context for later phases only. Do not copy their details into the base.

## Working rules

1. **Fidelity first.** The reference image is the source of truth. Do not "improve" the design, add details, or change proportions because a style guide suggests it. If the reference and a rule in the spec conflict, the reference wins; note the conflict in the report.
2. **Geometry, not tracing.** Rebuild the mascot from clean primitives (circles, ellipses, rounded paths with few points). Never auto-trace the reference image (potrace and similar produce hundreds of messy points that are impossible to animate later).
3. **Measure, don't guess.** The spec contains measured coordinates. If you need more, measure the reference image yourself with a small script (for example Python Pillow, which reads JPEG) instead of eyeballing.
4. **Verify visually in a loop.** Render, screenshot, compare with the reference, fix, repeat. Stop when the checklist in `03-visual-verification.md` passes, not when the code "looks right".
5. **Research when unsure.** The docs here are a starting point, not the full truth. If an API is unclear or might have changed, check the current official docs (links in `04-sources.md`) before writing code. Prefer official docs over blog posts. Do not invent APIs.
6. **Ask, don't assume,** when a decision changes the look (for example the color question in the spec). Present the options with a short explanation of each.
7. **Keep it small and clean.** The jury reviews the repository code. Typed, readable, no dead code, no huge path strings without a comment explaining what shape they are.

## Definition of done (phase 1)

- [ ] `<Babelek />` renders the base pose; looks like the reference at 256px and is still readable at 48px.
- [ ] Built from named, commented SVG parts (body, rim, highlight, dots, eyes, pupils, mouth, arms, shadow).
- [ ] All colors come from Tailwind theme tokens; no hardcoded hex in the component.
- [ ] `/mascot` preview page exists (side by side with reference, several sizes, light background).
- [ ] Visual diff script runs with one command and its result is recorded in `design/mascot/REPORT.md` (diff percentage, diff image, list of known differences).
- [ ] Accessible: `role="img"` and an `aria-label`, or `aria-hidden` when decorative (prop controlled).
- [ ] No new heavy dependencies beyond what `02-tech-stack.md` lists, unless justified in the report.
