import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };
import { photo } from '../02/scene.mjs';
import { queueShot } from '../03/scene.mjs';

function ease(f, start, end) {
  const t = Math.max(0, Math.min(1, (f - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

export function scene(f, k) {
  if (f === 0) return queueShot(k);
  const close = f >= 22;
  const travel = 24 * ease(f, 0, 13) - 35 * ease(f, 13, 32) + 11 * ease(f, 32, 46);
  const roll = travel * 180 / (Math.PI * 29);
  const look = ease(f, 11, 22);
  const lean = ease(f, 15, 40);
  const hipShift = .24 * travel + 10 * lean;
  const x = (close ? 564 : 323) + hipShift;
  const y = close ? 433 : 445;
  const s = close ? 1.01 : 1.05;
  const pramX = (close ? 712 : 474) + travel;
  const pramY = close ? 605 : 612;
  const handX = pramX - 144;
  const handY = pramY - 145;
  const marta = {
    x, y, s, lean: 2 + travel * .14 + 18 * lean,
    head: 9 + 4 * look + 7 * ease(f, 28, 48),
    gaze: .64 + .36 * look, brow: .7 * ease(f, 19, 33) - .44 * ease(f, 38, 51),
    mouth: mouths.marta[180 + f],
    left: [-60 + 13 * lean, -59, -55 + 24 * lean, -20 - 8 * lean],
    right: [47 + .28 * travel, -47 + 6 * lean, (handX - x) / s, (handY - y) / s],
    rightGrip: 'hold', footL: -hipShift / s, footR: -hipShift / s,
  };
  if (!close) return queueShot(k, { marta, pramX, roll });

  const offer = ease(f, 22, 49);
  const thumb = ease(f, 45, 58);
  const fx = 728 - 56 * offer, fy = 376 + 16 * offer, width = 125 + 3 * offer;
  const angle = -5 - offer, rad = angle * Math.PI / 180;
  const rightY = 31 - 76 * thumb;
  function wrist(dx, dy, elbow) {
    const wx = fx + dx * Math.cos(rad) - dy * Math.sin(rad);
    const wy = fy + dx * Math.sin(rad) + dy * Math.cos(rad);
    return [...elbow, (wx - 712) / 1.09, (wy - 438) / 1.09];
  }
  const pawel = {x:712, y:438, s:1.09, lean:3 - 6 * offer, head:12 - 17 * offer,
    gaze:-.65 - .35 * offer, grip:'hold', left:wrist(-61, 24, [-66,-41]),
    right:wrist(59, rightY, [79 - 5 * offer,-40 - 18 * thumb])};
  const cover = `<g transform="translate(${fx} ${fy}) rotate(${angle})">
    ${k.folder(0, 0, width, 0, 0)}
    <rect x="-58" y="-34" width="65" height="40" rx="1" fill="#fffaf0" stroke="#847e6f" stroke-width="1"/>
    <svg x="-55" y="-31" width="59" height="33.1875" viewBox="0 0 1280 720" overflow="hidden">${photo(k)}</svg>
    <g fill="#ffebdb" stroke="#283754" stroke-width="1.8" stroke-linejoin="round">
      <path d="M-62 22q3-7 7-8l11-5q5-1 5 2l-10 9q-6 7-13 7Z"/>
      <path transform="translate(0 ${rightY - 31})" d="M59 30q-4-7-9-8l-11-3q-4-1-4 3l12 8q5 5 12 5Z"/>
    </g></g>`;
  return `<g transform="translate(-870 -406) scale(2.35)">${k.queue()}${k.person('marta', marta)}
    ${k.pram(pramX, pramY, 1, roll)}${k.person('pawel', pawel)}${cover}</g>`;
}
