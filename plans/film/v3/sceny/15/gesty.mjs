// Author the free swing in joint angles. At a held key the endpoint is the prop-local
// attachment evaluated in the same frame as the drawing, including its turn/scale.
import {angleKeys,gripKeys,pinWindow,reach,spatialAngles} from "../../ruch/pose.mjs";

export function handTracks(makeFrame, tracks) {
  const cache = new WeakMap();
  function constrain(role, pose, side, target, weight=1) {
    return reach(role, pose, side, target, weight);
  }
  function build(k) {
    const keys={};
    for(const [role,hands] of Object.entries(tracks)) for(const [side,track] of Object.entries(hands)) {
      const stops=track.holds.flatMap(([a,b,id])=>[[a,id],[b,id]]);
      const knots=[...stops,...(track.free??[])].sort(([a],[b])=>a-b);
      keys[role+side]=knots.map(([f,goal])=>{
        const state=makeFrame(f,k), p=state.actors[role], name=side==='left'?'armL':'armR';
        p[side+'Grip']=gripKeys(f,track.grips);
        if(Array.isArray(goal)) return [f,goal];
        const arm=k.rig(role,goal==='entry'?p:constrain(role,p,side,state.targets[goal]))[name];
        return [f,p.downPole?.[side]?spatialAngles(arm):arm.angles];
      });
    }
    return keys;
  }
  return (f,k)=>{
    if(!cache.has(k)) cache.set(k,build(k));
    const keys=cache.get(k), state=makeFrame(f,k);
    for(const [role,hands] of Object.entries(tracks)) for(const [side,track] of Object.entries(hands)) {
      const p=state.actors[role], type=p.downPole?.[side]?'spatial':'angles';
      const keyed=angleKeys(f,keys[role+side]);
      const next={...p,[side+'Grip']:gripKeys(f,track.grips),[type]:{...p[type],[side]:keyed}};
      const held=track.holds.find(([a,b])=>f>=a&&f<=b);
      const near=held??track.holds.find(([a,b])=>f>a-4&&f<b+4);
      const target=near?state.targets[near[2]]:null;
      const posed=constrain(role,next,side,target??[p.x,p.y],near?pinWindow(f,near[0],near[1]):0);
      state.actors[role]=posed;
      if(held)state.contacts.push({role,joint:side==='left'?'gripL':'gripR',id:held[2],target});
    }
    return state;
  };
}
