import { describe, expect, it } from "vitest";
import { PATERNITY_SCENARIOS, allTestCases, appParameters, citeStatutes, knowledgeSources, paternityTestCases, scenarioOutcome } from "@/lib/admin/catalog";
import { SPEC_PARAMETERS } from "@/features/admin/mock-data";
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
      ["K-08", "zgodna"],
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

  it("asks for the fact instead of deciding when insurance is not confirmed", () => {
    const k8 = PATERNITY_SCENARIOS.find((s) => s.id === "K-08")!;
    expect(scenarioOutcome(k8, {})).toBe("przysługuje, 8–21 grudnia 2026 r.");
    expect(scenarioOutcome({ ...k8, input: { ...k8.input, insuranceConfirmed: null } }, {})).toBe("wymaga uzupełnienia");
  });

  it("includes the ZUS case set, each matching the ZUS decision and opening in /sprawdz", () => {
    const zestaw = allTestCases().filter((c) => c.tag.startsWith("Zestaw ZUS"));
    expect(zestaw).toHaveLength(10);
    expect(zestaw.filter((c) => c.tag.endsWith("odmowa"))).toHaveLength(6);
    expect(zestaw.every((c) => c.expected[0].value === c.result[0].value)).toBe(true);
    expect(zestaw.find((c) => c.id === "Z-ZAB-3")?.parentView).toBe("/sprawdz?sprawa=zab-3");
    expect(allTestCases()).toHaveLength(26);
  });

  it("every case in the set has complete data", () => {
    expect(allTestCases().filter((c) => c.status !== "zgodna").map((c) => c.id)).toEqual([]);
    expect(allTestCases().every((c) => !c.missing && c.result.length > 0)).toBe(true);
  });
});

describe("admin catalogue · payer and arrears rules", () => {
  const params = appParameters(undefined, "2026-11-22");
  const byId = (id: string) => params.find((p) => p.id === id);

  it("shows the art. 61 threshold and the art. 2a arrears threshold from the code", () => {
    expect(byId("app-payer-threshold")).toMatchObject({ value: "20", group: "Kto wypłaca", origin: "app", editable: true });
    expect(byId("app-payer-threshold")?.sourceUrl).toMatch(/^https:\/\/eli\.gov\.pl\/.+#page=\d+$/);
    expect(byId("app-arrears-threshold")?.value).toBe("48,06 zł");
  });

  it("shows the minimum wage in force with the next year's value planned", () => {
    // pl-PL groups thousands with a no-break space.
    const wage = byId("app-wage-minimum");
    const plain = (s?: string) => s?.replace(/\u00a0/g, " ");
    expect(plain(wage?.value)).toBe("4 806 zł");
    expect(plain(wage?.planned?.value)).toBe("4 950 zł");
    expect(wage?.planned?.from).toBe("2027-01-01");
  });
});

describe("admin catalogue · values from the specification", () => {
  it("cite the statute unit with a link and verbatim text", () => {
    const cited = citeStatutes(SPEC_PARAMETERS);
    for (const p of cited) {
      expect(p.sourceUrl, p.id).toMatch(/^https:\/\//);
      expect(p.quote, p.id).toBeTruthy();
    }
    expect(cited.find((p) => p.id === "deadline-paternity")?.quote).toContain("7 dni przed rozpoczęciem");
    expect(cited.find((p) => p.id === "sick-period")?.quote).toContain("270 dni");
  });
});
