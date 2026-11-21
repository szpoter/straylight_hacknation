# Bąbelek: phase 1 report

Date: 2026-11-21. Reference: `design/mascot/base.jpg` (2048 × 2048 JPEG).

## Result

Run with `npm run mascot:diff` (uses a dev server on `MASCOT_URL` or :3000, otherwise starts a temporary one).

| Measure | Value |
|---|---|
| Mismatched pixels (pixelmatch, threshold 0.1) | 4 825 |
| … of the whole image | 0.12 % |
| … of the character area (1 106 871 px) | **0.44 %** (target: below 5 %) |

Images: [`diff/current.png`](diff/current.png) (the component rendered 1:1) and [`diff/diff.png`](diff/diff.png) (red = mismatch).
Almost all remaining red pixels are 1 px lines along edges, where the browser's anti-aliasing differs from the soft edges and JPEG noise of the AI-generated reference.

## Checklist (docs/mascot/03-visual-verification.md)

- [x] Silhouette within 1 % of body width, lean included: the body path fits the measured rim edges with p95 error 0.5 px (0.04 % of the body width).
- [x] Rim 64.5 px (measured 64), uniform: it is one stroke on the body path.
- [x] Arms: position, size, outward bulge and seamless join (each arm fits its measured edge with p95 0.35 px).
- [x] Ground shadow: size, position and gap (fit error rms 0.25 px).
- [x] Crescent and three dots: positions and sizes (fit error rms ≤ 0.4 px).
- [x] Eyes: bottom cut curving down toward the nose, pupils nudged toward the nose and clipped by the cut, catchlights in the upper left.
- [x] Mouth: width, curve and thickness (fit error rms 0.1 px).
- [x] Colors: the tokens are the measured reference colors.
- [x] Mismatch within the character area below 5 % (0.44 %).
- [x] Readable at 48 px: eyes, pupils, arms and highlights are clear. The mouth is visible but faint on 1× screens (its stroke is below 1 px there) and clear on 2× screens.

## How the geometry was made

Edges were measured in the reference with sub-pixel precision, separately for each color pair that meets there (rim/background, rim/fill, white/fill, navy/fill, navy/white, shadow/background). Clean primitives were then fitted to them by least squares, using a one-off Python script (numpy + scipy) that is not part of the repo. Its results, with the meaning of every number, live in `components/mascot/geometry.ts` and `docs/mascot/01-design-spec.md`. No auto-tracing: the whole mascot is 5 Bézier anchors for the body, 4 segments per arm, two strokes (crescent, mouth), two lid curves, and circles and ellipses.

## Known differences and why they remain

1. **Edge anti-aliasing**: 1 px lines along every edge (see above). Not fixable by geometry.
2. **Mouth ends**: the reference ends in very slightly thicker, ball-like caps (≈ 2 px at 2048 px). We use one uniform round-capped stroke: simpler, and it can be animated as a single line.
3. **Arm junction**: the reference has a tiny corner (≈ 2 px) where each arm leaves the body; ours leaves the body tangentially.
4. **Right eye, inner corner**: the cubic lid curve is up to ≈ 3 px off in the last few pixels at the inner corner.
5. **Pupils and the left dot** are drawn as ellipses without rotation. A slightly rotated ellipse fits ≤ 1.7 px better, which is invisible below ~1000 px and not worth the extra transform.
6. **Color noise**: the reference has JPEG noise and faint shading inside flat areas; the mascot uses flat token colors.

## Decisions made during phase 1 (please confirm)

- **Idle float** was first done in CSS `@keyframes`. Superseded in phase 2: the `float` prop became `animated`, and the float now runs in Motion together with the rest of the idle life (`components/mascot/AnimatedSvg.tsx`), so it can blend into future states.
- **`data-part` instead of `id`** on the named parts: the preview page renders several mascots, and ids must be unique per page.
- **Extra prop `frame`** (`"tight"` default, `"reference"`): the tight square crop is for use in the app; the reference frame keeps the full 2048 × 2048 canvas for the side-by-side and the diff.
- **Eye cut as a body-colored "lid" shape** instead of a `clipPath`: no ids needed, and in phase 2 the lids can rise for blinking or a happy squint.
- **Each arm has its own path** instead of mirroring one: the arms are near mirror images, but the leaning body meets them at different heights.

## Colors

- **Decided: keep the reference colors** (rim `#338C5C`, ink `#1E3D5C`) rather than the exact ZUS palette (green `#00993F`, navy `#00416E`). Switching later is a one-line change per token in `app/globals.css`.

## Ready for phase 2

- Every part is its own element with a `data-part` name: `shadow`, `arm-left`, `arm-right`, `body`, `rim`, `highlight`, `dot-*`, `eye-left`, `eye-right` (each with an `eyeball` group of `eye-white`, `pupil`, `catchlight`, plus the `lid`), `mouth`.
- The body is one path with 5 anchors (shared by fill and rim), ready for morphing between body shapes.
- Eyes and mouth are positioned relative to `FACE_ORIGIN`, which is placed relative to `BODY_CENTER`.
- Natural pivots: arms at their start on the body edge (≈ (440, 990) and (1608, 986)), eyes at their eye-white centres.
