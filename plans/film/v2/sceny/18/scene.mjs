import voices from '../../../montaz/assets/mowa.json' with {type:'json'};
import {printout} from '../10/scene.mjs';
import {martaHands, openCover} from '../16/scene.mjs';
import {groundShoe, heldShoeHand, lastFrame, martaEnd, pawelEnd, restingLegs, shoe} from '../17/scene.mjs';
import {leadingSheet} from '../19/scene.mjs';

const mix=(a,b,t)=>a+(b-a)*t;
const between=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
function ease(f,a,b) {
  const t=Math.max(0,Math.min(1,(f-a)/(b-a)));
  return t*t*(3-2*t);
}
const point=(pose,arm)=>[pose.x+arm[2]*pose.s,pose.y+arm[3]*pose.s];
const gr=(transform,svg)=>`<g transform="${transform}">${svg}</g>`;

function documents(k,f,lp,rp) {
  const drag=ease(f,22,49), pass=ease(f,8,29);
  const x=mix(608,688,drag), y=mix(516,493,drag);
  const tilt=Math.sin(Math.PI*drag);
  const cover=gr(`translate(${x} ${y-8*tilt}) scale(${1+.034*drag} ${1-.32*tilt}) translate(-608 -516)`,openCover());
  const swap=ease(f,28,42);
  const newCover=gr(`translate(${x} ${y-8*tilt}) scale(1 ${1-.32*tilt}) translate(-688 -493)`,k.folder(688,493,300,-3,1));
  const folder=`<g opacity="${Math.min(1,2*swap)}">${newCover}</g><g opacity="${Math.min(1,2*(1-swap))}">${cover}</g>`;

  const baseX=mix(670,819,drag), baseY=mix(503,465,drag);
  const stack=[0,1,2,3].map(i=>k.paper(baseX-i*1.2,baseY-i*2.4,mix(91,170,drag),mix(20,44,drag),-3-i*.5,.05)).join('');
  const filedX=547+95*pass+179*drag, filedY=514-9*pass-47*drag;
  const filedTurn=ease(f,23,42);
  const topX=mix(670,821,drag), topY=mix(503,449,drag);
  const topTurn=ease(f,29,47);
  function turnPage(cx,cy,turn,angle,height,type,back) {
    const projection=Math.cos(Math.PI*turn);
    const face=gr(`scale(1.5 ${height})`,printout(type));
    return gr(`translate(${cx} ${cy-20*Math.sin(turn*Math.PI)}) rotate(${angle}) scale(1 ${Math.max(.018,Math.abs(projection))})`,turn<.5?face:back);
  }
  const filed=turnPage(filedX,filedY,filedTurn,mix(3,-3,drag),1.02,'urlop',
    gr('rotate(3) translate(-821 -458)',leadingSheet(0)));
  const selected=turnPage(topX,topY,topTurn,-3,.92,'zasilek',k.paper(0,0,182,49,0,.08));
  const maskArm=(arm,w)=>`<path d="M${800+arm[0]*1.16} ${490+arm[1]*1.16}L${800+arm[2]*1.16} ${490+arm[3]*1.16}" stroke="black" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<defs><mask id="s18arms" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720"><rect width="1280" height="720" fill="white"/>${maskArm(lp,15)}${maskArm(rp,31)}</mask></defs>
    <g mask="url(#s18arms)">${folder}${stack}${f<24?selected+filed:filed+selected}</g>`;
}

export function scene(f,k) {
  if(f===0) return lastFrame(k);
  const lower=ease(f,0,18), release=ease(f,18,26), bend=Math.sin(Math.PI*lower);
  const reach=ease(f,10,23), drag=ease(f,22,49), lift=ease(f,23,40), press=ease(f,40,59);
  const shoeX=mix(942,858,lower)+15*bend, shoeY=mix(537,655.88,lower);
  const rightAtShoe=[mix(101,110,lower),mix(-31,40,lower),(shoeX-800)/1.16,(shoeY-490)/1.16];
  const elbowUp=[87,-53,59,-87], rightEnd=[61,-32,39,-93];
  const right=between(between(rightAtShoe,elbowUp,lift),rightEnd,press);
  const left=between(between(pawelEnd.left,[-87,-29,-156,9],reach),[-69,-42,-65,-35],drag);
  const pawel={...pawelEnd,lean:3+20*bend-7*drag,head:-17+6*bend+24*drag,
    gaze:mix(-1,-.42,ease(f,28,54)),gazeDown:1-press,brow:.53*(1-drag),
    mouth:mix(voices.pawel[1020+f],.03,ease(f,54,59)),left,right,
    leftGrip:f<21?'open':'pinch',rightGrip:f<=18?'hold':'open',legsSVG:f<50?restingLegs(release):undefined};
  const help=ease(f,8,29), withdraw=ease(f,29,51), notice=ease(f,32,41);
  const marta={...martaEnd,lean:13+5*help-15*withdraw,head:7+5*notice-7*press,
    gaze:.78+.22*ease(f,26,33)-.87*press,gazeDown:1-press,brow:.24+.2*notice-.44*press,mouth:.07*press,
    blink:ease(f,18,20)-ease(f,20,23),
    left:between(martaEnd.left,[-66,-36,-48,-10],withdraw),
    right:between(between(martaEnd.right,[107,-8,172,23],help),[65,-33,79,-5],withdraw),
    rightGrip:f<29?'pinch':'open'};
  const lining=1-ease(f,23,50);
  const feet=f<50?groundShoe(lining)+shoe(shoeX,shoeY,74*(1-lower),lining):'';
  const [lx,ly]=point(pawel,left);
  const fingers=f<21?'':k.hand(lx,ly,-10,1.16,'pinch',-1);
  return k.salon()+k.person('marta',marta)+k.person('pawel',pawel)+documents(k,f,left,right)
    +(f<51?martaHands(k,marta):'')+feet+(f<=18?heldShoeHand(k,pawel):'')+fingers;
}
