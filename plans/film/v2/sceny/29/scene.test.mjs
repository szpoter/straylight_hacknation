import assert from 'node:assert/strict';
import { scene as attachment } from '../28/scene.mjs';
import { scene } from './scene.mjs';

assert.equal(scene(0, {}), attachment(59, {}));
for (let f = 1; f < 60; f++) {
  const frame = scene(f, {});
  for (const label of ['Wniosek o urlop rodzicielski', 'Pracodawca · Studio Lipa', 'Odpis aktu urodzenia Oli']) {
    assert.equal(frame.split(label).length, 2);
  }
  assert.doesNotMatch(frame, /NaN|undefined/);
  if (f >= 18) assert.equal(frame, scene(59, {}));
}
