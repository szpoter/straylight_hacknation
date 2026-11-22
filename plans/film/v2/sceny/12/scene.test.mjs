import assert from 'node:assert/strict';
import test from 'node:test';
import voices from '../../../montaz/assets/mowa.json' with {type:'json'};
import {kit} from '../../rysunek.mjs';
import {benefitForm,scene} from './scene.mjs';

test('the clerk takes the sheet before Paweł releases it and keeps it on the counter',()=>{
  for(let f=0; f<60; f++) {
    const actors = {};
    const frame = scene(f,{...kit,person(role,pose){actors[role]=pose; return kit.person(role,pose);}});
    assert.doesNotMatch(frame,/undefined|NaN/);
    assert.ok(frame.includes('ZASIŁEK'));
    assert.equal(actors.clerk.mouth,voices.pracownica[660+f]);
    if(f>=9 && f<=15){
      assert.equal(actors.clerk.rightGrip,'pinch');
      assert.equal(actors.pawel.rightGrip,'hold');
    }
    if(f>=55) assert.ok(frame.includes(benefitForm()));
  }
});
