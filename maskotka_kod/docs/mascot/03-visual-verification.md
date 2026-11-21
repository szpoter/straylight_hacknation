# 03: Visual verification loop

Claude Code cannot judge an SVG by reading its code. Every change to the mascot is checked visually against `design/mascot/base.jpg`.

## Tools

**Option A: Playwright MCP (interactive, recommended while iterating)**
Microsoft's Playwright MCP lets Claude Code drive a real browser: open the preview page, take screenshots and look at them.

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

Restart Claude Code afterwards, then check it is connected with `claude mcp list`. On this machine it is already configured and connected. The MCP saves screenshots and logs only inside the repo, in `.playwright-mcp/` (git-ignored).

**Option B: a script (repeatable, needed for the report)**
A small Node script using Playwright (as a library) for the screenshots and `pixelmatch` + `pngjs` for the diff. `pixelmatch` compares two equally sized images and returns the number of mismatched pixels; it can also write a diff image. Its `threshold` option (0 to 1, default 0.1) controls color sensitivity. The Playwright library needs its own browser (`npx playwright install chromium`, already done on this machine). Run the script with `tsx`.

Use A while working, B to produce numbers for `REPORT.md`.

## Making the comparison fair

1. Render the component on a pure white page at **exactly 2048 × 2048 px** with the viewBox `0 0 2048 2048` (1:1 with the reference). Device scale factor 1, a viewport of at least 2048 × 2048, no padding, no page margins, no scrollbars.
2. Screenshot only that element (Playwright element screenshot), so dimensions match the reference exactly.
3. Decode the reference in the same browser: `pngjs` reads only PNG and the reference is a JPEG, so open `design/mascot/base.jpg` as an `<img>` at its natural size (2048 × 2048, scale factor 1) and take an element screenshot of it. That gives a PNG buffer in memory, with no extra dependency and no converted copy of the reference on disk.
4. Run pixelmatch with `threshold: 0.1` and anti-aliasing detection on (the default).
5. Save `design/mascot/diff/current.png` and `design/mascot/diff/diff.png`.
6. Report the mismatch as a percentage of total pixels and also as a percentage of the character's area, since the white background inflates the first number. Count the character area as reference pixels that are not near-white (for example any channel below 245), because JPEG noise leaves faint off-white pixels in the background.

Expect some mismatch no matter what: the reference is an AI-generated raster with soft, slightly uneven edges and JPEG compression noise. The goal is matching shapes, positions and colors, not pixel-perfect noise.

## Loop

1. Build or change one part at a time (body and rim first, then arms, shadow, highlights, eyes, pupils, mouth).
2. Screenshot, run the diff, look at `diff.png` and at both images side by side.
3. Fix the biggest visible difference first (silhouette and positions before small details).
4. Repeat. Stop after roughly 10 iterations per part; if progress stalls, write down the remaining difference and move on.

## Checklist (all must pass)

- [ ] Silhouette: overlaying the two images, the body outline differs by no more than about 1 % of body width anywhere, including the slight lean (bottom point left of the centre line).
- [ ] Rim thickness matches (≈ 64 px at 1:1) and is uniform.
- [ ] Arms: same position, size, outward bulge and seamless join with the rim.
- [ ] Ground shadow: same size, position and gap.
- [ ] Crescent highlight and three dots: same positions and sizes.
- [ ] Eyes: bottom cut curving down toward the nose, same size and spacing; pupils nudged toward the nose and clipped by the cut; catchlights in the upper left, overlapping the pupil edge.
- [ ] Mouth: same width, curve and thickness.
- [ ] Colors: each region within a small distance of the measured values (or of the tokens, if the team chose ZUS colors).
- [ ] Mismatch within the character area below about 5 % (adjust if the reference's soft edges make this unrealistic, and explain why in the report).
- [ ] Readable at 48 px: eyes, mouth and arms still distinguishable.

## Report

Write `design/mascot/REPORT.md` with: date, final mismatch numbers, the diff image path, a short list of known differences and why they remain, and any open decisions (for example, reference colors vs exact ZUS colors).
