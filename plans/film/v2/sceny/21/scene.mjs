const progress = (f, start, end) => Math.max(0, Math.min(1, (f - start) / (end - start)));

export function scene(f, k) {
  const arrive = 1 - (1 - progress(f, 0, 13)) ** 2;
  const leave = progress(f, 22, 32);
  const pointerX = 1188 - 76 * arrive + 24 * leave;
  const pointerY = 507 - 107 * arrive - 11 * Math.sin(Math.PI * arrive) + 40 * leave;
  const press = progress(f, 14, 17);
  const release = progress(f, 17, 32);
  const snap = (.942 * (1 - Math.exp(-release / .118)) + .058 * release) /
    (.942 * (1 - Math.exp(-1 / .118)) + .058);
  const scale = 1 - .05 * press * (1 - snap);
  const endX = -4 + 324 * progress(f, 41, 59);

  return `<rect width="1280" height="720" fill="#f5faf7"/>
    <g font-family="Inter,sans-serif" fill="#283754">
      <rect width="1280" height="54" fill="#fcdcaa"/>
      <g transform="translate(359 27)" fill="none" stroke="currentColor" color="#283754" stroke-width="2" stroke-linecap="round">
        <circle r="9"/><path d="M0 -1v6 M0 -5v.01"/>
      </g>
      <text x="380" y="34" font-size="21">Wersja demonstracyjna · <tspan font-weight="600">nie podawaj prawdziwych danych</tspan></text>
      <text x="86" y="263" font-family="Domine,serif" font-size="64" letter-spacing="-.9">Import danych rodziny Oli</text>
      <text x="89" y="365" font-size="31" font-weight="550">Marta Lis i Paweł Lis</text>
      <text x="89" y="407" font-size="26" fill="#5e697f">dane z mObywatela i mZUS</text>
      <g transform="translate(859 378) scale(${scale})">
        <rect x="-314" y="-52" width="628" height="104" rx="52" fill="#1a8648"/>
        <text y="12" fill="#fff" text-anchor="middle" font-size="37" font-weight="500">Importuj dane i otwórz plan</text>
      </g>
      <path transform="translate(${pointerX} ${pointerY})" d="M0 0l2 29 7-7 5 12 6-3-5-11 10-1Z" fill="#283754" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" opacity="${1 - leave}"/>
      <path d="M-4 641 H${endX}" fill="none" stroke="#1a8648" stroke-width="5" stroke-linecap="round"/>
    </g>`;
}
