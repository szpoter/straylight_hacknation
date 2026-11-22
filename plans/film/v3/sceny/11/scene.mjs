// 11 · Ich numerek. Próba r2: Marta łapie dolny lewy narożnik; Paweł przejmuje ten sam narożnik w 36–39.
import { cam, shoot, world, key, curve, step, lips, breath, mix, ss, span, rot, centreFor, gripBar, rollDeg, folderHold } from "../07/kolejka.mjs";
import { clerkIdle, PRAM_X } from "../07/scene.mjs";
import { marta09, pramX, extras09 } from "../09/scene.mjs";
import { pawel10 } from "../10/scene.mjs";

import { reach, angleKeys, gripKeys, pinWindow, spatialAngles } from "../../ruch/pose.mjs";

export const Z_BL = [-32, 42];
export const CATCH = [505, 388], CATCH_F = 24, TAKE_F = 36, LET_F = 40;
export const Z_END = { x: 796, y: 330, ang: 6 };                 // 11/59 (12/0 continues from here)

const zAng = f => f <= CATCH_F ? key(f, [[0, -15], [10, -21], [CATCH_F, -29]]) : f <= 39 ? key(f, [[25, -29], [39, -7]]) : key(f, [[40, -7], [59, 6]]);
// bottom-left corner path while falling (0–24): continues the 10/59 velocity (≈ −1, +3 px/frame), drifts left
const blFall = f => [curve(f, [[0, 611.8], [8, 596], [16, 562], [CATCH_F, CATCH[0]]]), curve(f, [[0, 316.4], [8, 345], [16, 372], [CATCH_F, CATCH[1]]])];
// Marta's grip on the corner while she lifts it (25–40)
const martaGrip = f => [curve(f, [[25, CATCH[0]], [32, 524], [39, 540]]), curve(f, [[25, CATCH[1]], [32, 352], [39, 328]])];
// Paweł's grip on the corner (36–59)
const pawelGripEnd = () => rot(Z_END.x, Z_END.y, Z_END.ang, Z_BL[0], Z_BL[1]);

function blocked11(k, f) {
  const g = 600 + f;
  // pram: still until 42, then Marta rolls it 25 px after Paweł
  const px = pramX(59) + key(f, [[42, 0], [59, 25]], t => t * t * (3 - 2 * t));
  // ── Marta
  const m0 = marta09(k, 59, 539);
  const mx = key(f, [[13, m0.x], [24, m0.x + 50], [42, m0.x + 50], [59, m0.x + 72]]);
  const [fa, la] = step(f, 13, 21, m0.x - 13, m0.x + 30, 6), [fb, lb] = step(f, 17, 25, m0.x + 13, m0.x + 70, 6);
  const [fa2, la2] = step(f, 44, 52, m0.x + 30, m0.x + 52, 5), [fb2, lb2] = step(f, 50, 58, m0.x + 70, m0.x + 92, 5);
  const footA = f < 44 ? [fa, la] : [fa2, la2], footB = f < 50 ? [fb, lb] : [fb2, lb2];
  let marta = {
    ...m0, x: mx, ...lips("marta", g),
    head: key(f, [[9, .7], [12, .95], [16, .7], [24, .55], [36, .7], [44, .85]]),
    nod: key(f, [[9, .3], [12, .05], [18, .35], [26, .25], [38, .1]]),
    gaze: key(f, [[6, .6], [9, 1], [14, .3], [30, .6], [40, .8]]), gazeDown: key(f, [[6, .3], [9, -.2], [14, .6], [26, .3], [40, 0]]),
    lean: key(f, [[13, 5], [24, 15], [30, 13], [40, 6], [50, 4]]), bow: key(f, [[13, .18], [24, .34], [34, .2], [44, .12]]),
    twist: key(f, [[13, .3], [24, .45], [44, .3]]), brow: key(f, [[14, -.2], [22, .2], [40, -.1]]),
    feet: [[footA[0] - mx, 180 + footA[1]], [footB[0] - mx, 180 + footB[1]]],
    knees: [[(footA[0] - mx) * .5 - 6, 96 + footA[1] * .5], [(footB[0] - mx) * .5 + 6, 96 + footB[1] * .5]],
  };
  const Z=zAt(f), barL=gripBar(px,.55), barR=gripBar(px,.35);
  const corner=rot(Z.x,Z.y,Z.ang,...Z_BL);
  marta={...marta,r2:true,angles:{
    left:angleKeys(f,[[0,[104,-22,0]],[12,[108,-32,0]],[18,[106,-56,4]]]),
    right:angleKeys(f,[[0,[65,55,0]],[13,[61,57,1]],[18,[38,58,4]],[24,[32,49,6]],[40,[16,56,6]],[48,[48,56,2]],[56,[72,27,0]]])},
    leftGrip:gripKeys(f,[[0,"hold"],[14,"open"],[20,"hold"]]),
    rightGrip:gripKeys(f,[[0,"hold"],[17,"open"],[28,"pinch"],[44,"open"],[56,"hold"]])};
  marta=reach("marta",marta,"left",barL,pinWindow(f,19,120,7));
  const onBar=pinWindow(f,-60,12,6), onPaper=pinWindow(f,24,39,8);
  if(onBar) marta=reach("marta",marta,"right",barR,onBar);
  else if(onPaper) marta=reach("marta",marta,"right",f<24?CATCH:corner,onPaper);
  // ── Paweł
  const p0 = pawel10(k, 59, 599);
  const hx = key(f, [[40, p0.pose.x], [59, p0.pose.x + 62]]);
  const [ra, rl] = step(f, 41, 50, p0.pose.x + p0.pose.feet[1][0], p0.pose.x + p0.pose.feet[1][0] + 62, 8);
  const [la3, ll] = step(f, 49, 58, p0.pose.x + p0.pose.feet[0][0], p0.pose.x + p0.pose.feet[0][0] + 62, 8);
  let pawel = {
    ...p0.pose, x: hx, ...lips("pawel", g),
    head: key(f, [[9, .12], [12, .55], [24, .1], [30, -.35], [40, -.1], [46, .5]]),
    nod: key(f, [[9, .6], [12, .1], [22, .35], [32, .2], [46, .05]]),
    gaze: key(f, [[6, .25], [9, 1], [14, -.4], [24, -.8], [40, -.3], [46, .8]]),
    gazeDown: key(f, [[6, .9], [9, -.1], [14, .4], [28, .5], [44, .1]]),
    lean: key(f, [[24, -2], [34, -11], [40, -9], [50, 2], [58, 4]]), brow: key(f, [[10, -.5], [26, -.2], [46, -.3]]),
    feet: [[la3 - hx, 204 + ll], [ra - hx, 204 + rl]],
    knees: [[(la3 - hx) * .6, 108 + ll * .4], [(ra - hx) * .55, 108 + rl * .4]],
  };
  // folder rides with the hips; the left hand keeps it
  const dx = hx - p0.pose.x;
  const F = { ...p0.F, x: p0.F.x + dx };
  const shift = o => ({ ...o, x: o.x + dx });
  pawel={...pawel,r2:true,angles:{left:angleKeys(f,[[0,[76,-129,2]],[22,[76,-129,2]],[27,[102,-111,2]],[32,[181,-102,-1]],[37,[254,-143,-3]],[53,[129,-115,0]]])},
    leftGrip:gripKeys(f,[[0,"point"],[29,"open"],[39,"pinch"]]),rightGrip:"hold"};
  pawel=reach("pawel",pawel,"right",folderHold(F));
  pawel.downPole={left:36};
  const pass=ss(span(f,25,36)), guide=[mix(p0.tip[0],corner[0],pass),mix(p0.tip[1],corner[1],pass)-Math.sin(Math.PI*pass)*14];
  pawel=reach("pawel",pawel,"left",guide);
  // ── ZASIŁEK
  function zAt(ff) {
    const a = zAng(ff);
    if (ff <= CATCH_F) { const c = centreFor(blFall(ff), a, Z_BL[0], Z_BL[1]); return { x: c[0], y: c[1], ang: a }; }
    if (ff < LET_F) { const c = centreFor(martaGrip(Math.min(ff, 39)), a, Z_BL[0], Z_BL[1]); return { x: c[0], y: c[1], ang: a }; }
    // Paweł carries it: grip path from where he took it to the end grip (Z_END)
    const g39 = martaGrip(39);
    const ge = pawelGripEnd(), t = ss(span(ff, 40, 58));
    let gp = [mix(g39[0], ge[0], t), mix(g39[1], ge[1], t) - Math.sin(t * Math.PI) * 10];
    if (ff > 58) gp = [ge[0] + (ff - 59) * 2, ge[1]];                 // last two frames: 820 → 822 (2 px/frame)
    if (ff === 58) gp = [ge[0] - 2, ge[1]];
    const c = centreFor(gp, a, Z_BL[0], Z_BL[1]);
    return { x: c[0], y: c[1], ang: a };
  }

  const inFolder = p0.inFolder.filter(p => p.id !== "Z").map(shift);
  return { g, px, marta, pawel, F, inFolder, Z };
}

const approaches=new WeakMap();
export function state11(k,f){
  const state=blocked11(k,f);
  if(f<=25 || f>=36) return state;
  if(!approaches.has(k)){
    const keys=[25,36].map(n=>[n,spatialAngles(k.rig("pawel",blocked11(k,n).pawel).armL)]);
    approaches.set(k,keys);
  }
  const p=state.pawel, weight=ss(span(f,32,36)),target=rot(state.Z.x,state.Z.y,state.Z.ang,...Z_BL);
  state.pawel=reach("pawel",{...p,spatial:{left:angleKeys(f,approaches.get(k))}},"left",target,weight);
  return state;
}
export function motionFrame(f,k) {
  const s = state11(k, f);
  const ex = extras09(59);
  const st = {
    disp: f < 6 ? 16 : 17, marta: s.marta, pawel: s.pawel, folder: s.F, inFolder: s.inFolder, free: [{ id: "Z", ...s.Z }],
    clerk: { ...clerkIdle(s.g),r2:true,legs:false,downPole:{left:28}, head: key(f, [[6, -.25], [12, -.45]]), gaze: key(f, [[6, -.4], [12, -.8]]) },
    pram: { x: s.px, roll: rollDeg(s.px - PRAM_X), breath: breath(s.g) }, lady: ex.lady, bob: ex.bob,
  };
  st.clerk=reach("clerk",st.clerk,"left",[1040,364]);
  const contacts=[{role:"pawel",joint:"gripR",id:"folder.edge",target:folderHold(s.F)}];
  const add=(role,joint,id,target)=>contacts.push({role,joint,id,target});
  if(f<=12) add("marta","gripR","bar.r",gripBar(s.px,.35));
  if(f>=19) add("marta","gripL","bar.l",gripBar(s.px,.55));
  if(f>=24 && f<=39) add("marta","gripR","Z.corner",rot(s.Z.x,s.Z.y,s.Z.ang,...Z_BL));
  if(f>=36) add("pawel","gripL","Z.corner",rot(s.Z.x,s.Z.y,s.Z.ang,...Z_BL));
  if(f<=25) { const p=s.inFolder.find(p=>p.id==="P"); add("pawel","gripL","P.heading",rot(p.x,p.y,p.ang,16,-36)); }
  const actors={marta:s.marta,pawel:s.pawel,clerk:st.clerk};
  const supports=[];
  for(const [role,windows] of [["marta",[[[0,13],[21,44],[52,59]],[[0,17],[25,50],[58,59]]]],
    ["pawel",[[[0,49],[58,59]],[[0,41],[50,59]]]]]) {
    windows.forEach((ranges,i)=>{ const window=ranges.find(([a,b])=>f>=a && f<=b);
      if(window) { const p=actors[role],foot=p.feet[i];
        supports.push({role,joint:i?"ankleR":"ankleL",id:"floor."+window[0],target:[p.x+foot[0],p.y+foot[1]]}); }
    });
  }
  return {st,actors,contacts,supports,props:{Z:[s.Z.x,s.Z.y],folder:[s.F.x,s.F.y]},camera:cam(1,640,360)};
}
export function scene(f,k){
  const {st,camera}=motionFrame(f,k);
  return shoot(camera,world(k,st));
}
