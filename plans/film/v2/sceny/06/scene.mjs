import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };

function ease(f, start, end) {
  const t = Math.max(0, Math.min(1, (f - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function front(k, title, fold) {
  return k.paper(0, 0, 82, 100, 0, fold) +
    `<rect x="-32" y="-36" width="53" height="13" fill="#fffdf7"/>
    <text x="-30" y="-26" fill="#395b4c" font-family="Inter, sans-serif" font-weight="700" font-size="8.6">${title}</text>`;
}

export function reverse(curl) {
  return `<path d="M-40 -36l12 -12Q1 ${-54 - curl} 40 -44Q43 4 40 48Q0 39 -40 46Q-34 0 -40 -36Z" fill="#f3f4e9" stroke="#283754" stroke-width="1.6"/>
    <path d="M-40 -36l12 1 -1 -12" fill="#d5e1d5" stroke="#283754"/>
    <path d="M-26 -26h47" stroke="#617668" stroke-width="3"/>
    <path d="M-26 -10h7v7h-7ZM-26 4h7v7h-7ZM-26 18h7v7h-7Z" fill="none" stroke="#687b74" stroke-width="1.4"/>
    <path d="M-12 -7h38M-12 7h31M-12 21h35" stroke="#87949c" stroke-width="1.5"/>`;
}

export function scene(f, k) {
  const slip = ease(f, 0, 6);
  const turn = ease(f, 7, 19);
  const lower = ease(f, 37, 54);
  const look = ease(f, 14, 21);
  const nod = ease(f, 18, 25);
  const curve = Math.sin(Math.PI * turn);
  const projection = Math.cos(Math.PI * turn);
  const contactY = -34 + 24 * slip;
  const radians = Math.PI / 45;
  const pivotX = 740 + 37 * Math.cos(radians) - contactY * Math.sin(radians) - 63 * lower;
  const pivotY = 313 + 37 * Math.sin(radians) + contactY * Math.cos(radians) + 5 * curve + 46 * lower;
  const angle = 4 - 13 * curve - 8 * lower;
  const wristX = pivotX + 10 - 3 * turn;
  const wristY = pivotY + 7 + 4 * turn;
  const elbowX = 805 + 8 * curve - 13 * lower;
  const elbowY = 365 + 19 * turn + 10 * lower;
  const wristAngle = Math.atan2(wristY - elbowY, wristX - elbowX) * 180 / Math.PI + 5;
  const grip = f >= 3 && f < 6 ? 'open' : f < 7 ? 'pinch' : 'hold';
  const marta = k.person('marta', {
    x: 323, y: 445, s: 1.05, lean: 13, head: 17, gaze: .28 + .5 * look,
    brow: .95, mouth: mouths.marta[300 + f],
    left: [-61, -43, -34, -3], right: [49, -34, 7, 17], rightGrip: 'hold',
  });
  const pawel = k.person('pawel', {
    x: 712, y: 438, s: 1.09, lean: -1 + 4 * nod - 6 * lower, head: -2 + 10 * nod - 17 * lower,
    gaze: .6 + .4 * look - 1.15 * lower, brow: .32 + .55 * look,
    blink: Math.sin(Math.PI * ease(f, 46, 52)), mouth: mouths.pawel[300 + f - 21],
    left: [-88, -17, (618 - 712) / 1.09, (403 - 438) / 1.09],
    right: [(elbowX - 712) / 1.09, (elbowY - 438) / 1.09, (wristX - 712) / 1.09, (wristY - 438) / 1.09],
    leftGrip: 'hold', rightGrip: grip,
  });
  const face = projection >= 0 ? front(k, 'URLOP', .12 + .8 * curve) : reverse(10 * curve);
  const page = Math.abs(projection) < .01
    ? `<path d="M0 ${-48 - contactY}q-4 44 0 95" fill="none" stroke="#51645c" stroke-width="2"/>`
    : `<g transform="scale(${Math.abs(projection)} 1) translate(${projection > 0 ? -37 : 37} ${-contactY})">${face}</g>`;
  return `<g transform="translate(-415 -300) scale(1.96)">
    ${k.queue()}${k.pram(474, 612, 1, 0)}${marta}${pawel}
    <g transform="translate(665 374) rotate(-6)">${front(k, 'ZASIŁEK', .09)}</g>
    <g transform="translate(${pivotX} ${pivotY}) rotate(${angle})">${page}</g>
    ${k.folder(672, 392, 128, -6, .71)}
    ${k.hand(618, 403, -111, .94, 'hold')}
    ${k.hand(wristX, wristY, wristAngle, .9374, grip)}
  </g>`;
}
