const {chromium} = require('../../../app/node_modules/playwright-core');
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const base = process.env.FILM_BASE || 'http://127.0.0.1:3828';
const dir = path.join(__dirname, 'surowe');
async function openStudio() {
  const browser = await chromium.launch({channel:'chrome', args:['--lang=pl','--hide-scrollbars']});
  const page = await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1,locale:'pl-PL'});
  page.setDefaultTimeout(8000);
  await page.addInitScript(() => {
    function mount() {
      if (!document.body || document.getElementById('film-pointer')) return;
      const cursor = document.createElement('div');
      cursor.id = 'film-pointer';
      cursor.style.cssText = 'position:fixed;pointer-events:none;z-index:2147483647;top:0;left:0;width:16px;height:22px;transform:translate(1700px,830px);filter:drop-shadow(0 1px 1px #0005)';
      cursor.innerHTML='<svg viewBox="0 0 17 23"><path d="M1 1l14 12-6 1 3.3 6.1-3.1 1.5-3.1-6.4-5 3z" fill="#263534" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      document.body.append(cursor);
      document.addEventListener('mousemove', e=>cursor.style.transform='translate('+e.clientX+'px,'+e.clientY+'px)',true);
    }
    document.addEventListener('DOMContentLoaded',mount);
  });
  let lens=page;
  let recording, last, frames, zero, marks, encoder, done, capture, active;
  function flush() {
    if (!last || !recording) return;
    const target = Math.round((performance.now()-zero)*.03);
    while(frames<target) { encoder.stdin.write(last); frames++; }
  }
  const mark=(id,xy)=>{if(recording) console.log(recording,id); if(recording) marks.push({id,t:+((performance.now()-zero)/1000).toFixed(3),xy});};
  async function start(name) {
    assert(!recording);
    encoder=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate','30','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p',path.join(dir,name+'.mp4')],{stdio:['pipe','ignore','inherit']});
    done=new Promise((resolve,reject)=>encoder.once('exit',n=>n?reject(Error('ffmpeg '+n)):resolve()));
    last=await page.screenshot({type:'jpeg',quality:94});
    recording=name; frames=0; zero=performance.now(); marks=[];
    active=true;
    capture=(async()=>{while(active){const current=lens;
      try {const shot=await current.screenshot({type:'jpeg',quality:94,timeout:4500});flush();last=shot;}
      catch(error){if(page.isClosed())throw error;flush();await wait(65);}
    }})();
    await wait(2050);
  }
  async function stop() {
    await wait(2050); active=false; await capture; flush();
    const name=recording; recording=null; encoder.stdin.end(); await done;
    fs.writeFileSync(path.join(dir,name+'.json'),JSON.stringify(marks,null,2));
  }
  const txt=(s,i=0)=>page.getByText(s,{exact:true}).filter({visible:true}).nth(i);
  const role=(r,s,i=0)=>page.getByRole(r,{name:s,exact:true}).nth(i);
  async function focus(loc,id){
    await loc.waitFor({state:'visible'});
    await loc.evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
    await wait(230);
    const b=await loc.boundingBox();
    const pt=[Math.round(b.x+b.width/2),Math.round(b.y+b.height/2)];
    mark(id,pt); return pt;
  }
  async function click(loc,id){
    const pt=await focus(loc,id+'-aim');
    await page.mouse.move(...pt,{steps:14}); await wait(180);
    await loc.click(); mark(id,pt); await wait(360);
  }
  const park=()=>page.mouse.move(1700,830,{steps:12});
  const go=slug=>page.goto(base+slug,{waitUntil:'domcontentloaded'});
  async function enter(){
    await go('/logowanie'); await click(role('button','Importuj dane i otwórz plan'),'import'); await page.waitForURL('**/plan');
  }
  async function inputs(){
    const date=page.getByLabel(/Data porodu \(albo przewidywana/);
    await focus(date,'date'); assert.equal(await date.inputValue(),'2026-11-10');
    await wait(900);
    const second=page.getByLabel(/Drugi rodzic podlega ubezpieczeniu/);
    if(!await second.isChecked()) await click(second,'second');
    for(const [i,value] of ['6000','5000'].entries()){
      await click(role('radio','Umowa o pracę',i),'employment'+i);
      await click(role('radio','Znam podstawę',i),'known'+i);
      const input=page.getByLabel('Podstawa wymiaru zasiłku (zł)',{exact:true}).nth(i);
      await click(input,'input'+i); await input.fill(''); await input.pressSequentially(value,{delay:85}); mark('basis'+i); await wait(650);
    }
    await click(role('radio','81,5% przez cały okres'),'averaged');
    await click(txt('Wypłaty miesiąc po miesiącu'),'table');
  }
  async function row(value,id){
    const loc=page.locator('tr').filter({hasText:/lis(topad)? 2026/i}).first();
    await focus(loc,id+'-row');
    const amount=await loc.locator('td').nth(1).innerText();
    assert.match(amount.replace(/\s/g,''),new RegExp('^'+value+'(?:,00)?zł'));
    await park(); mark(id,await loc.locator('td').nth(1).boundingBox().then(b=>[b.x+b.width/2,b.y+b.height/2])); await wait(1900);
  }
  async function compare(){
    await row(3423,'first'); await click(role('radio','100%, potem 70%'),'switch'); await row(4200,'second-result');
  }
  const snapshot=()=>page.locator('body').ariaSnapshot().then(s=>console.log(s.slice(0,13000)));
  return {setLens:target=>lens=target,browser,page,start,stop,mark,txt,role,focus,click,park,go,enter,inputs,row,compare,snapshot,wait};
}
module.exports={openStudio};
if(require.main===module) (async()=>{
  const s=await openStudio();
  try{
    await s.enter(); await s.go('/kalkulator'); await s.inputs();
    await s.row(3423,'pre'); await s.start('proba'); await s.compare(); await s.stop();
  }finally{await s.browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
