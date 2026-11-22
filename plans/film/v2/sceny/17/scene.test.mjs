import test from 'node:test';
import assert from 'node:assert/strict';
import {kit} from '../../rysunek.mjs';
import {scene as before} from '../16/scene.mjs';
import {lastFrame, scene} from './scene.mjs';

test('Oba cięcia zachowują poprzednią pozę, a chwyt poprzedza zdjęcie buta',()=>{
  assert.equal(scene(0,kit),before(59,kit));
  assert.equal(scene(59,kit),lastFrame(kit));
  for(let f=1;f<60;f++) {
    const poses={};
    const svg=scene(f,{...kit,person:(role,pose)=>{
      poses[role]=pose;
      return kit.person(role,pose);
    }});
    assert.doesNotMatch(svg,/NaN|undefined/);
    if(f<27) continue;
    const p=poses.pawel, [,,x,y]=p.right;
    assert.equal(p.rightGrip,'hold');
    const heel=`translate(${p.x+x*p.s} ${p.y+y*p.s}) rotate(`;
    assert.ok(svg.split(heel).slice(1).some(t=>t.split('>')[0].includes('scale(1.16)')), 'But podąża za dłonią w klatce '+f);
    if(f>=50) assert.ok(svg.includes('translate(942 537) rotate(74) scale(1.16)'));
  }
});
