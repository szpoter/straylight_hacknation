import assert from 'node:assert/strict';
import {test} from 'node:test';
import {kit} from '../../rysunek.mjs';
import {printout} from '../10/scene.mjs';
import {scene} from './scene.mjs';

test('Marta chwyta zsuwający się druk, Paweł trzyma drugi brzeg przed puszczeniem', () => {
  const frames = Array.from({length:60}, (_,f) => {
    const wrists = {};
    const svg = scene(f, {...kit, person(role,pose) {
      if (role !== 'clerk') {
        const [, , x, y] = pose.right;
        wrists[role] = [pose.x + x * pose.s, pose.y + y * pose.s, pose.rightGrip];
      }
      return kit.person(role,pose);
    }});
    const page = printout('zasilek');
    assert.equal(svg.split(page).length, 2);
    assert.ok(!/NaN|undefined/.test(svg));
    const [,x,y,angle] = svg.slice(0,svg.indexOf(page)).match(/translate\(([-\d.]+) ([-\d.]+)\) rotate\(([-\d.]+)\)">$/);
    return {x:Number(x), y:Number(y), radians:Number(angle)*Math.PI/180, wrists};
  });
  const check = (role,f,ex,ey,dx,dy) => {
    const {x,y,radians,wrists} = frames[f];
    const [wx,wy,grip] = wrists[role];
    assert.equal(grip, 'pinch');
    assert.ok(Math.abs(wx - (x + ex*Math.cos(radians) - ey*Math.sin(radians) + dx)) < .01);
    assert.ok(Math.abs(wy - (y + ex*Math.sin(radians) + ey*Math.cos(radians) + dy)) < .01);
  };
  assert.equal(frames[0].x,619);
  assert.ok(frames[25].y - frames[0].y > 80);
  for (let f=25;f<=39;f++) check('marta',f,-37,17,-10,5);
  for (let f=36;f<60;f++) check('pawel',f,38,1,9,6);
  assert.equal(frames[40].wrists.marta[2],'open');
  assert.ok(frames[59].x > 800);
});
