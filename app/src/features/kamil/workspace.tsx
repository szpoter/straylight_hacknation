"use client";

import { useEffect, useState } from "react";
import { ChatStep } from "./chat-step";
import { DocumentStep } from "./document-step";
import { clearPages, loadPages, readDocument, savePages, type PageImage } from "./read-document";
import { ResultStep } from "./result-step";
import { useKamilCase } from "./use-kamil-case";
import { ZamStep } from "./zam-step";
import s from "./kamil.module.css";

/**
 * Kamil's independent path: document → confirmation → period and deadline → ZAM.
 * Integration point with the shared /zusik chat: this component only needs `useKamilCase()`
 * and the `/api/kamil` contract (src/lib/kamil/contract.ts); the shared screen can mount
 * <ChatStep>, <DocumentStep>, <ResultStep>, <ZamStep> once its layout is ready.
 */
export function KamilWorkspace() {
  const { view, busy, error, send, clearError } = useKamilCase();
  const [pages, setPages] = useState<PageImage[] | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);

  useEffect(() => {
    loadPages().then((stored) => {
      if (stored) setPages(stored.pages);
    });
  }, []);

  const onFile = async (file: File) => {
    setReadError(null);
    setReading("Przygotowuję odczyt…");
    try {
      const read = await readDocument(file, setReading);
      setPages(read.pages);
      await savePages(read.fileName, read.pages);
      if (read.candidates.length === 0) {
        setReadError("Nie znalazłem pól odpisu aktu urodzenia w tym pliku. Spróbuj wyraźniejszego skanu albo wpisz datę w rozmowie.");
      } else {
        await send({ type: "set_candidates", candidates: read.candidates });
      }
    } catch {
      setReadError("Nie udało się odczytać pliku. Sprawdź, czy to PDF albo zdjęcie JPG/PNG.");
    } finally {
      setReading(null);
    }
  };

  const onSample = async (path: string, name: string) => {
    const res = await fetch(path);
    const blob = await res.blob();
    await onFile(new File([blob], name, { type: blob.type }));
  };

  if (!view) {
    return (
      <div className={s.root}>
        <p className={s.header} role="status">
          {error ? error.message : "Wczytuję sprawę…"}
        </p>
      </div>
    );
  }

  return (
    <div className={s.root} data-kamil-workspace>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>Zasiłek za okres ojcowski</h1>
          <p className={s.muted}>Kamil prowadzi działalność i przygotowuje ZAM do ZUS</p>
        </div>
        <div className={s.row}>
          <span className={s.demoBadge}>Demo · dane fikcyjne</span>
          <button
            className={s.ghost}
            type="button"
            disabled={busy}
            onClick={async () => {
              await send({ type: "reset" });
              await send({ type: "load_profile" });
              await clearPages();
              setPages(null);
            }}
          >
            Zacznij od nowa
          </button>
        </div>
      </header>
      {error && (
        <div className={s.header}>
          <p className={s.error} role="alert">
            {error.message}{" "}
            <button className={s.ghost} type="button" onClick={clearError}>
              Zamknij
            </button>
          </p>
        </div>
      )}
      <main className={s.grid}>
        <div className={s.column}>
          <DocumentStep
            view={view}
            pages={pages}
            busy={busy}
            reading={reading}
            readError={readError}
            onFile={onFile}
            onSample={onSample}
            send={send}
          />
          <ResultStep key={view.reminder?.date ?? "none"} view={view} busy={busy} send={send} />
        </div>
        <div className={s.column}>
          <ChatStep view={view} pages={pages} busy={busy} send={send} />
          <ZamStep view={view} busy={busy} send={send} />
        </div>
      </main>
    </div>
  );
}
