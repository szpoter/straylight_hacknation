import {build} from "../../../app/node_modules/esbuild/lib/main.js";
import {existsSync,readFileSync,writeFileSync} from "node:fs";
import {dirname,join,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const here=dirname(fileURLToPath(import.meta.url));
const available=Array.from({length:30},(_,i)=>String(i+1).padStart(2,"0")).filter(id=>existsSync(join(here,"sceny",id,"scene.mjs")));
if(!available.length)throw Error("Brak scen");
const imports=available.map(id=>`import {scene as s${id}} from './sceny/${id}/scene.mjs';`).join("\n");
const player=resolve(here,"../montaz/node_modules");
const app=resolve(here,"../../../app");
await build({absWorkingDir:here,stdin:{contents:imports+"\nimport {start} from './film.tsx';start({"+available.map(id=>Number(id)+":s"+id).join(",")+"});",resolveDir:here},
  outfile:"film.js",minify:true,bundle:true,jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'},
  alias:{"@":join(app,"src"),"react":join(player,"react"),"react-dom":join(player,"react-dom"),"gsap":join(player,"gsap"),"remotion":join(player,"remotion"),"@remotion/player":join(player,"@remotion/player")}});
const template=readFileSync(join(here,"../index.html"),"utf8");
const html=template.replaceAll("url(montaz/assets/","url(../montaz/assets/").replaceAll('src="v1/sciezki/','src="../v1/sciezki/')
 .replace('src="montaz/bundle.js"','src="film.js"').replace(/<div id="plane">.*?<\/div><\/div>/,'<div id="plane"></div>');
writeFileSync(join(here,"index.html"),html);
console.log(available.length+" / 30 modułów");
