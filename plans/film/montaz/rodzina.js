import {createRig} from "./gesty";
import mouths from "./assets/mowa.json";
import Konva from "konva";
import { stagger } from "animejs";
import { World, Vec2, Box } from "planck";
import { SceneItem } from "scenejs";

const W=1280, H=720, ink="#33415c", tau=Math.PI*2;
const clip=x=>Math.min(1,Math.max(0,x));
const ease=x=>{x=clip(x);return x*x*(3-2*x)};
const mix=(a,b,p)=>a+(b-a)*p;
const art={
  birth:"montaz/assets/narodziny.png", pair:"montaz/assets/oboje.png", window:"montaz/assets/okienko.png", elbow:"montaz/assets/lokiec.png",
  queue:"referencje/kolejka-zus-v1.png", sofa:"referencje/kanapa-przed-fala-v1.png",
};
function path(ctx,d,fill,stroke,width=2) {
  const p=new Path2D(d);
  if(fill){ctx.fillStyle=fill;ctx.fill(p)}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p)}
}
// A fixed Planck simulation gives each released sheet its initial impulse and an independent arc.
function waveMotion(){
  const world=new World(Vec2(0,3.6));
  const delay=stagger(1.21);
  const bodies=[], snapshots=[];
  for(let f=0;f<=53;f++){
    for(let i=0;i<34;i++){
      const launch=i===0?0:Math.round(10+delay(null,i-1,33));
      if(f!==launch)continue;
      const side=i%2?1:-1, span=(i*17%23)/22;
      const body=world.createDynamicBody({position:Vec2(7.88,3.96),angle:(i%5-2)*.07});
      body.createFixture(Box(.19,.28),{density:.03,filterMaskBits:0});
      body.setLinearVelocity(Vec2(side*(1.4+4.2*span)-(i===0?1.4:0),-1.1-(i*7%13)*.33));
      body.setAngularVelocity(side*(.15+.54*span));
      bodies.push({body,i,launch});
    }
    snapshots.push(bodies.map(({body,i,launch})=>({i,x:body.getPosition().x*100,y:body.getPosition().y*100,
      angle:body.getAngle(),age:f-launch})));
    world.step(1/30);
  }
  return snapshots;
}
const wave=waveMotion();
const corner=new SceneItem({0:{bend:0},.23:{bend:10},.61:{bend:22},1:{bend:7}});
function page(ctx,x,y,w,h,rot,bend,variant=0){
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(w/110,h/146);
  const c=bend;
  path(ctx,`M-54 -65 Q-10 ${-75-c} 40 -70 L56 -55 Q47 -1 56 67 Q0 ${56+c} -52 70 Q-60 8 -54 -65Z`,"#fffefa",ink,1.8);
  path(ctx,"M40 -70l-1 14 17 1","#dce8df",ink,1.25);
  path(ctx,`M-39 -48 Q-3 ${-53-c*.55} 29 -49`,null,variant%4===1?"#698f7d":ink,3.4);
  for(let j=0;j<5;j++){
    const k=-26+j*16, end=j===4?15:37;
    if(variant%3===0)ctx.strokeRect(-39,k-4,6,6);
    path(ctx,`M${variant%3===0?-25:-39} ${k} Q-2 ${k-c*.34} ${end} ${k-1}`,null,"#7e899a",1.5);
  }
  ctx.restore();
}
function room(ctx,img,zoom=1,cx=.5,cy=.5){
  const w=W*zoom,h=H*zoom;
  ctx.drawImage(img,Math.max(W-w,Math.min(0,W/2-w*cx)),Math.max(H-h,Math.min(0,H/2-h*cy)),w,h);
}
function folder(ctx,x,y,w,r,photo){
  ctx.save();ctx.translate(x,y);ctx.rotate(r);ctx.scale(w/260,w/260);
  path(ctx,"M-130 -150 L97 -149 L130 -114 L127 150 L-127 151Z","#eddfb7",ink,3);
  path(ctx,"M97 -149l-1 36 34-1","#faf4df",ink,2);
  ctx.fillStyle="#fffdf7";ctx.fillRect(-93,-67,187,114);ctx.drawImage(photo,-86,-60,174,98);
  path(ctx,"M-92 67l183-2",null,"#b9ad91",1);
  ctx.restore();
}
const shots=[
  ["birth",1,.5,.5,1.14,.52,.54],["birth",1.72,.54,.66,2.00,.54,.65],null,
  ["queue",1.04,.46,.54,1.32,.38,.48],["queue",1.57,.414,.42,1.92,.42,.43],
  ["queue",2.04,.426,.426,1.81,.43,.36],["pair",1.72,.476,.73,1.52,.435,.66],
  ["pair",1.24,.427,.44,1.11,.45,.46],["pair",1.28,.74,.446,1.17,.64,.48],
  null,["queue",1.08,.48,.48,1.49,.73,.42],["window",1.05,.52,.5,1.18,.64,.5],
  ["window",1.79,.69,.69,2.08,.689,.70],["window",1.43,.685,.50,1.36,.64,.5],
  ["sofa",1.23,.56,.57,1.02,.5,.5],["sofa",1.79,.467,.548,1.97,.468,.558],
  ["sofa",1.54,.72,.58,1.72,.76,.62],["elbow",1.38,.64,.56,1,.5,.5]
];
export async function setupDrawing(element){
  const imgs=Object.fromEntries(await Promise.all(Object.entries(art).map(async ([key,src])=>{
    const im=new Image();im.src=src;await im.decode();return [key,im];
  })));
  const pose=createRig(imgs);
  const stage=new Konva.Stage({container:element,width:W,height:H,listening:false});
  const bg=new Konva.Layer({listening:false}), fg=new Konva.Layer({listening:false});stage.add(bg,fg);
  let frame=0;
  bg.add(new Konva.Shape({sceneFunc(context){
    const ctx=context._context,t=frame/30,shot=Math.floor(t/2),p=ease((t%2)/2);
    ctx.fillStyle="#f5faf7";ctx.fillRect(0,0,W,H);
    if(t>=38.44)return;
    if(t>=36){
      const blur=5.5*ease((t-37.70)/.17);
      ctx.save();ctx.filter=`blur(${blur}px)`;room(ctx,imgs.elbow,1.018);ctx.restore();return;
    }
    if(shot===2 || shot===9){room(ctx,imgs.queue,shot===9?1.32:1,.44,.5);return}
    const [key,z,x,y,z1,x1,y1]=shots[shot];
    const voice={marta:mouths.marta[frame],pawel:mouths.pawel[frame],pracownica:mouths.pracownica[frame]};
    room(ctx,pose(key,t,voice),mix(z,z1,p),mix(x,x1,p),mix(y,y1,p));
  }}));
  fg.add(new Konva.Shape({sceneFunc(context){
    const ctx=context._context,t=frame/30,shot=Math.floor(t/2),local=t%2;
    ctx.lineJoin="round";ctx.lineCap="round";
    if(t>=36 && t<38.44){
      const f=Math.min(52,frame-1080);
      for(const {i,x,y,angle,age} of wave[f]){
        const grow=ease(age/10), scale=(.20+grow*.8)*(.80+(i%5)*.12);
        const curl=Number(corner.getNowFrame(Math.min(1,age/25)).get("bend"));
        // Once a sheet catches the stack, its trailing edge follows the folded fan.
        const lane=((i*7)%17)/16, side=i%2?1:-1;
        const fan=ease(age/19), caught=.89*fan;
        const fanX=656+side*(45+lane*355);
        const fanY=485-135*lane+(i%3)*15;
        const fly=i<3;
        const px=fly?mix(788,x,.59):mix(x,fanX,caught);
        const py=fly?mix(396,y,.63):mix(y,fanY,caught);
        const tilt=fly?angle*.60:mix(angle,side*(.12+lane*.51),caught);
        page(ctx,px,py,(fly?99:128)*scale,(fly?133:155)*scale,tilt,curl+fan*13,i);
      }
    }
    if(shot===2){
      // The first photo frame reproduces the exact crop on frame 119, then reveals its sleeve.
      const p=ease((local-.13)/1.4), zoom=mix(2,1,p);
      const width=mix(W,66,p),height=width*9/16;
      const x=mix(W/2,573,p),y=mix(H/2,313,p);
      ctx.save();ctx.translate(x,y);ctx.rotate(-.15*p);
      ctx.fillStyle="#fffdf8";ctx.fillRect(-width*.53,-height*.58,width*1.06,height*1.16);
      ctx.save();ctx.beginPath();ctx.rect(-width/2,-height/2,width,height);ctx.clip();
      const sourceW=imgs.birth.width/zoom,sourceH=imgs.birth.height/zoom;
      ctx.drawImage(imgs.birth,(imgs.birth.width-sourceW)*.58,(imgs.birth.height-sourceH)*.80,sourceW,sourceH,-width/2,-height/2,width,height);
      const sweep=clip((local-.18)/.83);ctx.globalAlpha=.24*Math.sin(sweep*Math.PI);
      ctx.fillStyle="white";ctx.rotate(-.12);ctx.fillRect(-width*.8+sweep*width*1.46,-height*.8,width*.10,height*1.6);ctx.restore();ctx.restore();
    }
    if(shot===1 && local>1.8){
      ctx.fillStyle=`rgba(255,255,255,${.62*(1-clip((local-1.8)/.17))})`;ctx.fillRect(0,0,W,H);
    }
    if(shot===9){
      const p=ease(local/.46);ctx.fillStyle=`rgba(245,250,247,${.85*p})`;ctx.fillRect(0,0,W,H);
      ctx.save();ctx.translate(615,405+(1-p)*170);ctx.rotate(-.075);
      page(ctx,-228,15,365,495,-.13,12,2);page(ctx,83,-14,376,516,.12,11,1);
      ctx.fillStyle=ink;ctx.font="500 26px Inter";ctx.fillText("Okres urlopu",-345,-80);ctx.fillText("Podstawa",26,-110);ctx.fillText("Wysokość zasiłku",-10,28);
      for(const [x,y,w,d] of [[-345,-66,151,0],[27,-96,109,.39],[-9,41,192,.75]]){
        path(ctx,`M${x} ${y}q65 3 ${w*ease((local-d)/.31)} 0`,null,"#729980",4);
      }ctx.restore();
    }
    if(shot===12){
      const p=ease((local-.28)/.91);ctx.strokeStyle="#65876d";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(574,466);ctx.quadraticCurveTo(575+60*p,469,574+120*p,470);ctx.stroke();
    }
    if(t>=27.38 && t<28.74){
      const p=ease((t-27.38)/.37),q=ease((t-27.76)/.98);
      folder(ctx,380+291*q,380+51*q,345*(1-.65*q)*p,-.19+.22*q,imgs.birth);
    }
  }}));
  return (f)=>{frame=f;bg.draw();fg.draw()};
}
