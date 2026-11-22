import {build} from "../../../app/node_modules/esbuild/lib/main.js";
import {fileURLToPath} from "node:url";
import path from "node:path";
const here=path.dirname(fileURLToPath(import.meta.url)), app=path.resolve(here,"../../../app");
await build({absWorkingDir:here,entryPoints:["scene.tsx"],outfile:"bundle.js",bundle:true,minify:true,jsx:"automatic",
  define:{"process.env.NODE_ENV":'"production"'},
  alias:{"@":path.join(app,"src"),react:path.join(here,"node_modules/react"),"react-dom":path.join(here,"node_modules/react-dom")}});
