import assert from 'node:assert/strict';
import {test} from 'node:test';
import {kit} from '../../rysunek.mjs';
import {scene} from './scene.mjs';

test('palec zatrzymuje się przy nagłówku i dacie, a wzrok Marty reaguje na przesunięcie', () => {
  const frames = Array.from({length:60},(_,f) => {
    let tip, marta;
    const svg = scene(f,{...kit,
      person(role,pose) {
        if (role==='marta') marta = pose;
        return kit.person(role,pose);
      },
      hand(x,y,angle,size,grip) {
        if (grip==='point') {
          const a = angle*Math.PI/180;
          tip = [x + size*(29*Math.cos(a)+12*Math.sin(a)), y + size*(29*Math.sin(a)-12*Math.cos(a))];
        }
        return kit.hand(x,y,angle,size,grip);
      },
    });
    assert.ok(!/NaN|undefined/.test(svg));
    assert.equal(svg.split('11.01.2027').length,2);
    return {tip,marta};
  });
  for (const [start,end,x,y] of [[14,20,831.55,407.19],[44,59,850.79,493.30]]) {
    for (const {tip} of frames.slice(start,end+1)) assert.ok(Math.hypot(tip[0]-x,tip[1]-y)<1);
  }
  assert.ok(frames[23].tip[1]>frames[20].tip[1]);
  assert.equal(frames[23].marta.gazeDown,frames[20].marta.gazeDown);
  assert.ok(frames[27].marta.gazeDown>frames[23].marta.gazeDown);
  assert.equal(frames[27].marta.head,frames[20].marta.head);
  assert.ok(frames[49].marta.head>frames[27].marta.head);
});
