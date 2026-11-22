import {okienko,officeMotion} from "../13/okienko.mjs";
import {endPose} from "../../ruch/pose.mjs";
import {motionFrame as previous} from "../13/scene.mjs";
export function motionFrame(f,k) {return f===0?endPose(previous,k):officeMotion(780+f,k);}
export function scene(f,k) {return okienko(motionFrame(f,k),k);}
