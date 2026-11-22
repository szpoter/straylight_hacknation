import voices from '../../../montaz/assets/mowa.json' with {type:'json'};
import {benefitForm, counterClerk, counterDesk, counterRoom} from '../12/scene.mjs';
import {forearm, localArm, pen} from '../13/scene.mjs';

const radians = Math.PI/180;
const mix = (a,b,t) => a + (b-a)*t;
const between = (a,b,t) => a.map((n,i) => mix(n,b[i],t));
function ease(f,a,b) {
  const t = Math.max(0,Math.min(1,(f-a)/(b-a)));
  return t*t*(3-2*t);
}

function onForm(x,y) {
  const a = -10*radians;
  return [816+x*Math.cos(a)-.78*y*Math.sin(a),463+x*Math.sin(a)+.78*y*Math.cos(a)];
}

// Each line starts with a pen lift. The final vertex of the visible ink also places the nib.
const letters = [
  [[0,0],[2,-4],[7,-7],[8,-5],[6,-1],[3,0],[2,-2],[4,-6],[8,-6],[14,-17],[12,-12],[8,-1],[10,0],[14,-4]],
  [[20,-6],[17,-7],[14,-4],[13,-1],[15,0],[18,-1],[21,-5],[20,-6],[19,-5],[21,-3],[24,-4]],
  [[33,-6],[36,-6],[32,4],[30,9],[27,11],[26,9],[28,6],[35,1],[39,-4]],
  [[39,-6],[37,-1],[38,0],[41,-1],[46,-6],[44,-1],[45,0],[50,-3]],
  [[53,-13],[49,-3],[49,0],[52,0],[55,-3],[58,-7],[59,-7],[58,-4],[63,-6],[65,-5]],
  [[72,-5],[69,-7],[66,-5],[64,-1],[65,0],[68,-1],[72,-6],[70,-1],[72,0],[78,-3]],
  [[33,-10],[34,-11]], [[48,-8],[56,-9]]
];
const segments = [];
let length = 0;
for (const stroke of letters) {
  for (let i=0;i<stroke.length;i++) {
    const a = segments.at(-1)?.b ?? stroke[0], b = stroke[i];
    const end = length + Math.hypot(b[0]-a[0],b[1]-a[1]);
    if (end>length) segments.push({a,b,start:length,end,draw:i>0});
    length=end;
  }
}
function writing(f) {
  const distance = length * Math.max(0,Math.min(1,(f-7)/16));
  let d='', last=letters[0][0];
  for (const s of segments) {
    if (distance<=s.start) break;
    last = between(s.a,s.b,Math.min(1,(distance-s.start)/(s.end-s.start)));
    if (s.draw) d+='M'+s.a.join(' ')+'L'+last.join(' ');
  }
  const ink = d ? '<path transform="translate(-56 74)" d="'+d+'" stroke="#245344" stroke-width="2.1" stroke-linecap="round" fill="none"/>' : '';
  return {ink,tip:onForm(last[0]-56,last[1]+74)};
}

export function scene(f,k) {
  const write = writing(f);
  const plant = ease(f,0,7), lift = ease(f,24,34);
  const nib = between(between([940,491],write.tip,plant),[959,442],lift);
  const right = [1016.22-84*plant+75*lift,400.91+26*plant-31*lift,nib[0]+22,nib[1]-28];
  const [ix,iy]=onForm(29,46);
  const hx = ix-.86*1.53*(29*Math.cos(165*radians)+12*Math.sin(165*radians));
  const hy = iy-.86*1.53*(29*Math.sin(165*radians)-12*Math.cos(165*radians));
  const firstLeft = [hx-68*Math.cos(170*radians),hy-68*Math.sin(170*radians),hx,hy];
  const [edgeX,edgeY] = onForm(93,-7);
  const relinquish = ease(f,29,40);
  const left = between(between(firstLeft,[936,405,edgeX+13,edgeY+7],plant),[909,398,938,422],relinquish);
  const clerksGrip = f<3?'point': f<32?'pinch':'open';
  const clerk = counterClerk(k,{lean:-9+5*lift,head:-19+13*lift,gaze:-1,gazeDown:1-.8*lift,
    mouth:voices.pracownica[780+f],left:localArm(left),right:localArm(right),leftGrip:clerksGrip,rightGrip:'hold'});

  const nod = ease(f,19,24)-ease(f,25,32), settle=ease(f,27,44);
  const marta=k.person('marta',{x:264,y:486+4*nod,s:1.47,lean:12+4*nod-5*settle,head:19+11*nod-12*settle,gaze:1,gazeDown:1-.7*settle,
    left:[-59,-43,-53,-15],right:[65,-46,67,-9],rightGrip:'hold'});

  const raise=ease(f,18,36), pack=ease(f,30,44), close=ease(f,44,52);
  const drop=Math.max(0,f-52);
  const fx=462+138*raise+drop, fy=475-63*raise-26*close+6*drop;
  const width=145+45*raise, angle=-6-2*raise, open=.72*(1-close);
  const fx0=816-214*pack, fy0=463-51*pack, depth=.78-.21*pack, paperScale=1-.21*pack;
  const doc = '<g transform="translate('+fx0+' '+fy0+') rotate('+(-10+2*pack)+') scale('+paperScale+')">'
    +benefitForm(0,0,0,depth)+'<g transform="scale(1 '+depth+')">'+write.ink+'</g></g>';

  const reach=ease(f,19,28), transfer=ease(f,35,47);
  const leftPaper = onForm(-92,8);
  const approach=[leftPaper[0]-13,leftPaper[1]+3];
  const wrap = between([fx0-99+27*pack,fy0+26-9*pack],[fx+61,fy-63],transfer);
  const wristR = between(between([572,468],approach,reach),wrap,ease(f,28,31));
  const elbowR = between(between([584,434],[639,430],reach),[wristR[0]+22,wristR[1]-22*Math.sqrt(3)],transfer);
  const wristL = between([407.3,473.7],[fx-52,fy+37],raise);
  const releaseL=ease(f,48,56);
  const lw=between(wristL,[469,486],releaseL);
  const elbowL=between([411.65,438.9],[477,437],raise);
  const arm=(e,w) => [(e[0]-503)/1.45,(e[1]-494)/1.45,(w[0]-503)/1.45,(w[1]-494)/1.45];
  const gripR=f<26?'open':'hold';
  const pawel=k.person('pawel',{x:503,y:494,s:1.45,lean:2+9*reach-8*close,head:8+3*reach-6*close,gaze:1,gazeDown:1,
    left:arm(elbowL,lw),right:arm(elbowR,wristR),leftGrip:f<50?'hold':'open',rightGrip:gripR});
  const folder=k.folder(fx,fy,width,angle,open);
  const overlap=f<44?doc:'';
  const frontRight=k.hand(...wristR,mix(Math.atan2(wristR[1]-elbowR[1],wristR[0]-elbowR[0])/radians+5,125,transfer),1.247,gripR);
  const leftAngle=Math.atan2(lw[1]-elbowL[1],lw[0]-elbowL[0])/radians-5;
  const frontLeft = f<54 ? k.hand(...lw,mix(79,leftAngle,raise),1.247,f<50?'hold':'open') : '';
  const zoom=1-ease(f,26,48);
  return '<g transform="translate('+(-130*zoom)+' '+(-90*zoom)+') scale('+(1+.24*zoom)+')">'+counterRoom()+counterDesk()+clerk+marta+k.pram(402,654,.78,0)+pawel
    +overlap+folder+frontLeft+frontRight+forearm(k,left,clerksGrip,-1)+forearm(k,right,'hold',1)+pen(right[2],right[3])+'</g>';
}
