// b13 · counter world for shots 13–14 (global frames 720–839). One deterministic function of the global frame.
// World coordinates = the final frame of 14 (camera 1:1 from 14/48). Shot 13 and 14/0–33 view it through a closer
// camera (zoom 1.4 around world (830,330)); 14/34–48 pulls back to 1:1. The closed folder's path from 14/51 continues
// in 15 (see ../15/kanapa.mjs → folderDrop) so the cut 14/15 is on the same moving prop.
import { clamp, lerp, span, sm, smr, chan, tween, rot, r1, teczka, coverPt, teczkaPt, mouthAt, easeIn } from "../15/teczka.mjs";
import { folderDrop, PAWEL_DROP, SPINE14 } from "../15/kanapa.mjs";

import {handTracks} from "../15/gesty.mjs";
import {endPose,attachment} from "../../ruch/pose.mjs";
import {motionFrame as previous} from "../12/scene.mjs";

const INK = "#283754";
const HAND_INK = "#2D3950";             // handwriting: navy token (DESIGN.md on-surface navy) — do weryfikacji
// Clerk's voice envelope from media/dialog.flac, frames 720–839 (0–9).
const VOICE = "765686221212866641452103666511344420000000000002174497658886113654565117511576421765554245654200000000000000000000000000";

const S = 1.28;
const PAPER = { x: 1005, y: 388, w: 120, h: 150, a: -10 };   // ZASIŁEK standing on the counter, tilted to Marta
const SPINE = SPINE14, W = 150, FA = -4;                   // Paweł's open folder (hinge), panel width, angle
const PEN_REST = [952, 471];                                  // pen lying on the counter top by the paper's lower-left edge
// 13/0 = 12/59: centre (816,463) on screen, −10°, height 151 px → world (976.5,405.5), scale .786; the clerk turns it
// toward Marta and brings it forward (13/0–16) to the counter spot used in the rest of 13 and in 14.
// Express the previous set in the larger drawing units used at the counter.
const entryCache=new WeakMap();
function entry(k) {
  if(entryCache.has(k))return entryCache.get(k);
  const frame=endPose(previous,k), tx=790-frame.actors.pawel.x*S,ty=455-frame.actors.pawel.y*S;
  const map=([x,y])=>[x*S+tx,y*S+ty];
  const actors={};
  for(const [role,p] of Object.entries(frame.actors)) {
    const [x,y]=map([p.x,p.y]);
    const pins=Object.fromEntries(Object.entries(p.pins??{}).map(([side,pin])=>[side,{...pin,target:map(pin.target)}]));
    actors[role]={...p,x,y,s:(p.s??1)*S,pins};
  }
  const state={frame,actors,map,cutTransform:[S,0,0,S,tx,ty],z:map(frame.props.Z),folder:map(frame.props.folder),bar:map(frame.props.bar)};
  entryCache.set(k,state);return state;
}
const paperNow=(g,e)=>{
  const t=smr(g,720,739);
  return {x:lerp(e.z[0],PAPER.x,t),y:lerp(e.z[1],PAPER.y,t)-6*Math.sin(t*Math.PI),a:PAPER.a,sc:lerp(84*S/150,1,t),turn:lerp(64/84*150/120,1,t)};
};
const pp=(p,x,y)=>attachment({...p,ang:p.a},[x*p.sc*p.turn,y*p.sc]);
const DATE = { x: -50, y: 24, size: 15 }, LINE2 = { x: -46, y: 50, size: 15 };
const DATE_END = 21.4, LINE2_END = 10, HEAD_END = 20.6;   // Chrome getBBox (robocze/b13/mierz.mjs)                          // measured ink extents of the two handwritten strings (local px)

function camera(g,e) {
  const t=smr(g,814,828), u=smr(g,720,742), original=e.frame.camera;
  const start=e.map([original.cx,original.cy]);
  const z=lerp(lerp(original.z/S,1.32,u),1,t),cx=lerp(lerp(start[0],730,u),640,t),cy=lerp(lerp(start[1],335,u),360,t);
  return {z,cx,cy,tr:`translate(640 360) scale(${z}) translate(${-cx} ${-cy})`};
}

function pen(nib, ang = 128, len = 62) {                       // ang = direction nib → cap (deg)
  const [dx, dy] = rot(1, 0, ang), e = [nib[0] + dx * len, nib[1] + dy * len], m = [nib[0] + dx * 12, nib[1] + dy * 12];
  return `<path d="M${r1(m[0])} ${r1(m[1])}L${r1(e[0])} ${r1(e[1])}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`
    + `<path d="M${r1(m[0])} ${r1(m[1])}L${r1(e[0])} ${r1(e[1])}" stroke="#426358" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M${r1(nib[0])} ${r1(nib[1])}L${r1(m[0] - dy * 3.5)} ${r1(m[1] + dx * 3.5)}L${r1(m[0] + dy * 3.5)} ${r1(m[1] - dx * 3.5)}Z" fill="#E8ECF2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
}
const PEN_GRIP = 22;                                           // pinch point sits 22 px up the barrel from the nib

// Handwriting on the form: date always, "do jutra" revealed up to `wr` (0..1) of its ink width.
function form(k, cx, cy, a, wr, g, sc = 1, turn = 1) {
  let s = k.paper(cx, cy, PAPER.w, PAPER.h, a, { header: "ZASIŁEK", boxes: false });
  const id = "dj" + g;
  s += `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(a)})">`
    + `<text x="${DATE.x}" y="${DATE.y}" font-family="Domine, Georgia, serif" font-style="italic" font-weight="700" font-size="${DATE.size}" fill="${HAND_INK}" letter-spacing="-.4">11.01.2027</text>`
    + `<path d="M${DATE.x} ${DATE.y + 4}h${DATE_END - DATE.x + 2}" stroke="#98A6AC" stroke-width="1.2"/>`;
  if (wr > 0) s += `<clipPath id="${id}"><rect x="${LINE2.x - 2}" y="${LINE2.y - 20}" width="${r1((LINE2_END - LINE2.x + 4) * wr)}" height="28"/></clipPath>`
    + `<text clip-path="url(#${id})" x="${LINE2.x}" y="${LINE2.y}" font-family="Domine, Georgia, serif" font-style="italic" font-size="${LINE2.size}" fill="${HAND_INK}">do jutra</text>`;
  s += `</g>`;
  return sc === 1 && turn === 1 ? s : `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(a)}) scale(${r1(sc * turn * 1000) / 1000} ${r1(sc * 1000) / 1000}) rotate(${r1(-a)}) translate(${r1(-cx)} ${r1(-cy)})">${s}</g>`;
}

// ── timelines ──────────────────────────────────────────────────────────────────────────────────────────────
// Writing: nib path along the empty line under the date (paper-local), 14/2–23, lift between words 11–13.
function nibLocal(g) {
  const f = g - 780, y0 = LINE2.y - 2;
  if (f < 2) return [LINE2.x, y0 - 7 + 2 * span(f, 0, 2)];          // hovering ~5 px above (≈ 3 mm)
  if (f <= 23) {
    const w1 = span(f, 2, 11), w2 = span(f, 13, 23), gap = f > 11 && f < 13;
    const x = f < 11 ? lerp(LINE2.x, -18, w1) : f < 13 ? lerp(-18, -12, span(f, 11, 13)) : lerp(-12, LINE2_END, w2);
    const wig = Math.sin(f * 2.1) * 2;
    return [x, y0 + wig - (gap ? 5 : 0)];
  }
  return [LINE2_END + 10 * span(f, 24, 30), y0 - 40 * sm(span(f, 24, 32))]; // lifts away up-right
}
function writeReveal(g) { const f = g - 780; if (f < 2) return 0; if (f < 11) return span(f, 2, 11) * .4; if (f < 13) return .4; return lerp(.4, 1, span(f, 13, 23)); }

function clerkPose(g,e){
  const base=e.actors.clerk,t=smr(g,720,738);
  const look = tween([[720, { gaze: -.9, gazeDown: -.1, nod: .2 }], [726, { gaze: -.5, gazeDown: .6, nod: .45 }], [740, { gazeDown: .9, nod: .55 }],
    [752, { gazeDown: 1, nod: .62 }], [770, { gazeDown: 1, nod: .62 }], [800, { gazeDown: 1, nod: .66 }], [806, { gaze: -.9, gazeDown: .1, nod: .3 }],
    [812, { gaze: -.6, gazeDown: .7, nod: .5 }], [840, { gaze: -.6, gazeDown: .7, nod: .5 }]], g);
  return {...base,...look,x:lerp(base.x,1158,t),y:lerp(base.y,537,t),s:lerp(base.s,S,t),
    lean:lerp(base.lean,-12,t),head:lerp(base.head,-.42,t),bow:.15*t,mouth:mouthAt(VOICE,720,g)*.9};
}

function martaPose(g,e) {
  const look = tween([
    [720, { head: .45, nod: .35, gaze: .7, gazeDown: .2, brow: -.2 }],
    [735, { gaze: .7, gazeDown: .2 }], [740, { gaze: .8, gazeDown: .75 }], [745, { nod: .6, gazeDown: .8 }], [752, { nod: .62, gazeDown: .85 }],
    [804, { nod: .62, head: .42, gazeDown: .85 }], [806, { nod: .82 }], [808, { nod: .82 }], [813, { nod: .45, gazeDown: .5 }],
    [820, { head: .3, gaze: .3, gazeDown: .6, nod: .4 }], [832, { head: 0, gaze: -.1, gazeDown: .5, nod: .35 }]], g);
  return {...e.actors.marta,...look,blink:blink(g,[742,790,830])};
}
const blink = (g, at) => { for (const b of at) { const d = g - b; if (d >= 0 && d < 5) return [.5, 1, 1, .6, .2][d]; } return 0; };

// Paweł: standing, open folder at the chest; 14/24–33 takes the free left edge, inserts, closes, lowers.
function officeState(g,k) {
  const e=entry(k),cur=paperNow(g,e),clerk=clerkPose(g,e),marta=martaPose(g,e);
  const look = tween([[720, {}], [760, { gaze: .6, gazeDown: .5 }], [804, { head: .35, gazeDown: .5 }], [809, { head: .3, gaze: .7, gazeDown: .8 }],
    [822, { head: 0, gaze: 0, gazeDown: .9, nod: .5 }], [834, { head: -.3, gaze: -.4, gazeDown: .9, nod: .5, bow: .2 }]], g);
  const drop=smr(g,826,839),a=e.actors.pawel;
  const pawel={...a,...look,x:lerp(a.x,800,drop),y:lerp(a.y,444,drop),bow:lerp(.1,.25,drop),lean:lerp(0,-2,drop)};
  const feet=e.frame.supports.filter(c=>c.role==='pawel').map(c=>e.map(c.target));
  pawel.feet=feet.map(([x,y])=>[(x-pawel.x)/pawel.s,(y-pawel.y)/pawel.s]);
  const theta=chan([[730,0],[746,108],[820,108],[831,0]],g),move=smr(g,720,742);
  const ang=lerp(e.frame.st.folder.ang,FA,move),w=lerp(e.frame.st.folder.w*S,W,move),init=rot(-e.frame.st.folder.w*S/2,0,e.frame.st.folder.ang);
  let sx=lerp(e.folder[0]+init[0],SPINE[0],move),sy=lerp(e.folder[1]+init[1],SPINE[1],move);
  const offer=smr(g,804,812)-.5*smr(g,820,830); sx+=16*offer;
  let folder={sx,sy,theta,ang,w}, center=teczkaPt(sx,sy,w,ang,.5,0);
  if(g>=831){const d=folderDrop(g);folder={sx:d.sx,sy:d.sy,theta:0,ang:d.ang,w};center=d.c;}
  const take=smr(g,813,830),dst=teczkaPt(sx,sy,w,ang,.53,-6);
  const paper={...cur,x:lerp(cur.x,dst[0],take),y:lerp(cur.y,dst[1],take)-15*Math.sin(Math.PI*take),a:lerp(cur.a,ang,take),inFolder:take===1};
  const corner=pp(paper,-PAPER.w/2,PAPER.h/2),edge=pp(paper,PAPER.w/2,-PAPER.h*.05);
  const date=pp(paper,DATE_END+9,DATE.y-5),title=pp(paper,HEAD_END+9,-52);
  const scan=smr(g,734,751),n=nibLocal(Math.max(g,780)),nibOn=pp(cur,...n);
  const lift=smr(g,774,780),pang=lerp(176,128,lift);
  const nib=PEN_REST.map((v,i)=>lerp(v,nibOn[i],lift)), d=rot(PEN_GRIP,0,pang);
  const penAt=g>=774?{nib,ang:pang}:null;
  
  const pinOf=side=>{
    const t=e.actors.pawel.pins[side].target, offset=rot(t[0]-e.folder[0],t[1]-e.folder[1],-e.frame.st.folder.ang);
    return teczkaPt(folder.sx,folder.sy,folder.w,folder.ang,.5+offset[0]/(e.frame.st.folder.w*S),offset[1]*folder.w/(e.frame.st.folder.w*S));
  };
  const holdL=coverPt(folder.sx,folder.sy,folder.w,folder.ang,folder.theta,.70,-40);
  const startL=pinOf('left'),startR=pinOf('right'),coverMove=smr(g,720,738);
  const targets={
    'bar.l':e.bar,'Z.corner':corner, 'Z.edge':edge,
    'Z.title':[lerp(title[0],date[0],scan)+8*Math.sin(Math.PI*scan),lerp(title[1],date[1],scan)],
    'pen.barrel':[nib[0]+d[0],nib[1]+d[1]],
    'folder.cover':startL.map((x,i)=>lerp(lerp(x,holdL[i],coverMove),folderDrop(831).grip[i],smr(g,817,831))),
    'folder.edge':startR, 'folder.carry':folderDrop(Math.max(g,831)).grip,
  };
  const supports=e.frame.supports.map(c=>({...c,target:e.map(c.target)}));
  const state={g,e,cur,paper,folder,penAt,actors:{pawel,marta,clerk},contacts:[{role:'marta',joint:'gripL',id:'bar.l',target:e.bar}],supports,
    targets,props:{Z:[paper.x,paper.y],folder:center,bar:e.bar,pen:nib},camera:camera(g,e),cutTransform:g===720?e.cutTransform:undefined};
  return state;
}

const officeTracks={
  clerk:{
    left:{holds:[[720,732,'Z.corner'],[739,765,'Z.title'],[774,839,'pen.barrel']],grips:[[720,'pinch'],[737,'point'],[772,'open'],[776,'pinch']]},
    right:{holds:[[732,811,'Z.edge']],grips:[[720,'hold'],[724,'open'],[732,'pinch'],[816,'open']],free:[[720,'entry'],[825,[100,58,0]]]}
  },
  pawel:{
    left:{holds:[[720,829,'folder.cover'],[831,839,'folder.carry']],grips:[[720,'hold']]},
    right:{holds:[[720,795,'folder.edge'],[809,825,'Z.edge']],grips:[[720,'hold'],[799,'open'],[809,'pinch'],[832,'open']],free:[[839,[58,40,0]]]}
  }
};
export const officeMotion=handTracks(officeState,officeTracks);
export function okienko(state,k) {
  const {g,e,cur,paper,folder,penAt,actors:{pawel,marta,clerk}}=state;
  let w = k.queue({ counter: false });
  w += `<path d="M960 110H1280V470H960Z" fill="#E6EFEA" stroke="#A9BBAF" stroke-width="2.4"/><path d="M1120 110V470" stroke="#C9D6CD" stroke-width="2"/>`;
  w += `<path d="M1116 131H1250V187H1116Z" fill="${INK}" stroke="${INK}" stroke-width="2.2"/><text x="1183" y="173" text-anchor="middle" font-family="Inter, Arial" font-weight="700" font-size="36" fill="#A6D0B8" letter-spacing="1.4">A17</text>`;   // queue display = 07–12 (A17)
  w += k.person("clerk", { ...clerk, parts: "body" });
  w += k.queueCounter();
  w += k.person("clerk", { ...clerk, parts: "right" });            // holding hand behind the sheet (fingers at the back)
  const wr = writeReveal(g);
  if (!paper.inFolder && g < 813) w += form(k,paper.x,paper.y,paper.a,wr,g,paper.sc,paper.turn);
  if (!penAt) w += pen(PEN_REST, 176);
  const pram=e.frame.st.pram, at=e.map([pram.x,558]);
  w += k.pram(at[0],at[1],.95*S,{roll:pram.roll,breath:pram.breath});
  w += k.person("marta", marta);
  w += k.person("pawel", { ...pawel, parts: "body" });
  // folder with its papers (URLOP under; ZASIŁEK lands on top)
  let inner = "";
  const inP = teczkaPt(folder.sx, folder.sy, W, folder.ang, .5, 4);
  inner += k.paper(inP[0] - 4, inP[1] + 6, 112, 140, folder.ang + 3, { header: "URLOP", boxes: false });
  if (g >= 813) inner += form(k, paper.x, paper.y, paper.a, 1, g);
  w += teczka(k, folder.sx, folder.sy, folder.w, folder.ang, folder.theta, g >= 831 ? "" : inner);   // closed: papers hidden inside
  w += k.person("clerk", { ...clerk, parts: "left" });
  if (penAt) w += pen(penAt.nib, penAt.ang);
  w += k.person("pawel", { ...pawel, parts: "arms" });
  return `<g transform="${state.camera.tr}">${w}</g>`;
}
