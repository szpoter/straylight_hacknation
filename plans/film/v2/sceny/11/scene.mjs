import mouths from '../../../montaz/assets/mowa.json' with {type: 'json'};
import {printout} from '../10/scene.mjs';

const mix = (a, b, t) => a + (b - a) * t;
function ease(frame, start, end) {
  const t = Math.max(0, Math.min(1, (frame - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function walk(distance, halfStep, scale) {
  const phase = distance / halfStep;
  const half = Math.floor(phase);
  const t = phase - half;
  const lift = Math.sin(Math.PI * t);
  const step = half % 2 ? -lift : lift;
  const planted = halfStep * ((half % 2) - t);
  const swing = halfStep * (2 * ease(t, 0, 1) - t - (half % 2));
  return {step, footL: (half % 2 ? swing : planted) / scale + 29 * step,
    footR: (half % 2 ? planted : swing) / scale - 29 * step};
}

export function scene(f, k) {
  const look = ease(f, 6, 12), nod = ease(f, 9, 16);
  const drop = ease(f, 0, 25), reach = ease(f, 13, 25), pass = ease(f, 27, 37);
  const pull = ease(f, 40, 58), release = ease(f, 39, 49);
  const roll = 108 * ease(f, 42, 59), advance = 108 * ease(f, 40, 58);
  const leanIn = 46 * ease(f, 12, 31);
  const mx = 373 + leanIn + roll, px = 686 + advance;
  const handle = 391 + roll;
  const pageX = 619 - 77 * drop + 57 * pass + 115 * pull + advance;
  const pageY = 355 + 86 * drop - 58 * pass - 20 * pull;
  const angle = -10 - 19 * drop + 22 * pass + 13 * pull;
  const rad = angle * Math.PI / 180;
  function edge(x, y) {
    return [pageX + x * Math.cos(rad) - y * Math.sin(rad), pageY + x * Math.sin(rad) + y * Math.cos(rad)];
  }
  const [leftX, leftY] = edge(-37, 17), [rightX, rightY] = edge(38, 1);
  const mHandX = mix(mix(handle, leftX - 10, reach), handle, release);
  const mHandY = mix(mix(467, leftY + 5, reach), 467, release);
  const accept = ease(f, 24, 36), lower = ease(f, 3, 16);
  const pHandX = mix(719 - 13 * lower + advance, rightX + 9, accept);
  const pHandY = mix(323 + 44 * lower, rightY + 6, accept);
  const steady = ease(f, 5, 14) * (1 - ease(f, 48, 56));
  const mElbowX = 416 + leanIn + roll + 37 * reach * (1-release);
  const mElbowY = 409 + 29 * reach - 35 * pass + 6 * release;
  const pElbowX = px + 68 - 35 * accept + 43 * pull;
  const pElbowY = 370 + 42 * accept - 26 * pull;
  const mGrip = f < 13 || f >= 49 ? 'hold' : f < 25 || f >= 40 ? 'open' : 'pinch';
  const pGrip = f < 18 ? 'point' : f < 36 ? 'open' : 'pinch';
  const towardPage = ease(f, 13, 22) * (1 - ease(f, 39, 50));
  const marta = k.person('marta', {x:mx, y:445, s:1.05, ...walk(leanIn + roll, 38.5, 1.05),
    gaze:1, gazeDown:.22 - 1.12 * look + 1.86 * towardPage, head:-2 - 8 * nod + 23 * towardPage,
    lean:5 + 15 * towardPage, leftGrip:steady > .8 ? 'hold' : 'open', rightGrip:mGrip,
    left:[-58,-46,mix(-45,(handle - mx)/1.05,steady),mix(-8,22/1.05,steady)],
    right:[(mElbowX-mx)/1.05,(mElbowY-445)/1.05,(mHandX-mx)/1.05,(mHandY-445)/1.05]});
  const pawel = k.person('pawel', {x:px, y:438, s:1.09, ...walk(advance, 27, 1.09),
    gaze: -.65 + 1.65 * look - 1.9 * towardPage, gazeDown:.93 - 1.87 * look + 1.74 * towardPage,
    head:18 - 27 * nod + 18 * towardPage, lean:2 - 8 * towardPage + 4 * pull,
    mouth:mouths.pawel[600 + f], left:[-88,-17,-94/1.09,-35/1.09], leftGrip:'hold', rightGrip:pGrip,
    right:[(pElbowX-px)/1.09,(pElbowY-438)/1.09,(pHandX-px)/1.09,(pHandY-438)/1.09]});
  const paper = (kind, x, y, rotation) => `<g transform="translate(${x} ${y}) rotate(${rotation})">${printout(kind)}</g>`;
  const palm = (x,y,ex,ey,s,grip) => k.hand(x,y,5 + Math.atan2(y-ey,x-ex)*180/Math.PI,s*.86,grip);
  const board = `<g transform="translate(904 108)"><rect width="103" height="43" rx="5" fill="#35483e"/><text x="51.5" y="31" text-anchor="middle" font-family="monospace" font-weight="bold" font-size="26" fill="${f < 6 ? '#afc2ac' : '#d7f3b1'}">A ${f < 6 ? '16' : '17'}</text></g>`;
  const clerk = `<g opacity=".73">${k.person('clerk',{x:1090,y:396,s:.62,seat:true,head:-8,gaze:-1,
    left:[-54,-72,-68,-64],right:[46,-62,28,-62]})}</g><path d="M909 365h371v138H909Z" fill="#d9e4d7" stroke="#829488" stroke-width="2"/><path d="M887 349h393v22H887Z" fill="#b7cbb7" stroke="#283754" stroke-width="2.5"/>`;
  const page = paper('zasilek',pageX,pageY,angle);
  const forearm = `M${pElbowX} ${pElbowY}L${pHandX} ${pHandY}`;
  const sleeve = `<g fill="none" stroke-linecap="round"><path d="${forearm}" stroke="#283754" stroke-width="31"/><path d="${forearm}" stroke="#2d3950" stroke-width="25"/></g>`;
  return k.queue() + board + clerk + marta + k.pram(535+roll,612,1,(61+roll)*180/(Math.PI*29)) + pawel
    + paper('data',694 + advance - 27 * lower,338 + 26 * lower,-5)
    + (f < 13 ? page : '') + paper('urlop',746 + advance - 58 * lower,349 + 24 * lower,-4)
    + k.folder(646 + advance,392,128,-6,.71)
    + k.hand(592+advance,403,-111,.94,'hold')
    + (f >= 13 ? page : '') + sleeve
    + palm(pHandX,pHandY,pElbowX,pElbowY,1.09,pGrip)
    + palm(mHandX,mHandY,mElbowX,mElbowY,1.05,mGrip);
}
