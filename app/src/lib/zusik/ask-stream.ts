export const ASK_STREAM = "application/x-ndjson";

export async function readAskStream(
  response: Response,
  activity: (text: string) => void,
  delta: (text: string) => Promise<void>,
): Promise<{ status: number; body: unknown }> {
  if (!response.headers.get("content-type")?.includes(ASK_STREAM)) {
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }
  if (!response.body) throw new Error("Missing answer stream");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) throw new Error("Incomplete answer stream");
      pending += value;
      let boundary: number;
      while ((boundary = pending.indexOf("\n")) !== -1) {
        const frame = JSON.parse(pending.slice(0, boundary));
        pending = pending.slice(boundary + 1);
        if (frame?.type === "result" && Number.isInteger(frame.status) && frame.body) {
          return { status: frame.status, body: frame.body };
        }
        if (typeof frame?.text !== "string") throw new Error("Invalid answer stream");
        if (frame.type === "activity") activity(frame.text);
        else if (frame.type === "delta") await delta(frame.text);
        else throw new Error("Unexpected answer event");
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
