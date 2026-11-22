import React from "react";
import { useCurrentFrame } from "remotion";
import { easeOut } from "../../../app/node_modules/motion";
import { Zusik } from "../../../app/src/components/mascot/Zusik";
import { DRAFT_TITLE, PENDING_ROWS, CHOICE_TEXT } from "../../../app/src/features/chat/case-data";
import { OLA } from "../../../app/src/lib/family/ola";

const ink="#283754", green="#1a7644", mint="#d9efdf", stock="#f5faf7", line="#aebfb5";
const dates=PENDING_ROWS.find(row=>row.key==="period")!.value;
const attachment=PENDING_ROWS.find(row=>row.key==="attachment")!.value;
export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const between=(t:number,a:number,b:number)=>clamp((t-a)/(b-a));
// Motionmaxxing runtime/motion.js, normalized expoOut(3.41) and snapRamp(.942,.118).
const land=(p:number)=>(1-Math.exp(-3.41*p))/(1-Math.exp(-3.41));
const snap=(p:number)=>(.942*(1-Math.exp(-p/.118))+.058*p)/(.942*(1-Math.exp(-1/.118))+.058);
function T({x,y,size=32,serif=false,color=ink,weight=400,children,...rest}:any){
  return <text x={x} y={y} fontFamily={serif?"Domine":"Inter"} fontWeight={weight} fontSize={size} fill={color} {...rest}>{children}</text>;
}
function Rect({x,y,w,h,r=0,fill="#fff",stroke="none",...rest}:any){
  return <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth="2" {...rest}/>;
}
function Check({x,y,r=19}:any){return <g transform={`translate(${x} ${y}) scale(${r/19})`}><circle r="19" fill={green}/><path d="M-8 0l5 5L8-7" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round"/></g>}
function PaperIcon({x,y}:any){return <g transform={`translate(${x} ${y})`} stroke={green} strokeWidth="2.7" fill="none" strokeLinejoin="round"><path d="M0 0h22l10 10v32H0z M22 0v10h10 M7 21h17 M7 29h13"/></g>}
function Blob({cx,cy,size,look=0,squash=0}:any) {
  return <g style={{"--look":look+"px"} as any} transform={`translate(${cx} ${cy}) scale(${1+squash} ${1-squash})`}>
    <svg x={-size/2} y={-size/2} width={size} height={size} viewBox="0 0 100 100" overflow="visible"><Zusik size={100}/></svg></g>;
}
function Brand({t}:any) {
  const enter=easeOut(between(t,37.73,37.93)), clean=between(t,38.16,38.43), shift=easeOut(between(t,38.44,39.39));
  const settle=.085*Math.sin(Math.PI*between(t,37.92,38.23));
  return <><Rect x={0} y={0} w={1280} h={720} fill={stock} opacity={clean}/>
  <clipPath id="wordmark"><rect x={540} y={160} width={675*shift} height={440}/></clipPath>
  <g clipPath="url(#wordmark)"><T x={553} y={339} serif size={92}>Przewodnik</T><T x={553} y={447} serif size={92}>Rodzica</T></g>
  <Blob cx={640-296*shift} cy={335+12*(1-enter)+13*shift} size={(286+42*shift)*(.88+.12*enter)} squash={settle} look={14*shift}/></>;
}
function Login({t}:any) {
  const press=between(t,40.48,40.59), release=snap(between(t,40.59,40.98));
  const k=1-.045*press*(1-release);
  return <><T x={162} y={189} color={green} weight={600} size={26}>Wersja demonstracyjna</T>
    <T x={160} y={288} size={60} serif>Import danych rodziny Oli</T>
    <T x={164} y={352} size={32}>mObywatel i mZUS</T>
    <g transform={`translate(501 475) scale(${k}) translate(-501 -475)`}><Rect x={160} y={416} w={683} h={105} r={53} fill={green}/><T x={502} y={483} textAnchor="middle" color="white" size={37} weight={600}>Importuj dane i otwórz plan</T></g>
    <path d={`M0 633H${1280*between(t,41.43,41.99)}`} stroke={green} strokeWidth="5"/></>;
}
function MapScene({t}:any){
  const offset=land(between(t,42,45.04))*480;
  return <><T x={91} y={134} serif size={70}>Plan Oli</T><g transform={`translate(${-offset} 0)`}>
    <path d="M-10 304 H2030" fill="none" stroke={green} strokeWidth="5"/>
    <Check x={268} y={304} r={26}/><circle cx={886} cy={304} r={24} fill={stock} stroke={green} strokeWidth="6"/>
    <T x={146} y={410} color={green} size={27} weight={600}>Ukończono</T><T x={146} y={478} size={43} serif>Badania przesiewowe</T><T x={146} y={536} size={43} serif>noworodka</T>
    <T x={824} y={410} color={green} size={27} weight={600}>Do załatwienia</T><T x={824} y={483} size={52} serif>Zgłoś urodzenie Oli</T>
    <T x={824} y={556} size={32}>do 1 grudnia 2026</T></g></>;
}
function Chat({t}:any) {
  if(t<48){const p=land(between(t,46,46.54));return <><g transform={`translate(${-145*p} 0)`}><T x={188} y={235} color={green}>Plan Oli</T><T x={188} y={322} serif size={42}>Zgłoś urodzenie</T><T x={188} y={380} serif size={42}>Oli</T></g>
    <g transform={`translate(${(1-p)*800} 0)`}><Rect x={435} y={0} w={845} h={720} fill="#e6f3e9"/><T x={511} y={211} size={29} color={green} weight={600}>Marta</T>
    <Rect x={502} y={257} w={689} h={215} r={34}/><T x={551} y={345} size={48}>A jeśli weźmiemy</T><T x={551} y={416} size={48}>urlop razem?</T></g></>}
  if(t<50) return <><Blob cx={257} cy={343} size={265} look={15*land(between(t,48.63,49.1))}/><T x={251} y={549} textAnchor="middle" size={25}>Agent AI · RAG</T>
    <T x={464} y={224} color={green} weight={600}>Zusik</T><T x={460} y={324} serif size={51}>Oboje możecie korzystać</T><T x={460} y={393} serif size={51}>z urlopu jednocześnie.</T>
    <T x={464} y={519} size={31} color={green}>Kodeks pracy · art. 182¹a § 6</T><path d="M464 532h472" stroke={green} strokeWidth="2"/></>;
  const p=land(between(t,50,50.61));
  return <><g transform={`translate(${464-307*p} ${519-348*p})`}><T x={0} y={0} size={31} color={green}>Kodeks pracy · art. 182¹a § 6</T></g>
    <g opacity={p}><path d="M158 245v260" stroke={green} strokeWidth="4"/>
    <T x={199} y={315} size={46} serif>Z urlopu rodzicielskiego mogą</T>
    <Rect x={197} y={357} w={295*land(between(t,50.45,51.03))} h={44} fill="#c9eacf"/>
    <T x={199} y={391} size={46} serif>jednocześnie korzystać oboje</T><T x={199} y={467} size={46} serif>pracownicy – rodzice dziecka.</T></g></>;
}
function DraftHeading(){return <><T x={134} y={163} size={25} color={green} weight={600}>Dokumenty i wnioski</T><T x={131} y={245} size={55} serif>{DRAFT_TITLE}</T>
  <Rect x={1010} y={126} w={118} h={49} r={24} fill={mint}/><T x={1069} y={160} size={25} textAnchor="middle" color={green}>Szkic</T></>}
function Draft({t}:any) {
  const p=land(between(t,52.57,53.48));
  return <><g opacity={1-between(t,52.50,52.65)}><T x={135} y={210} color={green} size={29} weight={600}>Sposób korzystania z urlopu</T>
    <Check x={160} y={301} r={22}/><T x={203} y={319} size={61} serif>{CHOICE_TEXT.razem.short}</T></g>
    <g opacity={p} transform={`translate(0 ${(1-p)*88})`}><Rect x={77} y={66} w={1127} h={594} r={16} stroke={line}/><DraftHeading/>
    <path d="M134 284h1000" stroke={line}/><T x={134} y={355} size={29} weight={600}>Okres urlopu</T>
    <Rect x={132} y={387} w={1002} h={112} r={12} fill={stock} stroke={line}/><T x={136} y={581} size={27}>Marta Lis i Paweł Lis · 28 dni razem</T></g>
    <g transform={`translate(${130+36*p} ${464-4*p}) scale(${1-.17*p})`}>
      <rect x={-4} y={-33} width={846*(1-p)} height={45} rx={4} fill="#c9eacf"/>
      <T x={0} y={0} size={57} weight={560}>{dates}</T></g></>;
}
function Attached({t}:any) {
  const p=land(between(t,54.35,55.42));
  const x=92+573*p, y=351-38*Math.sin(Math.PI*p);
  return <><T x={82} y={134} size={45} serif>{DRAFT_TITLE}</T><path d="M84 179h1112" stroke={line} strokeWidth="2"/>
    <T x={91} y={297} size={36} serif>Pliki dziecka</T><T x={663} y={297} size={36} serif>Załącznik</T>
    <Rect x={89} y={350} w={521} h={153} r={14} fill="none" stroke={line}/>
    <Rect x={661} y={350} w={525} h={153} r={14} fill={stock} stroke={green} strokeDasharray="9 9"/>
    <g transform={`translate(${x} ${y})`}><Rect x={0} y={0} w={519} h={150} r={13} stroke={green}/>
    <PaperIcon x={25} y={52}/><T x={78} y={71} size={32} weight={550}>{attachment}</T><T x={79} y={112} size={24} color={green}>Ola Lis</T>
    <g opacity={between(t,55.41,55.55)}><Check x={477} y={105} r={15}/></g></g></>;
}
function Recipient({t}:any) {
  const p=land(between(t,56,56.56));
  return <g transform={`translate(640 360) scale(${1.09-.09*p}) translate(-640 -360)`}><Rect x={77} y={66} w={1127} h={594} r={16} stroke={line}/><DraftHeading/>
  <path d="M134 284h1000" stroke={line}/><T x={134} y={355} size={30}>Załącznik</T><T x={511} y={355} size={32}>{attachment}</T><Check x={1092} y={346}/>
  <Rect x={114} y={430} w={1048} h={145} r={14} fill={mint}/><T x={141} y={493} size={30} color={green}>Pracodawca</T><T x={507} y={526} size={62} serif>{OLA.employer}</T></g>;
}
function Finale({t}:any) {
  const p=land(between(t,58,59.67));
  return <>{[0,1,2,3].map((n)=>{
    const a=between(t,58+n*.16,59.50+n*.08), k=1-.88*land(a);
    if(n && t<58+n*.16)return null;
    return <g key={n} opacity={1-between(a,.81,1)} transform={`translate(640 ${360+(n?560*(1-land(a)):0)}) scale(${k}) rotate(${n*3*(1-a)}) translate(-640 -360)`}>
      {n===0?<Recipient t={58}/>:<><Rect x={170} y={100} w={940} h={630} r={14} stroke={line}/><T x={235} y={250} size={50} serif>{["","Urlop ojcowski","Urlop macierzyński","Zasiłek macierzyński"][n]}</T>{[340,416,492].map(y=><Rect key={y} x={239} y={y} w={755} h={44} stroke={line} r={6}/>)}</>}</g>})}
    <g opacity={between(t,58.93,59.35)}><Blob cx={640} cy={360+38*(1-p)} size={315} look={0}/></g></>;
}
export function Product(){
  const t=useCurrentFrame()/30;
  return <svg viewBox="0 0 1280 720" width="1280" height="720">
    {t>=40 && <Rect x={0} y={0} w={1280} h={720} fill={stock}/>}
    {t<37.73?null:t<40?<Brand t={t}/>:t<42?<Login t={t}/>:t<46?<MapScene t={t}/>:t<52?<Chat t={t}/>:t<54?<Draft t={t}/>:t<56?<Attached t={t}/>:t<58?<Recipient t={t}/>:<Finale t={t}/>}
  </svg>;
}
