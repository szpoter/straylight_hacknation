import type { Locator } from "playwright-core";

export async function visibleTurn(chat: Locator, message: {id: string; answer: string}) {
  const turn = chat.locator(`[data-knowledge-turn=${JSON.stringify(message.id)}]`);
  await turn.getByText(message.answer, {exact:true}).first().waitFor({timeout:8000});
  return turn;
}
