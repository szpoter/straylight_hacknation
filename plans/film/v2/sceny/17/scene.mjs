import voices from '../../../montaz/assets/mowa.json' with {type:'json'};
import {restingRoom} from '../15/scene.mjs';
import {scene as previous, documentsAtRest, martaAtRest, martaHands, pawelAtRest} from '../16/scene.mjs';

const ink='#283754', scale=1.16;
const mix=(a,b,t)=>a+(b-a)*t;
const between=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
function ease(f,a,b) {
  const t=Math.max(0,Math.min(1,(f-a)/(b-a)));
  return t*t*(3-2*t);
}

// Origin at the heel gives the fingers the same pivot whether the foot or the hand carries it.
export function shoe(x,y,angle=0,lining=1) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})" stroke-linejoin="round" stroke-linecap="round">
    <path d="M0 0q11 5 21 -2l7 8q17 4 16 9l-46 1q-4 -5 2 -16Z" fill="${ink}" stroke="${ink}" stroke-width="2"/>
    <g opacity="${lining}"><path d="M1.5 1q9 4 17 -1q-5 8 -14 6Z" fill="#111c2c"/>
    <path d="M24 5l-4 2m8 1 -4 2m-24 3 42 -1" stroke="#819098" stroke-width="1.4" fill="none"/></g></g>`;
}

function leg(side,kx,ky,fx,fy) {
  return `<g stroke="${ink}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M${side*24-13} -2Q${kx-18} ${ky-11} ${kx-15} ${ky+8}L${fx-10} ${fy}L${fx+11} ${fy}L${kx+17} ${ky+10}Q${kx+17} ${ky-2} ${side*24+15} -3Z" fill="#d0d9cf" stroke-width="2.7"/>
    <path d="M${fx-11} ${fy-4}q11 5 21 -2l7 8q14 4 14 8l-42 1q-4 -5 0 -15Z" fill="#fbf9f0" stroke-width="2"/></g>`;
}

// The left ankle can slide back behind the shoe during the next shot.
export function restingLegs(t=0) {
  return leg(-1,mix(-89,-83,t),29,mix(-116,-61,t),147)+leg(1,83,29,61,147);
}
export const groundShoe=(lining=0)=>shoe(800+(-61-11)*scale,490+(147-4)*scale,0,lining);

export const martaEnd={...martaAtRest,head:7,gaze:.78,brow:.24};
export const pawelEnd={...pawelAtRest,lean:-10,head:-5,gaze:-1,gazeDown:1,brow:.53,
  mouth:voices.pawel[1019],left:[-64,-23,-53,2],
  right:[101,-31,(942-800)/scale,(537-490)/scale],rightGrip:'hold'};

export function heldShoeHand(k,pose) {
  const [ex,ey,hx,hy]=pose.right;
  const a=Math.atan2(hy-ey,hx-ex)*180/Math.PI+5;
  return k.hand(pose.x+hx*pose.s,pose.y+hy*pose.s,a,.86*pose.s,'hold');
}
function tableau(k,marta,pawel,legs,second,contact,lining) {
  return restingRoom(k)+k.person('marta',marta)+k.person('pawel',{...pawel,legsSVG:legs})
    +documentsAtRest(k)+martaHands(k,marta)+groundShoe(lining)+second+(contact?heldShoeHand(k,pawel):'');
}
export function lastFrame(k) {
  return tableau(k,martaEnd,pawelEnd,restingLegs(),shoe(942,537,74),true,1);
}

export function scene(f,k) {
  if(f===0) return previous(59,k);
  if(f===59) return lastFrame(k);
  const slip=ease(f,2,16), lift=ease(f,11,27), pull=ease(f,29,45);
  const settle=ease(f,31,53), look=ease(f,40,44), turn=ease(f,44,54);
  const brace=ease(f,4,22), bend=ease(f,5,27);
  const lx=mix(-61,-116,slip), ly=147-27*Math.sin(slip*Math.PI);
  const rx=61+26*lift-26*settle, ry=147-89*lift+89*settle;
  const legs=leg(-1,mix(-83,-89,slip),29,lx,ly)+leg(1,83+17*lift-17*settle,29-35*lift+35*settle,rx,ry);
  const wrist=[(942-800)/scale,(537-490)/scale];
  const grab=[76,54], reach=ease(f,8,27);
  const handle=between(between(pawelAtRest.right.slice(2),grab,reach),wrist,pull);
  const elbow=between(between(pawelAtRest.right.slice(0,2),[122,-1],reach),pawelEnd.right.slice(0,2),pull);
  const pawel={...pawelAtRest,lean:-7+45*bend-48*settle,head:-12+26*bend-19*turn,
    gaze:-.72+1.66*ease(f,0,11)-1.94*look,gazeDown:1,brow:.15*brace+.38*look,
    left:between(pawelAtRest.left,pawelEnd.left,brace),right:[...elbow,...handle],
    rightGrip:f>=27?'hold':'open',mouth:voices.pawel[960+f]};
  const marta={...martaAtRest,head:mix(martaAtRest.head,martaEnd.head,look),
    gaze:mix(martaAtRest.gaze,martaEnd.gaze,ease(f,35,39)),brow:mix(martaAtRest.brow,martaEnd.brow,turn),
    blink:ease(f,20,22)-ease(f,22,26)};
  const hx=f<28?800+(rx-11)*scale:800+handle[0]*scale;
  const hy=f<28?490+(ry-4)*scale:490+handle[1]*scale;
  const rotation=74*ease(f,29,48)+5*(ease(f,34,43)-ease(f,44,50));
  return tableau(k,marta,pawel,legs,shoe(hx,hy,rotation,reach),f>=27,slip);
}
