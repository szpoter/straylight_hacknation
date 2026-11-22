import React from "react";
import {createRoot} from "react-dom/client";
import {flushSync} from "react-dom";
import {Player} from "@remotion/player";
import {gsap} from "gsap";
import Konva from "konva";
import {Product} from "./produkt";
import {setupDrawing} from "./rodzina";

async function setup(){
  Konva.pixelRatio=1.5;
  const shots=[...document.querySelectorAll("section.clip")];
  const plane=document.querySelector("#plane")!;
  const draw=await setupDrawing(document.querySelector("#drawing"));
  const player=React.createRef<any>();
  flushSync(()=>createRoot(document.querySelector("#product")!).render(
    <Player component={Product} ref={player} compositionWidth={1280} compositionHeight={720} durationInFrames={1800}
      fps={30} controls={false} showPosterWhenUnplayed={false} style={{width:1280,height:720,background:"transparent"}}/>
  ));
  await Promise.all(["36px Inter","60px Domine"].map(font=>document.fonts.load(font,"Paweł, urlop rodzicielski")));
  let last=-1;
  const frameClock={get frame(){return last},set frame(value){
    const f=Math.max(0,Math.min(1799,Math.round(value)));
    if(f===last)return;
    const shot=Math.floor(f/60);
    if(Math.floor(last/60)!==shot)shots[shot].appendChild(plane);
    if(f<1155 || last<1155)draw(f);
    flushSync(()=>player.current.seekTo(f));last=f;
  }};
  const timeline=gsap.timeline({paused:true});
  timeline.fromTo(frameClock,{frame:0},{frame:1800,duration:60,ease:"none",immediateRender:true});
  window.__timelines={...window.__timelines,rodzic:timeline};
  window.seekFilm=(f:number)=>{timeline.seek(f/30,false);return frameClock.frame};
  window.filmReady=true;
}
setup().catch(e=>{window.filmError=String(e);console.error(e)});
