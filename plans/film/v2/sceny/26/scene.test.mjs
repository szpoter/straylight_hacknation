import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
import {kit} from "../../rysunek.mjs";
import {answerFrame} from "../25/scene.mjs";
import {scene} from "./scene.mjs";

test("otwarcie przejmuje odnośnik i zatrzymuje prawdziwe zdanie przepisu", () => {
  const corpus = readFileSync(new URL("../../../../../app/corpus/marta/fragments.jsonl", import.meta.url), "utf8");
  const source = corpus.trim().split("\n").map(line => JSON.parse(line))
    .find(fragment => fragment.logicalId === "kp-art182-1a-par6");
  const firstSentence = source.sourceText.slice("§ 6. ".length).split(". ")[0] + ".";
  const frames = Array.from({length: 60}, (_, f) => scene(f, kit));
  assert.equal(frames[0], answerFrame(kit));
  const finalText = frames[59].replace(/<\/text>\s*<text[^>]*>/g, " ").replace(/<[^>]+>/g, "");
  assert.ok(finalText.includes(firstSentence));
  assert.ok(frames.slice(30).every(frame => frame === frames[59]));
  assert.notEqual(frames[18], frames[29]);
});
