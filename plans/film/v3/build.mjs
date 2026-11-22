// v3 build: bundles only v3/sceny/NN/scene.mjs + v3/zestaw.mjs into v3/film.js and writes v3/index.html.
// Audio: v3/media/*.flac (copied from the accepted v2 mix). Nothing outside v3/ is written.
import {build} from "../../../app/node_modules/esbuild/lib/main.js";
import {existsSync,readFileSync,writeFileSync,copyFileSync,mkdirSync} from "node:fs";
import {dirname,join,resolve,relative} from "node:path";
import {fileURLToPath} from "node:url";
const here=dirname(fileURLToPath(import.meta.url));
// Optional: --only 19,20  --out robocze/s19   (private workspace so parallel authors don't overwrite each other)
const args=process.argv.slice(2), opt=n=>{const i=args.indexOf(n);return i<0?null:args[i+1]};
const only=opt("--only")?.split(",").map(s=>s.padStart(2,"0"));
const outDir=resolve(here,opt("--out")??".");
mkdirSync(outDir,{recursive:true});
const available0=Array.from({length:30},(_,i)=>String(i+1).padStart(2,"0")).filter(id=>existsSync(join(here,"sceny",id,"scene.mjs")));
const available=only?available0.filter(id=>only.includes(id)):available0;
if(!available.length)throw Error("Brak scen");
const imports=available.map(id=>`import {scene as s${id}} from './sceny/${id}/scene.mjs';`).join("\n");
const player=resolve(here,"../montaz/node_modules");
const app=resolve(here,"../../../app");
await build({absWorkingDir:here,stdin:{contents:imports+"\nimport {start} from './film.tsx';start({"+available.map(id=>Number(id)+":s"+id).join(",")+"});",resolveDir:here},
  outfile:join(outDir,"film.js"),minify:true,bundle:true,jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'},
  alias:{"@":join(app,"src"),"react":join(player,"react"),"react-dom":join(player,"react-dom"),"gsap":join(player,"gsap"),"remotion":join(player,"remotion"),"@remotion/player":join(player,"@remotion/player")}});
const template=readFileSync(join(here,"../index.html"),"utf8");
const media=join(here,"media");
mkdirSync(media,{recursive:true});
for(const match of template.matchAll(/(?:url\()((?:montaz\/assets)\/([^)"']+))/g)){
  const dest=join(media,match[2]);
  if(!existsSync(dest))copyFileSync(join(here,"..",match[1]),dest);
}
const mediaRel=relative(outDir,media)||"media";
const html=template.replaceAll("url(montaz/assets/","url("+mediaRel+"/").replaceAll('src="v1/sciezki/','src="'+mediaRel+'/')
 .replace('src="montaz/bundle.js"','src="film.js"').replace(/<div id="plane">[^\n]+/,'<div id="plane"></div>');
writeFileSync(join(outDir,"index.html"),html);
console.log(available.length+" / 30 modułów: "+available.join(" "));
