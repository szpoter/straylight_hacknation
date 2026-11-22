function smooth(frame, from, to) {
  const t = Math.max(0, Math.min(1, (frame - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

export function scene(f, k) {
  const phrase = smooth(f, 0, 8);
  const gaze = smooth(f, 18, 26);
  const lean = smooth(f, 22, 36);
  const underline = smooth(f, 26, 39);
  const cy = 328 + 4 * lean;
  return `
    <rect width="1280" height="720" fill="#F5FAF7"/>
    <rect x="427" width="853" height="720" fill="white"/>
    <path d="M427 0v720" stroke="#D4D7DD" stroke-width="2"/>
    <style>[data-part=pupil],[data-part=catchlight]{transform:translate(var(--look,0px),var(--s25-down,0px))}</style>
    <g style="--s25-down:${18 * gaze}px" transform="rotate(${5 * lean} 241 ${cy})">
      ${k.zusik(241, cy, 262, -0.3 + 1.3 * gaze)}
    </g>
    <g font-family="Inter,sans-serif" fill="#283754">
      <text x="241" y="529" text-anchor="middle" font-size="25" fill="#5E697F">Agent AI · RAG</text>
      <text x="518" y="239" font-size="30" font-weight="600" fill="#1A8648">Zusik</text>
      <g font-family="Domine,Georgia,serif" font-size="49" letter-spacing="-0.9">
        <text x="518" y="331">Oboje możecie korzystać</text>
        <text x="518" y="${408 - 7 * phrase}" opacity="${0.36 + 0.64 * phrase}">z urlopu jednocześnie.</text>
      </g>
      <text x="518" y="519" textLength="432" lengthAdjust="spacingAndGlyphs" fill="#1A8648" font-size="31" font-weight="600">Kodeks pracy · art. 182¹a § 6</text>
      <rect x="518" y="529.5" width="${432 * underline}" height="3" rx="1.5" fill="#1A8648"/>
    </g>`;
}

export function answerFrame(k) {
  return scene(59, k);
}
