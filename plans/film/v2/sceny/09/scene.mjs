import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };
import {front, reverse} from '../06/scene.mjs';

function ease(frame, start, end) {
  const t = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function customer(f) {
  const distance = 252 * ease(f, 2, 56);
  const halfStep = 42;
  const phase = distance / halfStep;
  const index = Math.min(5, Math.floor(phase));
  const t = phase - index;
  const lift = Math.sin(Math.PI * t);
  const planted = 21 - halfStep * t;
  const moving = -21 + halfStep * (2 * t * t * (3 - 2 * t) - t);
  function leg(swing, color) {
    const ankle = swing ? moving : planted;
    const knee = ankle * .54 + (swing ? 9 * lift : 0);
    const y = 115 - (swing ? 15 * lift : 0);
    return `<path d="M0 -2Q${knee} 42 ${knee} 54L${ankle} ${y}" stroke="#58615c" stroke-width="17" fill="none"/>
      <path d="M0 -2Q${knee} 42 ${knee} 54L${ankle} ${y}" stroke="${color}" stroke-width="13" fill="none"/>
      <path d="M${ankle-8} ${y-3}q6 4 15 0l6 5q13 3 12 8h-34Z" fill="#64706c"/> `;
  }
  const swing = Math.cos(Math.PI * phase);
  return `<g transform="translate(${670 + distance} 431)" stroke="#64736a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
    ${leg(index % 2 === 0, '#b5bdb1')}${leg(index % 2 === 1, '#c8d1c3')}
    <g transform="translate(0 ${-2.5 * lift})">
      <path d="M-13 -88q-12 4-17 20l-8 81q24 10 62 0l-6-69q-2-21-12-29Z" fill="#e3ddcb"/>
      <path d="M-4 -83l6-11 4 11 8 25-13-11Z" fill="#c6c1ae"/>
      <path d="M-20 -126q9-18 25-15 22 1 22 28l6 9-7 3q-1 15-13 18l-7-1-4 9-13-9 3-12Z" fill="#f0e5d6"/>
      <circle cx="-23" cy="-111" r="11" fill="#c3c9c1"/>
      <path d="M-20 -101q-13-13-3-28 11-21 33-17 15 2 20 20l-18-5q-8 18-21 20l-4 12Z" fill="#c3c9c1"/>
      <path d="M10 -113h7m3 0h6m-15-2q2-4 8-2l1 7q-6 4-9-3Zm10-2q4-3 8-1l1 7q-6 3-8-3Z" fill="none" stroke-width="1.3"/>
      <g transform="rotate(${6 * swing} -15 -64)">
        <path d="M-15 -68q-8 18-5 38l6 31" fill="none" stroke-width="16"/>
        <path d="M-15 -68q-8 18-5 38l6 31" fill="none" stroke="#e3ddcb" stroke-width="12"/>
        <path d="M-26 30q3-30 15-29 12 2 13 29" fill="none" stroke-width="2.8"/>
        <path d="M-31 27h37l4 35q-21 7-45 0Z" fill="#c6bca3"/>
        <path d="M-18 -3q6-4 11 1l-1 8q-5 4-9-1Z" fill="#f0e5d6"/>
      </g>
    </g></g>`;
}

export function scene(f, k) {
  const travel = 61 * ease(f, 5, 34);
  const shift = -26 * ease(f, 16, 34);
  const brace = ease(f, 11, 31);
  const lookBack = ease(f, 5, 16);
  const lookDown = ease(f, 45, 54);
  const pramX = 474 + travel;
  const martaShift = 50 * ease(f, 6, 33);
  const martaStep = Math.sin(Math.PI * ease(f, 7, 20)) - Math.sin(Math.PI * ease(f, 21, 35));
  const marta = k.person('marta', {
    x: 323 + martaShift, y: 445, s: 1.05, step: martaStep,
    footL: (50 * ease(f, 21, 35) - martaShift) / 1.05 + 29 * martaStep,
    footR: (50 * ease(f, 7, 20) - martaShift) / 1.05 - 29 * martaStep,
    lean: 5 + 7 * Math.sin(Math.PI * ease(f, 6, 33)), head: -9 + 7 * brace,
    gaze: 1, gazeDown: -.88 + 1.1 * brace, left: [-57, -43, -45, -8],
    right: [48,-35,(pramX - 144 - 323 - martaShift) / 1.05, 22 / 1.05], rightGrip: 'hold',
  });
  const step = -Math.sin(Math.PI * ease(f, 10, 29));
  const leftFoot = -38 * ease(f, 10, 29);
  const pawel = k.person('pawel', {
    x: 712 + shift, y: 438, s: 1.09, step,
    footL: (leftFoot - shift) / 1.09 + 29 * step,
    footR: -shift / 1.09 - 29 * step,
    lean: -5 + 7 * brace, head: 6 + 3 * lookBack + 9 * ease(f, 50, 59),
    gaze: -1 + 1.95 * lookBack - 1.6 * lookDown, gazeDown: -.05 + .98 * lookDown,
    mouth: mouths.pawel[480 + f], brow: .25 + .5 * lookBack - .3 * lookDown,
    left: [-88, -17, -94 / 1.09, -35 / 1.09], right: [80 / 1.09, -44 / 1.09, 10 / 1.09, -75 / 1.09],
    leftGrip: 'hold', rightGrip: 'hold',
  });
  const atWindow = k.person('marta', {x:1088, y:399, s:.65, head:8, gaze:1,
    left:[-48,-59,-38,-38], right:[58,-69,73,-88], rightGrip:'pinch'});
  return k.queue() + `<defs><filter id="s09-window" color-interpolation-filters="sRGB">
    <feColorMatrix values=".49 0 0 0 .49 0 .49 0 0 .50 0 0 .49 0 .49 0 0 0 1 0"/>
    </filter></defs><g filter="url(#s09-window)">${atWindow}</g>` + customer(f) + marta
    + k.pram(pramX, 612, 1, travel * 180 / (Math.PI * 29)) + pawel
    + `<g transform="translate(${shift} 0)">
      <g transform="translate(665 374) rotate(-6)">${front(k, 'ZASIŁEK', .09)}</g>
      <g transform="translate(752 362) rotate(-4)">${reverse(0)}</g>
      ${k.folder(672, 392, 128, -6, .71)}${k.hand(618, 403, -111, .94, 'hold')}${k.hand(722, 363, -151, .9374, 'hold')}
    </g>`;
}
