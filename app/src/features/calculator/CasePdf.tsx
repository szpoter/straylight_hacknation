"use client";

import { useEffect, useRef, useState } from "react";
import { basisCandidates } from "@/lib/plan/pdf-basis";

export function CasePdf({ onBasis }: { onBasis?: (amount: string) => void }) {
  const operation = useRef<AbortController | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => () => operation.current?.abort(), []);

  async function read(file: File | undefined) {
    operation.current?.abort();
    setPages([]);
    setNotice("");
    if (!file) return;
    const controller = new AbortController();
    operation.current = controller;
    setNotice("Otwieram PDF…");
    try {
      const { readCasePdf } = await import("@/features/chat/read-case-pdf");
      const result = await readCasePdf(file, controller.signal, label => {
        if (!controller.signal.aborted) setNotice(label);
      });
      if (controller.signal.aborted) return;
      setPages(result);
      setNotice(`Odczytano ${result.filter(p => p.trim()).length} z ${result.length} stron. Sprawdź odczyt z oryginałem.`);
    } catch {
      if (!controller.signal.aborted) setNotice("Nie udało się odczytać PDF. Wybierz czytelny plik do 20 MB i 128 stron, bez hasła.");
    }
  }

  const candidates = basisCandidates(pages);
  return <div className="grid min-w-0 gap-3">
    <label className="grid min-w-0 grid-cols-1 gap-1">Odczytaj dokument PDF na tym urządzeniu
      <input type="file" accept=".pdf,application/pdf" className="max-w-full" onChange={event => void read(event.target.files?.[0])} />
    </label>
    <p role="status">{notice}</p>
    {onBasis && pages.length > 0 && (candidates.length ? candidates.map((item, i) =>
      <div key={i}><p>Strona {item.page} · {item.excerpt}</p>
        <button className="underline" type="button" onClick={() => {
          onBasis(item.amount);
          setNotice(`Wpisano podstawę pierwszego rodzica: ${item.amount} zł.`);
        }}>Użyj {item.amount} zł jako podstawy pierwszego rodzica</button></div>
    ) : <p>Nie znaleziono kwoty oznaczonej jako podstawa wymiaru. Sprawdź strony i wpisz podstawę ręcznie w kalkulatorze.</p>)}
    {pages.map((page, i) => <details key={i}><summary>Tekst strony {i + 1}</summary>
      <p className="max-h-64 overflow-auto whitespace-pre-wrap break-words">{page || "Brak czytelnego tekstu."}</p></details>)}
  </div>;
}
