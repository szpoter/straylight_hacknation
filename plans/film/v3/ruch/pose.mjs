// Degrees, screen axes (+y down). Angles below the root are relative to their parent bone.
const D = Math.PI / 180;
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const mix = (a,b,t) => a + (b-a)*t;
export const delta = (a,b) => ((b-a+540)%360+360)%360-180;
const vector = (a,l) => [Math.cos(a*D)*l,Math.sin(a*D)*l];
const add = (p,q) => [p[0]+q[0],p[1]+q[1]];
const angle = (p,q) => Math.atan2(q[1]-p[1],q[0]-p[0])/D;

export function angleKeys(f, keys) {
  const i = keys.findIndex(([n])=>n>=f);
  if(i===0 || i<0) return keys[i===0?0:keys.length-1][1];
  const [start,a]=keys[i-1], [end,b]=keys[i], t=ease((f-start)/(end-start));
  return a.map((v,j)=>v+delta(v,b[j])*t);
}

export function gripKeys(f, keys) {
  let current=keys[0][1];
  for(const [end,next] of keys.slice(1)) {
    if(f<=end-4) return current;
    if(f<end) return {from:current,to:next,t:ease((f-end+4)/4),thumb:ease((f-end+3)/3)};
    current=next;
  }
  return current;
}

export function gripPoint(points,g) {
  if(typeof g!=="object") return points[g]??points.open;
  return points[g.from].map((v,i)=>mix(v,points[g.to][i],g.t));
}

export function reach(role,pose,side,target,weight=1) {
  if(!["left","right"].includes(side) || !target.every(Number.isFinite)) throw Error("Invalid grip target for "+role);
  return {...pose,r2:true,pins:{...pose.pins,[side]:{target,weight}}};
}

// The analytic solve keeps one signed elbow pole even at full extension. The extra degrees
// below the straight-arm singularity keep angular velocity finite as a moving target reaches the limit.
function twoBone(root,target,a,b,pole) {
  const dx=target[0]-root[0], dy=target[1]-root[1], d=Math.hypot(dx,dy);
  const minimum=Math.sqrt(a*a+b*b+2*a*b*Math.cos(167*D));
  const maximum=Math.sqrt(a*a+b*b+2*a*b*Math.cos(15*D));
  const r=clamp(d,minimum,maximum), ux=d?dx/d:0, uy=d?dy/d:1;
  const slide=clamp(d-r,-12,12);
  const S=[root[0]+ux*slide,root[1]+uy*slide];
  const elbow=pole*Math.acos(clamp((r*r-a*a-b*b)/(2*a*b),-1,1))/D;
  const shoulder=Math.atan2(uy,ux)/D-Math.atan2(b*Math.sin(elbow*D),a+b*Math.cos(elbow*D))/D;
  return {S,shoulder,elbow};
}

export function spatialAngles(arm) {
  const upper=angle(arm.S,arm.E), lower=angle(arm.E,arm.W);
  const elevation=(a,b,z)=>Math.atan2(z??0,Math.hypot(b[0]-a[0],b[1]-a[1]))/D;
  return [upper,elevation(arm.S,arm.E,arm.upperZ),delta(upper,lower),elevation(arm.E,arm.W,arm.depthZ)];
}
function directedBone(az,elevation,len) {
  return [...vector(az,len*Math.cos(elevation*D)),len*Math.sin(elevation*D)];
}

// Keep a low elbow when carrying a sheet across the body. A pole with depth stays
// continuous as the hand passes in front of the shoulder (the planar solution flips there).
function lowElbow(root,b,pose,side,free,grip,pin,pole) {
  const scale=pose.s??1, left=side==="left", sign=left?(pose.leftFlip?-1:1):(pose.rightFlip?1:-1);
  const gx=grip[0]*b.hand/24, gy=grip[1]*sign*b.hand/24*Math.cos((pose.roll?.[side]??0)*D);
  const ext=b.L2+gx, length=Math.hypot(ext,gy);
  const x=(pin.target[0]-(pose.x??640))/scale,y=(pin.target[1]-(pose.y??470))/scale;
  const dx=x-root[0],dy=y-root[1],z=pose.downPole[side],d=Math.hypot(dx,dy,z);
  const axis=[dx/d,dy/d,z/d], max=b.L1+length-1;
  const slide=clamp(d-max,0,12), r=clamp(d-slide,Math.abs(b.L1-length)+1,max);
  const guide=[0,1,-.35], dot=axis.reduce((a,v,i)=>a+v*guide[i],0);
  const n=guide.map((v,i)=>v-dot*axis[i]), nl=Math.hypot(...n);
  const along=(b.L1**2-length**2+r*r)/(2*r), height=Math.sqrt(b.L1**2-along**2);
  const upper=axis.map((v,i)=>v*along+n[i]/nl*height);
  const extension=axis.map((v,i)=>v*r-upper[i]);
  const sz=clamp(extension[2]/ext,-1,1), projected=Math.sqrt(1-sz*sz);
  const a=Math.atan2(extension[1],extension[0])-Math.atan2(gy,projected*ext);
  const lower=[projected*Math.cos(a)*b.L2,projected*Math.sin(a)*b.L2,sz*b.L2];
  const w=clamp(pin.weight);
  const bone=(start,goal,len)=>{
    const v=start.map((x,i)=>mix(x,goal[i],w)), l=Math.hypot(...v);
    return v.map(x=>x/l*len);
  };
  const angles=pose.spatial?.[side]??[free.shoulder,0,free.elbow,0];
  const u=bone(directedBone(angles[0],angles[1],b.L1),upper,b.L1);
  const l=bone(directedBone(angles[0]+angles[2],angles[3],b.L2),lower,b.L2);
  const S=root.map((v,i)=>mix(free.S[i],v+axis[i]*slide,w)), E=add(S,u), W=add(E,l);
  const shoulder=angle(S,E);
  const flex=pole*Math.acos(clamp(u.reduce((a,v,i)=>a+v*l[i],0)/(b.L1*b.L2),-1,1))/D;
  const wrist=0;
  return {S,E,W,handProjection:Math.hypot(l[0],l[1])/b.L2,upperZ:u[2],depthZ:l[2],angles:[shoulder,flex,wrist],reach:slide?"shoulder":"ok"};
}

export function armChain(root,b,pose,side,input,grip) {
  const L=side==="left"; let wrist=pose.angles?.[side]?.[2]??pose[L?"wristL":"wristR"]??0;
  const pole=pose.poles?.[side]??(L?-1:1);
  const depth=pose.depth?.[side]??0, lower=b.L2*Math.cos(depth*D);
  const neutral=pose.angles?.[side];
  const free=neutral?{S:root,shoulder:neutral[0],elbow:neutral[1]}:twoBone(root,input.slice(2),b.L1,lower,pole);
  let {S,shoulder,elbow}=free;
  const pin=pose.pins?.[side];
  if(pin && pose.downPole?.[side]) return lowElbow(root,b,pose,side,free,grip,pin,pole);
  if(pin) {
    const scale=pose.s??1, target=[(pin.target[0]-(pose.x??640))/scale,(pin.target[1]-(pose.y??470))/scale];
    const sign=L?(pose.leftFlip?-1:1):(pose.rightFlip?1:-1);
    const [gx,gy]=[grip[0]*b.hand/24,grip[1]*sign*b.hand/24*Math.cos((pose.roll?.[side]??0)*D)];
    const direction=pose.handAngle?.[side];
    if(direction!=null) {
      const a=direction*D, endpoint=[target[0]-gx*Math.cos(a)+gy*Math.sin(a),target[1]-gx*Math.sin(a)-gy*Math.cos(a)];
      const ik=twoBone(root,endpoint,b.L1,lower,pole), w=clamp(pin.weight);
      S=S.map((v,i)=>mix(v,ik.S[i],w)); shoulder+=delta(shoulder,ik.shoulder)*w; elbow=mix(elbow,ik.elbow,w);
      wrist+=delta(wrist,delta(shoulder+elbow,direction))*w;
    } else {
    const x=lower+gx*Math.cos(wrist*D)-gy*Math.sin(wrist*D), y=gx*Math.sin(wrist*D)+gy*Math.cos(wrist*D);
    const offset=Math.atan2(y,x)/D;
    const solved=twoBone(root,target,b.L1,Math.hypot(x,y),pole);
    const w=clamp(pin.weight);
    S=S.map((v,i)=>mix(v,solved.S[i],w));
    shoulder+=delta(shoulder,solved.shoulder)*w;
    elbow=mix(elbow,solved.elbow-offset,w);
    }
  }
  const E=add(S,vector(shoulder,b.L1)), W=add(E,vector(shoulder+elbow,lower));
  return {S,E,W,depthZ:b.L2*Math.sin(depth*D),angles:[shoulder,elbow,wrist],reach:Math.hypot(S[0]-root[0],S[1]-root[1])>.01?"shoulder":"ok"};
}

export function legChain(b,root,foot,knee,pose,index) {
  const st=b.stand, thigh=Math.hypot(st.kneeX-b.hipJ[0],st.knee-b.hipJ[1]), shin=Math.hypot(st.ankleX-st.kneeX,st.ankle-st.knee);
  const side=index?"legR":"legL", authored=pose.angles?.[side];
  if(authored) {
    const K=add(root,vector(authored[0],thigh)), W=add(K,vector(authored[0]+authored[1],shin));
    return {S:root,E:K,W,z:0,angles:authored,lengths:[thigh,shin]};
  }
  // The knee bends toward camera in a seated/front view. Rotate its IK plane about the hip–ankle line.
  const dx=foot[0]-root[0],dy=foot[1]-root[1],d=Math.hypot(dx,dy),ux=d?dx/d:0,uy=d?dy/d:1;
  const r=clamp(d,Math.abs(thigh-shin)+.001,thigh+shin), slide=clamp(d-r,-12,12);
  const S=[root[0]+slide*ux,root[1]+slide*uy], W=[S[0]+r*ux,S[1]+r*uy];
  const along=(thigh*thigh-shin*shin+r*r)/(2*r), h=Math.sqrt(Math.max(0,thigh*thigh-along*along));
  const proj=clamp((knee[0]-S[0])*(-uy)+(knee[1]-S[1])*ux,-h,h);
  const K=[S[0]+ux*along-uy*proj,S[1]+uy*along+ux*proj],z=Math.sqrt(Math.max(0,h*h-proj*proj));
  const hip=angle(S,K), flex=Math.acos(clamp((r*r-thigh*thigh-shin*shin)/(2*thigh*shin),-1,1))/D;
  return {S,E:K,W,z,angles:[hip,flex,pose[index?"ankleR":"ankleL"]??0],lengths:[thigh,shin]};
}

const ends=new WeakMap();
export function endPose(motionFrame,k) {
  if(!ends.has(motionFrame)) ends.set(motionFrame,new WeakMap());
  const cache=ends.get(motionFrame);
  if(!cache.has(k)) cache.set(k,motionFrame(59,k));
  return cache.get(k);
}

export function attachment(prop,local) {
  const a=(prop.ang??prop.angle??0)*D,s=prop.s??1;
  return [prop.x+s*(local[0]*Math.cos(a)-local[1]*Math.sin(a)),prop.y+s*(local[0]*Math.sin(a)+local[1]*Math.cos(a))];
}

export function pinWindow(f,start,end,fade=4) {
  if(fade<3) throw Error("Contact ramp needs at least three frames");
  return ease((f-start+fade)/fade)*ease((end+fade-f)/fade);
}
