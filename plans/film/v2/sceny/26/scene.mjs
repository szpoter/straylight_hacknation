import {answerFrame} from "../25/scene.mjs";

function ease(frame, start, end) {
  const t = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function scene(f, k) {
  const answer = answerFrame(k);
  if (f === 0) return answer;

  const open = ease(f, 0, 18);
  const underline = ease(f, 18, 29);
  const paper = `x="${505 - 355 * open}" y="${484 - 302 * open}"
    width="${459 + 521 * open}" height="${58 + 312 * open}" rx="${8 + 27 * open}"`;

  return `
    <defs>
      <g id="answer26">${answer}</g>
      <clipPath id="paper26"><rect ${paper}/></clipPath>
      <clipPath id="link26"><rect x="513" y="485" width="441" height="50"/></clipPath>
    </defs>
    <use href="#answer26"/>
    <rect width="1280" height="720" opacity="${open}" fill="#F5FAF7"/>
    <rect ${paper} fill="white" stroke="#D4D7DD" stroke-width="${2 * open}"/>
    <g clip-path="url(#paper26)" opacity="${ease(f, 10, 17)}" fill="#283754">
      <text x="225" y="269" font-family="Inter,sans-serif" font-size="29" fill="#5E697F">Sejm RP · Dz.U. 2026 poz. 1245</text>
      <rect x="227" y="429" width="${273 * underline}" height="7" rx="3.5" fill="#A6D0B8"/>
      <g font-family="Domine,Georgia,serif" font-size="47" letter-spacing="-0.6">
        <text x="225" y="353">„Z urlopu rodzicielskiego mogą</text>
        <text x="225" y="416"><tspan textLength="275" lengthAdjust="spacingAndGlyphs">jednocześnie</tspan> korzystać oboje</text>
        <text x="225" y="475">pracownicy – rodzice dziecka.”</text>
      </g>
    </g>
    <use href="#answer26" clip-path="url(#link26)"/>`;
}
