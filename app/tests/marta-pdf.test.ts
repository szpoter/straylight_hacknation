import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it, vi } from "vitest";
import { applyMarta } from "@/lib/marta/case";
import { commandSchema } from "@/lib/marta/types";
import { martaPdf } from "@/lib/marta/pdf";
import { GET } from "@/app/api/zusik/marta/pdf/route";
import { readMarta } from "@/lib/marta/server";
import { currentSessionId } from "@/lib/zusik/server";

vi.mock("@/lib/marta/server", () => ({ readMarta: vi.fn() }));
vi.mock("@/lib/zusik/server", () => ({ currentSessionId: vi.fn(), NO_STORE: { "Cache-Control": "private, no-store" } }));

async function textOf(bytes: Uint8Array) {
  const pdf = await getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  try {
    expect(pdf.numPages).toBe(1);
    const content = await (await pdf.getPage(1)).getTextContent();
    return content.items.map(item => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ");
  } finally {
    await pdf.destroy();
  }
}

const compared = applyMarta(null, commandSchema.parse({
  type: "compare", firstStart: "2027-01-18", days: 28, firstDaily: 150, secondDaily: 110,
})).view!;
const chosen = applyMarta(compared, { type: "choose", version: 1, variant: "sequential" }).view!;
const ready = applyMarta(chosen, { type: "confirm", version: 2, employerHasCopy: true,
  otherParentConfirmed: true, previousDays: 7, previousParts: 1 }).view!;
const get = (query = "") => GET(new Request("https://example.test/api/zusik/marta/pdf" + query));

describe("employee application PDF", () => {
  it("marks the blank and partially filled employer form as drafts", async () => {
    const blank = await textOf(await martaPdf(null));
    expect(blank).toContain("SZKIC");
    expect(blank).toContain("Pracodawca: Studio Lipa");
    const partial = await textOf(await martaPdf(chosen));
    expect(partial).toContain("Do potwierdzenia");
    expect(partial).toContain("18.01.2027");
    expect(partial).not.toContain("null");
  });

  it("prints the confirmed dates, history, evidence and declaration for each variant", async () => {
    const sequential = await textOf(await martaPdf(ready));
    for (const text of ["Marta Lis", "Ola Lis", "18.01.2027 do 14.02.2027", "Paweł Lis", "15.02.2027 do 14.03.2027",
      "7 dni", "wniosków o zasiłek: 1", "nie zamierza", "aktach osobowych"]) expect(sequential).toContain(text);
    expect(sequential).not.toContain("SZKIC");
    const together = await textOf(await martaPdf({ ...ready, selected: "together", employerHasCopy: false, attachmentName: "odpis.pdf" }));
    expect(together).toContain("równocześnie ze mną");
    expect(together).toContain("odpis.pdf");
  });

  it("serves the exact version shown, keeps the final download gated and isolates sessions", async () => {
    vi.mocked(currentSessionId).mockResolvedValue("demo");
    vi.mocked(readMarta).mockResolvedValue({ status: 200, view: chosen });
    expect((await get()).status).toBe(404);
    expect((await get("?version=2")).status).toBe(200);
    vi.mocked(readMarta).mockResolvedValue({ status: 200, view: ready });
    expect((await get("?version=2")).status).toBe(404);
    const preview = await get("?version=3");
    expect(preview.headers.get("Cache-Control")).toBe("private, no-store");
    expect(Buffer.from(await preview.arrayBuffer())).toEqual(Buffer.from(await (await get()).arrayBuffer()));
    vi.mocked(currentSessionId).mockResolvedValue(null);
    expect((await get("?version=3")).status).toBe(404);
    expect((await get()).status).toBe(404);
    expect((await get("?version=0")).status).toBe(200);
  });
});
