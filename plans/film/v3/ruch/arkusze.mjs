// node ruch/arkusze.mjs film.mp4 firstShot 11,12  (firstShot = first shot in the MP4)
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {sampleShot} from './sample.mjs';

const sharp = createRequire(new URL('../../../../app/package.json', import.meta.url))('sharp');
const scenes = fileURLToPath(new URL('../sceny/', import.meta.url));
const [movie, firstShot, shotList] = process.argv.slice(2);
if (!movie || !/^\d+$/.test(firstShot) || !/^\d+(,\d+)*$/.test(shotList))
  throw Error('node ruch/arkusze.mjs film.mp4 pierwsze-ujęcie 11,12');

// Where a grip spans the entire shot, show its travel and name the outgoing hold.
const phases = [
  [[13,'Przygotowanie'],[28,'Bark prowadzi'],[48,'Dojście palca'],[59,'Szczelina przed dotykiem']],
  [[4,'Przed dotykiem'],[5,'Styk opuszek'],[34,'Cztery palce zgięte'],[53,'Chwyt do fotografii']],
  [[5,'Nieruchoma odbitka'],[20,'Podparcie zdjęcia'],[32,'Kciuk na okładce'],[59,'Chwyt przy piersi']],
  [[0,'Dłoń na rączce'],[13,'Zwrot wózka'],[29,'Postój'],[59,'Dłoń przy dokumencie']],
  [[8,'Dojście do rogu'],[15,'Chwyt rogu'],[25,'Papier pod naciskiem'],[59,'Chwyt na cięciu']],
  [[6,'Przed obrotem'],[13,'Papier z boku'],[19,'Palec na rewersie'],[59,'Chwyt nad teczką']],
  [[0,'Podparcie na rurce'],[10,'Początek skłonu'],[26,'Pełny skłon'],[59,'Utrzymanie chwytu']],
  [[0,'Dłoń na rurce'],[14,'Bark w ruchu'],[32,'Chwyt na rewersie'],[59,'Wzajemne spojrzenie']],
  [[23,'Przed kontaktem'],[28,'Udo przy gondoli'],[34,'Wózek wyhamował'],[44,'Zwolnienie chwytu']],
  [[25,'Dojście do druku'],[26,'Dotyk ZASIŁKU'],[37,'Przesunięty arkusz'],[38,'Przejście do potwierdzenia']],
  [[23,'Przed dotykiem'],[24,'Marta łapie róg'],[37,'Obie dłonie'],[41,'Marta puszcza']],
  [[11,'Przed odbiorem'],[12,'Dotyk pracownicy'],[16,'Obie dłonie'],[22,'Paweł puszcza']],
  [[7,'Palec przy tytule'],[32,'Palec przy dacie'],[47,'Pauza'],[59,'Dłoń na długopisie']],
  [[25,'Ręka dochodzi'],[29,'Chwyt Pawła'],[31,'Obie dłonie'],[33,'Druk u Pawła']],
  [[5,'Przed siedziskiem'],[6,'Róg na siedzisku'],[25,'Ciężar na poduszce'],[31,'Kciuk puszcza']],
  [[4,'Przed dotknięciem'],[5,'Dłoń na okładce'],[18,'Obrót pod naciskiem'],[27,'Dłoń puszcza okładkę']],
  [[26,'Przed zapiętkiem'],[27,'Chwyt zapiętka'],[35,'Pięta wysunięta'],[52,'But wisi w dłoni']],
  [[17,'Podeszwa nad podłogą'],[18,'But na podłodze'],[19,'Zwolnienie palców'],[31,'Druga dłoń na teczce']],
  [[4,'Chwyt ZASIŁKU'],[13,'Łokieć dociska stos'],[29,'Ostatni docisk'],[35,'Papier uwolniony']],
];
const colors = {hand:'#006866', elbow:'#a04122', foot:'#5140a1'};
function jointKind(name) {
  if (/elbow/i.test(name)) return 'elbow';
  if (/ankle|sole|heel|foot/i.test(name)) return 'foot';
  if (/grip|tip|palm|finger|hand/i.test(name)) return 'hand';
}
const svg = (w,h,body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" font-family="sans-serif">${body}</svg>`);
const label = (x,y,text,size=22,color='#253546') =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}">${text}</text>`;
for (const shot of shotList.split(',').map(Number)) {
  if (!phases[shot-1] || shot < +firstShot) throw Error('Nieprawidłowe ujęcie '+shot);
  const id = String(shot).padStart(2,'0');
  const dir = join(scenes,id);
  const cards = [], paths = [];
  const samples = [];
  for (let f=0; f<60; f++) samples.push(await sampleShot(id,f));
  for (const name of new Set(samples.flatMap(s=>Object.keys(s.points)))) {
    const color = colors[jointKind(name)];
    if (!color) continue;
    let prev;
    for (let f=0; f<60; f++) {
      const p = samples[f].points[name];
      if (!p || p.some(v=>!Number.isFinite(v))) { prev=undefined; continue; }
      const [x,y] = p;
      if (prev) paths.push(`<path d="M${prev[0]} ${prev[1]} L${x} ${y}" stroke="${color}" stroke-width="2" opacity=".65"/>`);
      paths.push(`<circle cx="${x}" cy="${y}" r="${f%10===0?4:1.8}" fill="${color}" opacity="${.3+.7*f/59}"/>`);
      prev = p;
    }
  }
  if (!paths.length) throw Error('Brak próbek kończyn: '+id);
  let background;
  for (const [i,[frame,caption]] of phases[shot-1].entries()) {
    const n = (shot-Number(firstShot))*60 + frame;
    const png = execFileSync('ffmpeg',['-v','error','-ss',(n/30).toFixed(6),'-i',movie,'-frames:v','1','-f','image2pipe','-vcodec','png','-'],{maxBuffer:16<<20});
    if (i===2) background = await sharp(png).resize(1280,720).png().toBuffer();
    const left = i%2*640, top = Math.floor(i/2)*412;
    cards.push({input:await sharp(png).resize(640,360).png().toBuffer(),left,top},
      {input:svg(640,52,label(16,33,`${id} / ${String(frame).padStart(2,'0')}   ${caption}`)),left,top:top+360});
  }
  await sharp({create:{width:1280,height:824,channels:3,background:'#f8f6f1'}})
    .composite(cards).jpeg({quality:92}).toFile(join(dir,'fazy.jpg'));
  const overlay=svg(1280,720,`<rect width="1280" height="720" fill="white" opacity=".57"/>`+paths.join(''));
  const legend=svg(1280,54,label(16,35,`Ujęcie ${id} · 60 klatek`)+label(330,35,'● dłoń',22,colors.hand)+
    label(505,35,'● łokieć',22,colors.elbow)+label(685,35,'● stopa',22,colors.foot)+label(900,35,'Duży punkt co 10 klatek',19));
  await sharp({create:{width:1280,height:774,channels:3,background:'#f8f6f1'}})
    .composite([{input:background,left:0,top:0},{input:overlay,left:0,top:0},{input:legend,left:0,top:720}])
    .jpeg({quality:92}).toFile(join(dir,'ruch.jpg'));
  console.log(id+'   ruch.jpg   fazy.jpg');
}
