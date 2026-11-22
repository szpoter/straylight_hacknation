import type { MartaView } from "../marta/types";
import { DEMO_INPUTS } from "../../features/chat/marta-input";
import { validateAnswer } from "../rag/answer";
import type { Corpus } from "../rag/corpus";
import type { AskAnswer, AskTurn } from "./types";

export { sourceIntent } from "./conversation";

export function previousSources(previous: AskTurn | undefined, corpusVersion: string): AskAnswer {
  if (!previous?.citations.length) {
    return { status: "insufficient_evidence", claims: [], citations: [], corpusVersion,
      message: previous ? "W poprzedniej odpowiedzi nie było cytatu ze źródła urzędowego." : "W tej rozmowie nie ma jeszcze odpowiedzi z cytatem." };
  }
  return {
    status: "answered", corpusVersion: previous.corpusVersion,
    message: "Te fragmenty zostały przytoczone w poprzedniej odpowiedzi.",
    claims: previous.citations.map(c => ({ text: c.quote, citationIds: [c.id] })),
    citations: previous.citations,
  };
}

const money = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });

export function caseSources(view: MartaView | null, corpus: Corpus): AskAnswer {
  let message: string;
  if (view && view.firstName === DEMO_INPUTS.firstName && view.secondName === DEMO_INPUTS.secondName && view.childName === DEMO_INPUTS.childName) {
    const { inputs, firstName, secondName, childName } = view;
    const { first, second, total } = view.variants[view.selected ?? "together"];
    const amount = (name: string, daily: number | null, result: number | null) => daily === null || result === null
      ? `${name} — brakuje stawki dziennej.`
      : `${name} — ${inputs.days} dni × ${money.format(daily)} dziennie = ${money.format(result)} brutto.`;
    message = [
      `Imiona rodziców i dziecka (${childName}), początek urlopu (${inputs.firstStart}), liczba dni i stawki pochodzą z zapisanego formularza tej sprawy.`,
      amount(firstName, inputs.firstDaily, first.amount), amount(secondName, inputs.secondDaily, second.amount),
      total === null ? "Do obliczenia sumy potrzebne są obie stawki." : `Łączna kwota z kalkulatora wynosi ${money.format(total)} brutto.`,
    ].join(" ");
  } else {
    const demo = DEMO_INPUTS;
    message = `Formularz korzysta z profilu rodziny Oli (${demo.firstName}, ${demo.secondName}, ${demo.childName}). Początkowo proponuje po ${demo.days} dni oraz stawki ${money.format(demo.firstDaily)} i ${money.format(demo.secondDaily)} brutto za dzień. Możesz je zmienić. Po zapisaniu porównania kalkulator pomnoży liczbę dni każdego rodzica przez jego stawkę i doda obie kwoty.`;
  }
  const fragment = corpus.fragments.get("kp-art182-1d-par1");
  const { answer } = validateAnswer(corpus, fragment ? [fragment] : [], {
    status: "answered", message: "", claims: [{ text: "Kodeks pracy określa termin złożenia wniosku o urlop rodzicielski.",
      evidence: [{ id: "kp-art182-1d-par1", quote: "w terminie nie krótszym niż 21 dni przed rozpoczęciem korzystania z urlopu" }] }],
  });
  return { ...answer, message: message + " Te stawki są założeniami porównania." };
}
