import {execFileSync} from "node:child_process";
import {join} from "node:path";

export function prepareSound(here){
  const rate=48000;
  function read(name){
    return execFileSync("ffmpeg",["-v","error","-i",join(here,"../v1/sciezki",name+".flac"),"-f","s16le","-ac","1","-ar",String(rate),"-"],{maxBuffer:8e6});
  }
  const dialog=read("dialog"),effects=read("efekty"),mix=read("miks");
  function moveCue(stem,from,to,seconds){
    const oldOffset=Math.round(from*rate)*2, newOffset=Math.round(to*rate)*2;
    const cue=Buffer.from(stem.subarray(oldOffset,oldOffset+Math.round(seconds*rate)*2));
    for(let i=0;i<cue.length;i+=2){
      mix.writeInt16LE(mix.readInt16LE(oldOffset+i)-cue.readInt16LE(i),oldOffset+i);
      stem.writeInt16LE(0,oldOffset+i);
    }
    for(let i=0;i<cue.length;i+=2){
      const dest=newOffset+i, sample=cue.readInt16LE(i);
      mix.writeInt16LE(mix.readInt16LE(dest)+sample,dest);
      stem.writeInt16LE(stem.readInt16LE(dest)+sample,dest);
    }
  }
  moveCue(dialog,10.15,10.85,.90); // Paweł inspects the reverse before answering.
  moveCue(effects,33.90,34.60,.402); // The sole reaches the floor in shot 18, frame 18.
  for(const [n,pcm] of [["dialog",dialog],["efekty",effects],["miks",mix]]){
    execFileSync("ffmpeg",["-v","error","-y","-f","s16le","-ac","1","-ar",String(rate),"-i","-","-c:a","flac",join(here,"media",n+".flac")],{input:pcm});
  }
}
