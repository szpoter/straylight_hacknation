import { Annotation, END, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { describe, expect, it, vi } from "vitest";
import { applyMarta } from "@/lib/marta/case";
import { commandSchema, type MartaView } from "@/lib/marta/types";
import { readMarta } from "@/lib/marta/server";

const memory = new MemorySaver();
vi.mock("@/lib/zusik/server", () => ({ runtime: () => ({ pool: null, checkpointer: memory }) }));
vi.mock("@/lib/zusik/case-store", () => ({
  PgCaseStore: class {
    findOrCreate(session: string) { return { threadId: session }; }
    findBySession(session: string) { return { threadId: session }; }
    acquireLease() { return true; }
    releaseLease() {}
  },
}));

const schema = Annotation.Root({ view: Annotation<MartaView | null> });
const graph = new StateGraph(schema).addNode("save", state => state)
  .addEdge(START, "save").addEdge("save", END).compile({ checkpointer: memory });
const config = (threadId: string) => ({ configurable: { thread_id: threadId } });
const input = { type: "compare", firstStart: "2027-01-18", days: 28, firstDaily: 150, secondDaily: 110 };
const compare = commandSchema.parse(input);
const ola = applyMarta(null, compare).view!;

describe("household-specific Marta checkpoint", () => {
  it("continues the old matching draft even if the old record has no birth date", async () => {
    const original = { ...ola, childBirthDate: undefined };
    await graph.invoke({ view: original }, config("matching:marta"));
    expect((await readMarta("matching")).view).toMatchObject({ version: 1, firstName: "Marta Lis" });
    await readMarta("matching", { type: "choose", version: 1, variant: "together" });
    expect((await readMarta("matching")).view?.selected).toBe("together");
    expect((await graph.getState(config("matching:marta"))).values.view?.version).toBe(2);
  });

  it("isolates an earlier household without changing the previous record", async () => {
    const original = { ...ola, firstName: "Inna osoba", attachmentName: "stary-odpis.pdf" };
    await graph.invoke({ view: original }, config("foreign:marta"));
    expect((await readMarta("foreign")).view).toBeNull();
    expect(commandSchema.safeParse({ ...input, firstName: original.firstName }).success).toBe(false);
    expect(commandSchema.safeParse({ ...input, childBirthDate: "2026-05-03" }).success).toBe(false);
    expect((await readMarta("foreign", compare)).status).toBe(200);
    expect((await readMarta("foreign")).view).toMatchObject({ childName: "Ola Lis", childBirthDate: "2026-11-10", attachmentName: null });
    expect((await graph.getState(config("foreign:marta"))).values.view).toEqual(original);
  });
});
