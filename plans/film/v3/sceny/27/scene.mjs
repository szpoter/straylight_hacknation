// 27 · Wspólny urlop w szkicu Marty (52–54 s, film frames 1560–1619).
// One gesture: the date range slides from the quote card into the "Okres urlopu" field while the
// card opens into Marta's draft sheet. Pure function of f (0–59); geometry documented in SPEC.md.

// Measured eases copied from Motionmaxxing runtime/motion.js @8c8ec0f (math only).
const expoOut = k => { const d = 1 - Math.exp(-k); return t => (1 - Math.exp(-k * t)) / d; };
const powerOut = p => t => 1 - Math.pow(1 - t, p);
const smoothP = p => t => { const a = Math.pow(t, p), b = Math.pow(1 - t, p); return a / (a + b); };
const guard = f => t => (t <= 0 ? 0 : t >= 1 ? 1 : f(t));
const softLand = guard(expoOut(3.41));
const glide = guard(powerOut(1.7));
const softInOut = guard(smoothP(1.42));
const cruise = guard(t => t);

const span = (f, a, b) => Math.max(0, Math.min(1, (f - a) / (b - a)));
const mix = (a, b, t) => a + (b - a) * t;
const r1 = v => Math.round(v * 100) / 100;

// Design tokens (DESIGN.md).
const ink = '#283754';
const muted = '#5E697F';
const green = '#1A8648';
const mint = '#A6D0B8';
const surface = '#F5FAF7';
const outline = '#D4D7DD';

// Strings from app/src/features/chat/case-data.ts and draft-form.tsx.
const TITLE = 'Wniosek o urlop rodzicielski';
const BADGE = 'Szkic';
const CHOICE_LABEL = 'Sposób korzystania z urlopu';
const CHOICE = 'Razem z Pawłem';
const PERIOD_LABEL = 'Okres urlopu';
const PERIOD = '11 stycznia – 7 lutego 2027';

// Domine ink metrics for PERIOD (measured in Chrome, per px of font size).
const ASC = 0.781, DESC = 0.190, WIDTH = 752.3 / 62, INK_LEFT = 2.8 / 62;
// Inter 500 26 px label metrics.
const L_ASC = 19.2, L_DESC = 5.3, L_WIDTH = 160.3, LABEL_GAP = 20;

const FIELD = { x0: 188, y0: 386, x1: 1092, y1: 542 };

function check(cx, cy, r) {
  const s = r / 18;
  return `<g transform="translate(${r1(cx)} ${r1(cy)}) scale(${r1(s)})">
      <circle r="18" fill="${surface}" stroke="${green}" stroke-width="2.5"/>
      <path d="M-9 0l6 6 12-14" fill="none" stroke="${green}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

export function scene(f) {
  // Paper: quote card (26/59) → draft sheet (28/0).
  const pp = softLand(span(f, 18, 34));
  const px0 = mix(150, 105, pp), py0 = mix(182, -12, pp), px1 = mix(1130, 1175, pp), py1 = mix(552, 772, pp);
  const prx = mix(35, 18, pp);

  // Dates: one text object, every frame.
  const dp = glide(span(f, 18, 40));
  const size = mix(62, 52, dp);
  const s = size / 62;
  const dx = mix(225, 216, dp), dy = mix(413, 500, dp);
  const inkL = dx + INK_LEFT * size, inkR = dx + WIDTH * size;
  const inkT = dy - ASC * size, inkB = dy + DESC * size;

  // Mint rule: taken over from 26, grows under "11 stycznia", rides with the dates, folds into the field bar.
  const grow = mix(273, 308, softLand(span(f, 2, 8)));
  const fold = softInOut(span(f, 26, 36));
  const ruleW = grow * s * (1 - fold);
  const ruleX = dx + 2 * s, ruleY = dy + 16 * s, ruleH = 7 * s;

  // Label lane: bottom of label ink stays LABEL_GAP px above the top of the dates.
  const labelOn = cruise(span(f, 24, 32));
  const ly = inkT - LABEL_GAP - L_DESC;
  const lT = ly - L_ASC;

  // Field: starts hugging dates + label (+rule), grows to its final box; always contains them.
  const fieldOn = cruise(span(f, 24, 27));
  const fh = glide(span(f, 24, 38)), fv = softLand(span(f, 24, 38));
  const pad = 10;
  const hug = {
    x0: Math.min(inkL, dx) - pad, x1: Math.max(inkR, dx + L_WIDTH) + pad,
    y0: lT - pad, y1: Math.max(inkB, ruleW > 0.5 ? ruleY + ruleH : 0) + pad,
  };
  const fx0 = Math.min(hug.x0, mix(hug.x0, FIELD.x0, fh));
  const fx1 = Math.max(hug.x1, mix(hug.x1, FIELD.x1, fh));
  const fy0 = Math.min(hug.y0, mix(hug.y0, FIELD.y0, fv));
  const fy1 = Math.max(hug.y1, mix(hug.y1, FIELD.y1, fv));
  const strokeOn = cruise(span(f, 37, 40));
  const bar = softLand(span(f, 36, 40));

  // Choice block rides with the dates.
  const cLabelX = mix(225, 188, dp), cLabelY = mix(262, 244, dp), cLabelSize = mix(26, 24, dp);
  const ccx = mix(245, 206, dp), ccy = mix(314, 291, dp), cr = mix(18, 17, dp);
  const cTextX = mix(281, 236, dp), cTextY = mix(330, 304, dp), cTextSize = mix(44, 38, dp);

  // Header assembles in reading order.
  const enter = (a, b) => ({ o: softInOut(span(f, a, a + 8)), y: 12 * (1 - softLand(span(f, a, b))) });
  // Header geometry is shared with scene 28 frame 0 (sheet top −12, title baseline 101, pill y 56, divider y 151).
  const title = enter(24, 36), badge = enter(27, 37);
  const divider = softLand(span(f, 29, 40));

  return `
    <rect width="1280" height="720" fill="${surface}"/>
    <rect x="${r1(px0)}" y="${r1(py0)}" width="${r1(px1 - px0)}" height="${r1(py1 - py0)}" rx="${r1(prx)}" fill="#FFFFFF" stroke="${outline}" stroke-width="2"/>
    <g font-family="Inter, sans-serif">
      <g opacity="${r1(title.o)}" transform="translate(0 ${r1(title.y)})">
        <text x="188" y="101" font-family="Domine, Georgia, serif" font-size="52" letter-spacing="-1.2" fill="${ink}">${TITLE}</text>
      </g>
      <g opacity="${r1(badge.o)}" transform="translate(0 ${r1(badge.y)})">
        <rect x="963" y="56" width="119" height="53" rx="26.5" fill="${surface}" stroke="${outline}" stroke-width="2"/>
        <text x="1022.5" y="92" text-anchor="middle" font-size="26" fill="${muted}">${BADGE}</text>
      </g>
      ${divider > 0 ? `<path d="M188 151H${r1(mix(188, 1092, divider))}" stroke="${outline}" stroke-width="2"/>` : ''}
      <text x="${r1(cLabelX)}" y="${r1(cLabelY)}" font-size="${r1(cLabelSize)}" fill="${muted}">${CHOICE_LABEL}</text>
      ${check(ccx, ccy, cr)}
      <text x="${r1(cTextX)}" y="${r1(cTextY)}" font-size="${r1(cTextSize)}" font-weight="600" fill="${ink}">${CHOICE}</text>
      ${fieldOn > 0 ? `<rect x="${r1(fx0)}" y="${r1(fy0)}" width="${r1(fx1 - fx0)}" height="${r1(fy1 - fy0)}" rx="14" fill="${surface}" opacity="${r1(fieldOn)}"/>` : ''}
      ${strokeOn > 0 ? `<rect x="${r1(fx0)}" y="${r1(fy0)}" width="${r1(fx1 - fx0)}" height="${r1(fy1 - fy0)}" rx="14" fill="none" stroke="${outline}" stroke-width="2" opacity="${r1(strokeOn)}"/>` : ''}
      ${bar > 0 ? `<path d="M190.5 ${r1(464 - 50 * bar)}V${r1(464 + 50 * bar)}" stroke="${green}" stroke-width="5" stroke-linecap="round"/>` : ''}
      ${labelOn > 0 ? `<text x="${r1(dx)}" y="${r1(ly)}" font-size="26" font-weight="500" fill="${muted}" opacity="${r1(labelOn)}">${PERIOD_LABEL}</text>` : ''}
      ${ruleW > 0.5 ? `<rect x="${r1(ruleX)}" y="${r1(ruleY)}" width="${r1(ruleW)}" height="${r1(ruleH)}" rx="${r1(ruleH / 2)}" fill="${mint}" opacity="${r1(1 - fold)}"/>` : ''}
      <text x="${r1(dx)}" y="${r1(dy)}" font-family="Domine, Georgia, serif" font-size="${r1(size)}" letter-spacing="${r1(-0.0145 * size)}" fill="${ink}">${PERIOD}</text>
    </g>`;
}
