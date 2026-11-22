// v3 range render: node v3/render.mjs 720|1080 first last out.mp4  (FILM_HTML=robocze/sNN/index.html for a private build)
import {chromium} from "../../../app/node_modules/playwright-core/index.mjs";
import {execFileSync,spawn} from "node:child_process";
import {once} from "node:events";
import {mkdirSync,mkdtempSync,existsSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {tmpdir} from "node:os";
const here=dirname(fileURLToPath(import.meta.url));
const [heightArg="720",firstArg="1",lastArg="30",output]=process.argv.slice(2);
const height=Number(heightArg),first=Number(firstArg),last=Number(lastArg);
if(![720,1080].includes(height)||!Number.isInteger(first)||!Number.isInteger(last)||first<1||last>30||first>last||!output)throw Error("render.mjs 720|1080 scena_od scena_do plik.mp4");
const out=resolve(output);
if(existsSync(out))throw Error("Plik już istnieje: "+out);
mkdirSync(dirname(out),{recursive:true});
const work=mkdtempSync(join(tmpdir(),"rodzic-v3-"));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",headless:true,args:["--allow-file-access-from-files"]});
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:height/1080});
  page.on("pageerror",e=>console.error(e.message));
  await page.goto(pathToFileURL(resolve(here,process.env.FILM_HTML??"index.html")).href);
  await page.waitForFunction(()=>window.filmReady);
  await page.evaluate(()=>Promise.all(["36px Inter","60px Domine"].map(font=>document.fonts.load(font,"Zażółć gęślą jaźń"))));
  const silent=join(work,"video.mp4");
  const ff=spawn("ffmpeg",["-v","error","-f","image2pipe","-framerate","30","-vcodec","mjpeg","-i","-","-c:v","libx264","-preset","fast","-crf","16","-pix_fmt","yuv420p",silent],{stdio:["pipe","ignore","inherit"]});
  const done=once(ff,"close");
  try{
    for(let n=(first-1)*60;n<last*60;n++){
      const got=await page.evaluate(n=>window.seekFilm(n),n);
      if(got!==n)throw Error("Nieprawidłowa klatka "+n);
      const jpg=await page.screenshot({type:"jpeg",quality:96});
      if(!ff.stdin.write(jpg))await once(ff.stdin,"drain");
    }
  }finally{ff.stdin.end()}
  if((await done)[0]!==0)throw Error("FFmpeg");
  execFileSync("ffmpeg",["-v","error","-i",silent,"-ss",String(2*(first-1)),"-i",join(here,"media/miks.flac"),"-t",String(2*(last-first+1)),"-map","0:v","-map","1:a","-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart",out]);
  console.log(out);
}finally{await browser.close()}
