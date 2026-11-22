// v3 · ujęcie 22 (42–44 s, klatki filmu 1260–1319) · autor bloku b19.
// Mapa Oli PRZENIESIONA z v2 (../../../v2/sceny/22/scene.mjs): ta sama trasa, podesty, kolejność spraw i jazda kamery.
// Jedyna zmiana we wspólnym rysunku 22–24: kapsuły statusu na karcie „Zgłoś urodzenie Oli” mają 30 px zamiast 22 px
// (odczyt „Do zrobienia” w podglądzie 360 px, SPEC 23 pkt 2). Zewnętrzny obrys karty 648 × 300 bez zmian.
// Dane: lib/demo/fixtures.ts (zglos-urodzenie, due 2026-12-01), lib/plan/status.ts (Odhaczone / Nic nie musisz robić / Do zrobienia).
const ink = "#283754", green = "#1A8648", sage = "#A6D0B8", quiet = "#5E697F", outline = "#D4D7DD";
export const ROUTE = "M-4 641 H344 C510 641 620 476 802 476 S1030 530 1148 530 S1435 523 1584 523 S1900 552 2220 506";
export const CARD = { x: 1260, y: 164, w: 648, h: 300 };
export const STOPS = { badania: [802, 476], z3: [1148, 530], zgloszenie: [1584, 523] };

function pedestal(x, y, kind) {
  const done = kind === "done", automatic = kind === "automatic";
  const edge = automatic ? quiet : green;
  const icon = done ? "M-13 0l8 8 18-18" : automatic ? "M10 1a10 10 0 1 1-3-8 M10-10v5H5" : "M0-12l10 4v8q0 9-10 14Q-10 9-10 0v-8Z";
  return `<g transform="translate(${x} ${y}) scale(${automatic ? .76 : 1})">
    <ellipse cy="31" rx="60" ry="15" fill="${ink}" opacity=".08"/>
    <g stroke="${edge}" stroke-width="2.5" ${automatic ? 'stroke-dasharray="6 4"' : ""}>
      <path d="M-57 0v22a57 21 0 0 0 114 0V0Z" fill="${done ? green : automatic ? "#F5FAF7" : sage}"/>
      <ellipse rx="57" ry="21" fill="${done ? sage : "white"}"/>
    </g>
    <path d="${icon}" fill="none" stroke="${done ? ink : edge}" stroke-width="${done ? 4.5 : 3}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function nearestCard(offset) {
  return `<g transform="translate(${CARD.x + offset} ${CARD.y})">
    <rect width="${CARD.w}" height="${CARD.h}" rx="18" fill="#FFF" stroke="${outline}" stroke-width="2"/>
    <text x="34" y="50" font-size="25" fill="${quiet}">Najbliższa sprawa</text>
    <text x="34" y="115" font-family="Domine,serif" font-size="48">Zgłoś urodzenie Oli</text>
    <rect x="34" y="134" width="216" height="54" rx="27" fill="#FCDCAA"/>
    <text x="142" y="171" text-anchor="middle" font-size="30" font-weight="600">Do zrobienia</text>
    <rect x="264" y="134" width="196" height="54" rx="27" fill="#F5FAF7" stroke="${outline}"/>
    <text x="362" y="171" text-anchor="middle" font-size="30">Obowiązek</text>
    <path d="M34 206h580" stroke="${outline}" stroke-width="2"/>
    <text x="34" y="258" font-size="25" fill="${quiet}">Termin</text>
    <text x="160" y="262" font-size="50" font-weight="600">1 grudnia 2026</text>
  </g>`;
}

export function drawMap(cameraX, traceX, cardOffset = 0) {
  return `<rect width="1280" height="720" fill="#F5FAF7"/>
    <g font-family="Inter,sans-serif" fill="${ink}">
      <text x="78" y="63" font-size="24" fill="${quiet}">Mój plan</text>
      <text x="76" y="126" font-size="55" font-family="Domine,serif">Narodziny</text>
      <text x="1202" y="117" font-size="23" text-anchor="end" fill="${quiet}">Etap 3 z 4</text>
      <path d="M78 147h1124" stroke="${outline}" stroke-width="1.5"/>
      <g transform="translate(${-cameraX} 0)">
        <defs><clipPath id="v3-mapa-postep"><rect x="-12" y="440" width="${traceX + 12}" height="230"/></clipPath></defs>
        <path d="${ROUTE}" fill="none" stroke="${outline}" stroke-width="5" stroke-linecap="round"/>
        <path d="${ROUTE}" clip-path="url(#v3-mapa-postep)" fill="none" stroke="${green}" stroke-width="5" stroke-linecap="round"/>
        <text x="79" y="560" font-family="Domine,serif" font-size="79">Ola</text>
        <text x="82" y="611" font-size="28" fill="${quiet}">ur. 10 listopada 2026</text>
        <g text-anchor="middle">
          <g opacity="${Math.max(0, Math.min(1, (895 - cameraX) / 160))}">
            <text x="802" y="292" font-size="42" font-weight="550">Badania przesiewowe</text>
            <text x="802" y="343" font-size="42" font-weight="550">noworodka</text>
            <text x="802" y="406" font-size="29" fill="${quiet}">Odhaczone</text>
          </g>
          <text x="1148" y="610" font-size="23" font-weight="550">Zaświadczenie Z-3</text>
          <text x="1148" y="640" font-size="23" font-weight="550">od pracodawcy</text>
          <text x="1148" y="672" font-size="21" fill="${quiet}">Nic nie musisz robić</text>
        </g>
        ${pedestal(...STOPS.badania, "done")}
        ${pedestal(...STOPS.z3, "automatic")}
        ${pedestal(...STOPS.zgloszenie, "current")}
        ${nearestCard(cardOffset)}
      </g>
    </g>`;
}

// SPEC 22: kamera 6·f²/19 do kl. 18, potem 12 px/kl.; ślad 338 + 18·f + 58·(f/59)².
export const camera22 = f => f < 19 ? 6 * f * f / 19 : 12 * f - 114;
export const trace22 = f => 338 + 18 * f + 58 * (f / 59) ** 2;
export function scene(f, k) { return drawMap(camera22(f), trace22(f)); }
