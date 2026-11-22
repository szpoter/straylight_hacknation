const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { openStudio } = require('./studio.cjs');

const question = 'Ola urodziła się 10 listopada. Moja podstawa to 6000 zł. Ile dostanę za listopad przy 81,5%, a ile przy 100%?';

async function record() {
  const s = await openStudio();
  const p = s.page;
  try {
    await s.go('/app/rozmowa');
    const box = p.getByRole('textbox', {name: 'Wiadomość do Zusika'});
    await box.waitFor();
    await p.evaluate(() => document.fonts.ready);
    await s.start('02-odpowiedz');
    await s.click(box, 'question');
    await box.pressSequentially(question, {delay: 22});
    await s.wait(900);
    await s.click(p.getByRole('button', {name: 'Wyślij', exact: true}), 'send');
    const log = p.getByRole('log');
    const chip = p.locator('summary').filter({hasText: /Źródło 1/}).first();
    await chip.waitFor({timeout: 90000});
    const answer = await log.innerText();
    for (const amount of ['3423', '4200']) assert.ok(answer.replace(/\s/g, '').includes(amount), answer);
    const amounts = log.getByText(/4\s?200/).last();
    await s.focus(amounts, 'reply');
    await s.park();
    await s.wait(6200);
    await s.click(chip, 'citation');
    const source = p.locator('details[open] blockquote:visible').first();
    await s.focus(source, 'source');
    await s.park();
    await s.wait(3800);
    fs.writeFileSync(path.join(__dirname, 'surowe/zrodlo.txt'), answer + '\n\n' + await source.innerText());
    await s.stop();
  } finally {
    await s.browser.close();
  }
}
record().catch(e => { console.error(e); process.exit(1); });
