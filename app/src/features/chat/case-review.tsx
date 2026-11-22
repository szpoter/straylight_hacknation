"use client";

import { useEffect, useRef, useState } from "react";
import { factInput, factValueKinds, type CaseDocument, type EvidenceFact, type FactInput } from "@/lib/zusik/memory/contract";
import { confirmCaseCandidate, type EvidenceCandidate, type LocalCaseDocument } from "./case-evidence";
import type { Assessment, CaseMessage, Citation } from "./case-api";
import { questions } from "../../../corpus/opportunities.json";
import s from "./zusik.module.css";

export type LocalPdf = { name: string; url: string; read: LocalCaseDocument };
export type ManualSource = { referenceId: string; page: number; url: string; kind: CaseDocument["metadata"]["kind"] };
export type CandidateChoice = { document: LocalCaseDocument; registered: CaseDocument; candidate: EvidenceCandidate };
export type FactDraft = { fact: FactInput; previous?: EvidenceFact; choice?: CandidateChoice };
const currency = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });
export const labels: Record<FactInput["field"], string> = {
  birthChildCount: "Liczba urodzonych dzieci", prenatalLeaveDays: "Dni urlopu przed porodem", maternityCourse: "Przebieg urlopu macierzyńskiego",
  childDeathDate: "Data śmierci dziecka", debtSettlement: "Rozliczenie zadłużenia", accountArrears: "Zadłużenie składkowe", sicknessCertificate: "Zwolnienie lekarskie", benefitHistory: "Historia świadczeń",
  birthDate: "Data urodzenia dziecka", insuranceTitle: "Tytuł ubezpieczenia", employerRef: "Płatnik",
  monthlyGrossPay: "Wynagrodzenie brutto", monthlyContributionBasis: "Podstawa składek", submissionStatus: "Status wniosku", benefitRequest: "Wnioskowane świadczenie",
  deliveryDate: "Data porodu", sicknessCoverage: "Ubezpieczenie chorobowe", otherCoverage: "Inny tytuł ubezpieczenia",
  postInsuranceException: "Wyjątek po ustaniu ubezpieczenia", maternityPayVariant: "Wariant wypłaty", payrollRegime: "Sposób ustalania płacy",
  monthlyEmployeeDeduction: "Potrącone składki", monthlyPayAfterDeduction: "Po potrąceniu składek", payerInsuredCount: "Liczba ubezpieczonych",
};
export function valueLabel(v: FactInput["value"]) {
  return v.kind === "money" ? currency.format(v.grosze / 100) : v.kind === "date" ? v.date : v.kind === "count" ? String(v.count) : v.code;
}
function publicSourceUrl(cite: Citation) {
  if (cite.kind !== "public_source" || !cite.publicUrl || !URL.canParse(cite.publicUrl)) return;
  const url = new URL(cite.publicUrl);
  if (url.protocol === "https:" && /(^|\.)(zus\.pl|gov\.pl|sejm\.gov\.pl)$/.test(url.hostname)) return url.href;
}

export function OpportunityCards({ message }: { message: CaseMessage }) {
  const cards = (message.opportunities ?? []).flatMap(card => {
    const sources = message.citations.flatMap(cite => {
      const href = card.citationIds.includes(cite.ref) && publicSourceUrl(cite);
      return href ? [{ href, cite }] : [];
    });
    return sources.length ? [{ ...card, sources }] : [];
  });
  const prompts: Record<string, string> = questions;
  return cards.map(card => <article key={card.id} aria-label={card.title} className={s.source}>
    <h3>{card.title}</h3>
    {card.exclusiveGroup && cards.some(other => other.id !== card.id && other.exclusiveGroup === card.exclusiveGroup) &&
      <p>Alternatywa w tym samym programie za ten sam okres.</p>}
    {card.missingFacts.length > 0 && <details><summary>Warunki do sprawdzenia</summary>
      <ul>{card.missingFacts.map(field => <li key={field}>{prompts[field] ?? field}</li>)}</ul></details>}
    {card.sources.map(({href, cite}) => <a key={cite.ref} href={href} target="_blank" rel="noreferrer">Źródło programu · {cite.version}</a>)}
  </article>);
}

export function Evidence({ citations, documents, local }: { citations: Citation[]; documents: CaseDocument[]; local: Map<string, LocalPdf> }) {
  return citations.map((cite, index) => {
    const key = cite.ref + index;
    if (cite.kind === "public_source") {
      const href = publicSourceUrl(cite);
      if (href && cite.quote) return <details key={key} className={s.source}>
        <summary>Źródło {index + 1} · {cite.locator}</summary>
        <blockquote>{cite.quote}</blockquote><a href={href} target="_blank" rel="noreferrer">Otwórz przepis</a>
      </details>;
      return href ? <a key={key} href={href} target="_blank" rel="noreferrer">Przepis · {cite.version}</a> : null;
    }
    if (cite.kind === "account") return <p key={key}>Źródło: symulowane konto ZUS · {cite.version}</p>;
    const doc = documents.find(d => d.id === cite.ref);
    const pdf = doc && local.get(doc.metadata.clientDocumentId);
    if (cite.kind === "document") return <p key={key}>{pdf ? <a href={pdf.url + "#page=" + (cite.page ?? 1)} target="_blank" rel="noreferrer">Dowód · strona {cite.page ?? 1} {pdf.read.mediaType?.startsWith("image/") ? "na skanie" : "w PDF"}</a>
      : <>Dowód · strona {cite.page ?? 1}. Dołącz ponownie ten sam PDF lub skan, aby otworzyć stronę.</>}</p>;
    return <p key={key}>{cite.kind === "fact" ? "Fakt" : cite.kind === "assessment" ? "Ocena" : "Zapis sprawy"} · {cite.ref} · wersja {cite.version}</p>;
  });
}
const statusText = { eligible: "Przysługuje", ineligible: "Nie przysługuje", needs_information: "Brakuje danych", needs_review: "Wymaga sprawdzenia", unsupported: "Poza zakresem reguły" };
const benefits: Record<string, string> = { maternity: "Zasiłek macierzyński", paternity: "Okres ojcowski", sickness: "Zasiłek chorobowy", parental: "Okres rodzicielski" };
export function DecisionCard({ assessment, historical, documents, local, prior }: { assessment: Assessment; historical: boolean; documents: CaseDocument[]; local: Map<string, LocalPdf>; prior: Assessment[] }) {
  function changedAmount(d: Assessment["decisions"][number]) {
    if (d.grossAmountGrosze === undefined) return null;
    const previous = prior.filter(a => a.input.asOf === assessment.input.asOf).flatMap(a => a.decisions).findLast(old =>
      old.benefit === d.benefit && old.subjectId === d.subjectId && old.from === d.from && old.to === d.to &&
      old.titleRef === d.titleRef && old.payerRef === d.payerRef && old.amountPeriod === d.amountPeriod && old.grossAmountGrosze !== undefined);
    const old = previous?.grossAmountGrosze;
    if (old === undefined || old === d.grossAmountGrosze) return null;
    const delta = d.grossAmountGrosze - old;
    return <p>Zmiana kwoty: {currency.format(old / 100)} → {currency.format(d.grossAmountGrosze / 100)} ({delta > 0 ? "+" : ""}{currency.format(delta / 100)}).</p>;
  }
  return <section className={s.aiMessage} aria-label="Ocena sprawy">
    <strong>{historical ? "Ocena historyczna" : "Ocena sprawy"} · wersja profilu {assessment.input.profileRevision}</strong>
    {assessment.decisions.map((d, i) => <section key={i}><strong>{benefits[d.benefit] ?? d.benefit} · {d.subjectId}</strong>
      <p>{statusText[d.status]}{d.from && " · od " + d.from}{d.to && " do " + d.to}</p>
      <p>Kwota: {d.amountStatus === "calculated" && typeof d.grossAmountGrosze === "number" ? valueLabel({ kind: "money", grosze: d.grossAmountGrosze, currency: "PLN" }) + " brutto " + ({ monthly: "miesięcznie", daily: "dziennie", total: "za okres" }[d.amountPeriod ?? "total"])
        : d.amountStatus === "not_applicable" ? "nie dotyczy" : d.amountStatus === "calculated" ? "brak wartości" : statusText[d.amountStatus]}</p>
      {d.payer && <p>Płatnik świadczenia: {d.payer === "zus" ? "ZUS" : "pracodawca"}</p>}
      {d.paymentStatus && <p>Wypłata: {{payable:"do wypłaty", withheld:"wstrzymana", needs_information:"wymaga uzupełnienia danych", expired:"prawo do wypłaty wygasło"}[d.paymentStatus]}</p>}
      {changedAmount(d)}
      {d.needed?.map(n => <p key={n.field}>{n.request}</p>)}
      <details><summary>Dlaczego taki wynik?</summary><p>{d.reasonCode} · reguła {assessment.ruleVersion}</p>
        {d.segments?.map(part => <p key={part.from}>{part.from} – {part.to} · podstawa {currency.format(part.basisGrosze / 100)} · {part.ratePct}% · {part.days} dni × {currency.format(part.dailyGrosze / 100)} = {currency.format(part.grossAmountGrosze / 100)} brutto</p>)}
        <Evidence citations={d.citations} documents={documents} local={local} /></details>
    </section>)}
  </section>;
}

const codeChoices: Partial<Record<FactInput["field"], [string, string][]>> = {
  benefitRequest: [["maternity", "Zasiłek macierzyński"], ["paternity", "Za okres ojcowski"], ["parental", "Za okres rodzicielski"]],
  insuranceTitle: [["employee", "Pracownik"], ["zleceniobiorca", "Zleceniobiorca"], ["dzialalnosc", "Działalność"]],
  sicknessCoverage: [["covered", "Podlega"], ["excluded", "Nie podlega"]],
  otherCoverage: [["none", "Potwierdzony brak innych tytułów"]],
  postInsuranceException: [["none", "Potwierdzony brak wyjątku"]],
  maternityPayVariant: [["100-70", "100% / 70%"], ["815", "81,5%"]],
  payrollRegime: [["full_time_fixed_full_months", "Pełny etat, stałe wynagrodzenie, pełne miesiące"]],
};
export function FactForm({ draft, manual, save, cancel }: { draft?: FactDraft; manual?: ManualSource; save: (fact: FactInput, previous?: EvidenceFact) => void; cancel: () => void }) {
  const heading = useRef<HTMLElement>(null);
  useEffect(() => {
    heading.current?.focus({preventScroll:true});
    heading.current?.scrollIntoView({block:"center"});
  }, []);
  const f = draft?.fact;
  const [field, setField] = useState<FactInput["field"]>(f?.field ?? "monthlyGrossPay");
  const [subject, setSubject] = useState(f?.subjectId ?? "person-A");
  const [from, setFrom] = useState(f?.validFrom ?? f?.asOf ?? "");
  const [to, setTo] = useState(f?.validTo ?? "");
  const v = f?.value;
  const [value, setValue] = useState(v?.kind === "money" ? String(v.grosze / 100) : v?.kind === "date" ? v.date : v?.kind === "count" ? String(v.count) : v?.code ?? "");
  const [payer, setPayer] = useState(f?.payerRef ?? "");
  const [title, setTitle] = useState(f?.titleRef ?? "");
  const choice = draft?.choice;
  const [error, setError] = useState("");
  const [pointInTime, setPointInTime] = useState(Boolean(f?.asOf && !f.validFrom));
  const kind = factValueKinds[field];
  const money = kind === "money";
  return <form className={s.reviewForm} onSubmit={event => {
    event.preventDefault();
    if (choice) {
      try {
        const confirmed = confirmCaseCandidate(choice.document, choice.registered, choice.candidate,
          { subjectId: subject, titleRef: title || undefined, payerRef: payer || undefined, asOf: from });
        save(confirmed);
      } catch { setError("Wybierz osobę, okres, tytuł i płatnika odpowiadające temu polu."); }
      return;
    }
    const raw = value.trim().replace(",", ".");
    const [whole, fraction = ""] = raw.split(".");
    const parsedValue = money ? { kind: "money", currency: "PLN", grosze: /^\d+(\.\d{1,2})?$/.test(raw) ? Number(whole + fraction.padEnd(2, "0")) : NaN }
      : kind === "count" ? { kind, count: /^\d+$/.test(value) ? Number(value) : NaN } : kind === "date" ? { kind: "date", date: value } : { kind: "code", code: value };
    const result = factInput.safeParse({ subjectId: subject, field, value: parsedValue, ...(pointInTime ? { asOf: from } : { validFrom: from, ...(to ? { validTo: to } : {}) }),
      ...(payer ? { payerRef: payer } : {}), ...(title ? { titleRef: title } : {}),
      source: manual ? { kind: "document", referenceId: manual.referenceId, page: manual.page } : { kind: "declaration", referenceId: crypto.randomUUID() } });
    if (!result.success) { setError("Sprawdź wartość oraz kolejność dat."); return; }
    save(result.data, draft?.previous);
  }}>
    <strong ref={heading} tabIndex={-1}>{draft?.previous ? "Potwierdź korektę" : "Potwierdź dane do sprawy"}</strong>
    {manual && <><a href={manual.url + "#page=" + manual.page} target="_blank" rel="noreferrer">Sprawdź oryginał · strona {manual.page}</a>
      {manual.kind === "other" && <p>Rodzaj tej strony wymaga sprawdzenia. Reguła może poprosić o dodatkowy dokument.</p>}</>}
    {draft?.previous && <p>Poprzednia wartość: {valueLabel(draft.previous.fact.value)}</p>}
    <label>Osoba<select value={subject} disabled={!!draft?.previous} onChange={e => setSubject(e.target.value)}>
      {Array.from(new Set(["person-A", "person-B", "child-A", subject])).map(id => <option key={id}>{id}</option>)}</select></label>
    <label>Pole<select value={field} disabled={!!draft} onChange={e => { setField(e.target.value as typeof field); setValue(""); }}>
      {Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    <label>{money ? "Kwota w złotych" : kind === "date" ? labels[field] : kind === "count" ? "Liczba" : "Kod wartości"}
      {codeChoices[field] && !choice ? <select required value={value} onChange={e => setValue(e.target.value)}>
        <option value="">Wybierz zapis z dokumentu lub deklaracji</option>{codeChoices[field]?.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select>
        : <input readOnly={!!choice} required type={kind === "date" ? "date" : "text"} value={value} inputMode={money ? "decimal" : undefined}
        pattern={kind === "code" ? "[a-zA-Z0-9_\\-]{1,64}" : undefined} maxLength={64} onChange={e => setValue(e.target.value)} />}</label>
    {!choice && <label>Zakres dat<select value={pointInTime ? "day" : "period"} onChange={e => setPointInTime(e.target.value === "day")}>
      <option value="period">Od dnia lub przez okres</option><option value="day">Stan na jeden dzień</option></select></label>}
    <label>{pointInTime ? "Stan na dzień" : "Obowiązuje od"}<input type="date" readOnly={!!(choice?.candidate.validFrom || choice?.candidate.asOf)} required value={from} onChange={e => setFrom(e.target.value)} /></label>
    {!pointInTime && <label>Obowiązuje do<input type="date" readOnly={!!choice} min={from} value={to} onChange={e => setTo(e.target.value)} /></label>}
    <label>Tytuł w tej sprawie<select required={money} value={title} onChange={e => setTitle(e.target.value)}>
      <option value="">Wybierz tytuł</option>{Array.from(new Set(["title-A","title-B",...(f?.titleRef ? [f.titleRef] : [])])).map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Płatnik w tej sprawie<select required={money} value={payer} onChange={e => setPayer(e.target.value)}>
      <option value="">Wybierz płatnika</option>{Array.from(new Set(["payer-P","payer-Q",...(f?.payerRef ? [f.payerRef] : [])])).map(v => <option key={v}>{v}</option>)}</select></label>
    {choice && <blockquote><mark>{choice.document.pages[choice.candidate.locator.page - 1].text.split(/\r?\n/u).slice(choice.candidate.locator.lineStart - 1, choice.candidate.locator.lineEnd).join(" ")}</mark>
      {choice.candidate.locator.column && " · kolumna " + choice.candidate.locator.column}</blockquote>}
    <p>{manual ? "Ręczny odczyt dokumentu · strona " + manual.page : f?.source.kind === "document" && !draft?.previous ? "Dokument · strona " + f.source.page : "Źródło: deklaracja w rozmowie"}</p>
    {error && <p role="alert">{error}</p>}
    <div className={s.row8}><button className={s.secondaryButton}>Potwierdzam zapis</button><button type="button" onClick={cancel}>Anuluj</button></div>
  </form>;
}

export function DocumentReview({ pdf, document, onConfirm, date }: {
  pdf: LocalPdf; document: CaseDocument; date?: string;
  onConfirm: (facts: FactInput[], asOf: string) => void;
}) {
  const candidates = pdf.read.pages.flatMap(page => page.candidates);
  const [omitted, setOmitted] = useState(new Set<number>());
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [payer, setPayer] = useState("");
  const claim = candidates.find(c => c.field === "benefitRequest");
  const [asOf, setAsOf] = useState(date ?? claim?.validTo ?? "");
  const [error, setError] = useState("");
  if (candidates.length < 2) return null;
  return <details className={s.source}><summary>Sprawdź pola dokumentu ({candidates.length})</summary>
    <form className={s.reviewForm} onSubmit={e => {
      e.preventDefault();
      try {
        const facts = candidates.flatMap((c, i) => omitted.has(i) ? [] : [confirmCaseCandidate(pdf.read, document, c, { subjectId: subject, titleRef: title, payerRef: payer, asOf })]);
        if (facts.length) onConfirm(facts, asOf);
      } catch { setError("Sprawdź zakres wybranych pól."); }
    }}>
      {candidates.map((c, i) => <label key={i} className={s.reviewCheck}>
        <input type="checkbox" checked={!omitted.has(i)} onChange={() => setOmitted(prev => {
          const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next;
        })} />
        <span>{labels[c.field]} · {valueLabel(c.value)} · {c.validFrom ?? c.asOf}{c.validTo && " – " + c.validTo} · str. {c.locator.page}, wiersz {c.locator.lineEnd}</span>
      </label>)}
      <label>Osoba z dokumentu<select required value={subject} onChange={e => setSubject(e.target.value)}><option value="">Wybierz osobę</option><option>person-A</option><option>person-B</option><option>child-A</option></select></label>
      <label>Tytuł z dokumentu<select required value={title} onChange={e => setTitle(e.target.value)}><option value="">Wybierz tytuł</option><option>title-A</option><option>title-B</option></select></label>
      <label>Płatnik z dokumentu<select required value={payer} onChange={e => setPayer(e.target.value)}><option value="">Wybierz płatnika</option><option>payer-P</option><option>payer-Q</option></select></label>
      <label>Data oceny sprawy<input required type="date" value={asOf} onChange={e => setAsOf(e.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <button disabled={omitted.size === candidates.length} className={s.secondaryButton}>Potwierdź wybrane pola i oceń sprawę</button>
    </form>
  </details>;
}
