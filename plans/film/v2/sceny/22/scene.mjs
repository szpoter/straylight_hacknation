const ink = "#283754", green = "#1A8648", sage = "#A6D0B8", quiet = "#5E697F", outline = "#D4D7DD";
const route = "M-4 641 H344 C510 641 620 476 802 476 S1030 530 1148 530 S1435 523 1584 523 S1900 552 2220 506";

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
  return `<g transform="translate(${1260 + offset} 164)">
    <rect width="648" height="300" rx="18" fill="#FFF" stroke="${outline}" stroke-width="2"/>
    <text x="34" y="50" font-size="25" fill="${quiet}">Najbliższa sprawa</text>
    <text x="34" y="115" font-family="Domine,serif" font-size="48">Zgłoś urodzenie Oli</text>
    <rect x="34" y="137" width="172" height="42" rx="21" fill="#FCDCAA"/>
    <text x="120" y="165" text-anchor="middle" font-size="22" font-weight="550">Do zrobienia</text>
    <rect x="219" y="137" width="145" height="42" rx="21" fill="#F5FAF7" stroke="${outline}"/>
    <text x="291.5" y="165" text-anchor="middle" font-size="22">Obowiązek</text>
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
        <defs><clipPath id="s22-postep"><rect x="-12" y="440" width="${traceX + 12}" height="230"/></clipPath></defs>
        <path d="${route}" fill="none" stroke="${outline}" stroke-width="5" stroke-linecap="round"/>
        <path d="${route}" clip-path="url(#s22-postep)" fill="none" stroke="${green}" stroke-width="5" stroke-linecap="round"/>
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
        ${pedestal(802, 476, "done")}
        ${pedestal(1148, 530, "automatic")}
        ${pedestal(1584, 523, "current")}
        ${nearestCard(cardOffset)}
      </g>
    </g>`;
}

export function scene(f, k) {
  const cameraX = f < 19 ? 6 * f * f / 19 : 12 * f - 114;
  const traceX = 338 + 18 * f + 58 * (f / 59) ** 2;
  return drawMap(cameraX, traceX);
}
