import assert from "node:assert/strict";
import {test} from "node:test";
import {scene as preceding} from "../23/scene.mjs";
import {scene} from "./scene.mjs";

test("mapa przechodzi w rozmowę, a oba wiersze pytania wchodzą razem", () => {
  assert.equal(scene(0), preceding(59));
  for (let frame = 0; frame < 60; frame++) {
    const svg = scene(frame);
    assert.match(svg, /Zgłoś urodzenie Oli/);
    assert.match(svg, /1 grudnia 2026/);
    assert.equal(svg.includes("A jeśli weźmiemy"), frame >= 14);
    assert.equal(svg.includes("urlop razem?"), frame >= 14);
  }
  assert.match(scene(59), /x="427" width="853"/);
  assert.equal(scene(25), scene(59));
});
