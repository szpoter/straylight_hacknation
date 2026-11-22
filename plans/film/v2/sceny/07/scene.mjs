import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };
import { front, reverse } from '../06/scene.mjs';

function ease(f, start, end) {
  const t = Math.max(0, Math.min(1, (f - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function martaProfile(k, { lean = 26, head = 16, gazeDown = 1, mouth = 0, blink = 0 }) {
  const angle = lean * Math.PI / 180;
  const shoulderX = -25 * Math.cos(angle) + 108 * Math.sin(angle);
  const shoulderY = -25 * Math.sin(angle) - 108 * Math.cos(angle);
  const farShoulderX = 14 * Math.cos(angle) + 109 * Math.sin(angle);
  const farShoulderY = 14 * Math.sin(angle) - 109 * Math.cos(angle);
  const farArm = `M${farShoulderX} ${farShoulderY}L${farShoulderX + 13} -57L${farShoulderX - 11} -63`;
  const elbowX = -38 + lean * .9;
  const wristX = (330 - 323) / 1.05;
  const wristY = (467 - 445) / 1.05;
  const arm = `M${shoulderX} ${shoulderY} Q${shoulderX - 8} -79 ${elbowX} -39 L${wristX} ${wristY}`;
  const wristAngle = Math.atan2(wristY + 39, wristX - elbowX) * 180 / Math.PI;
  const eyeHeight = (3.65 - .5 * gazeDown) * (1 - blink);
  const eye = blink > .88 ? '<path d="M16 0q5 3 10 -1" fill="none"/>' :
    `<ellipse cx="21" cy="-1" rx="5.9" ry="${eyeHeight + 1}" fill="#fff9ee" stroke-width="1.1"/>
     <ellipse cx="${23 - gazeDown}" cy="${-2 + 2.7 * gazeDown}" rx="2.55" ry="${eyeHeight}" fill="#283754" stroke="none"/>`;
  return `<g transform="translate(323 445) scale(1.05)" stroke="#283754" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-35 0q-2 49 -11 88l-2 84h19l11 -83 24 -86 M-3 -2l8 89 20 87h17l-10 -91 -4 -85" fill="#f6f5ec"/>
    <path d="M-39 -8q-7 30 -13 59q35 11 83 2l-1 -58Z" fill="#f4f4ea"/>
    <g transform="rotate(${lean})">
      <path d="M-14 -148l1 26q13 13 27 -1l-5 -28Z" fill="#ffebdb"/>
      <path d="M-13 -129l-23 12q-12 8 -11 28l8 85q32 14 70 -3l-3 -92q-3 -16 -15 -25l-7 8Z" fill="#b2caad"/>
      <path d="M5 -122l12 -7 11 14 5 102 -26 9Z" fill="#fbf9f0"/>
      <path d="M-1 -126l-12 20 10 5 -7 11" fill="none" stroke-width="1.7"/>
      <g transform="translate(0 -174) rotate(${head})">
        <path d="M-35 -26q12 -33 40 -27q28 0 34 26q3 10 -1 18l8 13q2 4 -3 5l-7 1q0 6 -3 10q-1 14 -17 16q-17 2 -28 -12q-11 -2 -17 -12q-10 -15 -6 -38Z" fill="#ffebdb"/>
        <circle cx="-35" cy="8" r="16" fill="#2d3950"/>
        <path d="M-39 7q-8 -17 -2 -34q9 -32 41 -30q29 -2 40 23l1 10q-13 -3 -21 -18q-9 21 -36 27l-9 19Z" fill="#2d3950"/>
        <path d="M-18 0q-11 -10 -16 -1q-3 10 8 16l7 -3" fill="#ffebdb" stroke-width="2"/>
        <path d="M15 -12q6 -4 12 -2" fill="none" stroke-width="2.5"/>
        ${eye}
        <path d="M${34.8 - 4 * mouth} 17q-4 1 -8 0q4 ${3 + 4.5 * mouth} 8 ${.3 + 1.9 * mouth}Z" fill="#374156" stroke-width="1.4"/>
      </g>
    </g>
    <path d="${farArm}" fill="none" stroke-width="23"/>
    <path d="${farArm}" fill="none" stroke="#b2caad" stroke-width="18"/>
    ${k.hand(farShoulderX - 11, -63, 193, .67, 'hold')}
    <path d="M40 34L18.095 13.333 5.714 20.952" fill="none" stroke-width="6.67"/>
    <path d="${arm}" fill="none" stroke-width="27"/>
    <path d="${arm}" fill="none" stroke="#b2caad" stroke-width="22"/>
    ${k.hand(wristX, wristY, wristAngle, .86, 'hold')}
  </g>`;
}

export function queueFamily(k, { marta = {}, pawel = {}, breath = 0, camera = 'translate(-394 -445) scale(2.25)' } = {}) {
  const actor = k.person('pawel', {
    x: 712, y: 438, s: 1.09, lean: -3, head: -9, gaze: -.15, gazeDown: 1, brow: .87,
    left: [-88, -17, -94 / 1.09, -35 / 1.09], right: [80 / 1.09, -44 / 1.09, 10 / 1.09, -75 / 1.09],
    leftGrip: 'hold', rightGrip: 'hold', ...pawel,
  });
  // Uniesiona krawędź kocyka zakrywa jego płaski obrys z rysunku wózka.
  const blanket = `<g transform="translate(474 612)">
    <path d="M-78 -109Q-20 ${-167 - 2 * breath} 34 -117l6 12Z" fill="#f9f8ed" stroke="#283754" stroke-width="2.7" stroke-linejoin="round"/>
    <path d="M-49 -113q23 ${-18 - breath} 43 ${-17 - breath}q23 4 39 ${17 + breath}l-5 6q-35 ${-24 - 2 * breath} -68 2Z" fill="#b2caad"/>
  </g>`;
  return `<g transform="${camera}">
    ${k.queue()}${k.pram(474, 612, 1, 0)}${blanket}${martaProfile(k, marta)}${actor}
    <g transform="translate(665 374) rotate(-6)">${front(k, 'ZASIŁEK', .09)}</g>
    <g transform="translate(752.21 359) rotate(-4)">${reverse(0)}</g>
    ${k.folder(672, 392, 128, -6, .71)}${k.hand(618, 403, -111, .94, 'hold')}${k.hand(722, 363, -151, .9374, 'hold')}
  </g>`;
}

export function scene(f, k) {
  return queueFamily(k, {
    marta: {
      lean: 13 + 13 * ease(f, 13, 45), head: 4 + 12 * ease(f, 10, 31),
      gazeDown: ease(f, 5, 17), mouth: mouths.marta[360 + f],
    },
    breath: 1.5 * (1 - Math.cos(2 * Math.PI * f / 59)),
  });
}
