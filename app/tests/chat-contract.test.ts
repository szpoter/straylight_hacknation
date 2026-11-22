import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { answerFromAskBody, groundedClaims, pdfPage, turnsFromView, type Answer } from "@/features/chat/contract";
import { AnswerView, TurnView } from "@/features/chat/turn-view";
import { OpportunityCards } from "@/features/chat/case-review";
import type { CaseMessage } from "@/features/chat/case-api";
import { mergeConversation } from "@/features/chat/use-zusik-case";
import { chatStarters, conversationInput } from "@/lib/zusik/conversation";
import { ChatStarters } from "@/features/chat/scenario-nav";

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
  it("restores the origin and timestamp of the exact quotation shown before reload", () => {
    const citation = { ...odpis.citations[0], origin: "official_live", retrievedAt: "2026-11-22T14:50:00Z" };
    const turn = { ...odpis, requestId: "r1", question: "Źródło?", citations: [citation] };
    expect(answerFromAskBody({ turn }, "r1")?.citations[0]).toEqual(citation);
    expect(turnsFromView({ turns: [turn] })[0].citations[0]).toEqual(citation);
  });

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

describe("TurnView", () => {
  it("replaces verified streaming text and activity with the final cited answer", () => {
    const render = (state: "sending" | "done" | "lost", partialText: string) =>
      renderToStaticMarkup(createElement(TurnView, {
        item: { state, requestId: "r1", question: "Odpis?", answer: odpis },
        asking: state === "sending", activity: "Sprawdzam źródła", partialText, onRetry: () => {},
      }));
    for (const part of ["Pierwszy fragment", "Pierwszy fragment i kolejny"]) {
      const html = render("sending", part);
      expect(html).toContain(part);
      expect(html).toContain("Sprawdzam źródła");
      expect(html).not.toContain("Źródło 1");
    }
    for (const state of ["lost", "done"] as const) {
      const html = render(state, "Tymczasowy tekst");
      expect(html).not.toContain("Tymczasowy tekst");
      expect(html).not.toContain("Sprawdzam źródła");
    }
    expect(render("done", "")).toContain("Źródło 1");
  });
});

it("shows three starter questions as actions in the current conversation", () => {
  const html = renderToStaticMarkup(createElement(ChatStarters, { onSelect: () => undefined, disabled: false }));
  expect(html).toContain("Sprawdź ubezpieczenie");
  expect(html).toContain("Oblicz wysokość zasiłku");
  expect(html).toContain("Sprawdź dokumenty i terminy");
  expect(html.match(/<button /g)).toHaveLength(3);
  expect(html).not.toContain("href=");
});

it.each(chatStarters)("starts $label with a relevant request for the user’s own data", starter => {
  expect(conversationInput(starter.prompt, "ogolna").reply).toBe(starter.reply);
  expect(conversationInput(starter.prompt + " Mam jeszcze jeden dokument.", "ogolna").reply).toBeNull();
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
    expect(html).not.toContain("Źródło");
  });

  it("adds its own reassurance only when the server sent no message", () => {
    const html = renderToStaticMarkup(createElement(AnswerView, { answer: { ...benefit800, message: "" } }));
    expect(html).toContain("nie oznacza, że świadczenie Ci nie przysługuje");
  });

  it("asks a single clarifying question", () => {
    const html = renderToStaticMarkup(
      createElement(AnswerView, {
        answer: { status: "needs_clarification", message: "Pytasz o wniosek do pracodawcy czy o wypłatę zasiłku?", claims: [], citations: [] },
      }),
    );
    expect(html).toContain("Pytasz o wniosek do pracodawcy czy o wypłatę zasiłku?");
  });

  it("keeps supported claims visible when one personal fact is still needed", () => {
    const html = renderToStaticMarkup(createElement(AnswerView, {
      answer: { ...odpis, status: "needs_clarification", message: "Czy dokument jest już w aktach?" },
    }));
    expect(html).toContain(odpis.claims[0].text);
    expect(html).toContain("Źródło 1");
    expect(html).toContain("Czy dokument jest już w aktach?");
  });
});

describe("pdfPage", () => {
  it("reads the page from a PDF link", () => {
    expect(pdfPage("https://eli.gov.pl/api/acts/DU/2026/1245/text.pdf#page=66")).toBe(66);
    expect(pdfPage("https://www.gov.pl/web/rodzina/urlop-rodzicielski")).toBeNull();
  });
});

it("shows alternatives with their own public sources and excludes unsupported cards", () => {
  const message: CaseMessage = {
    id:"turn", state:"completed", input:{intent:"public_question",publicQuestion:"Porównaj programy."},
    answer:"", caseRevision:1, profileRevision:1,
    citations:["dom", "zlobek"].map(ref => ({ref, kind:"public_source", version:"v1", publicUrl:"https://www.zus.pl/" + ref})),
    opportunities:["dom", "zlobek", "bez-dowodu"].map(id => ({id,title:id,citationIds:[id],missingFacts:["careType"],exclusiveGroup:"rodzic"})),
  };
  const html = renderToStaticMarkup(createElement(OpportunityCards, {message}));
  expect(html.match(/<article/g)).toHaveLength(2);
  expect(html.match(/Alternatywa w tym samym programie/g)).toHaveLength(2);
  expect(html).toContain("https://www.zus.pl/dom");
  expect(html).toContain("https://www.zus.pl/zlobek");
  expect(html).toContain("Czy dziecko będzie chodziło do żłobka");
  expect(html).not.toContain("bez-dowodu");
});
