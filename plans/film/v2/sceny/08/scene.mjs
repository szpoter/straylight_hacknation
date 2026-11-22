import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };
import {queueFamily} from '../07/scene.mjs';

function ease(f, start, end) {
  const t = Math.max(0, Math.min(1, (f - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function listeningFace(p, eyes, turn) {
  if (!eyes) return '';
  // Nos i usta przechodzą przez środek twarzy, kiedy Paweł odwraca się do Marty.
  const nose = 13 - 21 * turn;
  const lip = 2 - 12 * turn;
  const mouth = p.mouth > .15
    ? `M${lip} 24q7 -2 14 -1q-5 ${4 + p.mouth * 9} -14 1Z`
    : `M${lip} 25q7 ${4 - 3 * turn} 14 -1`;
  const sockets = [-9, 22].map((x, i) => {
    const cx = x - (i ? 9 : 4) * turn;
    const cy = 4 + 3 * p.gazeDown;
    return `<ellipse cx="${cx}" cy="4" rx="${5.2 + i * .8}" ry="5.6" fill="#fff9ee" stroke="#283754" stroke-width="1"/>
      <ellipse cx="${cx - 2.5 * eyes}" cy="${cy}" rx="2.55" ry="3.8" fill="#283754"/>`;
  }).join('');
  return `<g transform="translate(${p.x} ${p.y}) scale(${p.s}) rotate(${p.lean}) translate(0 -177) rotate(${p.head})" opacity="${eyes}">
    <path d="M-22 -5Q1 -6 32 -5L32 16Q27 30 15 32H-10Q-18 26 -22 15Z" fill="#ffebdb"/>
    ${sockets}
    <path d="M${nose} 8q${3 - 7 * turn} 7 ${1 - 4 * turn} 9" fill="none" stroke="#95857b" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${mouth}" fill="${p.mouth > .15 ? '#2d3950' : 'none'}" stroke="#283754" stroke-width="${p.mouth > .15 ? 1.4 : 2.2}" stroke-linecap="round"/>
  </g>`;
}

export function scene(f, k) {
  const eyes = ease(f, 3, 9);
  const head = ease(f, 9, 25);
  const back = ease(f, 14, 29);
  const camera = ease(f, 9, 29);
  const answer = ease(f, 26, 32);
  const chin = ease(f, 32, 43);
  const familyKit = {
    ...k,
    person: (role, pose) => k.person(role, pose) + (role === 'pawel' ? listeningFace(pose, answer, chin) : ''),
  };
  return queueFamily(familyKit, {
    camera: `translate(${-394 + 29 * camera} ${-445 + 185 * camera}) scale(${2.25 - .45 * camera})`,
    breath: 1.5 * (1 - Math.cos(2 * Math.PI * f / 59)),
    marta: {
      gazeDown: 1 - 1.88 * eyes, head: 16 - 25 * head, lean: 26 - 21 * back,
      mouth: mouths.marta[420 + f],
    },
    pawel: {
      gazeDown: 1 - 1.05 * answer, gaze: -.15 - .85 * answer,
      head: -9 + 15 * chin, lean: -3 - 2 * chin, brow: .87 - .62 * chin,
      mouth: mouths.pawel[420 + f],
    },
  });
}
