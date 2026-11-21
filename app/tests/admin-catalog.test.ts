import { describe, expect, it } from "vitest";
import { appParameters, knowledgeSources, paternityTestCases } from "@/lib/admin/catalog";
import { ZAM_FORM } from "@/lib/kamil/sources";
import { OFFICIAL_HOSTS } from "@/lib/rag/corpus";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import { MAX_PARTS, TOTAL_DAYS } from "@/lib/rules/paternity";
import { LAW_IDS } from "@/lib/rules/sickness";

describe("admin catalogue · parameters read from the app", () => {
  const params = appParameters();
  const byId = (id: string) => params.find((p) => p.id === id);

  it("shows the paternity constants the rule uses", () => {
    expect(byId("app-paternity-total")?.value).toBe(`${TOTAL_DAYS} dni`);
    expect(byId("app-paternity-parts")?.value).toBe(String(MAX_PARTS));
  });

  it("lists every statute unit of the sickness rule with a page link and verbatim text", () => {
    for (const id of LAW_IDS) {
      const p = byId(`app-${id}`);
      expect(p, id).toBeDefined();
      expect(p?.sourceUrl).toMatch(/^https:\/\/eli\.gov\.pl\/.+#page=\d+$/);
      expect(p?.quote?.length).toBeGreaterThan(40);
    }
    expect(byId("app-uz-art11-ust2-pkt1")?.quote).toContain("100 %");
  });

  it("describes the exact ZAM template the app fills", () => {
    const zam = byId("app-form-zam");
    expect(zam?.details).toContainEqual({ label: "SHA-256", value: ZAM_FORM.sha256 });
    expect(zam?.from).toBe(ZAM_FORM.version);
  });

  it("marks every value as coming from the app and links an official source", () => {
    for (const p of params) {
      expect(p.origin).toBe("app");
      expect(OFFICIAL_HOSTS).toContain(new URL(p.sourceUrl ?? "").host);
    }
  });
});

describe("admin catalogue · knowledge sources", () => {
  it("covers the three corpus packages and only official hosts", () => {
    const { packages, sources } = knowledgeSources();
    const expected = (["marta", "publiczne", "oferta"] as const).map(name => loadCorpus(name).manifest.corpusVersion);
    expect(packages.map(p => p.version)).toEqual(expected);
    expect(sources.length).toBe(packages.reduce((n, p) => n + p.documents, 0));
    for (const s of sources) expect(OFFICIAL_HOSTS).toContain(new URL(s.url).host);
  });
});

describe("admin catalogue · test cases computed by the paternity rule", () => {
  const cases = paternityTestCases();

  it("every scenario matches the expected result", () => {
    expect(cases.map((c) => [c.id, c.status])).toEqual([
      ["K-01", "zgodna"],
      ["K-02", "zgodna"],
      ["K-03", "zgodna"],
      ["K-04", "zgodna"],
      ["K-05", "zgodna"],
      ["K-06", "zgodna"],
      ["K-07", "zgodna"],
      ["K-08", "brak-danych"],
    ]);
  });

  it("shows the computed period and deadline for Kamil's first week", () => {
    const k1 = cases[0];
    expect(k1.result).toEqual([
      { label: "Wynik", value: "przysługuje" },
      { label: "Okres", value: "8–14 grudnia 2026 r." },
      { label: "Termin ZAM", value: "07.12.2026" },
      { label: "Część urlopu", value: "1" },
    ]);
    expect(k1.computedBy).toMatch(/^lib\/rules\/paternity\.ts · paternity-/);
  });

  it("names the missing fact instead of deciding", () => {
    expect(cases.find((c) => c.id === "K-08")?.missing).toMatch(/ubezpieczenie chorobowe/);
  });
});
