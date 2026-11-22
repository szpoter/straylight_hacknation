import {okienko,officeMotion} from "./okienko.mjs";
export function motionFrame(f,k) {return officeMotion(720+f,k);}
export function scene(f,k) {return okienko(motionFrame(f,k),k);}
