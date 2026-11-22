import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };

function ease(f, start, end) {
  const t = Math.max(0, Math.min(1, (f - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function form(k, x, y, angle, fold, title) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    ${k.paper(0, 0, 82, 100, 0, fold)}
    <rect x="-32" y="-36" width="53" height="13" fill="#fffdf7"/>
    <text x="-30" y="-26" fill="#395b4c" font-family="Inter, sans-serif" font-weight="700" font-size="8.6">${title}</text>
  </g>`;
}

export function scene(f, k) {
  const open = ease(f, 4, 15);
  const pull = ease(f, 15, 45);
  const grip = ease(f, 10, 15);
  const notice = ease(f, 19, 25);
  const nod = ease(f, 24, 36);
  const x = 668 + 72 * pull;
  const y = 374 - 61 * pull;
  const angle = -6 + 10 * pull;
  const rad = angle * Math.PI / 180;
  const cornerX = x + 37 * Math.cos(rad) + 34 * Math.sin(rad);
  const cornerY = y + 37 * Math.sin(rad) - 34 * Math.cos(rad);
  const wristX = cornerX + 10 + 7 * (1 - grip);
  const wristY = cornerY + 7 - 22 * (1 - open);
  const elbowX = 782 + 23 * pull;
  const elbowY = 394 - 29 * pull;
  const wristAngle = Math.atan2(wristY - elbowY, wristX - elbowX) * 180 / Math.PI + 5;
  const leftX = 616 + 2 * open;
  const leftY = 398 + 5 * open;
  const rightGrip = f < 12 ? 'open' : 'pinch';
  const marta = k.person('marta', {
    x: 323, y: 445, s: 1.05, lean: 9 + 4 * nod, head: 8 + 9 * nod,
    gaze: 1 - .72 * notice, brow: .15 + .8 * notice, mouth: mouths.marta[240 + f],
    left: [-61, -43, -34, -3], right: [49, -34, 7, 17], rightGrip: 'hold',
  });
  const pawel = k.person('pawel', {
    x: 712, y: 438, s: 1.09, lean: -6 + 5 * pull, head: -15 + 13 * pull,
    gaze: -.75 + 1.35 * pull, brow: .32, blink: Math.sin(Math.PI * ease(f, 4, 10)),
    left: [-88, -17, (leftX - 712) / 1.09, (leftY - 438) / 1.09],
    right: [(elbowX - 712) / 1.09, (elbowY - 438) / 1.09, (wristX - 712) / 1.09, (wristY - 438) / 1.09],
    leftGrip: 'hold', rightGrip,
  });
  return `<g transform="translate(-415 -300) scale(1.96)">
    ${k.queue()}${k.pram(474, 612, 1, 0)}${marta}${pawel}
    ${form(k, 665, 374, -6, .09, 'ZASIŁEK')}
    ${form(k, x, y, angle, .12 + .64 * Math.sin(Math.PI * pull), 'URLOP')}
    ${k.folder(672, 392, 128, -6, .71 * open)}
    ${k.hand(leftX, leftY, -111, .94, 'hold')}
    ${k.hand(wristX, wristY, wristAngle, .9374, rightGrip)}
  </g>`;
}
