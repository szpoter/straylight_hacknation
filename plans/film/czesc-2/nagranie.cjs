const {openStudio}=require('./studio.cjs');
const {resolve}=require('node:path');
const fs=require('node:fs');
const mode=process.argv[2] || 'rodzina';
async function film(){
  const s=await openStudio();
  const {page:p,start,stop,mark,txt,role,focus,click,park,go,wait}=s;
  const link=(href)=>p.locator('a[href="'+href+'"]:visible').first();
  const button=re=>p.getByRole('button',{name:re}).first();
  const docStop=()=>button(/^Wniosek o zasiłek macierzyński/);
  async function hold(loc,id){await focus(loc,id);await park();await wait(2000);}
  async function exitSheet(){await p.keyboard.press('Escape');await wait(250);}
  const sequence=[];
  function step(label,action){sequence.push([label,action]);}
  if(mode==='rodzina'){
    step('landing',async()=>{await go('/');await p.evaluate(()=>document.fonts.ready);await start('01');await hold(link('/logowanie'),'landing');await click(link('/logowanie'),'login');});
    step('import',async()=>{await hold(txt('Import danych rodziny Oli'),'card');await click(role('button','Importuj dane i otwórz plan'),'import');await p.waitForURL('**/plan');});
    step('profil',async()=>{await click(link('/profil'),'profile');await hold(txt('Rodzice Oli'),'parents');await click(link('/plan'),'map');await hold(p.getByLabel('Ścieżka planu, przewijana w poziomie'),'axis');await click(docStop(),'case');await park();await wait(1500);await stop();});
    step('rozmowa',async()=>{await exitSheet();await click(link('/profil'),'profile-chat');await focus(role('link','Otwórz rozmowę z Zusikiem'),'chat');await start('02');await click(role('link','Otwórz rozmowę z Zusikiem'),'open');});
    const question='Ola urodziła się 10 listopada. Moja podstawa to 6000 zł. Ile dostanę za listopad przy 81,5%, a ile przy 100%?';
    step('pytanie',async()=>{const box=p.locator('textarea:visible').last();await click(box,'question');await box.pressSequentially(question,{delay:20});await wait(800);await click(button(/^Wyślij$/),'send');});
    step('przypis',async()=>{const response=p.getByText(/Te źródła nie wystarczają/).first();await response.waitFor({timeout:20000});await wait(1200);mark('first-answer');await park();await wait(1700);
      const box=p.locator('textarea:visible').last();await click(box,'follow');await box.fill('Który przepis określa stawkę 81,5% za okres urlopu macierzyńskiego i rodzicielskiego?');await click(button(/^Wyślij$/),'follow-send');const chips=p.getByRole('button',{name:/^Źródło \d/});await chips.first().waitFor({timeout:125000});mark('reply');await park();await wait(1800);const candidates=await chips.evaluateAll(els=>els.map(e=>({label:e.getAttribute('aria-label'),text:e.parentElement.innerText})));const idx=candidates.findIndex(c=>/81,5|100%|podstawy wymiaru/.test(c.text));await click(chips.nth(Math.max(0,idx)),'citation');const panel=p.locator('section[aria-label^="Źródło:"]:visible').first();await hold(panel,'source');fs.writeFileSync(resolve(__dirname,'surowe/zrodlo.txt'),await panel.innerText());await stop();});
    step('kalkulator',async()=>{if(!await link('/kalkulator').count())await go('/profil');await start('03');await click(link('/kalkulator'),'calculator');await s.inputs();await s.compare();await click(role('radio','81,5% przez cały okres'),'back815');await click(role('button','Zapisz w planie'),'save');await park();await wait(1400);});
    step('termin',async()=>{await click(link('/plan'),'plan');await click(docStop(),'deadline');await park();await wait(2000);await exitSheet();await click(link('/dokumenty'),'documents');await click(p.locator('a[href*="/dokumenty/zasilek-macierzynski"]:visible').first(),'form');await hold(p.locator('main header').last(),'recipient');await click(button(/Uzupełnij wniosek|Rozpocznij wniosek|Edytuj wniosek/),'edit');await park();await wait(900);});
    step('podglad',async()=>{
      const v={rodzic:'Marta Lis',drugi_rodzic:'Paweł Lis',dziecko:'Ola Lis',rodzic_pesel:'90051212349',drugi_pesel:'44051401359',dziecko_pesel:'26311000009',dom:'8',kod:'90-001',miejscowosc:'Łódź',miejsce_urodzenia:'Łódź',nip:'5250001003',rachunek:'PL61 1090 1014 0000 0712 1981 2874'};
      for(const [key,value] of Object.entries({identyfikator:'PESEL',drugi_id:'PESEL',platnik:'Pracodawca',caly_okres:'Tak',wyplata:'Na rachunek bankowy'})){
        const field=p.locator('#pole-'+key);const choice=field.getByText(value,{exact:true}).first();
        if(await choice.count())await choice.click();
      }
      for(const [key,value] of Object.entries(v)){const el=p.locator('#pole-'+key+' input:visible').first();if(await el.count()) await el.fill(value);}
      await click(button(/^Zapisz i sprawdź$/),'review');
      const preview=role('link','Otwórz podgląd w nowej karcie');
      await preview.waitFor();
      const bytes=await preview.evaluate(async a=>Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer())));
      fs.writeFileSync(resolve(__dirname,'surowe/podglad-ZAM.pdf'),Buffer.from(bytes));
      const opened=p.waitForEvent('popup',{timeout:12000});opened.catch(()=>{});
      await click(preview,'preview');const pop=await opened;
      await pop.waitForLoadState('domcontentloaded');s.setLens(pop);await wait(2800);mark('pdf-preview');await wait(2100);s.setLens(p);await p.bringToFront();await wait(500);
      await click(button(/Wróć do edycji|Edytuj wniosek|Zmień/),'back-edit');
    });
    step('szkic',async()=>{await click(button(/^Zapisz szkic i wróć$/),'draft');await hold(p.getByText(/Szkic zapisany. Wrócisz/).first(),'saved');await stop();});
    step('ubezpieczenie',async()=>{await start('04');await click(link('/profil'),'profile');await focus(txt('Konto eZUS · symulacja'),'ezus');await click(txt('Zwolnienia e-ZLA · przykład'),'ezla');await click(role('link','Sprawdź ubezpieczenie na przykładzie'),'insurance');await click(button(/Czy za dni zwolnienia/),'ask');});
    step('plik',async()=>{const input=p.locator('input[type=file]:visible').last();await focus(input,'upload');const picker=p.waitForEvent('filechooser');await click(input,'choose');await (await picker).setFiles(resolve(__dirname,'../../../app/public/demo/sickness/akta-demonstracyjne.pdf'));mark('file');const original=txt('Oryginalna strona');await original.waitFor({timeout:45000});await hold(original,'read');if(!await original.evaluate(e=>e.closest('details').open))await click(original,'original');else mark('original');await focus(original,'page');await park();await wait(2200);await stop();});
  }else{
    step('admin',async()=>{await go('/admin');await click(p.locator('button[type=submit]'),'login');await p.waitForURL('**/admin/reguly');await click(button(/uśrednion/i),'rate');await click(role('link','Przygotuj zmianę'),'new');await p.getByLabel(/Nowa wartość/).fill('85');await p.getByLabel(/Stosuj od/).fill('2027-01-01');await p.getByLabel(/Podstawa zmiany/).fill('Demonstracyjny szkic do filmu.');await click(button(/^Zapisz szkic$/),'save');await focus(p.getByLabel(/Nowa wartość/),'rate');await start('05');await hold(p.getByLabel(/Nowa wartość/),'rate');await click(button(/^Sprawdź zmianę$/),'check');await p.getByText(/Sprawdzenie zakończone|Sprawdzenie wykazało/).first().waitFor();await hold(p.getByRole('columnheader',{name:'Po zmianie'}).first(),'tested');await stop();});
  }
  try {
    for(const [name,action] of sequence){
      console.log('START',name);
      await action();
    }
  } finally {
    await s.browser.close();
  }
}
film().catch(e=>{console.error(e);process.exit(1);});
