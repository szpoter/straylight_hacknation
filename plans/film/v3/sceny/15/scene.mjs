import {kanapa,sofaMotion} from "./kanapa.mjs";
import {endPose} from "../../ruch/pose.mjs";
import {motionFrame as previous} from "../14/scene.mjs";

export function motionFrame(f,k) {
  if(f===0) {
    const last=endPose(previous,k), state=sofaMotion(839,k);
    // Match cut between locations: the moving closed folder and the carrying hand fill both frames.
    state.actors.pawel=last.actors.pawel;
    state.actors.pawel={...state.actors.pawel,seat:true,feet:state.actors.pawel.feet};
    state.props.folder=last.props.folder;
    state.cutKeys=['folder','pawel.shoulderL','pawel.elbowL','pawel.wristL'];
    state.supports=state.supports.filter(s=>s.role==='marta');
    return state;
  }
  return sofaMotion(840+f,k);
}
export function scene(f,k) {return kanapa(motionFrame(f,k),k);}
