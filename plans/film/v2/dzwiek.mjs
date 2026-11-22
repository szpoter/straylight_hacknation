import {execFileSync} from "node:child_process";
import {join} from "node:path";

// The turn of the page now precedes Paweł's answer in scene 06.
export function prepareSound(here){
  const rate=48000, start=Math.round(10.15*rate), delay=Math.round(.70*rate), span=Math.round(.90*rate);
  function read(name){
    return execFileSync("ffmpeg",["-v","error","-i",join(here,"../v1/sciezki",name+".flac"),"-f","s16le","-ac","1","-ar",String(rate),"-"],{maxBuffer:8e6});
  }
  const dialog=read("dialog"),mix=read("miks"),line=Buffer.from(dialog.subarray(start*2,(start+span)*2));
  for(let i=0;i<span;i++){
    const idx=(start+i)*2;
    mix.writeInt16LE(mix.readInt16LE(idx)-line.readInt16LE(i*2),idx);
    dialog.writeInt16LE(0,idx);
  }
  for(let i=0;i<span;i++){
    const idx=(start+delay+i)*2, sample=line.readInt16LE(i*2);
    mix.writeInt16LE(mix.readInt16LE(idx)+sample,idx);
    dialog.writeInt16LE(dialog.readInt16LE(idx)+sample,idx);
  }
  for(const [n,pcm] of [["dialog",dialog],["miks",mix]]){
    execFileSync("ffmpeg",["-v","error","-y","-f","s16le","-ac","1","-ar",String(rate),"-i","-","-c:a","flac",join(here,"media",n+".flac")],{input:pcm});
  }
}
