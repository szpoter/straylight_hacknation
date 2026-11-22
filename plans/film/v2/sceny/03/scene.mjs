import {photo} from '../02/scene.mjs';

const width = 59;
const printX = -55, printY = -31;
const height = width * 720 / 1280;

function ease(f, first, last) {
  const t = Math.max(0, Math.min(1, (f - first) / (last - first)));
  return t * t * (3 - 2 * t);
}

function onCover(x, y, angle, lift) {
  const a = Math.PI * angle / 180;
  return [728 + x * Math.cos(a) - y * Math.sin(a), 376 - lift + x * Math.sin(a) + y * Math.cos(a)];
}

function wrist(x, y, elbow, angle, lift) {
  const [wx, wy] = onCover(x, y, angle, lift);
  return [...elbow, (wx - 712) / 1.09, (wy - 438) / 1.09];
}

function compose(k, pose, angle, lift, reflection) {
  const {marta, pawel, pramX = 474, roll = 0} = pose;
  const shine = -52 + 146 * reflection;
  const customers = k.person('clerk', {x: 1000, y: 413, s: .67, head: 4, gaze: 1, leftGrip: 'hold', rightGrip: 'hold'})
    + k.person('marta', {x: 1088, y: 399, s: .65, head: 8, gaze: 1, left: [-48,-59,-38,-38], right: [58,-69,73,-88], rightGrip: 'pinch'});
  const cover = k.folder(0, 0, 125, 0, 0)
    + `<rect x="-58" y="-34" width="65" height="40" rx="1" fill="#fffaf0" stroke="#847e6f" stroke-width="1.1"/>
       <svg x="${printX}" y="${printY}" width="${width}" height="${height}" viewBox="0 0 1280 720" overflow="hidden">${photo(k)}</svg>
       <svg x="-58" y="-34" width="65" height="40" viewBox="0 0 65 40" overflow="hidden">
         <g transform="translate(${shine} 0)" fill="#fffef4">
           <path d="M0 -1h7L-16 41h-7Z" opacity=".38"/><path d="M10 -1h2L-11 41h-2Z" opacity=".55"/>
         </g>
         <path d="M1 36V1h61M3 39h60l1-9" fill="none" stroke="#fff" stroke-width="1" opacity=".72"/>
       </svg>
       <g fill="#ffebdb" stroke="#283754" stroke-width="1.8" stroke-linejoin="round">
         <path d="M-62 22q3-7 7-8l11-5q5-1 5 2l-10 9q-6 7-13 7Z"/>
         <path d="M59 30q-4-7-9-8l-11-3q-4-1-4 3l12 8q5 5 12 5Z"/>
       </g>`;
  return k.queue() + `<defs><filter id="s03-distance" color-interpolation-filters="sRGB">
    <feColorMatrix values=".49 0 0 0 .49  0 .49 0 0 .50  0 0 .49 0 .49  0 0 0 1 0"/>
    </filter></defs><g filter="url(#s03-distance)">${customers}</g>`
    + k.person('marta', {x:323, y:445, s:1.05, lean:2, head:9, gaze:.64,
      left:[-60,-59,-55,-20], right:[47,-47,8,19], rightGrip:'hold', ...marta})
    + k.pram(pramX, 612, 1, roll)
    + k.person('pawel', {x:712, y:438, s:1.09, lean:3, head:12, gaze:-.65,
      left:wrist(-62,24,[-66,-41],angle,lift), right:wrist(59,31,[79,-40],angle,lift),
      grip:'hold', ...pawel})
    + `<g transform="translate(728 ${376-lift}) rotate(${angle})">${cover}</g>`;
}

export function queueShot(k, pose = {}) {
  return compose(k, pose, -5, 0, 1);
}

export const queueEnd = queueShot;

export function scene(f, k) {
  if (f <= 3) return photo(k);
  if (f >= 54) return queueShot(k);
  const turn = ease(f, 7, 32), settle = ease(f, 32, 53);
  const angle = -10 * turn + 5 * settle, lift = 6 * (turn - settle);
  const pull = ease(f, 3, 54);
  const zoom = (1280 / width) ** (1 - pull);
  const [cx, cy] = onCover(printX + width/2, printY + height/2, angle, lift);
  const x = 640 + (cx - 640) * pull, y = 360 + (cy - 360) * pull;
  const world = compose(k, {pawel:{head:12 + 3 * (turn-settle)}}, angle, lift, ease(f, 4, 38));
  return `<g transform="translate(${x} ${y}) scale(${zoom}) translate(${-cx} ${-cy})">${world}</g>`;
}
