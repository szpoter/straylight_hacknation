import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { officialEvidenceReader } from "@/lib/rag/official-fetch";
import { nurseryIntent } from "@/lib/zusik/turn-graph";

const sourceId = "zus-aktywnie-w-zlobku";
const html = readFileSync("corpus/oferta/snapshots/zus-aktywnie-w-zlobku.html", "utf8");
describe("official evidence", () => {
  it("fetches one canonical public page for concurrent reads and keeps the checked version", async () => {
    const request = vi.fn(async () => new Response(html, { headers: { "content-type": "text/html" } }));
    const read = officialEvidenceReader(request);
    const [care, payment] = await Promise.all([read(sourceId, "care"), read(sourceId, "recipient")]);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith("https://www.zus.pl/aktywnyrodzic/wiadczenie-aktywnie-w-zlobku",
      expect.objectContaining({ credentials: "omit", redirect: "error", headers: { accept: "text/html" } }));
    expect(care.citation?.hash).not.toBe(payment.citation?.hash);
    expect(payment.citation?.quote).toContain("rachunek bankowy podmiotu");
    expect(await read(sourceId, "recipient")).toEqual({ ...payment, fetches: 0 });
  });
  it("rejects unregistered inputs before HTTP and observes Retry-After", async () => {
    const request = vi.fn(async () => new Response(null, { status: 429, headers: { "retry-after": "180" } }));
    const read = officialEvidenceReader(request);
    expect((await read("unknown", "recipient")).fetches).toBe(0);
    expect(await read(sourceId, "recipient")).toEqual({ fetches: 1, unavailable: true, citation: null });
    expect((await read(sourceId, "recipient")).fetches).toBe(0);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it("discards a successful HTTP response without the approved section", async () => {
    const read = officialEvidenceReader(async () => new Response("<nav>Komu wypłacamy</nav>", { headers: { "content-type": "text/html" } }));
    expect(await read(sourceId, "recipient")).toEqual({ fetches: 1, unavailable: false, citation: null });
  });
  it("distinguishes starting nursery from closure, dates and personal calculations", () => {
    expect(nurseryIntent("Od stycznia syn będzie w żłobku. Co warto sprawdzić?")).toBe("care");
    for (const question of ["na czyje konto?", "Zamknęli żłobek, co mogę zrobić?", "Dziecko zacznie żłobek. Ile dostanę?",
      "Co mogłam dostać za żłobek w 2021 roku?"]) expect(nurseryIntent(question)).toBeNull();
  });
});
