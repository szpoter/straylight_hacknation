import {chromium} from "../../../app/node_modules/playwright-core/index.mjs";
import {spawn,execFileSync} from "node:child_process";
import {once} from "node:events";
import {mkdirSync,existsSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {tmpdir} from "node:os";

const here=dirname(fileURLToPath(import.meta.url));
const [mode="stills",heightArg="720",startArg="0",endArg="60",outArg]=process.argv.slice(2);
const height=Number(heightArg),start=Number(startArg)*30,end=Number(endArg)*30;
if(![720,1080].includes(height)||start<0||end>1800||start>=end)throw Error("Invalid time or resolution");
const out=resolve(outArg??join(tmpdir(),"rodzic-stills"));
const chrome=process.env.CHROME_PATH??"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser=await chromium.launch({executablePath:chrome,headless:true,args:["--allow-file-access-from-files","--disable-background-timer-throttling"]});
try{
  const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:height/1080});
  page.on("pageerror",err=>console.error(err.message));
  await page.goto(pathToFileURL(join(here,"../index.html")).href);
  await page.waitForFunction(()=>window.filmReady||window.filmError,{},{timeout:20000});
  const err=await page.evaluate(()=>window.filmError);if(err)throw Error(err);
  async function seek(f){
    const got=await page.evaluate(f=>window.seekFilm(f),f);
    if(got!==f)throw Error("Seek mismatch "+f+" / "+got);
  }
  if(mode==="stills"){
    mkdirSync(out,{recursive:true});
    for(const f of [0,119,120,153,570,714,1080,1104,1130,1136,1144,1167,1199,1217,1354,1455,1535,1567,1580,1612,1628,1643,1668,1799]){
      await seek(f);await page.screenshot({path:join(out,`frame-${String(f).padStart(4,"0")}.jpg`),type:"jpeg",quality:88});
    }
  }else{
    mkdirSync(dirname(out),{recursive:true});
    const cache=join(tmpdir(),`rodzic-film-${height}`);mkdirSync(cache,{recursive:true});
    const render=new Date().getTime();
    const silent=join(cache,`video-${start}-${end}-${render}.mp4`);
    const ff=spawn("ffmpeg",["-loglevel","error","-f","image2pipe","-framerate","30","-vcodec","mjpeg","-i","-","-c:v","libx264","-preset","fast","-crf","16","-pix_fmt","yuv420p","-color_primaries","bt709","-color_trc","bt709","-colorspace","bt709",silent],{stdio:["pipe","ignore","inherit"]});
    const closed=once(ff,"close");
    for(let f=start;f<end;f++){
      await seek(f);
      const img=await page.screenshot({type:"jpeg",quality:96});
      if(!ff.stdin.write(img))await once(ff.stdin,"drain");
    }
    ff.stdin.end();if((await closed)[0]!==0)throw Error("Picture encode failed");
    const mix=join(here,"../v1/sciezki/miks.flac");
    if(!existsSync(mix))throw Error("Render sound stems first");
    execFileSync("ffmpeg",["-loglevel","error","-y","-i",silent,"-ss",String(start/30),"-i",mix,"-t",String((end-start)/30),"-map","0:v","-map","1:a","-c:v","copy","-c:a","aac","-b:a","192k","-movflags","+faststart",out]);
    console.log(out);
  }
}finally{await browser.close()}
