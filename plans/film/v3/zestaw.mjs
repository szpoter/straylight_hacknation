// Kit passed to every v3 scene as `k`. Cast + props come from obsada/ (one owner); Zusik is the original app SVG.
import {obsada,REWIZJA} from "./obsada/obsada.mjs";
import {rekwizyty} from "./obsada/rekwizyty.mjs";

// Isolated film instance of the original mascot (state `available`), drawn via <use> of the static <Babelek/>.
// cx,cy = centre of the frame box; size = box edge in px; look −1..1 moves pupils (catchlights follow 1/5 via CSS);
// opt.sx/opt.sy squash around the bottom edge (settling), opt.blur in px, opt.opacity.
export function zusik(cx,cy,size,look=0,opt={}){
  const sx=opt.sx??1, sy=opt.sy??1, bottom=cy+size/2;
  const inner=`<svg x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" viewBox="320 294 1408 1408" overflow="visible" style="--look:${Math.max(-1,Math.min(1,look))*15}px"><use href="#oryginalny-zusik"/></svg>`;
  const t=(sx!==1||sy!==1)?` transform="translate(${cx} ${bottom}) scale(${sx} ${sy}) translate(${-cx} ${-bottom})"`:"";
  const o=opt.opacity!=null?` opacity="${opt.opacity}"`:"";
  return `<g${t}${o}>${inner}</g>`;
}
export const kit={rewizja:REWIZJA,...rekwizyty,...obsada,zusik};
