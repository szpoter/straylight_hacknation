import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { locateQuote, validateAnswer, parseModelAnswer, type ModelAnswer } from "@/lib/rag/answer";
import {
  buildCorpus,
  corpusDigest,
  CorpusValidationError,
  fragmentHash,
  pointId,
  withoutFragments,
  type Corpus,
} from "@/lib/rag/corpus";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import { excludedTopics, expandQuery, explicitLocatorKeys, sanitizeQuestion, scopeGate } from "@/lib/rag/query";
import { assembleEvidence, type VectorHit } from "@/lib/rag/retrieve";

const dir = path.join(process.cwd(), "corpus", "marta");
const manifestJson = () => JSON.parse(readFileSync(path.join(dir, "manifest.json"), "utf8"));
const fragmentsText = () => readFileSync(path.join(dir, "fragments.jsonl"), "utf8");
const corpus = loadCorpus("marta");
const hit = (c: Corpus, id: string, score = 0.9): VectorHit => ({
  logicalId: id,
  fragmentSha256: c.fragments.get(id)!.fragmentSha256,
  score,
});
const ASOF = "2026-11-21";

describe("corpus marta-v1", () => {
  it("loads 23 validated units from four official documents", () => {
    expect(corpus.manifest.corpusVersion).toBe("marta-v1");
    expect(corpus.fragments.size).toBe(23);
    expect([...corpus.documents.keys()]).toEqual([
      "kp-2026-1245",
      "rozp-2025-322",
      "mrpips-urlop-rodzicielski",
      "zus-zasilek-rodzicielski",
    ]);
    const pkt2 = corpus.fragments.get("rozp-2025-322-par15-ust2-pkt2")!;
    expect(pkt2).toMatchObject({ page: 8, topic: "employee_leave_application", locale: "pl" });
    // Both alternatives of the statement stay in one unit.
    expect(pkt2.sourceText).toContain("o braku zamiaru korzystania");
    expect(pkt2.sourceText).toContain("o okresie, w którym drugi z rodziców dziecka zamierza korzystać");
    expect(corpus.fragments.get("rozp-2025-322-par15-ust2-pkt1")!.relatedIds).toContain("rozp-2025-322-par22");
    // Soft hyphens, page headers and lost "nie" spaces are fixed.
    for (const f of corpus.fragments.values()) {
      expect(f.sourceText).not.toMatch(/­|Dziennik Ustaw|niekrótszym|niepóźniej|niewięcej/);
    }
  });

  it("derives stable point ids and digest (re-import = same ids and hashes)", () => {
    const again = buildCorpus(manifestJson(), fragmentsText());
    expect(corpusDigest(again)).toBe(corpusDigest(corpus));
    const id = pointId("marta-v1", "rozp-2025-322-par22");
    expect(id).toBe(pointId("marta-v1", "rozp-2025-322-par22"));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(pointId("marta-v2", "rozp-2025-322-par22")).not.toBe(id);
  });

  it("rejects duplicate ids, broken links, missing locator/page, bad hash and non-official URLs", () => {
    const lines = fragmentsText().trim().split("\n");
    const first = JSON.parse(lines[0]);
    const expectProblem = (manifest: unknown, text: string, pattern: RegExp) => {
      try {
        buildCorpus(manifest, text);
        throw new Error("expected validation to fail");
      } catch (error) {
        expect(error).toBeInstanceOf(CorpusValidationError);
        expect((error as CorpusValidationError).problems.join("\n")).toMatch(pattern);
      }
    };
    expectProblem(manifestJson(), [...lines, lines[0]].join("\n"), /duplicate logicalId kp-art182-1a-par1/);
    expectProblem(manifestJson(), [JSON.stringify({ ...first, relatedIds: ["nie-istnieje"] }), ...lines.slice(1)].join("\n"), /broken link to nie-istnieje/);
    expectProblem(manifestJson(), [JSON.stringify({ ...first, page: null }), ...lines.slice(1)].join("\n"), /PDF fragment without page/);
    expectProblem(manifestJson(), [JSON.stringify({ ...first, locator: "" }), ...lines.slice(1)].join("\n"), /locator/);
    expectProblem(manifestJson(), [JSON.stringify({ ...first, sourceText: first.sourceText + " x" }), ...lines.slice(1)].join("\n"), /fragmentSha256 mismatch/);
    const badUrl = manifestJson();
    badUrl.documents[2].url = "https://blog.example.com/urlop";
    expectProblem(badUrl, fragmentsText(), /non-official URL/);
    expect(fragmentHash("a  b\n c")).toBe(fragmentHash("a b c"));
  });
});

describe("question handling", () => {
  it("removes profile names and identifiers before any external call, keeping intent", () => {
    expect(sanitizeQuestion("Co wpisać o Pawle, skoro też bierze urlop?")).toBe("Co wpisać o drugim rodzicu, skoro też bierze urlop?");
    const s = sanitizeQuestion("Kadry Studia Lipa mają odpis aktu Oli Lis, PESEL 26050412345, marta.lis@example.com");
    expect(s).not.toMatch(/Ola|Oli|Lis\b|Lipa|26050412345|example/);
    expect(s).toContain("odpis aktu dziecka");
  });

  it("gates amounts and a context-free 'what to send'", () => {
    expect(scopeGate("Ile dostaniemy na konto?")?.kind).toBe("amount");
    expect(scopeGate("Ile wyniesie nasza wypłata netto?")?.kind).toBe("amount");
    expect(scopeGate("Czy dostanę 800+?")?.kind).toBe("amount");
    expect(scopeGate("Co trzeba wysłać?")?.kind).toBe("clarify");
    expect(scopeGate("Ile tygodni zasiłku przypada tacie?")).toBeNull();
    expect(scopeGate("Ile wcześniej mam złożyć wniosek i komu?")).toBeNull();
  });

  it("parses explicit locators and expands parent wording", () => {
    expect(explicitLocatorKeys("Co mówi art. 182¹d § 1?")).toEqual(["art182^1d§1"]);
    expect(explicitLocatorKeys("art. 182[1a] § 6 i dalej")).toEqual(["art182^1a§6"]);
    expect(explicitLocatorKeys("A § 15 ust. 2 pkt 1 i § 22?")).toEqual(["§15ust2pkt1", "§22"]);
    expect(expandQuery("Kiedy najpóźniej napisać do kadr?")).toContain("21 dni");
  });
});

describe("evidence assembly", () => {
  it("adds the distant exception (§ 15 ust. 2 pkt 1 → § 22) and explicit locators first", () => {
    const ev = assembleEvidence(corpus, [hit(corpus, "rozp-2025-322-par15-ust2-pkt1")], { asOf: ASOF, locatorKeys: ["art182^1d§1"] });
    expect(ev.items.map((i) => [i.fragment.logicalId, i.via])).toEqual([
      ["kp-art182-1d-par1", "locator"],
      ["rozp-2025-322-par15-ust2-pkt1", "vector"],
      ["rozp-2025-322-par22", "related"],
    ]);
    expect(ev.vectorIds).toEqual(["rozp-2025-322-par15-ust2-pkt1"]);
  });

  it("prefers primary law over a guidance duplicate and ignores stale hashes", () => {
    const ev = assembleEvidence(
      corpus,
      [hit(corpus, "mrpips-dzielenie-jednoczesnie"), { logicalId: "kp-art182-1c", fragmentSha256: "0".repeat(64), score: 0.8 }],
      { asOf: ASOF },
    );
    const ids = ev.items.map((i) => i.fragment.logicalId);
    expect(ids).toContain("kp-art182-1a-par6");
    expect(ids).not.toContain("mrpips-dzielenie-jednoczesnie");
    expect(ids).not.toContain("kp-art182-1c");
  });

  it("keeps the 21-day work-combination rule out of a plain leave-request question", () => {
    const hits = [hit(corpus, "kp-art182-1d-par1"), hit(corpus, "kp-art182-1e-par2")];
    const plain = assembleEvidence(corpus, hits, { asOf: ASOF, excludeTopics: excludedTopics("Kiedy najpóźniej napisać do kadr?") });
    expect(plain.items.map((i) => i.fragment.logicalId)).toEqual(["kp-art182-1d-par1"]);
    const work = assembleEvidence(corpus, hits, { asOf: ASOF, excludeTopics: excludedTopics("Chcę pracować na pół etatu, kiedy złożyć wniosek?") });
    expect(work.items.map((i) => i.fragment.logicalId)).toContain("kp-art182-1e-par2");
  });

  it("drops units outside their known validity window", () => {
    const ev = assembleEvidence(corpus, [hit(corpus, "rozp-2025-322-par22")], { asOf: "2024-12-31" });
    expect(ev.items).toEqual([]);
  });
});

describe("answer validation", () => {
  const evidenceFor = (ids: string[], c: Corpus = corpus) => ids.map((id) => c.fragments.get(id)!);
  const odpisAnswer: ModelAnswer = {
    status: "answered",
    message: "",
    claims: [
      {
        text: "Jeśli odpis jest już w Twoich aktach osobowych, nie dołączasz go ponownie.",
        evidence: [{ id: "rozp-2025-322-par22", quote: "nie dołącza się dokumentów wymienionych w rozporządzeniu, jeżeli dokumenty te znajdują się w aktach osobowych pracownika" }],
      },
      {
        text: "Odpis lub jego kopia jest przewidzianym załącznikiem do wniosku.",
        evidence: [{ id: "rozp-2025-322-par15-ust2-pkt1", quote: "„odpis skrócony aktu urodzenia dziecka (dzieci)”" }],
      },
    ],
  };

  it("publishes claims whose quotes occur verbatim; URL, title and page come from the manifest", () => {
    const { answer, report } = validateAnswer(corpus, evidenceFor(["rozp-2025-322-par15-ust2-pkt1", "rozp-2025-322-par22"]), odpisAnswer);
    expect(report.rejectedEvidence).toEqual([]);
    expect(answer.status).toBe("answered");
    expect(answer.claims).toHaveLength(2);
    expect(answer.citations.map((c) => [c.fragmentId, c.locator, c.url])).toEqual([
      ["rozp-2025-322-par22", "§ 22", "https://eli.gov.pl/api/acts/DU/2025/322/text.pdf#page=10"],
      ["rozp-2025-322-par15-ust2-pkt1", "§ 15 ust. 2 pkt 1", "https://eli.gov.pl/api/acts/DU/2025/322/text.pdf#page=7"],
    ]);
    expect(answer.citations[1].quote).toBe("odpis skrócony aktu urodzenia dziecka (dzieci)");
    expect(answer.citations.every((c) => c.corpusVersion === "marta-v1")).toBe(true);
  });

  it("rejects a fictional id and a quote that is not in the cited unit", () => {
    const { answer, report } = validateAnswer(corpus, evidenceFor(["kp-art182-1d-par1"]), {
      status: "answered",
      message: "",
      claims: [
        { text: "Złóż wniosek 21 dni wcześniej.", evidence: [{ id: "kp-art182-1d-par9", quote: "w terminie nie krótszym niż 21 dni" }] },
        { text: "Pracodawca musi go przyjąć.", evidence: [{ id: "kp-art182-1d-par1", quote: "Pracodawca zawsze musi przyjąć wniosek" }] },
      ],
    });
    expect(report.rejectedEvidence.map((r) => r.reason)).toEqual(["unknown_id", "quote_not_found"]);
    expect(answer).toMatchObject({ status: "insufficient_evidence", claims: [], citations: [] });
  });

  it("a real quote from the wrong article passes the validator — content is judged by the eval", () => {
    // 182¹e § 2 (combining leave with work) also says 21 days: string checks cannot catch this.
    const { answer } = validateAnswer(corpus, evidenceFor(["kp-art182-1e-par2"]), {
      status: "answered",
      message: "",
      claims: [{ text: "Złóż wniosek 21 dni przed urlopem.", evidence: [{ id: "kp-art182-1e-par2", quote: "w terminie nie krótszym niż 21 dni przed rozpoczęciem wykonywania pracy" }] }],
    });
    expect(answer.status).toBe("answered");
    expect(answer.citations[0].fragmentId).toBe("kp-art182-1e-par2");
  });

  it("removes an amount claim and keeps legal content out of message", () => {
    const { answer } = validateAnswer(corpus, evidenceFor(["kp-art182-1a-par6"]), {
      status: "answered",
      message: "Możecie też dostać 3920 zł.",
      claims: [
        { text: "Możecie korzystać z urlopu jednocześnie.", evidence: [{ id: "kp-art182-1a-par6", quote: "Z urlopu rodzicielskiego mogą jednocześnie korzystać oboje pracownicy" }] },
        { text: "Dostaniecie 3920 zł.", evidence: [{ id: "kp-art182-1a-par6", quote: "Z urlopu rodzicielskiego mogą jednocześnie korzystać oboje pracownicy" }] },
      ],
    });
    expect(answer.claims.map((c) => c.text)).toEqual(["Możecie korzystać z urlopu jednocześnie."]);
    expect(answer.message).toBe("");
  });

  it("rejects a negative claim whose only quote is affirmative (real Bielik output without § 22)", () => {
    const ablated = withoutFragments(corpus, ["rozp-2025-322-par22"]);
    const { answer, report } = validateAnswer(ablated, evidenceFor(["rozp-2025-322-par15-ust2-pkt1"], ablated), {
      status: "answered",
      message: "",
      claims: [
        {
          text: "Jeśli kadry mają już odpis aktu urodzenia dziecka w Twoich aktach, nie musisz dołączać go ponownie do wniosku o urlop rodzicielski.",
          evidence: [{ id: "rozp-2025-322-par15-ust2-pkt1", quote: "Do wniosku dołącza się: 1) odpis skrócony aktu urodzenia dziecka (dzieci)" }],
        },
      ],
    });
    expect(report.polarityRemoved).toBe(1);
    expect(answer.status).toBe("insufficient_evidence");
    // The same claim with the § 22 quote is published.
    const ok = validateAnswer(corpus, evidenceFor(["rozp-2025-322-par22"]), {
      status: "answered",
      message: "",
      claims: [{ text: "Nie musisz dołączać odpisu, który jest w aktach osobowych.", evidence: [{ id: "rozp-2025-322-par22", quote: "nie dołącza się dokumentów wymienionych w rozporządzeniu" }] }],
    });
    expect(ok.answer.status).toBe("answered");
  });

  it("accepts an elided quote only when every piece is verbatim and in order", () => {
    const ust1 = corpus.fragments.get("rozp-2025-322-par15-ust1")!.sourceText;
    expect(locateQuote(ust1, "§ 15. 1. Wniosek [...] zawiera: 1) imię i nazwisko pracownika; [...] 3) wskazanie okresu, na który ma być udzielony urlop rodzicielski")).toBe(
      "§ 15. 1. Wniosek […] zawiera: 1) imię i nazwisko pracownika […] 3) wskazanie okresu, na który ma być udzielony urlop rodzicielski",
    );
    expect(locateQuote(ust1, "imię i nazwisko pracownika [...] podpis drugiego rodzica")).toBeNull();
    expect(locateQuote(ust1, "3) wskazanie okresu [...] 1) imię i nazwisko pracownika")).toBeNull();
    const pkt3 = corpus.fragments.get("rozp-2025-322-par15-ust2-pkt3")!.sourceText;
    expect(locateQuote(pkt3, 'o wsparciu kobiet w ciąży i rodzin "Za życiem"')).toBe("o wsparciu kobiet w ciąży i rodzin „Za życiem");
  });

  it("keeps a true negative claim backed by an obligation (no false refusal)", () => {
    const { answer } = validateAnswer(corpus, evidenceFor(["kp-art182-1d-par1"]), {
      status: "answered",
      message: "",
      claims: [{ text: "Pracodawca nie może odmówić, jeśli złożysz wniosek w terminie.", evidence: [{ id: "kp-art182-1d-par1", quote: "Pracodawca jest obowiązany uwzględnić wniosek pracownika." }] }],
    });
    expect(answer.status).toBe("answered");
  });

  it("parses JSON wrapped in prose or fences and rejects malformed output", () => {
    expect(parseModelAnswer('Oto odpowiedź:\n```json\n{"status":"insufficient_evidence","message":"Brak.","claims":[]}\n```')?.status).toBe("insufficient_evidence");
    expect(parseModelAnswer('{"status":"answered","claims":[{"text":"x","evidence":[]}]}')).toBeNull();
    expect(parseModelAnswer("nie wiem")).toBeNull();
    // Real Bielik output shape: one extra "}" after each claim list, brackets inside strings untouched.
    const broken = '{"status":"answered","message":"","claims":[{"text":"A {x}","evidence":[{"id":"a","quote":"q ]}"}]}}]}}';
    expect(parseModelAnswer(broken)?.claims[0]).toEqual({ text: "A {x}", evidence: [{ id: "a", quote: "q ]}" }] });
  });

  it("ablation: without § 22 in the corpus the 'already in my files' answer loses its basis", () => {
    const ablated = withoutFragments(corpus, ["rozp-2025-322-par22"]);
    const ev = assembleEvidence(ablated, [hit(ablated, "rozp-2025-322-par15-ust2-pkt1")], { asOf: ASOF });
    const ids = ev.items.map((i) => i.fragment.logicalId);
    expect(ids).toEqual(["rozp-2025-322-par15-ust2-pkt1"]);
    // The same model output now cannot cite § 22: the core claim is removed → insufficient_evidence.
    const full = validateAnswer(corpus, evidenceFor(["rozp-2025-322-par15-ust2-pkt1", "rozp-2025-322-par22"]), odpisAnswer).answer;
    const without = validateAnswer(ablated, ev.items.map((i) => i.fragment), odpisAnswer).answer;
    expect(full.status).toBe("answered");
    expect(without.status).toBe("insufficient_evidence");
    expect(without.claims).toEqual([]);
  });
});

describe("Bielik call", () => {
  it("retries invalid JSON once and returns the second, valid answer", async () => {
    const { MockLanguageModelV4 } = await import("ai/test");
    const { generateAnswer } = await import("@/lib/rag/answer");
    const outputs = ["nie umiem", '{"status":"insufficient_evidence","message":"Brak podstawy.","claims":[]}'];
    let calls = 0;
    const languageModel = new MockLanguageModelV4({
      doGenerate: async () =>
        ({
          content: [{ type: "text", text: outputs[calls++] }],
          finishReason: { unified: "stop", raw: "stop" },
          usage: { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } },
          warnings: [],
        }) as never,
    });
    const result = await generateAnswer({ baseURL: "", apiKey: "", model: "bielik-test", languageModel }, corpus, "pytanie", []);
    expect(calls).toBe(2);
    expect(result.status).toBe("ok");
    expect(result.output?.status).toBe("insufficient_evidence");
  });
});
