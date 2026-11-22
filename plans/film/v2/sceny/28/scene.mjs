function progress(frame, start, end) {
  return Math.min(1, Math.max(0, (frame - start) / (end - start)));
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

export function scene(f, k) {
  const travel = smooth(progress(f, 17, 36));
  const slide = (1 - Math.exp(-3.41 * travel)) / (1 - Math.exp(-3.41));
  const lift = smooth(progress(f, 9, 17)) - smooth(progress(f, 34, 42));
  const arc = 4 * slide * (1 - slide);
  const x = 140 + 536 * slide;
  const y = 376 - 22 * lift - 17 * arc;
  const ink = '#283754';
  const muted = '#5E697F';
  const green = '#1A8648';
  const outline = '#D4D7DD';
  const mint = '#F5FAF7';
  const check = progress(f, 42, 48);

  return `
    <rect width="1280" height="720" fill="${mint}"/>
    <rect x="105" y="-12" width="1070" height="784" rx="18" fill="#fff" stroke="${outline}" stroke-width="2"/>
    <g fill="${ink}" font-family="Inter, sans-serif">
      <text x="188" y="101" font-size="52" letter-spacing="-1.2" font-family="Domine, Georgia, serif">Wniosek o urlop rodzicielski</text>
      <rect x="963" y="56" width="119" height="53" rx="26.5" fill="${mint}" stroke="${outline}" stroke-width="2"/>
      <text x="1022.5" y="92" text-anchor="middle" font-size="26" fill="${muted}">Szkic</text>
      <path d="M188 151H1092" fill="none" stroke="${outline}" stroke-width="2"/>
      <text x="140" y="319" font-size="37" font-family="Domine, Georgia, serif">Pliki dziecka</text>
      <text x="676" y="319" font-size="37" font-family="Domine, Georgia, serif">Załącznik</text>
      <rect x="140" y="376" width="446" height="108" rx="14" fill="${mint}" stroke="${outline}" stroke-width="2"/>
      <rect x="676" y="376" width="446" height="108" rx="14" fill="${mint}" stroke="${muted}" stroke-width="2" stroke-dasharray="8 8"/>
      <g data-file="odpis" transform="translate(${x} ${y})">
        <rect width="446" height="108" rx="14" fill="#fff" stroke="${f >= 42 ? green : outline}" stroke-width="2.5"/>
        <g transform="translate(20 31)" fill="none" stroke="${green}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 1h21l11 11v32H3z M24 1v11h11 M10 23h17 M10 30h13"/>
        </g>
        <text x="72" y="65" font-size="30" font-weight="560" letter-spacing="-.45">Odpis aktu urodzenia Oli</text>
      </g>
      ${check > 0 ? `<g data-confirmation="attached" transform="translate(883 306)" opacity="${Math.min(1, check * 2)}">
        <circle r="17" fill="${green}"/>
        <path d="m-8 0 5 5 11-12" pathLength="1" stroke-dasharray="1" stroke-dashoffset="${1 - check}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>` : ''}
    </g>`;
}
