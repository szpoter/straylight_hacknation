"use client";

import { useId, useMemo, useRef, useState } from "react";
import { AiTag, Button, ButtonLink, Disclosure, Page, PageTitle, Panel, SectionTitle, Segmented, Tag, UploadIcon, cn } from "@/components/ui";
import { ZESTAW, type ZestawCase } from "@/lib/cases/zestaw";
import { readCaseText, type CaseReading } from "@/lib/cases/read-case";
import type { RuleSchedule } from "@/lib/rules/parameters";
import {
  assessMaternityEligibility,
  type EligibilityFacts,
  type EligibilityResult,
  type EligibilityStatus,
} from "@/lib/rules/maternity-eligibility";
import { readCasePdf, MAX_PAGES, type ReadPage } from "./read-pdf";
import { FactsForm } from "./FactsForm";

export type LawRef = { title: string; url: string; quote: string };

type Mode = "zestaw" | "upload" | "own";

const EMPTY: EligibilityFacts = { applicant: "rodzi", event: "porod", eventDate: "", title: "pracownik", insured: "nie-wiem" };

const STATUS: Record<EligibilityStatus, { label: string; tone: "brand" | "accent" | "neutral" | "ink" }> = {
  przysluguje: { label: "Przysługuje", tone: "brand" },
  "nie-przysluguje": { label: "Nie przysługuje", tone: "ink" },
  wstrzymany: { label: "Wstrzymany do spłaty", tone: "accent" },
  "brak-danych": { label: "Brakuje danych", tone: "neutral" },
};

/** Ekran testu prawa do zasiłku: sprawa z zestawu, wgrany skan albo własne fakty. */
export function CheckView({ laws, schedule, today }: { laws: Record<string, LawRef>; schedule: RuleSchedule; today: string }) {
  const [mode, setMode] = useState<Mode>("zestaw");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [facts, setFacts] = useState<EligibilityFacts>(EMPTY);
  const [reading, setReading] = useState<(CaseReading & { pages: ReadPage[]; fileName: string }) | null>(null);
  const selected = ZESTAW.find((c) => c.id === caseId) ?? null;

  const result = useMemo(() => assessMaternityEligibility(facts, today, schedule), [facts, today, schedule]);
  const edited = selected ? JSON.stringify(selected.facts) !== JSON.stringify(facts) : false;
  const zus = mode === "zestaw" && selected ? selected.zus.status : mode === "upload" && reading?.zusOutcome ? reading.zusOutcome : null;

  const pickCase = (c: ZestawCase) => {
    setCaseId(c.id);
    setFacts(c.facts);
    requestAnimationFrame(() => document.getElementById("fakty")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const switchMode = (m: Mode) => {
    setMode(m);
    setCaseId(null);
    setReading(null);
    setFacts(EMPTY);
  };

  return (
    <Page className="flex flex-col gap-10 pb-section-mobile md:gap-12 md:pb-section">
      <div className="flex max-w-prose flex-col gap-4">
        <PageTitle>Sprawdź prawo do zasiłku macierzyńskiego</PageTitle>
        <p className="text-lead text-on-surface-variant">
          Wybierz sprawę z zestawu ZUS, wgraj skan sprawy albo wpisz własne fakty. Rozstrzyga reguła oparta na ustawie zasiłkowej, a każdy powód ma przypis do przepisu.
        </p>
      </div>

      <div data-tour="check-howto"><HowToTest /></div>

      <div data-tour="check-mode">
      <Segmented<Mode>
        label="Skąd wziąć fakty"
        value={mode}
        onChange={switchMode}
        fill
        options={[
          { value: "zestaw", label: "Sprawa z zestawu ZUS" },
          { value: "upload", label: "Wgraj PDF sprawy" },
          { value: "own", label: "Wpisz własne fakty" },
        ]}
      />
      </div>

      {mode === "zestaw" && <div data-tour="check-cases"><CaseList selectedId={caseId} onPick={pickCase} /></div>}
      {mode === "upload" && (
        <Upload
          onRead={(r) => {
            setReading(r);
            setFacts({ ...EMPTY, ...r.facts });
            requestAnimationFrame(() => document.getElementById("fakty")?.scrollIntoView({ behavior: "smooth", block: "start" }));
          }}
          reading={reading}
        />
      )}

      {(mode === "own" || selected || reading) && (
        <div id="fakty" className="grid scroll-mt-24 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-6">
            {selected && (
              <Panel className="flex flex-col gap-2">
                <p className="text-meta text-on-surface-variant">Sprawa z zestawu · {selected.fileHint}</p>
                <h2 className="font-serif text-title">{selected.title}</h2>
                <p>{selected.story}</p>
                <p className="text-meta text-on-surface-variant">Fakty z dokumentów: {selected.source}.</p>
              </Panel>
            )}
            <Panel aria-labelledby="fakty-tytul" data-tour="check-facts">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <SectionTitle id="fakty-tytul">Fakty sprawy</SectionTitle>
                {selected && edited && (
                  <Button variant="secondary" size="sm" onClick={() => setFacts(selected.facts)}>
                    Przywróć fakty z akt
                  </Button>
                )}
              </div>
              {selected && <p className="mb-4 text-meta text-on-surface-variant">Możesz zmienić fakt i zobaczyć, jak zmienia się wynik.</p>}
              {mode === "upload" && reading && (
                <p className="mb-4 text-meta text-on-surface-variant">Pola z podpowiedzią odczytu sprawdź z podglądem strony poniżej formularza. Popraw je, jeśli odczyt się pomylił.</p>
              )}
              <FactsForm facts={facts} onChange={setFacts} />
            </Panel>
            {mode === "upload" && reading && <EvidenceList reading={reading} />}
          </div>

          <aside aria-label="Wynik" data-tour="check-verdict" className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
            <Verdict result={result} laws={laws} zus={zus} zusText={mode === "zestaw" ? selected?.zus.text ?? null : null} edited={edited} />
          </aside>
        </div>
      )}
    </Page>
  );
}

function HowToTest() {
  return (
    <section aria-label="Jak przetestować" className="flex flex-col gap-2 rounded-lg border border-outline bg-surface p-gutter-mobile md:p-card">
      <h2 className="font-serif text-title">Jak przetestować</h2>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          <strong>Sprawa z zestawu ZUS:</strong> wybierz jedną z 10 spraw (6 odmów, 4 przyznania). Obok wyniku reguły widać rozstrzygnięcie ZUS z akt i znacznik zgodności.
        </li>
        <li>
          <strong>Wgraj PDF sprawy:</strong> wybierz plik z folderu „Sprawy” zestawu. Tekst odczytujemy na tym urządzeniu (OCR), plik nie trafia na serwer. Podpowiedzi faktów sprawdź z podglądem strony i popraw w formularzu.
        </li>
        <li>
          <strong>Kwoty i okresy:</strong> liczy{" "}
          <a href="/kalkulator" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
            kalkulator
          </a>{" "}
          — wybierz w nim „Sprawa ZUS: …”, żeby porównać wyliczenie z decyzją co do grosza.
        </li>
        <li>
          <strong>Panel administracyjny:</strong> zmiana płacy minimalnej w{" "}
          <a href="/admin" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
            /admin
          </a>{" "}
          zmienia próg zadłużenia (1% płacy minimalnej) w tej przeglądarce.
        </li>
      </ol>
    </section>
  );
}

function CaseList({ selectedId, onPick }: { selectedId: string | null; onPick: (c: ZestawCase) => void }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2" aria-label="Sprawy z zestawu ZUS">
      {ZESTAW.map((c) => {
        const active = c.id === selectedId;
        return (
          <li key={c.id}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onPick(c)}
              className={cn(
                "flex h-full w-full flex-col items-start gap-2 rounded-lg border p-gutter-mobile text-left transition-colors duration-150 md:p-card",
                active ? "border-on-surface bg-surface" : "border-outline bg-background hover:bg-surface",
              )}
            >
              <span className="flex w-full flex-wrap items-center justify-between gap-2">
                <span className="text-meta text-on-surface-variant">{c.fileHint.split(" · ")[0]}</span>
                <Tag tone={STATUS[c.zus.status].tone}>ZUS: {STATUS[c.zus.status].label.toLowerCase()}</Tag>
              </span>
              <span className="font-medium">{c.title}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function Upload({ onRead, reading }: { onRead: (r: CaseReading & { pages: ReadPage[]; fileName: string }) => void; reading: { fileName: string } | null }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const read = async (file?: File) => {
    if (!file) return;
    setError(null);
    setBusy(true);
    abort.current = new AbortController();
    try {
      const pages = await readCasePdf(file, setProgress, abort.current.signal);
      const r = readCaseText(pages.map((p) => p.text));
      onRead({ ...r, pages, fileName: file.name });
      setProgress("");
    } catch (e) {
      setError(e instanceof DOMException && e.name === "AbortError" ? "Przerwano odczyt." : "Nie udało się odczytać pliku. Spróbuj innego PDF albo wpisz fakty ręcznie.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-serif text-title">Wgraj PDF sprawy</h2>
        <AiTag />
      </div>
      <p className="max-w-prose text-on-surface-variant">
        PDF albo zdjęcie dokumentów sprawy (ZAM, Z-3, Z-3a, Z-3b, decyzja, poświadczenie ubezpieczenia, odpis aktu urodzenia). Czytamy do {MAX_PAGES} stron. Skan 15–25 stron to zwykle 30–60 sekund.
      </p>
      <label htmlFor={id} className={cn("inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full border border-on-surface px-5 font-medium hover:bg-surface", busy && "pointer-events-none opacity-50")}>
        <UploadIcon size={18} /> Wybierz plik
      </label>
      <input id={id} type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg" disabled={busy} onChange={(e) => read(e.target.files?.[0])} />
      <p role="status" aria-live="polite" className="text-meta text-on-surface-variant">
        {busy ? progress : reading ? `Odczytano: ${reading.fileName}` : ""}
      </p>
      {busy && (
        <Button variant="secondary" size="sm" onClick={() => abort.current?.abort()}>
          Przerwij
        </Button>
      )}
      {error && <p className="rounded-sm bg-tertiary px-3 py-2 text-meta">{error}</p>}
    </Panel>
  );
}

function EvidenceList({ reading }: { reading: CaseReading & { pages: ReadPage[] } }) {
  const [page, setPage] = useState<number | null>(null);
  const shown = reading.pages.find((p) => p.page === page);
  return (
    <Panel aria-labelledby="podpowiedzi">
      <SectionTitle id="podpowiedzi" className="mb-2">
        Co odczytaliśmy z pliku
      </SectionTitle>
      {reading.evidence.length === 0 ? (
        <p className="text-on-surface-variant">Nie znaleźliśmy rozpoznawalnych faktów. Uzupełnij formularz ręcznie, patrząc na strony pliku.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reading.evidence.map((e, i) => (
            <li key={i} className="border-t border-outline pt-3">
              <p className="font-medium">{e.label}</p>
              <p className="text-meta text-on-surface-variant">„{e.snippet}”</p>
              <button type="button" className="text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface" onClick={() => setPage(e.page)}>
                Pokaż stronę {e.page}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Disclosure summary={`Wszystkie strony (${reading.pages.length})`} className="mt-4 border-t border-outline">
        <div className="flex flex-wrap gap-2">
          {reading.pages.map((p) => (
            <button key={p.page} type="button" aria-pressed={page === p.page} onClick={() => setPage(p.page)} className={cn("min-h-10 min-w-10 rounded-full border px-3 text-meta", page === p.page ? "border-on-surface bg-on-surface text-on-primary" : "border-outline")}>
              {p.page}
            </button>
          ))}
        </div>
      </Disclosure>
      {shown && (
        <figure className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- podgląd z pamięci przeglądarki */}
          <img src={shown.image} alt={`Strona ${shown.page} wgranego pliku`} className="w-full rounded-sm border border-outline" />
          <figcaption className="mt-1 text-meta text-on-surface-variant">Strona {shown.page}. Podgląd tylko w tej przeglądarce.</figcaption>
        </figure>
      )}
    </Panel>
  );
}

function Verdict({ result, laws, zus, zusText, edited }: { result: EligibilityResult; laws: Record<string, LawRef>; zus: EligibilityStatus | null; zusText: string | null; edited: boolean }) {
  const s = STATUS[result.status];
  // Przy brakującym fakcie nie ma czego porównać — nie pokazujemy „Niezgodne”.
  const match = zus && result.status !== "brak-danych" ? zus === result.status : null;
  return (
    <>
      <Panel className="flex flex-col gap-3" aria-live="polite">
        <p className="text-meta text-on-surface-variant">Wynik reguły{result.checkedOn ? ` · ubezpieczenie sprawdzone na ${result.checkedOn.split("-").reverse().join(".")}` : ""}</p>
        <div>
          <Tag tone={s.tone}>{s.label}</Tag>
        </div>
        <p className="font-serif text-title">{result.summary}</p>
        {result.question && <p className="rounded-sm bg-tertiary px-3 py-2">{result.question}</p>}
        {result.payerNote && <p className="text-meta">{result.payerNote}</p>}
      </Panel>

      {zus && (
        <Panel className="flex flex-col gap-2">
          <p className="text-meta text-on-surface-variant">Rozstrzygnięcie ZUS w aktach</p>
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone={STATUS[zus].tone}>{STATUS[zus].label}</Tag>
            {match !== null && <Tag tone={match ? "brand" : "accent"}>{match ? "Zgodne z regułą" : edited ? "Inaczej po zmianie faktów" : "Niezgodne"}</Tag>}
            {zus && match === null && <Tag tone="neutral">Uzupełnij fakty, żeby porównać</Tag>}
          </div>
          {zusText && <p className="text-meta">{zusText}</p>}
        </Panel>
      )}

      {result.reasons.length > 0 && (
        <Panel>
          <h2 className="mb-2 font-serif text-title">Dlaczego</h2>
          <ol className="flex flex-col gap-4">
            {result.reasons.map((r, i) => (
              <li key={i} className="flex flex-col gap-1">
                <p>{r.text}</p>
                <ul className="flex flex-col gap-1">
                  {r.lawIds.map((id) => {
                    const law = laws[id];
                    if (!law) return null;
                    return (
                      <li key={id}>
                        <Disclosure summary={law.title} summaryClassName="py-1 text-meta">
                          <blockquote className="border-l-2 border-outline pl-3 text-meta text-on-surface-variant">{law.quote}</blockquote>
                          <a href={law.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                            Otwórz źródło<span className="sr-only"> (otwiera się w nowej karcie)</span>
                          </a>
                        </Disclosure>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <ButtonLink href="/kalkulator" variant="secondary">
        Policz kwotę i okresy w kalkulatorze
      </ButtonLink>
    </>
  );
}
