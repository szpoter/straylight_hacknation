import voices from '../../../montaz/assets/mowa.json' with {type:'json'};

function ease(f, a, b) {
  const t = Math.max(0, Math.min(1, (f - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function counterRoom() {
  return `<rect width="1280" height="720" fill="#f5faf7"/>
    <g fill="#e7efe6" stroke="#becdbf" stroke-width="2.5">
      <path d="M20 75h312v223H20Z"/><path d="M173 76v220M22 217h307"/>
      <path d="M825 60h424v274H825Z"/><path d="M1091 61v272M827 238h420"/>
    </g>
    <path d="M0 525q315 2 601 -3M0 549l610 -4" fill="none" stroke="#c0cfc2" stroke-width="2"/>
    <text x="1143" y="142" font-family="Inter,sans-serif" font-size="37" fill="#617e6c" font-weight="650">ZUS</text>
    <path d="M915 460l-6 -100q2 -31 32 -33l59 -1q31 0 33 27l-2 110Z" fill="#becdbd" stroke="#8b9e90" stroke-width="3"/>`;
}

export function counterDesk() {
  return `<g stroke-linejoin="round"><path d="M569 529l711 -3v194H573Z" stroke="#748a7a" stroke-width="3" fill="#d4e1d3"/>
    <path d="M699 447l581 -2v93l-711 8 -13 -10Z" fill="#e5eddc" stroke="#40564c" stroke-width="3"/>
    <path d="M556 536l724 -9v13l-706 9 -18 -5Z" fill="#aabea8" stroke="#637c67" stroke-width="2"/>
    <path d="M602 572l3 148M1235 562v158" stroke="#bbcdbb" stroke-width="2"/></g>`;
}

export function benefitForm(x = 816,y = 463,angle = -10,depth = .78) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(1 ${depth})">
    <path d="M-93 -105Q-8 -113 73 -104L94 -84Q89 -5 94 105Q11 101 -92 110Q-96 18 -93 -105Z" fill="#fffdf7" stroke="#283754" stroke-width="2.7"/>
    <path d="M74 -103l-2 20 21 -1" fill="#dee8dc" stroke="#526a5b" stroke-width="1.6"/>
    <g fill="#395b4c" font-family="Inter,sans-serif"><text x="-74" y="-84" font-size="9.5" font-weight="650" letter-spacing="1.2">WNIOSEK</text>
    <text x="-74" y="-61" font-weight="750" font-size="23">ZASIŁEK</text>
    <text x="-73" y="-12" font-size="10.5">Podstawa</text></g>
    <path d="M-73 -48q61 -3 135 0M-72 9h104M-72 17h122M-74 74h125" stroke="#a0ada2" stroke-width="1.8" fill="none"/>
    <path d="M-73 -6q19 1 46 -1" stroke="#4b885f" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="-61" y="49" fill="#466252" font-family="Georgia,serif" font-size="19" font-style="italic" transform="rotate(-3 -61 49)">11.01.2027</text></g>`;
}

export function counterClerk(k, pose) {
  const reflected = ([ex,ey,wx,wy]) => [-ex,ey,-wx,wy];
  return `<defs><clipPath id="clerk-at-counter"><path d="M0 0h1280v446H1084v-6H880v8H0Z"/></clipPath></defs>
    <g clip-path="url(#clerk-at-counter)"><g transform="translate(1900 0) scale(-1 1)">${k.person('clerk',{
      x:950,y:477,s:1.53,seat:true,...pose,lean:-(pose.lean??0),head:-(pose.head??0),gaze:-(pose.gaze??0),
      left:reflected(pose.right),right:reflected(pose.left),leftGrip:pose.rightGrip,rightGrip:pose.leftGrip})}</g></g>`;
}

function arm(elbow, wrist, x,y,s) {
  return [(elbow[0]-x)/s,(elbow[1]-y)/s,(wrist[0]-x)/s,(wrist[1]-y)/s];
}

function palm(k, elbow, wrist, s, side, grip) {
  const angle = Math.atan2(wrist[1]-elbow[1],wrist[0]-elbow[0])*180/Math.PI + 5*side;
  return k.hand(...wrist, angle, .86*s, grip);
}

export function scene(f,k) {
  const pass = ease(f,0,11), take = ease(f,12,25), turn = ease(f,32,55), release = ease(f,16,32);
  const x = 614 + 39*pass + 169*take - 6*turn;
  const y = 429 - 3*pass - 34*take + 71*turn;
  const angle = 6 - 4*pass + 22*take - 34*turn;
  const depth = .76 + .13*take - .11*turn - .18*Math.sin(Math.PI*turn);
  const a = angle*Math.PI/180;
  function point(px,py) {
    return [x + px*Math.cos(a)-py*depth*Math.sin(a), y + px*Math.sin(a)+py*depth*Math.cos(a)];
  }
  const [pawelX,pawelY] = point(84,15), [rightX,rightY] = point(93,-52+45*take);
  const clerkWrist = [rightX+11+132*(1-pass),rightY+7-15*(1-pass)];
  const clerkElbow = [909-51*pass+99*take-8*turn,379+19*pass-12*take+6*turn];
  const pawelWrist = [pawelX+10 + (572-pawelX-10)*release,pawelY+8+(468-pawelY-8)*release];
  const pawelElbow = [608+25*pass-49*release,442+9*pass-17*release];
  const look = ease(f,13,22), meet = ease(f,44,54);
  const clerkGrip = f < 9 ? 'open' : 'pinch';
  const pawelGrip = f < 16 ? 'hold' : 'open';
  const marta = k.person('marta',{x:264,y:486,s:1.47,lean:6+4*turn,head:4+8*turn,gaze:1,gazeDown:.22+.78*turn,
    left:[-59,-43,-53,-15],right:[65,-46,67,-9],rightGrip:'hold'});
  const pawel = k.person('pawel',{x:503,y:494,s:1.45,lean:6+3*pass-7*release,head:7+4*pass-6*release,gaze:1,gazeDown:.5+.28*turn,
    left:[-63,-38,-66,-14],leftGrip:'hold',right:arm(pawelElbow,pawelWrist,503,494,1.45),rightGrip:pawelGrip});
  const clerk = counterClerk(k,{lean:-5-6*pass+6*take,head:-5-12*look+12*meet,gaze:-.8+.25*look-.45*meet,gazeDown:.15+.85*look-.92*meet,
    mouth:voices.pracownica[660+f],left:arm(clerkElbow,clerkWrist,950,477,1.53),leftGrip:clerkGrip,
    right:[74,-53,65,-36],rightGrip:'hold'});
  return counterRoom()+counterDesk()+clerk+marta+k.pram(402,654,.78,0)+pawel+k.folder(462,475,145,-6,.72)
    +k.hand(407.3,473.7,79,1.247,'hold')+benefitForm(x,y,angle,depth)
    +(f < 28 ? palm(k,pawelElbow,pawelWrist,1.45,1,pawelGrip) : '')
    +`<g transform="translate(1900 0) scale(-1 1)">${palm(k,[1900-clerkElbow[0],clerkElbow[1]],
      [1900-clerkWrist[0],clerkWrist[1]],1.53,1,clerkGrip)}</g>`;
}
