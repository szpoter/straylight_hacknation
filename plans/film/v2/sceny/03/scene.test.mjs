import assert from 'node:assert/strict';
import {test} from 'node:test';
import {kit} from '../../rysunek.mjs';
import {photo, scene as hospital} from '../02/scene.mjs';
import {scene, queueShot} from './scene.mjs';

test('zdjęcie zachowuje ostatnią pozę szpitalną przez cały odjazd', () => {
  const still = photo(kit);
  assert.equal(scene(0, kit), hospital(59, kit));
  for (let f = 0; f < 60; f++) assert.ok(scene(f, kit).includes(still), `klatka ${f}`);
  assert.notEqual(scene(18, kit), scene(32, kit));
  assert.equal(scene(59, kit), queueShot(kit));
});
