# 01: Design spec for Bąbelek (base pose)

## 1. Style principles (Duolingo shape language)

The mascot follows the flat geometric approach Duolingo uses for its characters. Key rules collected from Duolingo's design blog and guidelines:

- **Few shapes.** Duolingo's guidelines show about 15 shapes as the sweet spot: 6 is too abstract, 30 is too many. Our bubble should land around 10 to 15 shapes.
- **Rounded, not pointed.** Every corner and tip is rounded.
- **Shape repetition.** Reuse the same shape family (circles, pills, soft drops) across the character for a cohesive look.
- **Geometric eyes.** Duolingo uses a few fixed eye styles, always geometric. No free hand ovals. Pupils are never perfectly centered in the eye, because centered pupils look creepy.
- **Flat color, flat shading.** Solid fills; volume is suggested by separate flat highlight shapes, not gradients or textures.
- **Strong silhouette.** The character must read at a glance and at icon size.

Note: Duolingo characters usually have no outlines. Our reference **does** have a thick darker rim, because it is what makes it read as a soap bubble. The reference wins: keep the rim.

## 2. Anatomy of the base pose

Back to front (SVG paint order):

1. **Ground shadow**: flat light grey ellipse below the body, with a clear gap (the bubble levitates).
2. **Arms**: two solid drop/pill shapes in the rim color, hanging down from the lower sides of the body, slightly outward. Their base merges seamlessly into the rim (no visible joint, no seam line). Rounded tips. No fingers.
3. **Body fill**: one soft egg shape, almost a circle, very slightly taller than wide, fuller in the lower half. It leans a little: the bottom point sits left of the centre line. **This unevenness is intentional:** Bąbelek is fluid, like a drop floating in water, so the body is never perfectly symmetric. Reproduce the lean roughly as in the reference; do not straighten it.
4. **Rim**: thick stroke in a darker, muted green around the whole body. Uniform thickness.
5. **Main highlight**: a white curved crescent (a thick arc with rounded ends) on the upper left, following the body curve.
6. **Small highlights**: three white dots. A slightly oval one on the left side below the crescent, two smaller round ones on the lower right.
7. **Eyes**: two white eye shapes: circles cut off at the bottom by a soft curve that is almost flat on the outer side and dips toward the nose. The face sits slightly right of the body's centre (it looks a little to the right).
8. **Pupils**: big dark navy, nearly round shapes, nudged toward the nose and clipped by the bottom cut of the eyes, so they read as sitting low. Each has one white catchlight circle in its **upper left**, overlapping the pupil edge (the light comes from the upper left, like the crescent highlight).
9. **Mouth**: a short, gently curved navy line (closed calm smile) with rounded caps, centered below the eyes.

## 3. Measured values from `design/mascot/base.jpg`

Measured with a script from the reference (**2048 × 2048 px JPEG**, sRGB, no embedded color profile) on 2026-11-21. Values are approximate (±3 px) because the reference is an AI-generated raster with anti-aliasing and JPEG noise. (An earlier version of this file used a 1046 × 944 crop of the same image; all numbers below are for the 2048 × 2048 file.)

SVG `viewBox` during matching: `0 0 2048 2048`, so coordinates map 1:1 onto the reference. The character only fills the middle of the canvas (x 340 to 1707, y 335 to 1684); crop or normalize the viewBox later.

### Colors (median of a clean patch inside each region)

| Part | Measured | Notes |
|---|---|---|
| Body fill | `#A3DAB3` | light mint green |
| Rim and arms | `#338C5C` | muted dark green; arms are the same color as the rim |
| Pupils and mouth | `#1E3D5C` | dark navy |
| Highlights, eye whites, catchlights | `#FFFFFF` | |
| Ground shadow | `#D1D1D1` | flat grey |
| Background | `#FFFFFF` | |

**Decided (2026-11-21): keep the reference colors.** The official ZUS palette the team uses is green `#00993F`, navy `#00416E`, blue `#3F84D2`, yellow `#FFB34F`, grey `#BEC3CE`. The reference rim (`#338C5C`) and pupils (`#1E3D5C`) are close to, but not the same as, ZUS green and navy; the team chose to keep the reference values. Every color is a token, so switching later is still a one-line change.

### Body

| Measure | Value |
|---|---|
| Outer bounding box (rim outer edge, arms excluded) | x 438 to 1609, y 335 to 1531 |
| Outer width / height | 1172 / 1197 (height ≈ 1.02 × width) |
| Widest row | y ≈ 1000, from x 438 to 1609 (centre x 1023.5). That is ≈ 67 px below the box centre (y 933), so the lower half is fuller. The arms join right below this row. |
| Top / bottom point | top ≈ (1014, 335), bottom ≈ (974, 1531) |
| Lean | not mirror-symmetric: the silhouette midpoint is x ≈ 1014 near the top, 1023.5 at the widest row and ≈ 974 at the bottom. The bottom of the egg sits ≈ 50 px left of the centre line. Intentional (the body is fluid, see §2.3). |
| Rim thickness | 64 px, uniform all the way round (measured every 30°; ≈ 5.5 % of body width) |

Outer silhouette (rim outer edge) at sample heights, to check the egg shape:

| y | left x | right x | width |
|---|---|---|---|
| 360 | 858 | 1171 | 314 |
| 400 | 768 | 1261 | 494 |
| 450 | 693 | 1337 | 645 |
| 500 | 637 | 1395 | 759 |
| 600 | 555 | 1481 | 927 |
| 700 | 500 | 1542 | 1043 |
| 800 | 464 | 1581 | 1118 |
| 900 | 444 | 1602 | 1159 |
| 1000 | 438 | 1609 | 1172 |
| 1250 | 496 | 1523 | 1028 |
| 1300 | 523 | 1484 | 962 |
| 1350 | 559 | 1435 | 877 |
| 1400 | 606 | 1374 | 769 |
| 1450 | 672 | 1294 | 623 |
| 1500 | 776 | 1175 | 400 |

(Rows ≈ 1020 to 1240 are skipped because the arms join there.)

### Highlights

| Part | Measured |
|---|---|
| Crescent highlight | bbox x 630 to 1011, y 460 to 756. A thick arc (≈ 76 px) with round caps, roughly concentric with the body (centre ≈ (1023, 933)): inner edge at r ≈ 381 to 404, outer edge at r ≈ 456 to 478, i.e. ≈ 50 to 60 px inside the rim's inner edge, following its curve. Cap centres ≈ (666, 718) lower left and ≈ (973, 492) upper right. |
| Left dot | slightly tall oval, centre (616, 853), 74 × 85 |
| Right dot, upper | circle, centre (1427, 1106), d ≈ 48 |
| Right dot, lower | circle, centre (1298, 1262), d ≈ 64 |

### Face

The face centre line is x ≈ 1047.5 (midway between the eyes, and the centre of the mouth), ≈ 24 px right of the body's centre line.

| Part | Measured |
|---|---|
| Left eye white | circle r ≈ 136, centre (888, 844), cut off at the bottom (visible bbox x 753 to 1023, y 708 to 932) |
| Right eye white | circle r ≈ 136, centre (1207, 843), cut off at the bottom (visible bbox x 1072 to 1342, y 706 to 929) |
| Bottom cut of the eyes | a soft curve, not a straight line: almost flat at y ≈ 876 on the outer third, then descending toward the nose to y ≈ 928 at the inner corner. Left eye (x → y): 758 → 877, 838 → 880, 878 → 888, 918 → 902, 958 → 918, 978 → 928. Right eye, mirrored: 1337 → 874, 1257 → 878, 1217 → 886, 1177 → 900, 1137 → 919, 1117 → 926. |
| Left pupil | nearly round (rx ≈ 76, ry ≈ 82), centre (926, 849); the bottom is clipped by the eye cut (visible bbox x 851 to 1002, y 767 to 922) |
| Right pupil | nearly round (rx ≈ 77, ry ≈ 81), centre (1188, 847) (visible bbox x 1112 to 1265, y 766 to 915) |
| Pupil offset from the eye-circle centre | left (+38, +5), right (−19, +4): both nudged toward the nose, the left one more. Vertically they sit at the eye-circle centre, but because the eye is cut off at the bottom they read as sitting low and touch the cut. |
| Catchlights | white circles, d ≈ 50, centre = pupil centre + (−48, −50): left ≈ (878, 799), right ≈ (1141, 796). They overlap the pupil's upper-left edge, so they merge with the eye white there. |
| Mouth | navy stroke ≈ 27 px with round caps; bbox x 956 to 1139, y 986 to 1040. Centreline from ≈ (970, 1000) through ≈ (1047, 1028) to ≈ (1125, 1000), a shallow symmetric curve. |

### Arms

Solid rim-colored drops growing out of the lower sides of the body. They are mirror images of each other around x ≈ 1023.5 (the centre of the widest body row), not around the leaning bottom point.

| Arm | Measured |
|---|---|
| Left | outer edge leaves the body silhouette at y ≈ 1020; a white notch between arm and body opens at y ≈ 1210; outermost point x 340 at y ≈ 1260; round tip, lowest point ≈ (402, 1330). The free part is ≈ 133 px wide at y 1240. |
| Right | same shape, mirrored: leaves the body at y ≈ 1020; the notch opens at y ≈ 1195; outermost point x 1707 at y ≈ 1260; tip ≈ (1645, 1326). |

Outer edge by height:

| y | 1040 | 1080 | 1120 | 1160 | 1200 | 1240 | 1280 | 1300 | 1320 |
|---|---|---|---|---|---|---|---|---|---|
| left arm x | 430 | 408 | 383 | 363 | 349 | 342 | 341 | 349 | 368 |
| right arm x | 1618 | 1642 | 1666 | 1686 | 1698 | 1706 | 1705 | 1696 | 1673 |

Inner edge of the free part (the arm side of the notch):

| y | 1220 | 1240 | 1260 | 1280 | 1300 | 1320 |
|---|---|---|---|---|---|---|
| left arm x | 479 | 474 | 470 | 467 | 458 | 438 |
| right arm x | 1569 | 1575 | 1577 | 1581 | 1592 | 1616 |

### Ground shadow

Ellipse centre ≈ (1024, 1640), rx ≈ 337, ry ≈ 44 (bbox x 688 to 1361, y 1597 to 1684). Gap between body bottom (y 1531) and shadow top (y 1597) ≈ 65 px. The shadow is centred on the body's centre line (x ≈ 1024), not under the leaning bottom point.

## 4. Do and don't

Do:
- Build the body as one closed path (or ellipse plus small adjustment) and draw the rim as a stroke or as a slightly larger shape behind the fill, whichever matches the reference better. Keep rim thickness uniform.
- Make arms one path each that overlaps the rim so the join is invisible.
- Keep every part a separate, named element (`<g id="eye-left">` etc.) so phase 2 can animate parts independently.

Don't:
- Add eyebrows, blush, hair, outlines on the face, gradients, filters, drop shadows or textures.
- Center the pupils.
- Change the expression, pose or proportions "to look better". In particular, do not make the body symmetric: its lean is part of the fluid look.
- Use the other images in `design/mascot/` as a source of details for the base pose.
