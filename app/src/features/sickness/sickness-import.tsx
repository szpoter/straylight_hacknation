"use client";

import { useEffect, useRef, useState } from "react";
import { blankFields, confirmManual, fieldsFrom, type ManualFields } from "@/lib/sickness/manual";
import type { PageFact, SicknessView } from "@/lib/sickness/types";
import { ManualPage } from "./manual-page";
import { readSicknessFile, saveOriginalPages } from "./read-file";

type ReviewPage = {
  page: number;
  raw: string;
  image?: Blob;
  fact: PageFact | null;
  fields: ManualFields;
  manual: boolean;
  included: boolean;
};

function PageImage({ image }: { image: Blob }) {
  const preview = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(image);
    if (preview.current) preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [image]);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the source is a device-local blob URL
    <img
      ref={preview}
      alt="Oryginalna strona dokumentu do potwierdzenia"
      style={{ width: "100%", height: "auto" }}
    />
  );
}

export function SicknessImport({ version, onSaved }: { version: number; onSaved: (view: SicknessView) => void }) {
  const [pages, setPages] = useState<ReviewPage[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [baseVersion, setBaseVersion] = useState(version);
  function edit(page: number, change: Partial<ReviewPage>) {
    setPages((list) => list.map((p) => (p.page === page ? { ...p, ...change } : p)));
  }
  async function read(file?: File) {
    setPages([]);
    if (!file) return;
    setBusy(true);
    setMessage("Odczytuję strony na tym urządzeniu…");
    setBaseVersion(version);
    try {
      const read = await readSicknessFile(file, setMessage);
      setPages(
        read.map((p) => ({
          ...p,
          included: true,
          manual: !p.fact,
          fields: p.fact ? fieldsFrom(p.fact) : { ...blankFields },
        })),
      );
      setMessage("Sprawdź odczyt. Jeśli dokument ma nowy układ, wskaż ustalenia widoczne na stronie.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Nie udało się odczytać pliku.");
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    setBusy(true);
    try {
      const selected = pages.filter((p) => p.included);
      const confirmed = selected.map((p) => {
        const fact = p.manual || !p.fact ? confirmManual(p.fields, p.page) : p.fact;
        return { page: p.page, text: fact.text, manual: p.manual };
      });
      const res = await fetch("/api/zusik/sickness", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: "import", version: baseVersion, pages: confirmed }),
      });
      const { view } = (await res.json()) as { view?: SicknessView };
      if (res.status === 409 && view) {
        onSaved(view);
        setPages([]);
        setMessage("Sprawa zmieniła się. Wybierz plik ponownie.");
        return;
      }
      if (!res.ok || !view) throw new Error("Nie udało się zapisać dokumentów. Spróbuj ponownie.");
      const originals = view.evidence.flatMap((e) => {
        const p = selected.find((p) => p.page === e.page);
        return p ? [{ url: e.url, image: p.image ?? new Blob([p.raw], { type: "text/plain" }) }] : [];
      });
      try {
        await saveOriginalPages(originals);
        setMessage("Zapisano potwierdzone strony.");
      } catch {
        setMessage("Zapisano ustalenia. Przeglądarka nie zachowała oryginalnych stron.");
      }
      onSaved(view);
      setPages([]);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Błąd połączenia.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-label="Import pakietu demonstracyjnego">
      <h3>Sprawdź inny pakiet dokumentów</h3>
      <p>Plik odczytamy na tym urządzeniu. W sprawie zapiszemy ustalenia, które potwierdzisz.</p>
      <details>
        <summary>Przykładowe pliki do pobrania</summary>
        <p>
          <a download href="/demo/sickness/akta-demonstracyjne.pdf">
            Dokumenty PDF do odczytu ręcznego
          </a>
          {" · "}
          <a download href="/demo/sickness/pakiet-A.txt">
            Pełny pakiet TXT
          </a>
          {" · "}
          <a download href="/demo/sickness/pakiet-B.txt">
            Pakiet bez ustalenia TXT
          </a>
        </p>
      </details>
      <label>
        Wybierz plik demonstracyjny{" "}
        <input
          type="file"
          accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void read(file);
          }}
        />
      </label>
      <p role="status">{message}</p>
      {pages.map((p) => (
        <details key={p.page} open>
          <summary>Strona {p.page}</summary>
          <label>
            <input
              type="checkbox"
              checked={p.included}
              onChange={(e) => edit(p.page, { included: e.target.checked })}
            />{" "}
            Uwzględnij tę stronę
          </label>
          {p.included && (
            <>
              <details open={p.manual}>
                <summary>Oryginalna strona</summary>
                {p.image ? <PageImage image={p.image} /> : <pre style={{ whiteSpace: "pre-wrap" }}>{p.raw}</pre>}
              </details>
              {p.manual ? (
                <ManualPage fields={p.fields} onChange={(fields) => edit(p.page, { fields })} />
              ) : (
                <>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{p.fact?.text}</pre>
                  <button type="button" onClick={() => edit(p.page, { manual: true })}>
                    Popraw odczyt
                  </button>
                </>
              )}
            </>
          )}
        </details>
      ))}
      {!!pages.length && (
        <p>
          Potwierdź, że wybrane e-ZLA dotyczy wnioskodawczyni tej sprawy i że ustalenia na wybranych stronach
          odpowiadają treści dokumentów.
        </p>
      )}
      {!!pages.length && (
        <button disabled={busy || !pages.some((p) => p.included)} onClick={() => void confirm()}>
          Potwierdzam odczyt i zastępuję dokumenty sprawy
        </button>
      )}
    </section>
  );
}
