import {kanapa,sofaMotion} from "../15/kanapa.mjs";
import {endPose} from "../../ruch/pose.mjs";
import {motionFrame as previous} from "../17/scene.mjs";

export function motionFrame(f,k) {
  if(f===0) return endPose(previous,k);
  return sofaMotion(1020+f,k);
}
export function scene(f,k) {return kanapa(motionFrame(f,k),k);}
