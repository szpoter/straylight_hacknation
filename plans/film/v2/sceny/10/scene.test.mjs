import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {test} from 'node:test';
import {kit} from '../../rysunek.mjs';
import {scene} from './scene.mjs';

const sharp = createRequire(new URL('../../../../../app/package.json', import.meta.url))('sharp');

test('papier odsłania kolejno pełne podkreślenie prawego, lewego i środkowego akapitu', async () => {
  const frames = [[0, [false,false,false]], [16, [false,false,true]], [37, [true,false,true]], [59, [true,true,true]]];
  for (const [f, expected] of frames) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">${scene(f,kit)}</svg>`;
    const pixels = await sharp(Buffer.from(svg)).removeAlpha().raw().toBuffer();
    const ink = [0, 0, 0];
    for (let i = 0; i < pixels.length; i += 3) {
      if (pixels[i] !== 32 || pixels[i + 1] !== 134 || pixels[i + 2] !== 75) continue;
      const x = (i / 3) % 1280;
      ink[x < 415 ? 0 : x < 790 ? 1 : 2]++;
    }
    assert.deepEqual(ink.map(count => count > 500), expected, `klatka ${f}`);
  }
});
