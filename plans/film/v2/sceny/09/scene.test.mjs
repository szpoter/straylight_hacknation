import assert from 'node:assert/strict';
import {test} from 'node:test';
import {kit} from '../../rysunek.mjs';
import {scene} from './scene.mjs';

test('Paweł opiera się na prawym bucie i zatrzymuje oba koła', () => {
  let pose, wheels;
  const probe = {
    ...kit,
    person(role, p) {
      if (role === 'pawel') pose = p;
      return kit.person(role, p);
    },
    pram(...args) {
      wheels = args;
      return kit.pram(...args);
    },
  };
  for (let f = 0; f < 60; f++) {
    scene(f, probe);
    const shoeX = pose.x + (26 + 29 * pose.step + pose.footR) * pose.s;
    assert.ok(Math.abs(shoeX - (712 + 26 * 1.09)) < 1e-8);
    assert.ok(Math.abs(wheels[3] - (wheels[0] - 474) * 180 / (Math.PI * 29)) < 1e-8);
    if (f >= 34) {
      assert.equal(wheels[0], 535);
      assert.equal(pose.x, 686);
    }
  }
});
