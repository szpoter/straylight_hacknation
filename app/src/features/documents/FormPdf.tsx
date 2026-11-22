"use client";

import { useEffect, useState } from "react";
import { Button, ButtonAnchor, FileIcon, TextButton } from "@/components/ui";
import { buildApplicationPdf, type ApplicationDoc, type ApplicationFonts } from "@/lib/forms/application-pdf";

/** Czcionki z polskimi znakami, pobierane raz na sesję (te same co w ZAM). */
let fonts: Promise<ApplicationFonts> | null = null;

function loadFonts(): Promise<ApplicationFonts> {
  fonts ??= Promise.all(
    ["/forms/fonts/DejaVuSans.ttf", "/forms/fonts/DejaVuSans-Bold.ttf"].map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`font ${url} ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    }),
  )
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((error) => {
      fonts = null;
      throw error;
    });
  return fonts;
}

type Built = { key: string; url?: string; failed?: boolean };

/**
 * PDF wniosku składany w przeglądarce z wpisanych wartości: przycisk „Pobierz” i podgląd
 * w nowej karcie. Nic nie trafia na serwer — wartości wniosków są w przeglądarce (PlanProvider).
 */
export function FormPdf({ doc, filename, label }: { doc: ApplicationDoc; filename: string; label: string }) {
  const key = JSON.stringify(doc);
  const [built, setBuilt] = useState<Built | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    loadFonts()
      .then((f) => buildApplicationPdf(JSON.parse(key) as ApplicationDoc, f))
      .then((bytes) => {
        if (cancelled) return;
        url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: "application/pdf" }));
        setBuilt({ key, url });
      })
      .catch(() => {
        if (!cancelled) setBuilt({ key, failed: true });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [key, attempt]);

  // Po zmianie wartości stary plik znika od razu, nowy pojawia się po złożeniu.
  const current = built?.key === key ? built : null;

  if (current?.failed) {
    return (
      <p role="alert" className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        Nie udało się przygotować PDF.
        <TextButton
          onClick={() => {
            setBuilt(null);
            setAttempt((n) => n + 1);
          }}
        >
          Spróbuj ponownie
        </TextButton>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6" aria-live="polite">
      {current?.url ? (
        <>
          <ButtonAnchor href={current.url} download={filename} variant="secondary" className="justify-center">
            <FileIcon size={20} /> {label}
          </ButtonAnchor>
          <a href={current.url} target="_blank" rel="noreferrer" className="self-start text-label underline decoration-outline underline-offset-4 hover:decoration-on-surface sm:self-auto">
            Otwórz podgląd w nowej karcie
          </a>
        </>
      ) : (
        <Button variant="secondary" disabled className="justify-center">
          Przygotowuję PDF…
        </Button>
      )}
    </div>
  );
}
