const ink = '#283754';
const muted = '#5E697F';
const green = '#1A8648';
const mint = '#A6D0B8';
const surface = '#F5FAF7';
const outline = '#D4D7DD';

function ease(frame, start, end) {
  const t = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function scene(f, k) {
  const open = ease(f, 11, 40);
  const field = ease(f, 13, 40);
  const header = ease(f, 17, 34);
  const paperX = 150 - 45 * open;
  const paperY = 182 - 126 * open;
  const paperW = 1280 - 2 * paperX;
  const paperH = 350 + 360 * open;
  const radius = 35 - 17 * open;
  const left = 225 - 37 * open;
  const choiceY = 306 + 26 * open;
  const dateX = left + 28 * open;
  const dateY = 413 + 87 * open;
  const dateSize = 62 - 12 * open;
  const fieldX = 1230 - 1042 * field;
  const fieldY = dateY - 101;
  const ruleWidth = 355 * (1 - ease(f, 17, 36));

  return `
    <defs>
      <clipPath id="paper27">
        <rect x="${paperX}" y="${paperY}" width="${paperW}" height="${paperH}" rx="${radius}"/>
      </clipPath>
    </defs>
    <rect width="1280" height="720" fill="${surface}"/>
    <rect x="${paperX}" y="${paperY}" width="${paperW}" height="${paperH}" rx="${radius}" fill="#fff" stroke="${outline}" stroke-width="2"/>
    <g clip-path="url(#paper27)" fill="${ink}" font-family="Inter, sans-serif">
      <g opacity="${header}">
        <text x="188" y="165" font-family="Domine, Georgia, serif" font-size="52" letter-spacing="-1.2">Wniosek o urlop rodzicielski</text>
        <rect x="963" y="120" width="119" height="53" rx="26.5" fill="${surface}" stroke="${outline}" stroke-width="2"/>
        <text x="1022.5" y="156" text-anchor="middle" font-size="26" fill="${muted}">Szkic</text>
        <text x="188" y="215" font-size="26" fill="${muted}">Do pracodawcy · Studio Lipa</text>
        <path d="M188 245H1092" stroke="${outline}" stroke-width="2"/>
      </g>
      <text x="${left}" y="${250 + 44 * open}" fill="${muted}" font-size="${29 - 3 * open}">Sposób korzystania z urlopu</text>
      <g transform="translate(${left} ${choiceY}) scale(${1 - 0.12 * open})">
        <circle cx="20" cy="0" r="18" fill="${surface}" stroke="${green}" stroke-width="2.5"/>
        <path d="m11 0 6 6 12-14" fill="none" stroke="${green}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="56" y="12" font-size="39" font-weight="600">Razem z Pawłem</text>
      </g>
      <g transform="translate(${fieldX} ${fieldY})">
        <rect width="904" height="139" rx="14" fill="${surface}" stroke="${outline}" stroke-width="2"/>
        <path d="M1 27v85" stroke="${green}" stroke-width="5" stroke-linecap="round"/>
        <text x="28" y="42" font-size="27" fill="${muted}">Okres urlopu</text>
      </g>
      <rect x="${dateX + 2}" y="${dateY + 16}" width="${ruleWidth}" height="7" rx="3.5" fill="${mint}"/>
      <text x="${dateX}" y="${dateY}" font-family="Domine, Georgia, serif" font-size="${dateSize}" letter-spacing="-0.9">11 stycznia – 7 lutego 2027</text>
    </g>`;
}
