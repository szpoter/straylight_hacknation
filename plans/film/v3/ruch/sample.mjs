import { kit } from "../zestaw.mjs";

const joints=["shoulder","elbow","wrist","grip","knee","ankle"].flatMap(n=>[n+"L",n+"R"]);
export const project=(p,c)=>{
  if(Array.isArray(c)) return [c[0]*p[0]+c[2]*p[1]+c[4],c[1]*p[0]+c[3]*p[1]+c[5]];
  const z=c?.z??1;
  return [640+(p[0]-(c?.cx??640))*z,360+(p[1]-(c?.cy??360))*z];
};
const modules=new Map();
export async function sampleShot(id,f) {
  const n=String(id).padStart(2,"0");
  if(!modules.has(n)) modules.set(n,import(`../sceny/${n}/scene.mjs`));
  const mod=await modules.get(n);
  if(!mod.motionFrame) throw Error("Missing motionFrame in shot "+n);
  return sampleFrame(mod.motionFrame(f,kit));
}
export function sampleFrame(frame) {
  const {actors={},camera,visible={},details={},contacts=[],supports=[],props={}}=frame;
  const worldPoints={...details},rigs={};
  for(const [role,pose] of Object.entries(actors)) {
    const js=kit.joints(role,pose);
    rigs[role]=kit.rig(role,pose);
    for(const joint of visible[role]??joints) {
      if(pose.legs===false && /^(ankle|knee)/.test(joint)) continue;
      worldPoints[role+"."+joint]=js[joint];
    }
  }
  const map=(entries,fn)=>Object.fromEntries(Object.entries(entries).map(([key,v])=>[key,fn(v)]));
  const points=map(worldPoints,p=>project(p,camera));
  const screen=c=>({...c,target:project(c.target,camera),worldTarget:c.target});
  return {...frame,rigs,worldPoints,points,worldProps:props,props:map(props,p=>project(p,camera)),contacts:contacts.map(screen),supports:supports.map(screen)};
}
