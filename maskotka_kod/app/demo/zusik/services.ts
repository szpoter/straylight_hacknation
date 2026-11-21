/**
 * Simulated services for the demo: saving a draft field, adding a file and streaming an answer.
 * Results are deterministic. Testers can reproduce a delay or a failure without any control visible
 * to the parent, from the browser console or the URL:
 *   window.zusikTest.failNextSave()      next field save fails
 *   window.zusikTest.dropNextStream()    the connection drops in the middle of the next answer
 *   window.zusikTest.failNextUpload()    the next file fails to upload
 *   window.zusikTest.setDelay(3000)      every save and upload takes 3 s
 *   /demo/zusik?awaria=zapis|polaczenie|plik&opoznienie=3000   the same, once, from the URL
 */

import type { DraftId, FieldKey } from "./data";

type TestState = { saveFails: number; streamDrops: number; uploadFails: number; delay: number; saveCalls: number };

/** `saveCalls` counts field saves, so a test can check that retrying an answer does not save again. */
const test: TestState = { saveFails: 0, streamDrops: 0, uploadFails: 0, delay: 900, saveCalls: 0 };

export const testControls = {
  failNextSave: () => void (test.saveFails += 1),
  dropNextStream: () => void (test.streamDrops += 1),
  failNextUpload: () => void (test.uploadFails += 1),
  setDelay: (ms: number) => void (test.delay = ms),
  state: () => ({ ...test }),
};

/** Reads the hidden test switches from the URL (called once when the demo starts). */
export function applyTestParams(search: string) {
  const params = new URLSearchParams(search);
  const failure = params.get("awaria");
  if (failure === "zapis") testControls.failNextSave();
  if (failure === "polaczenie") testControls.dropNextStream();
  if (failure === "plik") testControls.failNextUpload();
  const delay = Number(params.get("opoznienie"));
  if (delay > 0) testControls.setDelay(delay);
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Saves one field of a draft. Resolves to whether the save succeeded. */
export async function saveField(draftId: DraftId, field: FieldKey, value: string): Promise<boolean> {
  void draftId;
  void field;
  void value;
  test.saveCalls += 1;
  await wait(test.delay);
  if (test.saveFails > 0) {
    test.saveFails -= 1;
    return false;
  }
  return true;
}

/** Uploads a file attached in the composer. */
export async function uploadFile(name: string): Promise<boolean> {
  void name;
  await wait(Math.min(test.delay, 1200));
  if (test.uploadFails > 0) {
    test.uploadFails -= 1;
    return false;
  }
  return true;
}

/** Whether the connection drops during this answer; asked once per streamed answer. */
export function connectionDropsNow(): boolean {
  if (test.streamDrops > 0) {
    test.streamDrops -= 1;
    return true;
  }
  return false;
}

export type ModelId = "pllum" | "bielik";

/**
 * What the deployed version of each model's API declares (simulated). The reasoning level is offered
 * only when the deployed API confirms it; PLLuM declares none, so its requests omit the parameter.
 */
export const MODELS: Record<ModelId, { name: string; reasoningLevels: string[] | null }> = {
  pllum: { name: "PLLuM", reasoningLevels: null },
  bielik: { name: "Bielik", reasoningLevels: ["Niski", "Średni", "Wysoki"] },
};
