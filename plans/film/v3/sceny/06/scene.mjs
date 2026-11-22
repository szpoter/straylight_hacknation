import {endPose,reach,gripKeys} from "../../ruch/pose.mjs";
// Scene 06 · "Chyba tak" (10–12 s, global frames 300–359). Author: block b01, models r1.
// Same side of Marta's shoulder as 05, camera a little higher. 0–6 the right thumb slides from URLOP's corner down
// its left edge; 7–19 the sheet turns ~180° about that held vertical edge (thin profile at 13, grid side at 19);
// 20–26 eyes settle on one box, chin drops; "Chyba tak" from the mix at 27 (10.90 s); from "tak" the sheet is
// lowered over the folder, still held by the same edge. 54–59 Marta turns toward the pram and starts her question.
import mouths from "../../../montaz/assets/mowa.json" with { type: "json" };
import { thin } from "../01/scene.mjs";
import { queueWorld, queueFrame, papers, PAPER, folderLocal, ss } from "../03/kolejka.mjs";
import { withPhoto } from "../03/scene.mjs";
import { motionFrame as motion05, pull05, camT } from "../05/scene.mjs";

const lerp = (a, b, t) => a + (b - a) * t;
const D = Math.PI / 180;
const f1 = v => Math.round(v * 1000) / 1000;
export const CAM06 = { z: 2.0, cx: 798, cy: 232 };
// Paweł's "Chyba tak" amplitude from media/dialog.flac, film frames 327–342 (mowa.json's Paweł track is stale).
const PAWEL_VOICE = [.08, .24, .32, .17, 1, .5, 1, 1, .33, .02, .48, .45, .17, .02, 0, .04];

export function turn06(f) { return 180 * ss(7, 19, f); }                     // degrees about the held edge
export function sheet06(k, f) {
  const base = endPose(motion05,k), F = base.F, p0 = pull05(59), sc = F.w / 100;
  const lower = ss(36, 56, f);
  const pull = { ...p0, dx: p0.dx + 40 * lower, dy: p0.dy + 40 * lower, angle: p0.angle + 6 * lower, bend: 0, lift: 0 };
  const w = PAPER.w * sc, h = PAPER.h * sc, al = F.angle - 1 + pull.angle;
  const c = folderLocal(F, -2 + pull.dx, -60 - 38 + PAPER.h / 2 + pull.dy);           // sheet centre before turning
  const hinge = [c[0] - w / 2 * Math.cos(al * D), c[1] - w / 2 * Math.sin(al * D)];   // middle of the held left edge
  return { base, F, pull, w, h, al, hinge };
}
function backSide(w, h) {
  // reverse of the print: a grid of boxes ("kratki") and a few lines, no title
  let g = `<path d="M${-w / 2} ${-h / 2}H${w / 2}V${h / 2}H${-w / 2}Z" fill="#FFFDF7" stroke="#283754" stroke-width="2.2" stroke-linejoin="round"/>`;
  const bw = w * .8, x0 = -bw / 2, cw = bw / 6, ch = h * .085;
  for (let r = 0; r < 4; r++) {
    const y = -h * .36 + r * ch * 1.9;
    g += `<path d="M${f1(x0)} ${f1(y)}h${f1(bw)}v${f1(ch)}h${f1(-bw)}Z" fill="none" stroke="#7E8F98" stroke-width="1.5"/>`;
    for (let i = 1; i < 6; i++) g += `<path d="M${f1(x0 + cw * i)} ${f1(y)}v${f1(ch)}" stroke="#7E8F98" stroke-width="1.3"/>`;
  }
  for (let i = 0; i < 3; i++) g += `<path d="M${f1(x0)} ${f1(h * .28 + i * h * .055)}h${f1(bw * (i === 2 ? .5 : .9))}" stroke="#98A6AC" stroke-width="1.5"/>`;
  return g;
}
export function drawSheet(k, s) {
  const th = s.turn * D, c = Math.cos(th), tr = `translate(${f1(s.hinge[0])} ${f1(s.hinge[1])}) rotate(${f1(s.al)})`;
  if (Math.abs(c) < .06) // edge-on: the sheet is a thin band seen in profile
    return `<g transform="${tr}"><path d="M-3 ${-s.h / 2}L3 ${-s.h / 2 + 4}L3 ${s.h / 2 - 2}L-3 ${s.h / 2}Z" fill="#FFFDF7" stroke="#283754" stroke-width="2.2" stroke-linejoin="round"/></g>`;
  if (c > 0) return `<g transform="${tr} scale(${f1(c)} 1) translate(${f1(s.w / 2)} 0)">${k.paper(0, 0, s.w, s.h, 0, { header: "URLOP" })}</g>`;
  return `<g transform="${tr} scale(${f1(-c)} 1) translate(${f1(-s.w / 2)} 0)">${backSide(s.w, s.h)}</g>`;
}

export function pose06(k, f) {
  const sh = sheet06(k, f), turn = turn06(f), base = sh.base;
  // grip on the held edge: corner (05/59) → lower on the same edge by 6; the pinch turns with the sheet
  const slide = ss(0, 6, f), alr = sh.al * D;
  const along = lerp(-sh.h / 2 + 7 * sh.F.w / 100, -sh.h * .12, slide);
  const inset = 6 * (sh.F.w / 100) * Math.cos(turn * D);
  const target = [sh.hinge[0] + inset * Math.cos(alr) - along * Math.sin(alr), sh.hinge[1] + inset * Math.sin(alr) + along * Math.cos(alr)];
  const check = ss(20, 26, f), talk = PAWEL_VOICE[f - 27] ?? 0;
  let pawel = { ...base.pawel, head: lerp(-.5, -.55, check), gaze: lerp(-.2, -.55, ss(8, 20, f)), gazeDown: lerp(.55, .75, ss(8, 20, f)) + .1 * check - .2 * ss(40, 56, f),
    nod: .35 + .12 * check, mouth: talk * .9, brow: -.25 * check * (1 - ss(44, 56, f)), roll:{left:turn} };
  pawel=reach("pawel",pawel,"left",target);
  const bar=base.bar, second=[bar[0]+13,bar[1]-2.6];
  let marta=reach("marta",{...base.marta,rightGrip:gripKeys(f,[[0,"open"],[44,"hold"]]),
    leftGrip:gripKeys(f,[[0,"hold"],[55,"open"]])},"right",second,ss(31,44,f));
  marta=reach("marta",marta,"left",bar,1-ss(48,59,f));
  const sheetCenter=[sh.hinge[0]+sh.w/2*Math.cos(turn*D)*Math.cos(alr),sh.hinge[1]+sh.w/2*Math.cos(turn*D)*Math.sin(alr)];
  return {...base,marta,pawel,sheet:{...sh,turn},working:target,workingId:f===0?"urlop.corner":"urlop.edge",sheetCenter};
}

function martaOTS(k, f) {
  const a = mouths.marta[300 + f] ?? 0, away = ss(52, 59, f);
  const head = k.head("marta", { x: 112, y: 540, s: 3.0, head: .93 - .25 * away, nod: .3 + .2 * away, tilt: 2, gaze: lerp(.75, .2, away), gazeDown: lerp(.45, .85, away),
    mouth: a * .8, line: 1.25 });
  const neck = `<path d="M62 540C70 590 78 630 84 670L162 680C152 630 142 590 142 540Z" fill="#FFEBDB" stroke="#283754" stroke-width="3.4"/>`;
  const shoulder = `<path d="M-60 630C20 618 120 642 186 676C230 700 250 730 254 780H-60Z" fill="#B2CAAD" stroke="#283754" stroke-width="3.4"/>`;
  return neck + shoulder + head;
}

export function motionFrame(f,k) {return queueFrame(pose06(k,f),CAM06);}
export function scene(f, k) {
  const { marta, pawel, F, pr, sheet } = motionFrame(f,k);
  const ps = papers(k, F, sheet.pull, { split: true });
  const front = sheet.turn > 40;                                 // the free edge swings out in front of the folder
  const sheetSvg = drawSheet(k, sheet);
  const svg = queueWorld(k, { marta, pawel, pram: { ...pr, breath: .3 + .3 * Math.sin((f + 180) / 18) }, folder: F, photo: "%%PHOTO%%",
    behindFolder: ps.z + (front ? "" : sheetSvg), overFolder: front ? sheetSvg + k.person("pawel", { ...pawel, parts: "left" }) : "",
    thumbFront: !front, extrasF: f + 180 });
  return `<rect width="1280" height="720" fill="#F5FAF7"/><g transform="${camT(CAM06)}">${withPhoto(thin(svg, 1 / Math.pow(CAM06.z, .62)), k)}</g>` + martaOTS(k, f);
}
