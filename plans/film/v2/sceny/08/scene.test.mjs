import assert from 'node:assert/strict';
import {test} from 'node:test';
import mouths from '../../../montaz/assets/mowa.json' with {type: 'json'};
import {kit} from '../../rysunek.mjs';
import {scene as previous} from '../07/scene.mjs';
import {scene} from './scene.mjs';

test('ujęcie otwiera dokładny ostatni kadr nad wózkiem', () => {
  assert.equal(scene(0, kit), previous(59, kit));
});

test('Paweł podnosi oczy przed głową i utrzymuje oboma rękami dokumenty', () => {
  const poses = [];
  const folders = [];
  const probe = {
    ...kit,
    person(role, pose) {
      if (role === 'pawel') poses.push(pose);
      return kit.person(role, pose);
    },
    folder(...args) {
      folders.push(args);
      return kit.folder(...args);
    },
  };
  for (let f = 0; f < 60; f++) scene(f, probe);
  assert.equal(poses.length, 60);
  assert.equal(folders.length, 60);
  for (const [f, pose] of poses.entries()) {
    assert.deepEqual(pose.left, poses[0].left);
    assert.deepEqual(pose.right, poses[0].right);
    assert.deepEqual(folders[f], folders[0]);
    assert.equal(pose.mouth, mouths.pawel[420 + f]);
  }
  assert.equal(poses[26].gazeDown, poses[0].gazeDown);
  assert.ok(poses[32].gazeDown < poses[26].gazeDown);
  assert.equal(poses[32].head, poses[26].head);
  assert.notEqual(poses[43].head, poses[32].head);
});
