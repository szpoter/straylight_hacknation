import assert from 'node:assert/strict';
import test from 'node:test';
import {kit} from '../../rysunek.mjs';
import {scene as previous} from '../17/scene.mjs';
import {scene as next} from '../19/scene.mjs';
import {scene} from './scene.mjs';

test('But osiada przed puszczeniem, a ręce przechodzą bez uskoku do sceny 19',()=>{
  assert.equal(scene(0,kit),previous(59,kit));
  const poses={};
  const capture={...kit,person(role,p){poses[role]=p;return kit.person(role,p);}};
  for(let f=1;f<60;f++){
    const svg=scene(f,capture);
    assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
    if(f===18 || f===19){
      const p=poses.pawel;
      assert.ok(Math.abs(p.x+p.right[2]*p.s-858)<.001);
      assert.ok(Math.abs(p.y+p.right[3]*p.s-655.88)<.001);
      assert.equal(p.rightGrip,f===18?'hold':'open');
    }
  }
  for(const [role,ending] of Object.entries({...poses})){
    next(0,capture);
    for(const arm of ['left','right'])assert.deepEqual(ending[arm],poses[role][arm]);
  }
});
