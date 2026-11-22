import voices from '../../../montaz/assets/mowa.json' with {type:'json'};
import {printout} from '../10/scene.mjs';
import {restingFolder, restingRoom} from '../15/scene.mjs';

const mix = (a,b,t) => a + (b-a)*t;
const between = (a,b,t) => a.map((n,i) => mix(n,b[i],t));
function ease(f,a,b) {
  const t=Math.max(0,Math.min(1,(f-a)/(b-a)));
  return t*t*(3-2*t);
}

const martaStart={x:427,y:490,s:1.16,seat:true,lean:3,head:6,gaze:.9,gazeDown:.9,
  left:[-64,-40,-49,-8],right:[66,-23,85,1]};
const pawelStart={x:800,y:490,s:1.16,seat:true,lean:-4,head:-9,gaze:-.85,gazeDown:1,
  left:[-64,-35,-64,-8],right:[74,-46,48,-7]};
export const martaAtRest={...martaStart,lean:13,head:12,gaze:.95,gazeDown:1,brow:.52,
  left:[-47,-16,31,9],right:[90,-4,96,31],leftGrip:'open',rightGrip:'pinch'};
export const pawelAtRest={...pawelStart,lean:-7,head:-12,gaze:-.72};

export function martaHands(k,pose) {
  const palm=(arm,grip,side) => {
    const [ex,ey,wx,wy]=arm;
    const angle=Math.atan2(wy-ey,wx-ex)*180/Math.PI+5*side;
    const a=pose.lean*Math.PI/180;
    const sx=side*52*Math.cos(a)+108*Math.sin(a), sy=side*52*Math.sin(a)-108*Math.cos(a);
    const line=`M${sx} ${sy}L${ex} ${ey}L${wx} ${wy}`;
    return `<g transform="translate(${pose.x} ${pose.y}) scale(${pose.s})">
      <g stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="${line}" stroke="#283754" stroke-width="29"/>
      <path d="${line}" stroke="#b2caad" stroke-width="24"/></g>
      <path transform="translate(${wx} ${wy}) rotate(${angle-5*side})" d="M-9 -11l4 1v20l-4 1Z" fill="#f5faf7" stroke="#283754" stroke-width="1.6"/>
      ${k.hand(wx,wy,angle,.86,grip)}</g>`;
  };
  return '<defs><clipPath id="s16-sleeves"><path d="M453 447H780V593H453Z"/></clipPath></defs><g clip-path="url(#s16-sleeves)">'
    +palm(pose.left,pose.leftGrip??'open',-1)+palm(pose.right,pose.rightGrip??'open',1)+'</g>';
}

export function openCover() {
  return `<g transform="translate(608 516) rotate(-3)" stroke-linejoin="round">
    <path d="M-145 -40Q-74 -49 -15 -46L118 -49l25 13-2 83q-75 -2 -149 3l-132 3Z" fill="#ead6aa" stroke="#283754" stroke-width="2.8"/>
    <path d="M-15 -44l3 92m124 -96 -2 12 31 1" fill="none" stroke="#b19c74" stroke-width="2"/>
    <path d="M-138 30q47 0 114 -9l3 22-116 5Z" fill="#dac393" stroke="#b19c74" stroke-width="1.3"/>
    </g>`;
}

function contents(spread) {
  const leftX=mix(624,547,spread), leftY=mix(506,514,spread)-8*Math.sin(Math.PI*spread);
  const sheet=(x,y,a,sy,kind) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(1.5 ${sy})">${printout(kind)}</g>`;
  return openCover()+sheet(670,503,-3,.92,'zasilek')+sheet(leftX,leftY,mix(-6,3,spread),1.02+.17*Math.sin(Math.PI*spread),'urlop');
}
export const documentsAtRest=() => contents(1);

function documents(k,open,spread) {
  if (!open) return restingFolder(k);
  if (open===1) return contents(spread);
  const theta=open*Math.PI, cos=Math.cos(theta), sin=Math.sin(theta);
  const sx=cos>=0?cos:.36*cos;
  const left=533+185*Math.max(0,sx)-83*open;
  const far=721+41*open;
  const face=cos>=0?restingFolder(k):'<path d="M522 481l160 -15 29 9 8 95-178 16Z" fill="#eedeb9" stroke="#283754" stroke-width="2.8"/>';
  return `<defs><clipPath id="s16-opening"><rect x="${left}" y="390" width="${far-left}" height="230"/></clipPath></defs>
    <g clip-path="url(#s16-opening)">${contents(spread)}</g>
    <g opacity="${1-ease(open,.76,1)}" transform="translate(533 526) matrix(${sx} ${-.49*sin} 0 1 0 0) translate(-533 -526)">${face}</g>`;
}

export function scene(f,k) {
  if(f===0) return restingRoom(k)+k.person('marta',martaStart)+k.person('pawel',pawelStart)+restingFolder(k);
  if(f===59) return restingRoom(k)+k.person('marta',martaAtRest)+k.person('pawel',pawelAtRest)+documentsAtRest(k)+martaHands(k,martaAtRest);
  const plant=ease(f,0,11), grab=ease(f,3,14), open=ease(f,15,33), collect=ease(f,31,39);
  const spread=ease(f,39,50), release=ease(f,48,56), turn=ease(f,50,57);
  const sine=Math.sin(open*Math.PI), cosine=Math.cos(open*Math.PI);
  const front=38*(cosine>=0?cosine:.36*cosine);
  const onLid=[85,-6,(533+front-427)/1.16,(547-.49*38*sine-490)/1.16];
  const left=between(between(martaStart.left,[-46,1,84,13],plant),martaAtRest.left,release);
  const right=between(between(between(martaStart.right,onLid,grab),[85,-7,165,11],collect),martaAtRest.right,spread);
  const marta={...martaStart,lean:3+18*plant-8*release,head:6+5*plant-7*collect+8*turn,
    gaze:.9-.72*collect+.77*ease(f,48,53),gazeDown:.9+.1*plant,brow:.52*collect,
    blink:ease(f,26,28)-ease(f,28,31),mouth:voices.marta[900+f],left,right,
    leftGrip:f<10||f>51?'open':'hold',rightGrip:f<13?'open':'pinch'};
  const look=ease(f,35,48);
  const pawel={...pawelStart,lean:-4-3*look,head:-9-3*look,gaze:-.85+.13*look};
  return restingRoom(k)+k.person('marta',marta)+k.person('pawel',pawel)+documents(k,open,spread)+martaHands(k,marta);
}
