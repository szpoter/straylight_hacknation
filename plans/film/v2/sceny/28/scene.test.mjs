import assert from 'node:assert/strict';
import test from 'node:test';
import { scene } from './scene.mjs';

test('pojedynczy odpis przekracza prześwit przed potwierdzeniem', () => {
  const frames = Array.from({ length: 60 }, (_, f) => scene(f, {}));
  const positions = frames.map((svg, frame) => {
    assert.equal(svg.match(/Odpis aktu urodzenia Oli/g)?.length, 1);
    assert.equal(svg.includes('data-confirmation="attached"'), frame > 42);
    const [, x, y] = svg.match(/data-file="odpis" transform="translate\(([\d.]+) ([\d.]+)\)"/);
    return [Number(x), Number(y)];
  });

  assert.deepEqual(positions[0], [140, 376]);
  assert.deepEqual(positions[17], [140, 354]);
  assert.ok(positions.some(([x, y]) => x < 586 && x + 446 > 676 && y < 354));
  assert.ok(positions.slice(1).every(([x], i) => x >= positions[i][0]));
  assert.ok(positions[41][1] < 376);
  assert.deepEqual(positions[42], [676, 376]);
  assert.equal(frames[48], frames[59]);
});
