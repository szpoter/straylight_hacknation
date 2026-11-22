"use client";

import { useState } from "react";
import { factInput, factValueKinds, type CaseDocument, type EvidenceFact, type FactInput } from "@/lib/zusik/memory/contract";
import { confirmCaseCandidate, type EvidenceCandidate, type LocalCaseDocument } from "./case-evidence";
import type { Assessment, Citation } from "./case-api";
import s from "./zusik.module.css";

export type LocalPdf = { name: string; url: string; read: LocalCaseDocument };
export type CandidateChoice = { document: LocalCaseDocument; registered: CaseDocument; candidate: EvidenceCandidate };
export type FactDraft = { fact: FactInput; previous?: EvidenceFact; choice?: CandidateChoice };
const currency = new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" });
export const labels: Record<FactInput["field"], string> = {
  accountArrears: "Zadłużenie składkowe", sicknessCertificate: "Zwolnienie lekarskie", benefitHistory: "Historia świadczeń",
  birthDate: "Data urodzenia dziecka", insuranceTitle: "Tytuł ubezpieczenia", employerRef: "Płatnik",
  monthlyGrossPay: "Wynagrodzenie brutto", monthlyContributionBasis: "Podstawa składek", submissionStatus: "Status wniosku", benefitRequest: "Wnioskowane świadczenie",
  deliveryDate: "Data porodu", sicknessCoverage: "Ubezpieczenie chorobowe", otherCoverage: "Inny tytuł ubezpieczenia",
  postInsuranceException: "Wyjątek po ustaniu ubezpieczenia", maternityPayVariant: "Wariant wypłaty", payrollRegime: "Sposób ustalania płacy",
  monthlyEmployeeDeduction: "Potrącone składki", monthlyPayAfterDeduction: "Po potrąceniu składek", payerInsuredCount: "Liczba ubezpieczonych",
};
export function valueLabel(v: FactInput["value"]) {
  return v.kind === "money" ? currency.format(v.grosze / 100) : v.kind === "date" ? v.date : v.kind === "count" ? String(v.count) : v.code;
}
export function Evidence({ citations, documents, local }: { citations: Citation[]; documents: CaseDocument[]; local: Map<string, LocalPdf> }) {
  return citations.map((cite, index) => {
    const key = cite.ref + index;
    if (cite.kind === "public_source") {
      const url = URL.canParse(cite.publicUrl ?? "") ? new URL(cite.publicUrl ?? "") : null;
      return url?.protocol === "https:" && /(^|\.)(zus\.pl|gov\.pl|sejm\.gov\.pl)$/.test(url.hostname)
        ? <a key={key} href={url.href} target="_blank" rel="noreferrer">Przepis · {cite.version}</a> : null;
    }
    const doc = documents.find(d => d.id === cite.ref);
    const pdf = doc && local.get(doc.metadata.clientDocumentId);
    if (cite.kind === "document") return <p key={key}>{pdf ? <a href={pdf.url + "#page=" + (cite.page ?? 1)} target="_blank" rel="noreferrer">Dowód · strona {cite.page ?? 1} w PDF</a>
      : <>Dowód · strona {cite.page ?? 1}. Dołącz ponownie ten sam PDF, aby otworzyć stronę.</>}</p>;
    return <p key={key}>{cite.kind === "fact" ? "Fakt" : cite.kind === "assessment" ? "Ocena" : "Zapis sprawy"} · {cite.ref} · wersja {cite.version}</p>;
  });
}
const statusText = { eligible: "Przysługuje", ineligible: "Nie przysługuje", needs_information: "Brakuje danych", needs_review: "Wymaga sprawdzenia", unsupported: "Poza zakresem reguły" };
const benefits: Record<string, string> = { maternity: "Zasiłek macierzyński", paternity: "Okres ojcowski", sickness: "Zasiłek chorobowy", parental: "Okres rodzicielski" };
export function DecisionCard({ assessment, historical, documents, local }: { assessment: Assessment; historical: boolean; documents: CaseDocument[]; local: Map<string, LocalPdf> }) {
  return <section className={s.aiMessage} aria-label="Ocena sprawy">
    <strong>{historical ? "Ocena historyczna" : "Ocena sprawy"} · wersja profilu {assessment.input.profileRevision}</strong>
    {assessment.decisions.map((d, i) => <section key={i}><strong>{benefits[d.benefit] ?? d.benefit} · {d.subjectId}</strong>
      <p>{statusText[d.status]}{d.from && " · od " + d.from}{d.to && " do " + d.to}</p>
      <p>Kwota: {d.amountStatus === "calculated" && typeof d.grossAmountGrosze === "number" ? valueLabel({ kind: "money", grosze: d.grossAmountGrosze, currency: "PLN" }) + " brutto " + ({ monthly: "miesięcznie", daily: "dziennie", total: "za okres" }[d.amountPeriod ?? "total"])
        : d.amountStatus === "not_applicable" ? "nie dotyczy" : d.amountStatus === "calculated" ? "brak wartości" : statusText[d.amountStatus]}</p>
      {d.needed?.map(n => <p key={n.field}>{n.request}</p>)}
      <details><summary>Dlaczego taki wynik?</summary><p>{d.reasonCode} · reguła {assessment.ruleVersion}</p>
        {d.segments?.map(part => <p key={part.from}>{part.from} – {part.to} · podstawa {currency.format(part.basisGrosze / 100)} · {part.ratePct}% · {part.days} dni × {currency.format(part.dailyGrosze / 100)} = {currency.format(part.grossAmountGrosze / 100)} brutto</p>)}
        <Evidence citations={d.citations} documents={documents} local={local} /></details>
    </section>)}
  </section>;
}

export function FactForm({ draft, save, cancel }: { draft?: FactDraft; save: (fact: FactInput, previous?: EvidenceFact) => void; cancel: () => void }) {
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
    const result = factInput.safeParse({ subjectId: subject, field, value: parsedValue, validFrom: from, ...(to ? { validTo: to } : {}),
      ...(payer ? { payerRef: payer } : {}), ...(title ? { titleRef: title } : {}),
      source: draft && !draft.previous ? draft.fact.source : { kind: "declaration", referenceId: crypto.randomUUID() } });
    if (!result.success) { setError("Sprawdź wartość oraz kolejność dat."); return; }
    save(result.data, draft?.previous);
  }}>
    <strong>{draft?.previous ? "Potwierdź korektę" : "Potwierdź dane do sprawy"}</strong>
    {draft?.previous && <p>Poprzednia wartość: {valueLabel(draft.previous.fact.value)}</p>}
    <label>Osoba<select value={subject} disabled={!!draft?.previous} onChange={e => setSubject(e.target.value)}>
      {Array.from(new Set(["person-A", "person-B", "child-A", subject])).map(id => <option key={id}>{id}</option>)}</select></label>
    <label>Pole<select value={field} disabled={!!draft} onChange={e => { setField(e.target.value as typeof field); setValue(""); }}>
      {Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
    <label>{money ? "Kwota w złotych" : kind === "date" ? labels[field] : kind === "count" ? "Liczba" : "Kod wartości"}
      <input readOnly={!!choice} required type={kind === "date" ? "date" : "text"} value={value} inputMode={money ? "decimal" : undefined}
        pattern={kind === "code" ? "[a-zA-Z0-9_\\-]{1,64}" : undefined} maxLength={64} onChange={e => setValue(e.target.value)} /></label>
    <label>Obowiązuje od<input type="date" readOnly={!!(choice?.candidate.validFrom || choice?.candidate.asOf)} required value={from} onChange={e => setFrom(e.target.value)} /></label>
    <label>Obowiązuje do<input type="date" readOnly={!!choice} min={from} value={to} onChange={e => setTo(e.target.value)} /></label>
    <label>Tytuł w tej sprawie<select required={money} value={title} onChange={e => setTitle(e.target.value)}>
      <option value="">Wybierz tytuł</option>{Array.from(new Set(["title-A","title-B",...(f?.titleRef ? [f.titleRef] : [])])).map(v => <option key={v}>{v}</option>)}</select></label>
    <label>Płatnik w tej sprawie<select required={money} value={payer} onChange={e => setPayer(e.target.value)}>
      <option value="">Wybierz płatnika</option>{Array.from(new Set(["payer-P","payer-Q",...(f?.payerRef ? [f.payerRef] : [])])).map(v => <option key={v}>{v}</option>)}</select></label>
    {choice && <blockquote><mark>{choice.document.pages[choice.candidate.locator.page - 1].text.split(/\r?\n/u).slice(choice.candidate.locator.lineStart - 1, choice.candidate.locator.lineEnd).join(" ")}</mark>
      {choice.candidate.locator.column && " · kolumna " + choice.candidate.locator.column}</blockquote>}
    <p>{f?.source.kind === "document" && !draft?.previous ? "Dokument · strona " + f.source.page : "Źródło: deklaracja w rozmowie"}</p>
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
