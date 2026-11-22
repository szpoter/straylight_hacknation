import assert from 'node:assert/strict';
import test from 'node:test';
import {kit} from '../../rysunek.mjs';
import {scene} from './scene.mjs';

test('Kreska rośnie pod stalówką, a zamknięta teczka przechodzi przez cięcie z ustaloną prędkością',()=>{
  let folder;
  const capture = {...kit,folder(...pose){folder=pose;return kit.folder(...pose);}};
  for (let f=0;f<60;f++) {
    const svg = scene(f,capture);
    assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
    if (f===7) assert.doesNotMatch(svg,/stroke="#245344"/);
    if ([8, 13, 17, 23].includes(f)) {
      const ink = svg.match(/translate\(-56 74\)" d="([^"]+)"/)[1];
      const [,x,y] = ink.match(/L([-\d.]+) ([-\d.]+)$/).map(Number);
      const [,wx,wy] = svg.match(/translate\(([\d.]+) ([\d.]+)\)" stroke-linejoin="round"><path d="M-22 28/).map(Number);
      const angle = -10*Math.PI/180;
      const endX = 816+(x-56)*Math.cos(angle)-(y+74)*.78*Math.sin(angle);
      const endY = 463+(x-56)*Math.sin(angle)+(y+74)*.78*Math.cos(angle);
      assert.ok(Math.hypot(endX-(wx-22),endY-(wy+28))<.01);
    }
    if (f>=44) assert.doesNotMatch(svg,/11\.01\.2027/);
    if (f>=53) assert.deepEqual(folder,[600+f-52,386+6*(f-52),190,-8,0]);
  }
});
