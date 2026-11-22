"use client";

import { useEffect, useRef, useState } from "react";
import type { CaseChatEntry } from "./case-chat-window";
import { findCasePassages } from "./find-case-passages";
import s from "./zusik.module.css";

type LocalFile = { name: string; url: string; pages: string[] };

export function useCaseFile() {
  const [file, setFile] = useState<LocalFile | null>(null);
  const [reading, setReading] = useState(false);
  const [notice, setNotice] = useState("");
  const [entries, setEntries] = useState<CaseChatEntry[]>([]);
  const activeRead = useRef<AbortController | null>(null);
  const objectUrl = useRef("");

  function release() {
    activeRead.current?.abort();
    activeRead.current = null;
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = "";
  }

  useEffect(() => release, []);

  function clear() {
    release();
    setFile(null);
    setEntries([]);
    setReading(false);
    setNotice("");
  }

  async function select(selected: File) {
    clear();
    const operation = new AbortController();
    activeRead.current = operation;
    setFile({ name: selected.name, url: "", pages: [] });
    setReading(true);
    setNotice("Otwieram PDF…");
    try {
      const { readCasePdf } = await import("./read-case-pdf");
      const pages = await readCasePdf(selected, operation.signal, label => {
        if (!operation.signal.aborted) setNotice(label);
      });
      if (operation.signal.aborted) return;
      const url = URL.createObjectURL(selected.slice(0, selected.size, "application/pdf"));
      objectUrl.current = url;
      setFile({ name: selected.name, url, pages });
      const readable = pages.filter(page => page.trim().length > 0).length;
      setEntries([{
        at: new Date().toISOString(), id: crypto.randomUUID(),
        content: <div>
          <strong>{selected.name}</strong>
          <p>Strony z odczytanym tekstem: {readable} z {pages.length}.
            {readable > 0 ? " Zapytaj o zapis w dokumencie, a wskażę pasujące fragmenty i strony." : " Możesz otworzyć oryginał lub wgrać czytelniejszy skan."}</p>
          <a href={url} target="_blank" rel="noopener noreferrer">Otwórz własny PDF</a>
        </div>,
      }]);
      setNotice("");
    } catch (error) {
      if (operation.signal.aborted) return;
      const message = error instanceof Error && /^(Wybierz |Ten plik|Przeglądarka )/u.test(error.message) ? error.message
        : "Nie udało się odczytać PDF-u. Sprawdź, czy jest czytelny i można go otworzyć bez hasła.";
      setNotice(message);
    } finally {
      if (!operation.signal.aborted) setReading(false);
    }
  }

  function ask(question: string) {
    if (!file?.url || !question.trim() || reading) return false;
    const passages = findCasePassages(file.pages, question);
    setEntries(items => [...items, {
      id: crypto.randomUUID(), at: new Date().toISOString(),
      content: <>
        <p className={s.userBubble}>{question}</p>
        <div>
          <p>{passages.length ? "W Twoim PDF znalazłem te zapisy:" : "Nie znalazłem fragmentu pasującego do pytania. Podaj nazwę pola, rodzaj dokumentu lub sformułowanie z pisma."}</p>
          {passages.map(({ page, excerpt }) => <details key={page} className={s.source} open>
            <summary>Strona {page}</summary>
            <blockquote className={s.sourceQuote}>{excerpt}</blockquote>
            <a href={file.url + "#page=" + page} target="_blank" rel="noopener noreferrer">Otwórz stronę {page} w PDF</a>
          </details>)}
          {/kwot|ile (?:dostan|otrzym|wyp[łl]a|wynies)|oblicz|wysoko[śs]|brutto|netto/iu.test(question) &&
            <p>Kwotę na podstawie danych z dokumentu możesz sprawdzić w <a href="/app/kalkulator" target="_blank" rel="noopener noreferrer">kalkulatorze zasiłku</a>. Dane wpisujesz samodzielnie.</p>}
        </div>
      </>,
    }]);
    return true;
  }

  return { active: file !== null, canAsk: Boolean(file?.url) && !reading, fileName: file?.name, reading, notice, entries, select, clear, ask };
}

export function CaseFileUpload({ state }: { state: ReturnType<typeof useCaseFile> }) {
  const input = useRef<HTMLInputElement>(null);
  return <div>
    <input hidden ref={input} type="file" accept=".pdf,application/pdf" onChange={event => {
      const chosen = event.target.files?.[0];
      event.target.value = "";
      if (chosen) void state.select(chosen);
    }} />
    {state.active
      ? <button type="button" className={s.secondaryButton} onClick={state.clear} aria-label={`Odłącz plik ${state.fileName}`}>Odłącz PDF</button>
      : <button type="button" className={s.secondaryButton} onClick={() => input.current?.click()}>Dołącz PDF sprawy</button>}
    {state.notice && <p role="status" className={s.composerNotice}>{state.notice}</p>}
  </div>;
}
