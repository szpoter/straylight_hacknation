import assert from 'node:assert/strict';
import { kit } from '../../rysunek.mjs';
import { scene as draft } from '../29/scene.mjs';
import { scene } from './scene.mjs';

const frames = Array.from({ length: 60 }, (_, f) => scene(f, kit));
assert.equal(frames[0], draft(59, kit));
for (const frame of frames) assert.doesNotMatch(frame, /NaN|undefined/);
assert.match(frames[19], /Pracodawca · Studio Lipa[\s\S]*Zgłoszenie urodzenia dziecka[\s\S]*urlopu ojcowskiego/);
for (const frame of frames.slice(36)) {
  assert.match(frame, /#oryginalny-zusik/);
  assert.doesNotMatch(frame, /<text/);
}
const final = '<rect width="1280" height="720" fill="#F5FAF7"/>' + kit.zusik(640, 360, 315, 0);
for (const frame of frames.slice(56)) assert.equal(frame, final);
