import { expect, it } from "vitest";
import { ASK_STREAM, readAskStream } from "../src/lib/zusik/ask-stream";

function response(frames: object[]) {
  const bytes = new TextEncoder().encode(frames.map(frame => JSON.stringify(frame) + "\n").join(""));
  return new Response(new ReadableStream({
    start(controller) {
      for (const byte of bytes) controller.enqueue(Uint8Array.of(byte));
      controller.close();
    },
  }), { headers: { "content-type": ASK_STREAM } });
}

it("decodes split UTF-8 and delivers activity and verified text before the result", async () => {
  const shown: string[] = [];
  const result = { status: 200, body: { turn: {} } };
  const res = response([{type:"activity",text:"Źródła"}, {type:"delta",text:"Świadczenie"}, {type:"result", ...result}]);
  expect(await readAskStream(res, s => shown.push(s), async s => { shown.push(s); })).toEqual(result);
  expect(shown).toEqual(["Źródła", "Świadczenie"]);
});

it("rejects an interrupted response so it can be retried under the original request id", async () => {
  await expect(readAskStream(response([]), () => {}, async () => {})).rejects.toThrow("Incomplete");
});

it("preserves ordinary HTTP errors and retry semantics", async () => {
  const res = Response.json({ error: "no_session" }, { status: 401 });
  expect(await readAskStream(res, () => {}, async () => {})).toEqual({status:401,body:{error:"no_session"}});
});
