import voices from '../../../montaz/assets/mowa.json' with {type:'json'};
import {benefitForm, counterClerk, counterDesk, counterRoom} from '../12/scene.mjs';

function ease(f, start, end) {
  const t = Math.min(1, Math.max(0, (f-start)/(end-start)));
  return t*t*(3-2*t);
}

const rad = Math.PI/180;
const size = 1.53;

function pointOnForm(x,y) {
  const a = -10*rad;
  return [816 + x*Math.cos(a) - y*.78*Math.sin(a), 463 + x*Math.sin(a) + y*.78*Math.cos(a)];
}

export function localArm([ex,ey,wx,wy]) {
  return [(ex-950)/size,(ey-477)/size,(wx-950)/size,(wy-477)/size];
}

// The desk masks the body. Its two foreground sleeves must reach across the page.
export function forearm(k,[ex,ey,wx,wy],grip,side) {
  const angle = Math.atan2(wy-ey,wx-ex)/rad;
  return `<g fill="none" stroke-linecap="round"><path d="M${ex} ${ey}L${wx} ${wy}" stroke="#283754" stroke-width="${29*size}"/><path d="M${ex} ${ey}L${wx} ${wy}" stroke="#f6f4e7" stroke-width="${24*size}"/></g>
    <g transform="translate(${wx} ${wy}) rotate(${angle}) scale(${size})"><path d="M-9 -11l4 1v20l-4 1Z" fill="#f5faf7" stroke="#283754" stroke-width="1.6"/></g>`
    + k.hand(wx,wy,angle+side*5,.86*size,grip);
}

export function pen(wx,wy) {
  return `<g transform="translate(${wx} ${wy})" stroke-linejoin="round"><path d="M-22 28l4 -11 14 -17 5 4 -14 16ZM5 -11l12 -15q3 -2 5 2L10 -8Z" fill="#426358" stroke="#283754" stroke-width="2"/><path d="M-22 28l4 -11 5 3Z" fill="#d5c3a4" stroke="#283754" stroke-width="1.3"/></g>`;
}

export function scene(f,k) {
  const lift = ease(f,0,14), slide = ease(f,20,44);
  const [edgeX,edgeY] = pointOnForm(93,-7);
  const startX = edgeX+13, startY = edgeY+7;
  const startAngle = Math.atan2(startY-401,startX-886)/rad;
  const angle = startAngle+(170-startAngle)*lift;
  const handAngle = (angle-5)*rad;
  const [tipX,tipY] = pointOnForm(25+4*slide, -67+113*slide);
  const endX = tipX-.86*size*(29*Math.cos(handAngle)+12*Math.sin(handAngle));
  const endY = tipY-.86*size*(29*Math.sin(handAngle)-12*Math.cos(handAngle));
  const wx = startX+(endX-startX)*lift;
  const wy = startY+(endY-startY)*lift-16*Math.sin(Math.PI*lift);
  const length = Math.hypot(startX-886,startY-401)*(1-lift)+68*lift;
  const left = [wx-length*Math.cos(angle*rad),wy-length*Math.sin(angle*rad),wx,wy];
  const ready = ease(f,22,49);
  const right = [950+74*size-47*ready,477-53*size+5*ready,950+65*size+(962-950-65*size)*ready,477-36*size+(463-477+36*size)*ready];
  const leftGrip = f < 9 ? 'pinch' : 'point';
  const eyes = ease(f,23,45), head = ease(f,27,49);
  const clerk = counterClerk(k,{lean:-5-4*lift,head:-5-8*lift-6*slide,gaze:-1,gazeDown:.08+.65*lift+.27*slide,
    mouth:voices.pracownica[720+f],left:localArm(left),leftGrip,right:localArm(right),rightGrip:'hold'});
  const marta = k.person('marta',{x:264,y:486,s:1.47,lean:10+2*head,head:12-6*lift+13*head,gaze:1,gazeDown:1-1.3*lift+1.3*eyes,
    left:[-59,-43,-53,-15],right:[65,-46,67,-9],rightGrip:'hold'});
  const pawel = k.person('pawel',{x:503,y:494,s:1.45,lean:2,head:5+3*slide,gaze:1,gazeDown:.78+.22*slide,
    left:[-63,-38,-66,-14],leftGrip:'hold',right:[81/1.45,-60/1.45,69/1.45,-26/1.45],rightGrip:'open'});
  return '<g transform="translate(-130 -90) scale(1.24)">'+counterRoom()+counterDesk()+clerk+marta+k.pram(402,654,.78,0)+pawel
    +k.folder(462,475,145,-6,.72)+k.hand(407.3,473.7,79,1.247,'hold')+benefitForm()
    +forearm(k,left,leftGrip,-1)+forearm(k,right,'hold',1)+pen(right[2],right[3])+'</g>';
}
