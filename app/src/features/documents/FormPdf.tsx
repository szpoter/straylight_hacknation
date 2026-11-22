"use client";

import { useEffect, useState } from "react";
import { Button, ButtonAnchor, FileIcon, TextButton } from "@/components/ui";
import type { ApplicationFonts } from "@/lib/forms/application-pdf";
import type { FormDef } from "@/lib/demo/forms";
import { validate, type Values } from "./flow";
import { pdfFilename, renderFormPdf, type PdfOptions } from "./pdf";

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

type Props = PdfOptions & { def: FormDef; values: Values; label?: string };

export function FormPdf({ def, values, recipient, date, correction, label }: Props) {
  if (def.pdf === "none") return null;
  const incomplete = Object.keys(validate(def, values, date)).length > 0;
  if (incomplete && def.pdf === "official") {
    return <p className="text-meta text-on-surface-variant">Uzupełnij wymagane dane, aby pobrać urzędowy druk.</p>;
  }
  const data = JSON.stringify({ values, recipient, date, correction });
  return <PdfDownload key={def.name + data} def={def} data={data} filename={pdfFilename(def, correction)} label={incomplete ? "Pobierz szkic PDF" : label ?? "Pobierz wniosek PDF"} />;
}

function PdfDownload({ def, data, filename, label }: { def: FormDef; data: string; filename: string; label: string }) {
  const [current, setCurrent] = useState<{ url?: string; failed?: boolean }>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    const { values, ...options }: PdfOptions & { values: Values } = JSON.parse(data);
    loadFonts()
      .then((fonts) => renderFormPdf(def, values, options, fonts))
      .then((bytes) => {
        if (cancelled) return;
        url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: "application/pdf" }));
        setCurrent({ url });
      })
      .catch(() => {
        if (!cancelled) setCurrent({ failed: true });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [def, data, attempt]);

  if (current?.failed) {
    return (
      <p role="alert" className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        Nie udało się przygotować PDF.
        <TextButton
          onClick={() => {
            setCurrent(undefined);
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
