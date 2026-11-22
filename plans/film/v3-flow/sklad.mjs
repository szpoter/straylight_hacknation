// node sklad.mjs 720|1080 [wybrane/montaz.json] [output.mp4]
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {constants, copyFileSync, writeFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const height = Number(process.argv[2]);
assert([720,1080].includes(height), 'Podaj wysokość 720 albo 1080');
const width = height * 16 / 9;
const manifest = resolve(here, process.argv[3] ?? 'wybrane/montaz.json');
const out = resolve(here, process.argv[4] ?? `przewodnik-rodzica-B-${height}p.mp4`);
const sheet = join(dirname(out), `arkusz-B-${height}p.jpg`);
assert(!existsSync(out) && !existsSync(sheet), 'Wynik lub arkusz już istnieje');
const {shots, waveMask} = JSON.parse(readFileSync(manifest));
const asset = p => resolve(dirname(manifest), p);
const reference = height === 1080 ? join(here,'przewodnik-rodzica-A-1080p.mp4') : join(here,'../v3/podglady/animatik-720p-r2.mp4');
const mix = join(here,'../v3/media/miks.flac');
assert.equal(shots.length, 19);
assert(existsSync(asset(waveMask)), 'Potrzebna maska ostrych papierów dla kl. 1132');
const ff = (...args) => execFileSync('ffmpeg',['-nostdin','-v','error','-n',...args],{maxBuffer:32*1024*1024});
const streams = file => JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-of','json',file])).streams;
const num = n => String(n).padStart(4,'0');
const temp = mkdtempSync(join(tmpdir(),'film-flow-'));
const frameName = (dir,n) => join(dir,num(n)+'.png');
const encoding = ['-c:v','libx264','-preset','veryfast','-qp','0'];

// Każdy znacznik [klatka montażu, klatka źródła po konwersji do 30 fps] wiąże gest z miksem.
function indices(keys, last) {
  assert(Array.isArray(keys) && keys.length >= 2);
  assert.equal(keys[0][0],0);
  assert.equal(keys.at(-1)[0],last);
  for(let i=0;i<keys.length;i++){
    const [at,source] = keys[i];
    assert(Number.isInteger(at) && Number.isInteger(source) && source >= 0);
    if(i) assert(at > keys[i-1][0] && source >= keys[i-1][1], 'Znaczniki muszą biec do przodu');
  }
  let k=1;
  return Array.from({length:last+1},(_,n)=>{
    if(n>keys[k][0]) k++;
    const [a,x]=keys[k-1], [b,y]=keys[k];
    return Math.round(x+(y-x)*(n-a)/(b-a));
  });
}

function renderShot(shot, i) {
  assert.equal(shot.id,i+1);
  const frames = indices(shot.keys,shot.id===19 ? 52 : 59);
  const input = asset(shot.file);
  assert(existsSync(input), input);
  const src = join(temp,'src'+i), edit = join(temp,'edit'+i);
  mkdirSync(src); mkdirSync(edit);
  ff('-i',input,'-map','0:v:0','-vf','fps=30','-frames:v',String(frames.at(-1)+1),'-start_number','0',join(src,'%04d.png'));
  assert(readdirSync(src).length > frames.at(-1), 'Za krótki klip '+shot.id);
  for(let n=0;n<60;n++) linkSync(frameName(src,frames[Math.min(n,frames.length-1)]),frameName(edit,n));
  const args=['-framerate','30','-start_number','0','-i',join(edit,'%04d.png')];
  let graph=`[0:v]scale=${width}:${height}:flags=lanczos,setsar=1,format=yuv420p[base]`;
  let video='base', index=1;
  if(shot.titles){
    const titles=asset(shot.titles);
    const overlay=streams(titles).find(s=>s.codec_type==='video');
    assert(overlay && /^(rgba|bgra|argb|abgr|yuva|gbrap)/.test(overlay.pix_fmt),'Brak kanału alfa napisów '+shot.id);
    assert.equal(overlay.r_frame_rate,'30/1');
    const count=Number(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-count_frames','-show_entries','stream=nb_read_frames','-of','csv=p=0',titles]).toString().trim());
    assert.equal(count,60,'Napisy muszą mieć 60 klatek');
    args.push('-i',titles);
    graph+=`;[${index++}:v]setpts=PTS-STARTPTS,scale=${width}:${height},setsar=1[txt];[base][txt]overlay[titled]`;
    video='titled';
  } else {
    assert(shot.blank===true,'Potwierdź brak czytelnego tekstu lub podaj warstwę napisów dla '+shot.id);
  }
  if(shot.id===19){
    args.push('-loop','1','-framerate','30','-i',asset(waveMask),'-loop','1','-framerate','30','-i',join(here,'warstwy/zusik.png'));
    graph+=`;[${index}:v]scale=${width}:${height},format=gray[mask];[${video}]trim=end_frame=53,tpad=stop_mode=clone:stop=7,split=4[orig][s1][s2][s3]`;
    const ratio=height/720;
    for(const [j,blur] of [1.4,2.2,2.6].entries())
      graph+=`;[s${j+1}]gblur=sigma=${blur*ratio}:steps=3[b${j+1}]`;
    graph+=';[orig]split[sharp][before];[before][b1]overlay=enable=gte(n\\,52)[a];[a][b2]overlay=enable=gte(n\\,53)[b];[b][b3]overlay=enable=gte(n\\,54)[soft]';
    // Maska biała zachowuje ostrość fali; rodzice i wyciągnięte ręce są poza maską.
    graph+=`;[sharp][mask]alphamerge[paper];[soft][paper]overlay=enable=gte(n\\,52)[freeze];[${index+1}:v]scale=${width}:${height}[mascot];[freeze][mascot]overlay=enable=gte(n\\,53)[click]`;
    video='click';
  }
  const name='shot'+num(i+1)+'.mkv';
  ff(...args,'-filter_complex',graph,'-map','['+video+']','-an','-frames:v','60',...encoding,'-pix_fmt','yuv420p',join(temp,name));
  return name;
}

function tailHash(file){
  return ff('-i',file,'-map','0:v:0','-vf','trim=start_frame=1140,setpts=PTS-STARTPTS','-an','-pix_fmt','yuvj420p','-f','hash','-hash','sha256','-').toString().trim();
}

try {
  const names=shots.map(renderShot);
  const list=join(temp,'lista.ffconcat');
  writeFileSync(list,names.map(name=>"file '"+name+"'").join('\n'));
  const film=join(temp,'B.mp4'), contact=join(temp,'arkusz.jpg');
  const graph='[0:v]scale=in_range=tv:out_range=pc,format=yuvj420p,settb=1/30,setpts=N[head];[1:v]trim=start_frame=1140:end_frame=1800,settb=1/30,setpts=N[tail];[head][tail]concat=n=2:v=1:a=0[v]';
  ff('-f','concat','-safe','1','-i',list,'-i',reference,'-i',mix,'-filter_complex',graph,'-map','[v]','-map','2:a:0',
    ...encoding,'-pix_fmt','yuvj420p','-color_range','pc','-colorspace','bt470bg','-c:a','aac','-b:a','192k','-t','60','-movflags','+faststart',film);
  const [v,a]=streams(film);
  assert.equal(Number(v.nb_frames),1800); assert.equal(v.r_frame_rate,'30/1');
  assert.equal(v.width,width); assert.equal(v.height,height); assert.equal(Number(a.duration),60);
  assert.equal(tailHash(film),tailHash(reference),'Poradnik od 1140 do 1799 różni się od A');
  ff('-i',film,'-vf',"select='eq(mod(n,60),30)',scale=320:180,tile=5x6:padding=2:color=white",'-frames:v','1','-update','1',contact);
  mkdirSync(dirname(out),{recursive:true});
  copyFileSync(film,out,constants.COPYFILE_EXCL);
  copyFileSync(contact,sheet,constants.COPYFILE_EXCL);
  console.log(out);
} finally {
  rmSync(temp,{recursive:true,force:true});
}
