import { scene as draft } from '../29/scene.mjs';

const forms = [
  { start: 3, lines: ['Zgłoszenie urodzenia dziecka'], field: 'Placówka lub miejsce porodu', angle: -5 },
  { start: 10, lines: ['Wniosek o udzielenie', 'urlopu ojcowskiego'], field: 'Imię i nazwisko ojca', angle: 5 },
];

function ease(f, start, end) {
  const t = Math.max(0, Math.min(1, (f - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function form(f, { start, lines, field, angle }) {
  if (f < start) return '';
  const distance = 1 - ease(f, start, start + 26);
  const y = 345 + 627 * distance;
  const scale = .12 + .42 * (1 - ease(f, 26, 36)) + .8 * distance;
  return `<g transform="translate(640 ${y}) rotate(${angle * distance}) scale(${scale})">
    <rect x="-350" y="-156" width="700" height="312" rx="12" fill="white" stroke="#BBCBC2" stroke-width="3"/>
    <path d="M-306 -118h58" stroke="#1A8648" stroke-width="6" stroke-linecap="round"/>
    <g font-family="Domine,serif" font-size="42" fill="#283754">
      ${lines.map((line, i) => `<text x="-306" y="${-52 + i * 47}">${line}</text>`).join('')}
    </g>
    <text x="-306" y="58" font-family="Inter,sans-serif" font-size="25" fill="#5E697F">${field}</text>
    <rect x="-306" y="75" width="608" height="40" rx="5" fill="#F5FAF7" stroke="#D4D7DD" stroke-width="2"/>
  </g>`;
}

export function scene(f, k) {
  if (f === 0) return draft(59, k);
  const scale = 1 - .66 * ease(f, 0, 25) - .26 * ease(f, 25, 35);
  const stack = f < 36 ? `<g transform="translate(640 360) scale(${scale}) translate(-640 -360)">${draft(59, k)}</g>
    ${forms.map(sheet => form(f, sheet)).join('')}` : '';
  const rise = ease(f, 23, 36);
  const settle = ease(f, 36, 56);
  const mascot = f > 23 ? k.zusik(640, 918 - 566 * rise + 8 * settle, 315, -.34 * (1 - settle)) : '';
  return `<rect width="1280" height="720" fill="#F5FAF7"/>${stack}${mascot}`;
}
