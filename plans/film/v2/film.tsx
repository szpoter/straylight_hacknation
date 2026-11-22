import React from "react";
import {createRoot} from "react-dom/client";
import {flushSync} from "react-dom";
import {Player} from "@remotion/player";
import {useCurrentFrame} from "remotion";
import {gsap} from "gsap";
import {Babelek} from "../../../app/src/components/mascot/babelek/Babelek";
import {kit} from "./rysunek.mjs";

export function start(scenes){
  const K=Object.freeze(kit);
  function Frame(){
    const f=useCurrentFrame(), i=Math.floor(f/60)+1;
    const draw=scenes[i];
    return <svg viewBox="0 0 1280 720" width="1280" height="720">
      <defs><g id="oryginalny-zusik"><svg x="320" y="294" width="1408" height="1408"><Babelek/></svg></g></defs>
      <g dangerouslySetInnerHTML={{__html:draw?draw(f%60,K):""}}/>
    </svg>;
  }
  const player=React.createRef<any>(),container=document.querySelector("#plane"), clips=[...document.querySelectorAll("section.clip")];
  flushSync(()=>createRoot(container).render(<Player ref={player} component={Frame} compositionWidth={1280} compositionHeight={720}
    durationInFrames={1800} fps={30} controls={false} showPosterWhenUnplayed={false} style={{width:1280,height:720}}/>));
  let frame=-1;
  const clock={get value(){return frame},set value(t){
    const n=Math.min(1799,Math.max(0,Math.round(t))),i=Math.floor(n/60);
    if(n===frame)return;
    if(Math.floor(frame/60)!==i)clips[i].appendChild(container);
    flushSync(()=>player.current.seekTo(n));frame=n;
  }};
  const timeline=gsap.timeline({paused:true});
  timeline.fromTo(clock,{value:0},{value:1800,duration:60,ease:"none"});
  clock.value=0;window.__timelines.rodzic=timeline;
  window.seekFilm=(n)=>{if(!scenes[Math.floor(n/60)+1])throw Error("Brak modułu sceny "+(1+Math.floor(n/60)));timeline.seek(n/30,false);return frame};
  window.filmReady=true;
}
