// 12 · Przy okienku. Próba r2: przekazanie narożnika, pauza na odczytanie, odłożenie druku.
import { cam, shoot, world, key, lips, mix, ss, span, rot, folderHold, HIP_Y } from "../07/kolejka.mjs";
import { Z_BL, motionFrame as previous } from "../11/scene.mjs";

import { reach, endPose, gripKeys, angleKeys, spatialAngles } from "../../ruch/pose.mjs";

export const CAM12 = { z: 1.8, cx: 885, cy: 254 };
export const TOUCH_F = 12, RELEASE_F = 18;
export const MARTA12 = 640, PAWEL12 = 850;
const toWorld = (sx, sy) => [CAM12.cx + (sx - 640) / CAM12.z, CAM12.cy + (sy - 360) / CAM12.z];
export const Z_FINAL = { ...(([x, y]) => ({ x, y }))(toWorld(816, 463)), ang: -10 };

export function zAt(f,entry={x:872,y:332,ang:6}) {
  if (f <= TOUCH_F) { const t = ss(span(f, 0, TOUCH_F)); return { x: mix(entry.x, 977, t), y: mix(entry.y, 285, t) - Math.sin(t * Math.PI) * 4, ang: mix(entry.ang, 2, t) }; }
  if (f <= 22) { const t = span(f, TOUCH_F, 22); return { x: mix(977, 980, t), y: mix(285, 285, t), ang: mix(2, 4, t) }; }
  if (f <= 36) { const t = ss(span(f, 22, 30)); return { x: mix(980, 992, t), y: mix(285, 300, t), ang: mix(4, 20, t) }; }
  const t = ss(span(f, 37, 53));
  return { x: mix(992, Z_FINAL.x, t), y: mix(300, Z_FINAL.y, t) - Math.sin(t * Math.PI) * 6, ang: mix(20, Z_FINAL.ang, t) };
}

function blocked12(f,k) {
  const g = 660 + f;
  const last=endPose(previous,k), exit=last.st.free[0], dx=PAWEL12-last.actors.pawel.x, dy=HIP_Y.pawel-last.actors.pawel.y;
  const entry={x:exit.x+dx,y:exit.y+dy,ang:exit.ang}, Z=zAt(f,entry);
  const place=(actor,x,y)=>{
    const p=last.actors[actor], tx=x-p.x,ty=y-p.y;
    const pins=Object.fromEntries(Object.entries(p.pins??{}).map(([side,pin])=>[side,{...pin,target:[pin.target[0]+tx,pin.target[1]+ty]}]));
    return {...p,x,y,pins};
  };
  // ── clerk: reaches with the screen-left hand, thumb on the printed side of the shared corner
  const edge = rot(Z.x, Z.y, Z.ang, ...Z_BL);
  let clerk = {
    ...last.actors.clerk, ...lips("clerk", g),
    head: key(f, [[0, -.45], [10, -.35], [23, -.2], [37, -.25], [53, -.55]]),
    nod: key(f, [[0, .1], [23, .25], [28, .5], [37, .45], [53, .1]]),
    gaze: key(f, [[0, -.8], [12, -.5], [23, -.6], [37, -.7], [53, -1]]),
    gazeDown: key(f, [[0, .1], [12, .5], [23, .9], [37, .8], [53, -.1]]),
    lean: key(f, [[0, 0], [12, -9], [22, -6], [36, -3], [53, -6]]), brow: key(f, [[20, 0], [30, -.15], [53, .1]]),
    smile: key(f, [[30, .3], [54, .5]]), leftGrip:gripKeys(f,[[0,"open"],[15,"pinch"]]),
    rightGrip:gripKeys(f,[[0,"open"],[22,"hold"]]),
  };
  const idle=k.joints("clerk",last.actors.clerk).gripL;
  const t=ss(span(f,1,TOUCH_F)), toward=[mix(idle[0],edge[0],t),mix(idle[1],edge[1],t)-Math.sin(t*Math.PI)*6];
  clerk={...clerk,downPole:{left:28}};
  clerk=reach("clerk",clerk,"left",toward);
  // ── Paweł: hands the print by its corner, lets go on 18, hand back to the folder
  const hip = [PAWEL12, HIP_Y.pawel];
  const F={...last.st.folder,x:last.st.folder.x+dx,y:last.st.folder.y+dy};
  let pawel={...place("pawel",...hip), ...lips("pawel",g),
    lean:key(f,[[0,last.actors.pawel.lean],[18,3],[30,0]]),
    head:key(f,[[0,last.actors.pawel.head],[16,.45],[26,.3],[40,.35]]),nod:key(f,[[0,last.actors.pawel.nod],[20,.2],[40,.25]]),
    gaze:key(f,[[0,.8],[20,.5],[40,.6]]),gazeDown:key(f,[[0,.1],[20,.4],[40,.5]]),
    leftGrip:gripKeys(f,[[0,"pinch"],[21,"open"],[35,"hold"]]),rightGrip:"hold"};
  const lastAngles=k.rig("pawel",last.actors.pawel).armL.angles;
  pawel.angles={...pawel.angles,left:angleKeys(f,[[0,lastAngles],[17,[55,-65,0]],[24,[111,-110,3]],[34,[143,-115,2]]])};
  pawel=reach("pawel",pawel,"right",folderHold(F));
  const top=edge;
  const back=rot(F.x,F.y,F.ang,-30,-44), ret=ss(span(f,17,36));
  const towardFolder=[mix(top[0],back[0],ret),mix(top[1],back[1],ret)-Math.sin(ret*Math.PI)*12];
  pawel=reach("pawel",pawel,"left",towardFolder);
  const inFolder=last.st.inFolder.map(p=>({...p,x:p.x+dx,y:p.y+dy}));
  // ── Marta: waits, then reads the title as it turns to her
  const marta={...place("marta",MARTA12,last.actors.marta.y),head:key(f,[[0,last.actors.marta.head],[20,.6],[40,.45]]),
    nod:key(f,[[0,last.actors.marta.nod],[37,.15],[53,.3]]),gaze:key(f,[[0,.8],[24,.6],[44,.5]]),
    gazeDown:key(f,[[0,0],[37,.2],[53,.45]]),brow:key(f,[[30,-.2],[53,-.4]])};

  const st = { disp: 17, marta, pawel, folder: F, inFolder, free: [{ id: "Z", ...Z }], clerk };
  const actors={marta,pawel,clerk};
  const contacts=[{role:"pawel",joint:"gripR",id:"folder.edge",target:folderHold(F)}];
  if(f<=17) contacts.push({role:"pawel",joint:"gripL",id:"Z.corner",target:top});
  if(f>=12) contacts.push({role:"clerk",joint:"gripL",id:"Z.corner",target:edge});
  if(f>=36) contacts.push({role:"pawel",joint:"gripL",id:"folder.cover",target:rot(F.x,F.y,F.ang,-30,-44)});
  const supports=[];
  for(const role of ["marta","pawel"]) for(const [i,joint] of ["ankleL","ankleR"].entries()){
    const p=actors[role];supports.push({role,joint,id:"floor",target:[p.x+p.feet[i][0],p.y+p.feet[i][1]]});
  }
  const cutOffsets={marta:[MARTA12-last.actors.marta.x,0],pawel:[dx,dy],clerk:[0,0],Z:[dx,dy],folder:[dx,dy]};
  return {st,actors,contacts,supports,props:{Z:[Z.x,Z.y],folder:[F.x,F.y]},cutOffsets,camera:cam(CAM12.z,CAM12.cx,CAM12.cy)};
}
const approaches=new WeakMap();
export function motionFrame(f,k) {
  const state=blocked12(f,k);
  if(f<=1 || f>=TOUCH_F) return state;
  if(!approaches.has(k)) {
    const keys=[1,TOUCH_F].map(n=>[n,spatialAngles(k.rig("clerk",blocked12(n,k).actors.clerk).armL)]);
    approaches.set(k,keys);
  }
  const p=state.actors.clerk, paper=state.st.free[0], corner=rot(paper.x,paper.y,paper.ang,...Z_BL);
  const pose=reach("clerk",{...p,spatial:{left:angleKeys(f,approaches.get(k))}},"left",corner,ss(span(f,8,12)));
  state.actors.clerk=state.st.clerk=pose;
  return state;
}
export function scene(f,k) {
  const {st,camera}=motionFrame(f,k);
  return shoot(camera,world(k,st));
}
