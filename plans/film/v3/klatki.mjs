// Quick stills for authors: node v3/klatki.mjs <outdir> <globalFrame> [globalFrame...]
// Renders 1280x720 PNGs straight from v3/index.html (run build.mjs first). Overwrites only <outdir>/f<NNNN>.png.
import {chromium} from "../../../app/node_modules/playwright-core/index.mjs";
import {mkdirSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const here=dirname(fileURLToPath(import.meta.url));
const [outdir,...frames]=process.argv.slice(2);
if(!outdir||!frames.length)throw Error("klatki.mjs katalog klatka...");
mkdirSync(resolve(outdir),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:["--allow-file-access-from-files"]});
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:720/1080});
  page.on("pageerror",e=>console.error(e.message));
  await page.goto(pathToFileURL(resolve(here,process.env.FILM_HTML??"index.html")).href);
  await page.waitForFunction(()=>window.filmReady);
  await page.evaluate(()=>Promise.all(["36px Inter","60px Domine"].map(font=>document.fonts.load(font,"Zażółć gęślą jaźń"))));
  for(const n of frames.map(Number)){
    await page.evaluate(n=>window.seekFilm(n),n);
    const file=join(resolve(outdir),"f"+String(n).padStart(4,"0")+".png");
    await page.screenshot({path:file});console.log(file);
  }
}finally{await browser.close()}
