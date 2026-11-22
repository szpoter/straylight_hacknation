import assert from 'node:assert/strict';
import test from 'node:test';
import mouths from '../../../montaz/assets/mowa.json' with { type: 'json' };
import { kit } from '../../rysunek.mjs';
import { scene as previous } from '../03/scene.mjs';
import { scene } from './scene.mjs';

test('scena 04 łączy kadry, a ręka, koła i usta zachowują synchronizację', () => {
  assert.equal(scene(0, kit), previous(59, kit));
  const rolls = [0];
  for (let f = 1; f < 60; f++) {
    let actor, pram;
    const svg = scene(f, { ...kit,
      person(role, pose) {
        if (role === 'marta' && pose.rightGrip === 'hold') actor = pose;
        return kit.person(role, pose);
      },
      pram(x, y, scale, roll) {
        pram = { x, y, scale, roll };
        return kit.pram(x, y, scale, roll);
      },
    });
    assert.doesNotMatch(svg, /NaN|undefined/);
    assert.equal(actor.mouth, mouths.marta[180 + f]);
    assert.ok(Math.abs(actor.x + actor.right[2] * actor.s - (pram.x - 144)) < .001);
    assert.ok(Math.abs(actor.y + actor.right[3] * actor.s - (pram.y - 145)) < .001);
    const distance = pram.x - (f < 22 ? 474 : 712);
    assert.ok(Math.abs(distance - pram.roll * Math.PI * 29 / 180) < .001);
    rolls.push(pram.roll);
  }
  assert.ok(rolls[13] > rolls[0] && rolls[13] > rolls[14]);
  assert.ok(rolls[32] < 0 && rolls[32] < rolls[33]);
  assert.equal(rolls[59], 0);
  assert.match(scene(59, kit), /translate\(672 392\) rotate\(-6\)/);
});
