import type { Locator } from "playwright-core";
import { expect, it } from "vitest";
import { visibleTurn } from "../scripts/qa-visible-turn";

it("waits for the server's message ID and answer even if an earlier answer is identical", async () => {
  const message = {id:"next", answer:"Identyczna odpowiedź ze źródła."};
  const rendered = new Map([["prior", message.answer]]);
  const element = (id?: string) => ({
    getByText: (text: string, {exact}: {exact:boolean}) => ({
      first: () => ({waitFor: async () => {
        if (!id || !exact || rendered.get(id) !== text) throw Error("missing visible answer");
      }}),
    }),
  });
  const chat = { locator: (selector: string) => {
    const ids = [...rendered.keys()];
    if (selector === "[data-knowledge-turn]") return { last: () => element(ids.at(-1)) };
    return element(ids.find(id => selector === `[data-knowledge-turn="${id}"]`));
  } } as unknown as Locator;
  await expect(visibleTurn(chat,message)).rejects.toThrow("missing visible answer");
  rendered.set(message.id, "Inna treść.");
  await expect(visibleTurn(chat,message)).rejects.toThrow("missing visible answer");
  rendered.set(message.id, message.answer);
  await expect(visibleTurn(chat,message)).resolves.toBeDefined();
});
