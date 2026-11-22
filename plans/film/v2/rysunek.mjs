import {Group} from "../montaz/node_modules/konva/lib/Group.js";

const ink="#283754", dark="#2d3950", skin="#ffebdb", sage="#b2caad", pale="#dce8d8", stock="#f5faf7";
const path=(d,fill="none",stroke=ink,w=2.7)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const ellipse=(x,y,a,b,fill,stroke="none",w=2)=>`<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const group=(tr,body)=>`<g transform="${tr}">${body}</g>`;
const poseGroup=(x,y,s,a,body)=>group(`translate(${x} ${y}) rotate(${a}) scale(${s})`,body);
export function hand(x,y,angle=0,size=1,grip="open",side=1){
  const contours={
    open:"M-8 -6 Q-5 -13 0 -11 L9 -19 Q14 -22 13 -16 L6 -6 L18 -15 Q22 -16 20 -11 L11 -2 L23 -8 Q27 -8 24 -3 L14 5 L24 2 Q29 3 24 7 L12 14 Q3 18 -5 12 L-11 5Z",
    pinch:"M-9 -6 Q-3 -10 2 -12 L14 -18 Q19 -20 20 -16 Q20 -13 15 -11 L9 -7 Q16 -11 19 -7 Q20 -3 14 1 L10 8 Q6 14 0 12 L-10 6Z",
    hold:"M-10 -8 Q-4 -12 4 -13 Q8 -18 12 -16 L18 -11 Q22 -8 19 -4 L16 -1 Q18 4 13 6 Q12 12 6 12 L0 13 Q-7 12 -11 6Z",
    point:"M-9 -7 Q-3 -13 3 -11 L23 -14 Q31 -15 29 -10 L12 -4 Q17 -2 13 3 Q12 10 5 12 Q-2 15 -10 7Z"
  };
  const marks=grip==="hold"?"M4 -9l7 5m-9 1 7 4":grip==="pinch"?"M4 -2q3 -5 9 -6":grip==="point"?"M4 0l6 2":"M1 4q3 -3 6 -4";
  return group(`translate(${x} ${y}) rotate(${angle}) scale(${size*side} ${size})`,path(contours[grip]||contours.open,skin,ink,2.1)+path(marks,"none","#947c72",1.4));
}
function arm(sx,sy,a,color,grip,side){
  const [ex,ey,hx,hy]=a;
  const angle=Math.atan2(hy-ey,hx-ex)*180/Math.PI;
  // Sleeve silhouette follows the actual bend, with the cuff transverse to the wrist.
  const sleeve=`M ${sx} ${sy} Q ${(sx+ex)/2} ${(sy+ey)/2} ${ex} ${ey} L ${hx} ${hy}`;
  return path(sleeve,"none",ink,29)+path(sleeve,"none",color,24)+group(`translate(${hx} ${hy}) rotate(${angle})`,path("M-9 -11l4 1 0 20-4 1Z",stock,ink,1.6))+hand(hx,hy,angle+(side===1?5:-5),.86,grip);
}
function face(role,p){
  const female=role!=="pawel",clerk=role==="clerk", hair=clerk?"#7d8688":dark;
  const look=Math.max(-1,Math.min(1,p.gaze??.45)),blink=Math.max(0,Math.min(1,p.blink??0)),
    mouth=Math.max(0,Math.min(1,p.mouth??0)),b=p.brow??0;
  let s=female?ellipse(-39,-4,17,17,hair,ink,2.5):"";
  s+=path("M-34 -26 C-28 -54 17 -59 35 -33 Q48 -20 41 -1 Q44 14 32 29 Q21 45 1 42 Q-14 40 -24 25 Q-42 24 -42 8 Q-46 -2 -35 -5Z",skin);
  s+=female?path("M-36 5 Q-52 -11 -41 -32 Q-32 -51 -10 -54 Q22 -61 37 -38 Q46 -28 44 -15 Q29 -22 19 -33 Q4 -16 -23 -10 L-28 6 Q-32 0 -36 5Z",hair):
    path("M-36 2 Q-45 -6 -43 -21 L-55 -16 Q-50 -30 -36 -37 L-49 -34 Q-39 -47 -20 -49 Q0 -61 18 -50 Q10 -57 14 -58 Q49 -55 44 -18 L38 -7 Q31 -16 28 -27 Q12 -27 -1 -40 Q-9 -29 -24 -24 L-17 -34 L-30 -21Z",hair);
  s+=path("M-32 6q-11 -8 -12 3q0 10 13 13",skin,ink,2.2);
  for(const ex of [-9,22]){
    s+=path(`M${ex-6} ${-10+b*(ex<0?4:-4)}q5 -4 11 -2`,"none",hair,2.5);
    s+=blink>.84?path(`M${ex-4} 4q4 2 8 0`,"none",ink,2.5):ellipse(ex+look*3,4+3*Math.max(-1,Math.min(1,p.gazeDown??0)),2.8,4.8*(1-blink),ink);
  }
  s+=path("M13 7q3 7 1 9","none","#95857b",1.8);
  s+=mouth>.15?path(`M2 24q7 -2 14 -1q-5 ${4+mouth*9} -14 1Z`,dark,ink,1.4):path("M2 25q8 4 15 -1","none",ink,2.2);
  return s;
}
// The torso joint carries the head; hands can stay planted as the shoulders turn.
const torsoJoint=new Group(), headJoint=new Group({x:0,y:-177});
torsoJoint.add(headJoint);
const matrix=node=>"matrix("+node.getTransform().getMatrix().join(" ")+")";
export function person(role,p={}){
  const x=p.x??640,y=p.y??470,s=p.s??1,lean=p.lean??0;
  torsoJoint.rotation(lean);headJoint.rotation(p.head??0);
  const female=role!=="pawel",clerk=role==="clerk",coat=clerk?"#f6f4e7":female?sage:dark;
  const step=p.step??0, seated=p.seat??false;
  const ll=p.left??[-62,-63,-61,-24],rr=p.right??[63,-68,61,-25];
  const shirt=path("M-22 -127 Q0 -143 23 -126 L52 -113 46 -4 Q11 17 -47 4 L-51 -108Z","#fbf9f0");
  const jacket=path("M-22 -127 L-49 -116 Q-59 -111 -57 -92 L-51 -43 -58 5 Q-39 14 -17 8 L-12 -102Z",coat)+path("M20 -128 L48 -115 Q58 -111 56 -83 L50 -28 57 7 Q39 14 15 7 L12 -104Z",coat)
    +path("M-19 -121l-15 18 10 7-5 8m48 -34 14 19-9 7 5 7","none",clerk||female?ink:"#94a0a7",1.7);
  const neck=path("M-13 -150l2 26q12 13 25 -2l-3 -25Z",skin);
  const head=group(matrix(headJoint),face(role,p));
  let legs="";
  for(const side of [-1,1]){
    const fx=(seated?side*61:side*26)+step*side*29+(side===-1?p.footL??0:p.footR??0);
    const ky=seated?29:86, kx=seated?side*83:side*25+step*side*10;
    const fy=(seated?147:185)-Math.max(step*side,0)*17;
    legs+=path(`M${side*24-13} -2 Q${kx-18} ${ky-11} ${kx-15} ${ky+8} L${fx-10} ${fy} L${fx+11} ${fy} L${kx+17} ${ky+10} Q${kx+17} ${ky-2} ${side*24+15} -3Z`,female?"#f6f5ec":"#d0d9cf");
    legs+=path(`M${fx-11} ${fy-4}q11 5 21 -2l7 8q17 4 16 9l-46 1q-4 -5 2 -16Z`,side===1&&p.sock?"#fbf9f0":ink,ink,2);
  }
  const core=group(matrix(torsoJoint),shirt+jacket+neck+head);
  function shoulder(side){const point=torsoJoint.getTransform().point({x:side*52,y:-108});return [point.x,point.y]}
  const left=arm(...shoulder(-1),ll,coat,p.leftGrip??p.grip??"open",-1);
  const right=arm(...shoulder(1),rr,coat,p.rightGrip??p.grip??"open",1);
  return poseGroup(x,y,s,0,legs+core+left+right);
}
export function grasp(t=1,offsetX=0){
  const q=Math.max(0,Math.min(1,t));
  let a=group(`translate(${offsetX-35} 0)`,path("M435 48q-75 -3 -121 20l-123 32q-15 4 -15 14q2 12 18 10l91 -12q-16 17 -10 30q7 14 24 6l42 -20q51 9 94 0Z",skin));
  a+=path("M3 231l32 -63q23 -45 61 -47l40 -15q16 -5 28 6l8 26q-12 30 -37 42l-38 51Z",skin);
  for(let i=0;i<4;i++){
    const p=Math.max(0,Math.min(1,q*1.5-.14*i));
    const x=121+i*13,y=119-i*2;
    a+=group(`translate(${x} ${y}) rotate(${-28+25*p})`,path(`M-6 15Q-9 0 -6 -14Q-4 ${-30+12*p} 3 ${-30+15*p} Q${12+4*p} ${-32+21*p} ${9+4*p} ${-23+23*p} L7 6 Q5 18 -6 15Z`,skin,ink,2.1));
  }
  return a+path("M102 149q18 -8 25 -23q5 -14 14 -11q9 5 1 18l-11 17","none",ink,2.8);
}
export function folder(x,y,w=165,angle=0,open=0){
  const t=Math.max(0,Math.min(1,open));
  const left=-56-72*t;
  return poseGroup(x,y,w/118,angle,group(`scale(${118/(118+72*t)} ${1-.66*t}) translate(${36*t} 0)`,path(`M${left} -63l${-left-2} -5L42 -70l16 17-2 119-58 5-${-left-2} -5Z`,"#e9d5a6")
    +path("M42 -70l-2 18 17 0","#fff6d5",ink,1.6)+path(`M-2 -67l0 136`,"none","#baa77f",1.3)
    +group(`translate(${left*.85} -27) scale(.116)`,path("M-16 -14h431v259h-431Z","#fff9ec",ink,9)+grasp(1))));
}
export function paper(x,y,w=100,h=130,angle=0,fold=.2){
  const c=Math.max(0,Math.min(1,fold))*20;
  return group(`translate(${x} ${y}) rotate(${angle}) scale(${w/100} ${h/130})`,
    path(`M-49 -57Q-9 ${-68-c} 34 -61L49 -47Q40 8 48 60Q0 ${48+c} -49 63Q-55 11 -49 -57Z`,"#fffdf7",ink,1.9)+path("M35 -60l-2 15 16 -2","#dbe7dc",ink,1.2)+
    [-38,-20,-2,17,36].map((v,i)=>path(`M-36 ${v}q30 ${-c*.4} ${i===4?46:65} -3`,"none",i?"#87949c":"#647c72",i?1.6:3.5)).join(""));
}
export function pram(x,y,s=1,roll=0){
  let wheels="";
  for(const wx of [-62,72]){
    wheels+=group(`translate(${wx} 0) rotate(${roll})`,ellipse(0,0,29,29,"#f5f8f1",ink,6)+[0,45,90,135].map(a=>group(`rotate(${a})`,path("M-26 0h52","none",ink,2.2))).join("")+ellipse(0,0,4,4,ink));
  }
  return poseGroup(x,y,s,0,wheels+path("M-62 -3l121 -104M72 -2l-132 -100M-60 -85l-72 -68 -13 8","none",ink,7)+path("M-89 -103q71 -21 177 -4q-2 49 -34 52l-86 -1q-34 0 -57 -47Z","#f4f4e9")
    +path("M5 -108q3 -98 50 -97q47 6 48 86l-11 15Z",sage)+path("M10 -108q14 -77 47 -75q26 8 32 77Z","#e5eddc")
    +ellipse(32,-132,26,24,skin,ink,2)+path("M17 -134q3 3 6 0m10 0q3 3 6 -1","none",ink,1.6)
    +path("M-78 -109q58 -58 112 -8l6 12Z","#f9f8ed")+path("M-49 -113q23 -18 43 -17q23 4 39 17l-5 6q-35 -24 -68 2Z",sage,"none"));
}
const bg=()=>'<rect width="1280" height="720" fill="#f5faf7"/>';
export function salon(){
  return bg()+path("M0 600q592 -13 1280 0","none","#bfcac1",2)+path("M152 637l9 -68m890 64-9 -68","none",ink,9)
    +path("M116 510q5 -98 32 -115l18 -114q8 -43 45 -48q325 -22 731 0q35 3 42 39l21 126q46 0 50 60l-1 92q-4 36 -36 38l-869 1q-36 -2 -35 -50Z","#b7c9b3")
    +path("M162 453q244 -23 815 -2q34 0 37 39q-2 44 -37 44l-808 0q-22 -17 -7 -81Z","#cfddca")
    +path("M132 542q-9 -120 28 -133q37 -10 43 42l-3 101M976 545l-3 -93q1 -43 33 -46q43 -2 42 53","none","#819784",3)
    +path("M1117 594V186M1101 595h35","none",ink,5)+path("M1074 184l18 -77q25 -11 54 0l25 77q-48 9 -97 0Z","#ede6ce",ink,2)
    +path("M57 598H16","none","#bac8be",3)+pram(117,608,.72,0);
}
export function queue(){
  return bg()+path("M0 542h1280M0 565l1280 -8","none","#b8c8bc",2)
    +path("M20 78h269v201H20Z","#e8f1e9","#b6c7bd",2)+path("M151 80v194m-131 -70h270","none","#bbc8c0",3)
    +path("M880 87h373v282H880Z","#e9f0e7","#abbeb2",2)+path("M1091 84v264m-211 -78h373","none","#adbdaf",2)
    +path("M909 364h371v139H908Z","#d9e4d7","#829488",2)+path("M887 349h393v22H887Z","#b7cbb7",ink,2.5)
    +`<text x="1045" y="149" font-family="Inter" font-size="35" font-weight="650" fill="#607b69">ZUS</text>`
    +path("M394 85h102l8 8H396ZM682 85h98l6 8h-107Z","#fffdf5","#c9d3c7",1.5);
}
export function ward(){
  return bg()+path("M850 73h359v274H850Z","#e4eee6","#b5c6bb",2)+path("M1028 77v266m-176 -131h352","none","#c6d2c8",3)
    +path("M0 524Q168 370 350 378l399 112q90 16 266 88l126 137H0Z","#f1eddd",ink,3)
    +path("M17 453q60 -159 160 -181q111 -8 200 116q39 57 19 94q-65 67 -155 62Z","#fffdf5","#a6b6ab",2.5);
}
export function zusik(cx,cy,size,look=0){
  return `<svg x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" viewBox="320 294 1408 1408" overflow="visible" style="--look:${Math.max(-1,Math.min(1,look))*15}px"><use href="#oryginalny-zusik"/></svg>`;
}
export const kit={person,hand,grasp,folder,paper,pram,salon,queue,ward,zusik};
