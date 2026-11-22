import { cubicBezier } from '../../../montaz/node_modules/animejs/dist/modules/easings/cubic-bezier/index.js';
import { Vec2, World } from '../../../montaz/node_modules/planck/dist/planck.mjs';
import { SceneItem } from '../../../montaz/node_modules/scenejs/dist/scene.esm.js';

const press = cubicBezier(.45, 0, .45, 1);
const slip = cubicBezier(.42, .01, .23, 1);
const progress = (f, start, end) => Math.max(0, Math.min(1, (f - start) / (end - start)));
const mix = (a, b, t) => a + (b - a) * t;
const crease = new SceneItem({0:{bend:4},6:{bend:4},15:{bend:15},20:{bend:12},26:{bend:14},40:{bend:21},54:{bend:29}});

function pose(f, keys) {
  const i = keys.findIndex(key => key[0] >= f);
  if (i < 1) return (i === 0 ? keys[0] : keys.at(-1)).slice(1);
  const prev = keys[i - 1], next = keys[i];
  const p = press(progress(f, prev[0], next[0]));
  return prev.slice(1).map((v, j) => mix(v, next[j + 1], p));
}

const leftP = [[0,-69,-42,-65,-35],[6,-68,-43,-65,-37],[15,-91,-45,-119,-47],[22,-99,-45,-129,-49],[30,-112,-54,-151,-76],[38,-112,-58,-166,-88],[53,-113,-71,-183,-116]];
const rightP = [[0,61,-32,39,-93],[7,63,-24,43,-87],[15,60,-22,41,-81],[23,72,-27,55,-78],[36,80,-44,111,-71],[54,83,-59,120,-109]];
const rightM = [[0,65,-33,79,-5],[15,65,-33,79,-5],[21,69,-29,90,-12],[30,92,-34,132,-39],[39,107,-49,163,-67],[53,109,-59,174,-92]];

// Each small sheet leaves the same pile with its own initial impulse.
const looseSheets = [
  [24, -7.9, -7.7, -1.7, 83, 100], [28, 6.6, -8.4, 1.5, 86, 112],
  [31, -4.6, -10.9, -2.0, 60, 83], [33, 9.8, -8.4, 2.6, 113, 125],
].map(([start, vx, vy, turn, w, h]) => {
  const world = new World({gravity: new Vec2(0, 6.3)});
  const body = world.createDynamicBody({position: new Vec2(7.74,4.58), linearVelocity: new Vec2(vx,vy), angularVelocity: turn, angularDamping: .65, linearDamping: .14});
  const frames = [];
  for (let f = start; f <= 52; f++) {
    const p = body.getPosition();
    frames.push([p.x * 100,p.y * 100,body.getAngle() * 180 / Math.PI]);
    world.step(1 / 30);
  }
  return { start, w, h, frames };
});

// The rows describe the far and near banks of the travelling wave, from the knees outwards.
const sheets = [
  [18, 464,476,133,90,-19], [23,370,433,114,106,-29], [27,290,382,99,113,-39],
  [29,493,388,100,102,-20], [31,563,354,90,115,-17], [33,351,325,87,102,-30],
  [22,889,414,129,88,11], [26,966,366,91,108,29], [29,1033,343,100,120,30],
  [34,897,336,83,98,21], [35,747,340,85,107,14], [36,1100,402,109,115,35],
  [22,640,517,161,79,-8], [24,528,529,142,86,-19], [27,418,522,126,98,-28],
  [31,332,490,124,118,-35], [36,285,445,105,100,-44], [32,524,452,117,99,-24],
  [35,605,420,109,128,-13], [24,826,512,147,88,14], [29,933,485,135,105,20],
  [32,1023,458,129,111,29], [35,1089,435,104,113,44], [33,808,421,110,107,19],
];

function bank(k, f, items) {
  return items.map(([start, x, y, w, h, a],i) => {
    if (f < start) return '';
    const t = slip(progress(f, start, 55 + i % 4));
    const billow = Math.sin(t * Math.PI);
    return k.paper(mix(797,x,t),mix(465,y,t) + 38*billow,mix(118,w,t),mix(40,h,t),mix(-4,a,t),.12 + .5*billow + .24*t);
  }).join('');
}

// Broad curved edges and printed lines share the same bend as the sheet rises.
function leadingSheet(f) {
  const [x, y, w, h, a] = pose(f, [[0,821,458,165,43,-3],[8,821,458,165,43,-3],[14,799,455,167,51,-5],[22,753,447,170,65,-9],[30,682,432,177,78,-14],[36,630,421,183,101,-18],[43,605,387,195,122,-17],[54,654,302,208,166,9]]);
  const bend = crease.getNowFrame(f).get('bend');
  const lines = [[-22,19,26],[-22,25,18],[-17,39,44],[-17,52,47],[-17,66,32]];
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${w/100} ${h/100}) translate(0 -48)" stroke="#37455a" stroke-linecap="round" stroke-linejoin="round">
    <path d="M-50 5 Q-8 ${-bend} 48 5 Q39 39 53 93 Q10 ${77-bend/2} -44 98 Q-55 54 -50 5Z" fill="#fffdf6" stroke-width="2.2"/>
    <path d="M-50 5 Q-7 ${-bend} 48 5 Q39 22 35 27 Q3 ${5-bend} -50 5Z" fill="#dee6da" stroke-width="1.45"/>
    <path d="M-38 19 h9 v9 h-9z" fill="#718b77" stroke="none"/>
    ${lines.map(([l,y,len])=>`<path d="M${l} ${y} q${len*.48} ${-bend*.24} ${len} -1" fill="none" stroke="#79858a" stroke-width="1.6"/>`).join('')}
    <path d="M-32 36l6 -1 1 8 -6 1z M-31 50l6 -1 1 8 -6 1z M-30 64l6 -1 1 8 -6 1z" fill="none" stroke-width="1.15"/></g>`;
}

function actors(k, f, lp, rp) {
  const reaction = press(progress(f,16,32)), reach = press(progress(f,23,43));
  const effort = press(progress(f,0,12)), recoil = press(progress(f,18,43));
  return k.person('marta',{x:427,y:490,s:1.16,seat:true,lean:3+8*reach,head:5+7*reaction-4*reach,gaze:.13+.85*press(progress(f,13,21)),mouth:.07+.40*reaction,brow:.45*reaction,left:[-66,-36,-48,-10],right:pose(f,rightM),grip:'open'}) +
    k.person('pawel',{x:800,y:490,s:1.16,seat:true,lean:-4-5*effort+12*recoil,head:7+7*effort-21*recoil,gaze:-.42-.56*press(progress(f,13,22)),mouth:.03+.62*recoil,brow:-.58*effort+.99*recoil,left:lp,right:rp,leftGrip:f<20?'pinch':'open',rightGrip:'open'});
}

function room(k,f,blur) {
  const lp = pose(f,leftP), rp = pose(f,rightP);
  const [leX,leY,lhX,lhY] = lp.map((v,i)=>v*1.16+(i%2?490:800));
  const [reX,reY,rhX,rhY] = rp.map((v,i)=>v*1.16+(i%2?490:800));
  const armCut = `<path d="M${reX} ${reY} L${rhX} ${rhY}" stroke="black" stroke-width="31" stroke-linecap="round"/><path d="M${leX} ${leY} L${lhX} ${lhY}" stroke="black" stroke-width="15" stroke-linecap="round"/>`;
  const defs = `<defs><mask id="s19arm" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720"><rect width="1280" height="720" fill="white"/>${armCut}</mask><filter id="s19defocus" x="-3%" y="-3%" width="106%" height="106%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>`;
  const sheetsUp = looseSheets.map(({start,w,h,frames}) => {
    if (f < start) return '';
    const [x,y,a] = frames[f-start];
    const t = press(progress(f,start,start+12));
    return k.paper(x,y,mix(110,w,t),mix(38,h,t),a,.4+.25*Math.sin(t*2.4));
  }).join('');
  const chosenX = 821 - 59*press(progress(f,6,17)) - 15*press(progress(f,19,36));
  const chosenY = 449 - 17*press(progress(f,6,17)) + 59*press(progress(f,21,46));
  const chosen = k.paper(chosenX,chosenY,182,49,-3-11*press(progress(f,6,17))+18*press(progress(f,23,46)),.08+.40*press(progress(f,6,18)));
  const held = `<g mask="url(#s19arm)">${k.folder(688,493,300,-3,1)}${[0,1,2,3].map(i=>k.paper(819-i*1.2,465-i*2.4,170,44,-3-i*.5,.05)).join('')}${f<18?leadingSheet(f):''}${chosen}</g>`;
  const fingers = f<20?k.hand(lhX,lhY,-10,1.16,'pinch',-1):'';
  const lead = f>=18?leadingSheet(f):'';
  const wave = bank(k,f,sheets.slice(0,12)) + sheetsUp + bank(k,f,sheets.slice(12)) + lead;
  return defs + `<rect width="1280" height="720" fill="#f5faf7"/><g${blur? ' filter="url(#s19defocus)"':''}>${k.salon()}${actors(k,f,lp,rp)}</g>${held}${fingers}${wave}`;
}

export function frozenRoom(k) { return room(k,52,4); }

export function scene(f,k) {
  if (f>=53) return frozenRoom(k) + k.zusik(640,325,270,0);
  return room(k,f,f===52?2:0);
}
