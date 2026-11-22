import assert from 'node:assert/strict';
import test from 'node:test';
import { kit } from '../../rysunek.mjs';
import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };
import { scene } from './scene.mjs';

test('zmiana chwytu poprzedza obrót, a obejrzenie odwrotu poprzedza odpowiedź', () => {
  const frames = Array.from({ length: 60 }, (_, f) => {
    let pawel;
    const svg = scene(f, { ...kit, person(role, pose) {
      if (role === 'pawel') pawel = pose;
      return '';
    } });
    assert.doesNotMatch(svg, /NaN|undefined/);
    assert.equal(pawel.mouth, mouths.pawel[279 + f]);
    return { svg, pawel };
  });
  assert.equal(frames[0].pawel.rightGrip, 'pinch');
  assert.equal(frames[4].pawel.rightGrip, 'open');
  assert.equal(frames[7].pawel.rightGrip, 'hold');
  assert.ok(frames[7].pawel.right[3] > frames[0].pawel.right[3] + 20);
  assert.match(frames[7].svg, />URLOP</);
  assert.doesNotMatch(frames[13].svg, />URLOP</);
  assert.match(frames[19].svg, /M-26 -10h7v7h-7Z/);
  assert.ok(frames[24].pawel.head > frames[14].pawel.head);
  assert.ok(frames.slice(0, 27).every(({ pawel }) => pawel.mouth === 0));
  assert.ok(frames[30].pawel.mouth > .5);
});
