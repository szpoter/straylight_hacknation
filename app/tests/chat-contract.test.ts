import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { answerFromAskBody, groundedClaims, pdfPage, turnsFromView, type Answer } from "@/features/chat/contract";
import { AnswerView } from "@/features/chat/turn-view";
import { mergeConversation } from "@/features/chat/use-zusik-case";

// Sample answers shaped like the proposed /ask contract (PLAN-ETAP-1-KROK-2.md, section 4).
// Component tests only: the real answers come from the backend.
const odpis: Answer = {
  status: "answered",
  message: null,
  claims: [
    { text: "Odpis lub jego kopia jest przewidzianym załącznikiem.", citationIds: ["par15-ust2-pkt1"] },
    { text: "Jeśli ten dokument jest już w Twoich aktach osobowych, nie dołączasz go ponownie.", citationIds: ["par22"] },
  ],
  citations: [
    {
      id: "par15-ust2-pkt1",
      title: "Rozporządzenie MRPiPS z 11.03.2025 (Dz.U. 2025 poz. 322)",
      locator: "§ 15 ust. 2 pkt 1",
      url: "https://eli.gov.pl/api/acts/DU/2025/322/text.pdf#page=8",
      quote: "odpis skróconego aktu urodzenia dziecka lub jego kopię",
      corpusVersion: "marta-v1",
    },
    {
      id: "par22",
      title: "Rozporządzenie MRPiPS z 11.03.2025 (Dz.U. 2025 poz. 322)",
      locator: "§ 22",
      url: "https://eli.gov.pl/api/acts/DU/2025/322/text.pdf#page=10",
      quote: "pracownik nie jest obowiązany dołączać dokumentów, które znajdują się w jego aktach osobowych",
      corpusVersion: "marta-v1",
    },
  ],
};

const benefit800: Answer = {
  status: "insufficient_evidence",
  message: "Te źródła nie dotyczą świadczenia 800+, więc nie mogę na nie odpowiedzieć.",
  claims: [],
  citations: [],
};

describe("groundedClaims", () => {
  it("numbers citations in first-use order and keeps one number per source", () => {
    const shared: Answer = {
      ...odpis,
      claims: [
        { text: "A", citationIds: ["par22"] },
        { text: "B", citationIds: ["par15-ust2-pkt1", "par22"] },
      ],
    };
    const { claims, citations } = groundedClaims(shared);
    expect(claims.map((c) => c.numbers)).toEqual([[1], [2, 1]]);
    expect(citations.map((c) => c.id)).toEqual(["par22", "par15-ust2-pkt1"]);
  });

  it("drops a claim whose citation is not in the answer", () => {
    const broken: Answer = { ...odpis, claims: [...odpis.claims, { text: "Bez źródła", citationIds: ["fake"] }] };
    expect(groundedClaims(broken).claims).toHaveLength(2);
  });
});

describe("answerFromAskBody", () => {
  it("reads { turn }, { view.turns } and the bare answer", () => {
    expect(answerFromAskBody({ turn: odpis }, "r1")?.claims).toHaveLength(2);
    expect(answerFromAskBody({ view: { turns: [{ ...odpis, requestId: "r1", question: "Mam dać drugi?" }] } }, "r1")?.status).toBe(
      "answered",
    );
    expect(answerFromAskBody(benefit800, "r1")?.status).toBe("insufficient_evidence");
  });

  it("rejects a body that does not match the contract", () => {
    expect(answerFromAskBody({ status: "maybe" }, "r1")).toBeNull();
    expect(answerFromAskBody(null, "r1")).toBeNull();
  });
});

describe("turnsFromView", () => {
  it("returns an empty list for the step-1 view and skips invalid turns", () => {
    expect(turnsFromView({ state: "completed" })).toEqual([]);
    const turns = turnsFromView({ turns: [{ ...odpis, requestId: "r1", question: "Q" }, { bad: true }] });
    expect(turns.map((t) => t.requestId)).toEqual(["r1"]);
  });
});

describe("mergeConversation", () => {
  it("shows a saved turn once, even if this tab still remembers it", () => {
    const saved = turnsFromView({ turns: [{ ...odpis, requestId: "r1", question: "Q1" }] });
    const merged = mergeConversation(saved, [
      { requestId: "r1", question: "Q1", state: "done", answer: odpis },
      { requestId: "r2", question: "Q2", state: "lost" },
    ]);
    expect(merged.map((m) => `${m.requestId}:${m.state}`)).toEqual(["r1:done", "r2:lost"]);
  });
});

describe("AnswerView", () => {
  it("shows each claim with its own footnote, sources collapsed", () => {
    const html = renderToStaticMarkup(createElement(AnswerView, { answer: odpis }));
    expect(html).toContain("Odpis lub jego kopia jest przewidzianym załącznikiem.");
    expect(html).toContain('aria-label="Źródło 1: Rozporządzenie MRPiPS z 11.03.2025 (Dz.U. 2025 poz. 322), § 15 ust. 2 pkt 1"');
    expect(html).toContain('aria-label="Źródło 2: Rozporządzenie MRPiPS z 11.03.2025 (Dz.U. 2025 poz. 322), § 22"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("<blockquote");
  });

  it("shows no source as a basis for refusal when evidence is insufficient", () => {
    const html = renderToStaticMarkup(createElement(AnswerView, { answer: benefit800 }));
    expect(html).toContain("800+");
    expect(html).toContain("nie oznacza, że świadczenie Ci nie przysługuje");
    expect(html).not.toContain("Źródło");
  });

  it("asks a single clarifying question", () => {
    const html = renderToStaticMarkup(
      createElement(AnswerView, {
        answer: { status: "needs_clarification", message: "Pytasz o wniosek do pracodawcy czy o wypłatę zasiłku?", claims: [], citations: [] },
      }),
    );
    expect(html).toContain("Pytasz o wniosek do pracodawcy czy o wypłatę zasiłku?");
  });
});

describe("pdfPage", () => {
  it("reads the page from a PDF link", () => {
    expect(pdfPage("https://eli.gov.pl/api/acts/DU/2026/1245/text.pdf#page=66")).toBe(66);
    expect(pdfPage("https://www.gov.pl/web/rodzina/urlop-rodzicielski")).toBeNull();
  });
});
