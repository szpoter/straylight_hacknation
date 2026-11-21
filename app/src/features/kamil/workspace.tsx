"use client";

import { useEffect, useState } from "react";
import { CaseChatWindow } from "../chat/case-chat-window";
import { ChatStep } from "./chat-step";
import { DocumentStep } from "./document-step";
import { clearPages, loadPages, readDocument, savePages, type PageImage } from "./read-document";
import { ResultStep } from "./result-step";
import { useKamilCase } from "./use-kamil-case";
import { ZamStep } from "./zam-step";
import s from "./kamil.module.css";

export function KamilWorkspace() {
  const { view, documentCache, busy, error, send, reload } = useKamilCase();
  const [pages, setPages] = useState<PageImage[] | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentCache) return;
    let active = true;
    loadPages(documentCache).then(stored => { if (active) setPages(stored?.pages ?? null); });
    return () => { active = false; };
  }, [documentCache]);

  const onFile = async (file: File) => {
    setReadError(null);
    setReading("Przygotowuję odczyt…");
    try {
      const read = await readDocument(file, setReading);
      if (read.candidates.length === 0) {
        setReadError("Nie znalazłem pól odpisu aktu urodzenia w tym pliku. Spróbuj wyraźniejszego skanu albo wpisz datę w rozmowie.");
      } else {
        const saved = await send({ type: "set_candidates", candidates: read.candidates });
        if (saved) {
          setPages(read.pages);
          await savePages(documentCache, read.fileName, read.pages);
        }
      }
    } catch {
      setReadError("Nie udało się odczytać pliku. Sprawdź, czy to PDF albo zdjęcie JPG/PNG.");
    } finally {
      setReading(null);
    }
  };

  const onSample = async (path: string, name: string) => {
    try {
      setReading("Otwieram przykład…");
      const res = await fetch(path);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      await onFile(new File([blob], name, { type: blob.type }));
    } catch {
      setReadError("Nie udało się otworzyć przykładowego pliku. Spróbuj ponownie.");
      setReading(null);
    }
  };

  const blocked = busy || !!reading || !view;
  return (
    <CaseChatWindow scenario="kamil" label="Kamil · Zasiłek za okres ojcowski" busy={blocked}
      notice={readError ?? error?.message} onMessage={text => send({ type: "chat", text })}>
      {!view ? <p role="status">{error ? <button type="button" onClick={reload}>Spróbuj ponownie</button> : "Wczytuję sprawę…"}</p> : <>
        <div className={s.caseTools} data-kamil-workspace>
          <h1 className={s.cardTitle}>Zasiłek za okres ojcowski</h1>
          <details open={!!view.candidates.length || (!view.facts.child_birth_date && !view.draft)}>
            <summary>Odpis aktu urodzenia</summary>
            <DocumentStep view={view} pages={pages} busy={busy} reading={reading} readError={readError}
              onFile={onFile} onSample={onSample} send={send} />
          </details>
          <details>
            <summary>Okres, prawo i termin</summary>
            <ResultStep key={view.reminder?.date ?? "none"} view={view} busy={busy} send={send} />
          </details>
          <details open={!!view.draft || view.readyForDraft}>
            <summary>Wniosek ZAM</summary>
            <ZamStep view={view} busy={busy} send={send} />
          </details>
          <button className={s.ghost} type="button" disabled={blocked} onClick={async () => {
            if (!(await send({ type: "reset" }))) return;
            await send({ type: "load_profile" });
            await clearPages(documentCache);
            setPages(null);
            setReadError(null);
          }}>Zacznij od nowa</button>
        </div>
        <ChatStep view={view} pages={pages} busy={blocked} send={send} />
      </>}
    </CaseChatWindow>
  );
}
