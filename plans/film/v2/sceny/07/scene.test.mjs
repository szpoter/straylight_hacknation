import assert from 'node:assert/strict';
import { test } from 'node:test';
import { kit } from '../../rysunek.mjs';
import { scene as following } from '../08/scene.mjs';
import { scene } from './scene.mjs';

test('skłon nie zrywa chwytu, oddech porusza kocyk i kończy się w pozie 08', () => {
  const heights = [];
  for (let f = 0; f < 60; f++) {
    const hands = [];
    const svg = scene(f, { ...kit, hand(...args) {
      hands.push(args);
      return kit.hand(...args);
    }});
    assert.doesNotMatch(svg, /NaN|undefined/);
    assert.ok(hands.some(([x, y, , , grip]) => 323 + x * 1.05 === 330 && 445 + y * 1.05 === 467 && grip === 'hold'));
    heights.push(Number(svg.match(/M-78 -109Q-20 ([-.\d]+)/)[1]));
  }
  assert.equal(heights[0], heights[59]);
  assert.ok(heights[29] < heights[15] && heights[15] < heights[0]);
  assert.ok(heights[44] > heights[30]);
  assert.equal(scene(59, kit), following(0, kit));
});
