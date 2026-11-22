import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { sampleShot } from "./sample.mjs";
import { delta, reach, angleKeys, gripKeys, pinWindow, endPose } from "./pose.mjs";
import { kit } from "../zestaw.mjs";

const dist=(a,b)=>Math.hypot(...a.map((p,i)=>p-b[i]));
const precision=1e-6;
export async function auditShot(id) {
  const maxima={lengthPct:0,angleStep:0,angleAccel:0,contactPx:0,footPx:0,girdle:0,cutPx:0,cutWorld:0};
  const fails=new Map(), prior=new Map(), planted=new Map(), frames=[];
  function check(key,value,limit,f,where) {
    assert.ok(Number.isFinite(value),`${id}/${f} ${where} ${key} is nonfinite`);
    maxima[key]=Math.max(maxima[key],value);
    if(value>limit+precision && value>(fails.get(key)?.value??0)) fails.set(key,{f,where,value,limit});
  }
  for(let f=0;f<60;f++) {
    const s=await sampleShot(id,f); frames.push(s);
    assert.ok(Object.keys(s.points).length,`${id}/${f} empty sample`);
    for(const [role,r] of Object.entries(s.rigs)) {
      assert.ok(r.legs,`${id}/${f} ${role} uses r1`);
      const p=s.actors[role], angles={torso:p.lean??0,head:(p.head??0)*90,neck:(p.nod??0)*25};
      for(const [i,side] of ["L","R"].entries()){
        const arm=r["arm"+side],leg=r.legs[i];
        for(const [chain,z1,z2,lengths,name] of [[arm,arm.upperZ??0,arm.depthZ,[r.b.L1,r.b.L2],"arm"+side],[leg,leg.z,leg.z,leg.lengths,"leg"+side]]) {
          if(p.legs===false && chain===leg) continue;
          for(const [j,[a,b,z]] of [[chain.S,chain.E,z1],[chain.E,chain.W,z2]].entries()) {
            const actual=Math.hypot(dist(a,b),z);
            check("lengthPct",Math.abs(actual/lengths[j]-1)*100,.49999,f,role+"."+name+j);
          }
          chain.angles.forEach((v,j)=>angles[name+j]=v);
        }
        check("girdle",dist(arm.S,r["sh"+side]),12,f,role+"."+side);
        const pole=p.poles?.[i?"right":"left"]??(i?1:-1);
        if(arm.angles[1]*pole<-.001) throw Error(`${id}/${f} ${role} elbow reversed (${side})`);
      }
      for(const [joint,value] of Object.entries(angles)){
        const key=(s.segment??"")+"."+role+"."+joint,old=prior.get(key);
        const speed=old?delta(old.value,value):undefined;
        if(old) check("angleStep",Math.abs(speed),20,f,key);
        if(old?.speed!=null) check("angleAccel",Math.abs(speed-old.speed),12,f,key);
        prior.set(key,{value,speed});
      }
    }
    const transfers={11:[36,39,"marta.gripR","pawel.gripL"],12:[13,17,"pawel.gripL","clerk.gripL"]};
    const transfer=transfers[id];
    if(transfer && f>=transfer[0] && f<=transfer[1]){
      const [a,b]=transfer.slice(2).map(key=>s.contacts.find(c=>c.role+"."+c.joint===key));
      assert.ok(a && b,`${id}/${f} both paper contacts required`);
      assert.equal(a.id,b.id,`${id}/${f} hands must share the attachment`);
      check("contactPx",dist(a.target,b.target),1,f,"handover target");
      check("contactPx",dist(s.points[transfer[2]],s.points[transfer[3]]),1,f,"handover");
    }
    for(const c of [...s.contacts,...s.supports]){
      const key=c.role+"."+c.joint, p=s.points[key];
      assert.ok(p,`${id}/${f} missing measured point ${key}`);
      const foot=s.supports.includes(c);
      check(foot?"footPx":"contactPx",dist(p,c.target),1,f,key+" "+c.id);
      if(foot){
        const entry=planted.get(key), contiguous=entry?.f===f-1 && entry.id===c.id;
        const anchor=contiguous?entry.anchor:c.worldTarget;
        const world=s.worldPoints[key], sc=Array.isArray(s.camera)?Math.hypot(s.camera[0],s.camera[1]):s.camera?.z??1;
        check("footPx",dist(anchor,world)*sc,1,f,key+" slide");
        planted.set(key,{f,id:c.id,anchor});
      }
    }
  }
  return {id,frames,maxima,fails};
}
export function auditCut(last,first) {
  const p=last.frames.at(-1),q=first.frames[0], offsets=q.cutOffsets??{};
  const a={...p.worldPoints,...p.worldProps}, b={...q.worldPoints,...q.worldProps};
  if(last.id===11 && first.id===12){
    assert.deepEqual(Object.keys(offsets),[],"The queue and window share one set");
    for(const old of p.contacts){
      const current=q.contacts.find(c=>c.role===old.role && c.joint===old.joint && c.id===old.id);
      assert.ok(current,`Lost cut contact: ${old.role}.${old.joint} ${old.id}`);
      assert.ok(dist(old.worldTarget,current.worldTarget)<=1,`Cut contact slid: ${old.id}`);
    }
  }
  const keys=q.cutKeys??Object.keys(a).filter(k=>b[k] && (!k.includes(".")||/\.(shoulder|elbow|wrist)/.test(k)));
  for(const key of keys) {
    assert.ok(a[key]&&b[key],`cut ${last.id}/${first.id} missing ${key}`);
    const offset=offsets[key.split(".")[0]]??[0,0];
    const transform=q.cutTransform??[1,0,0,1,0,0], [x,y]=a[key];
    const target=[transform[0]*x+transform[2]*y+transform[4]+offset[0],transform[1]*x+transform[3]*y+transform[5]+offset[1]];
    first.maxima.cutWorld=Math.max(first.maxima.cutWorld,dist(target.map((v,i)=>v-offset[i]),b[key]));
    const d=dist(target,b[key]);first.maxima.cutPx=Math.max(first.maxima.cutPx,d);
    if(d>4 && d>(first.fails.get("cutPx")?.value??0)) first.fails.set("cutPx",{f:0,where:key,value:d,limit:4});
  }
}
function selfCheck() {
  assert.equal(angleKeys(5,[[0,[175]],[10,[-175]]])[0],180);
  assert.equal(pinWindow(6,10,20),0);
  assert.equal(pinWindow(10,10,20),1);
  assert.throws(()=>pinWindow(6,10,20,2));
  const grip=gripKeys(8,[[0,"open"],[10,"pinch"]]);
  assert.ok(grip.thumb<grip.t && grip.t>0 && grip.t<1);
  const cacheKey={}, source=f=>({f});
  assert.equal(endPose(source,cacheKey),endPose(source,cacheKey));
  for(const role of ["marta","pawel","clerk"]) for(const view of [0,.5,1]){
    for(const down of [0,32]){
      const target=[615,388],pose=reach(role,{bodyView:view,x:640,y:480,s:1.2,leftGrip:grip,downPole:{left:down}},"left",target);
      const r=kit.rig(role,pose),arm=r.armL;
      assert.ok(dist(kit.joints(role,pose).gripL,target)<.1);
      assert.ok(Math.abs(Math.hypot(dist(arm.S,arm.E),arm.upperZ??0)-r.b.L1)<precision);
      assert.ok(Math.abs(Math.hypot(dist(arm.E,arm.W),arm.depthZ)-r.b.L2)<precision);
      assert.ok(!kit.person(role,pose).includes("NaN"));
    }
    const p=reach(role,{r2:true,x:0,y:0},"left",[-9999,-9999]),r=kit.rig(role,p);
    assert.ok(dist(r.armL.S,r.shL)<=12+precision);
    assert.ok(dist(kit.joints(role,p).gripL,[-9999,-9999])>1000);
  }
  console.log("OK · segmenty, kontakt, biegun, widoki, chwyt, okno i klatka 59");
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv.includes("--self")) { selfCheck(); process.exit(0); }
  const ids=process.argv.slice(2).flatMap(s=>s.split(",")).map(Number);
  if(!ids.length) ids.push(...Array.from({length:19},(_,i)=>i+1));
  let previous=null;
  for(const id of ids){
    const result=await auditShot(id);
    if(previous?.id===id-1) auditCut(previous,result);
    console.log(String(id).padStart(2,"0"),Object.entries(result.maxima).map(([k,v])=>k+"="+v.toFixed(2)).join(" "));
    for(const [metric,x] of result.fails){ console.error(`  ${metric} ${x.where} / ${x.f}: ${x.value.toFixed(2)} > ${x.limit}`);process.exitCode=1; }
    previous=result;
  }
}
