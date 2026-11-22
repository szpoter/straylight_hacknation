// Scene 28 · "Odpis Oli trafia do szkicu" (54–56 s, global frames 1620–1679).
// One instance of the file row travels from "Pliki dziecka" to the "Załącznik" field and lands exactly on local frame 42
// (mix thud at 55.400 s = global 1662). Pure function of f; returns SVG content for a 1280×720 viewBox.

const INK = '#283754';
const MUTED = '#5E697F';
const GREEN = '#1A8648';
const OUTLINE = '#D4D7DD';
const MINT = '#F5FAF7';

const ROW = { w: 446, h: 108 };
const FROM = { x: 140, y: 436 };
const TO = { x: 676, y: 436 };
const HEAD_Y = 378; // baseline of "Pliki dziecka" / "Załącznik" (58 px above the rows, as in the brief)
const LIFT = 22; // px raised before travel
const ARC = 17; // extra px at mid-travel (max 39 above rest)
const CHECK = { x: 893, y: 365 };

const clamp = (t) => Math.min(1, Math.max(0, t));
const progress = (f, a, b) => clamp((f - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
// Motionmaxxing softLand, fitted to the plotted curve (0.30 / 0.59 / 0.85 at 10 / 25 / 50 % of time).
const K = 3.4;
const softLand = (t) => (1 - Math.exp(-K * t)) / (1 - Math.exp(-K));
const r = (v) => Math.round(v * 100) / 100;

export function pose(f) {
  const lift = smooth(progress(f, 10, 17));
  const s = softLand(smooth(progress(f, 17, 36)));
  const drop = softLand(progress(f, 36, 42));
  const arc = 4 * s * (1 - s);
  const x = f >= 42 ? TO.x : FROM.x + (TO.x - FROM.x) * s;
  const y = f >= 42 ? TO.y : FROM.y - LIFT * lift - ARC * arc + LIFT * drop;
  const raised = clamp((FROM.y - y) / LIFT); // 0 at rest, 1 at full lift (shadow strength)
  return { x, y, raised, landed: f >= 42, check: progress(f, 42, 48) };
}

// FileIcon from app/src/components/ui/icons.tsx (24 px grid, stroke 1.75) at 44 px.
function fileIcon() {
  return `<g transform="translate(22 32) scale(${44 / 24})" fill="none" stroke="${MUTED}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>
    </g>`;
}

function fileRow(p) {
  const shadow = p.raised > 0.01
    ? `<defs><filter id="s28-cien" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="9"/></filter></defs>
       <rect x="10" y="${r(10 + 14 * p.raised)}" width="${ROW.w - 20}" height="${ROW.h - 6}" rx="14" fill="${INK}" opacity="${r(0.16 * p.raised)}" filter="url(#s28-cien)"/>`
    : '';
  return `<g data-file="odpis-aktu-urodzenia-oli" transform="translate(${r(p.x)} ${r(p.y)})">
      ${shadow}
      <rect width="${ROW.w}" height="${ROW.h}" rx="14" fill="#FFFFFF" stroke="${p.landed ? GREEN : OUTLINE}" stroke-width="2.5"/>
      ${fileIcon()}
      <text x="84" y="65" font-size="30" font-weight="500" letter-spacing="-0.45" fill="${INK}">Odpis aktu urodzenia Oli</text>
    </g>`;
}

function checkMark(c) {
  if (c <= 0) return '';
  return `<g data-confirmation="attached" transform="translate(${CHECK.x} ${CHECK.y})" opacity="${r(Math.min(1, c * 2))}">
      <circle r="17" fill="${GREEN}"/>
      <path d="M-8 0l5 5 11-12" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${r(1 - c)}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`;
}

// The "Okres urlopu" field from scene 27/59 (188–1092 × 386–542), compressed and lifted under the divider.
// Same surface, outline, green bar and Domine 52 px dates, so the cut reads as the sheet moving up, not the dates vanishing.
const PERIOD = { x0: 188, y0: 172, x1: 1092, y1: 304, dateX: 216, dateY: 282, labelY: 213 };
function periodField() {
  const P = PERIOD;
  return `<g data-field="okres-urlopu">
      <rect x="${P.x0}" y="${P.y0}" width="${P.x1 - P.x0}" height="${P.y1 - P.y0}" rx="14" fill="${MINT}" stroke="${OUTLINE}" stroke-width="2"/>
      <path d="M190.5 ${P.y0 + 22}V${P.y1 - 22}" stroke="${GREEN}" stroke-width="5" stroke-linecap="round"/>
      <text x="${P.dateX}" y="${P.labelY}" font-size="26" font-weight="500" fill="${MUTED}">Okres urlopu</text>
      <g transform="translate(${P.dateX + 196} ${P.labelY - 9})">
        <circle r="14" fill="${MINT}" stroke="${GREEN}" stroke-width="2.2"/>
        <path d="M-7 0l4.7 4.7 9.4-11" fill="none" stroke="${GREEN}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="${P.dateX + 222}" y="${P.labelY}" font-size="26" font-weight="600" fill="${INK}">Razem z Pawłem</text>
      <text x="${P.dateX}" y="${P.dateY}" font-family="Domine, Georgia, serif" font-size="52" letter-spacing="-0.75" fill="${INK}">11 stycznia – 7 lutego 2027</text>
    </g>`;
}

export function scene(f, k) {
  const p = pose(f);
  return `
    <rect width="1280" height="720" fill="${MINT}"/>
    <rect x="105" y="-12" width="1070" height="784" rx="18" fill="#FFFFFF" stroke="${OUTLINE}" stroke-width="2"/>
    <g font-family="Inter, sans-serif" fill="${INK}">
      <text x="188" y="101" font-size="52" letter-spacing="-1.2" font-family="Domine, Georgia, serif">Wniosek o urlop rodzicielski</text>
      <rect x="963" y="56" width="119" height="53" rx="26.5" fill="${MINT}" stroke="${OUTLINE}" stroke-width="2"/>
      <text x="1022.5" y="92" text-anchor="middle" font-size="26" fill="${MUTED}">Szkic</text>
      <path d="M188 151H1092" fill="none" stroke="${OUTLINE}" stroke-width="2"/>
      ${periodField()}
      <text x="${FROM.x}" y="${HEAD_Y}" font-size="37" font-family="Domine, Georgia, serif">Pliki dziecka</text>
      <text x="${TO.x}" y="${HEAD_Y}" font-size="37" font-family="Domine, Georgia, serif">Załącznik</text>
      <rect data-slot="pliki-dziecka" x="${FROM.x}" y="${FROM.y}" width="${ROW.w}" height="${ROW.h}" rx="14" fill="${MINT}" stroke="${OUTLINE}" stroke-width="2"/>
      <rect data-slot="zalacznik" x="${TO.x}" y="${TO.y}" width="${ROW.w}" height="${ROW.h}" rx="14" fill="${MINT}" stroke="${MUTED}" stroke-width="2" stroke-dasharray="8 8"/>
      ${checkMark(p.check)}
      ${fileRow(p)}
    </g>`;
}
