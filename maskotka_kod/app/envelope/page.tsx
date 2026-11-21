import type { Metadata } from "next";
import Image from "next/image";
import type { CSSProperties } from "react";
import { SentEnvelope } from "@/components/envelope/SentEnvelope";
import reference from "@/design/envelope/reference.jpg";

export const metadata: Metadata = { title: "Koperta „wysłano”: podgląd animacji" };

/** Moments of the loop for the storyboard, with the brief's step they show. */
const MOMENTS = [
  { at: 0.3, label: "0,3 s · start" },
  { at: 1.0, label: "1,0 s · kartka wchodzi" },
  { at: 1.8, label: "1,8 s · klapa się składa" },
  { at: 2.3, label: "2,3 s · pieczątka opada" },
  { at: 2.7, label: "2,7 s · ptaszek" },
  { at: 3.25, label: "3,25 s · wysłane (4 px w prawo)" },
  { at: 4.5, label: "4,5 s · blednie" },
  { at: 4.85, label: "4,85 s · wraca start" },
] as const;

const SIZES = [96, 182, 320] as const;

/**
 * Where the drawing lands on the reference image (2048 px): the envelope's 170 units are 575.5 px there,
 * so the 182-unit viewBox is 616 px wide; its top left is 6 and 90 units left of and above each envelope.
 */
const OVERLAY = {
  start: { left: "2.87%", top: "25.12%", width: "30.08%" },
  half: { left: "34.92%", top: "25.12%", width: "30.08%" },
  sealed: { left: "67.03%", top: "25.12%", width: "30.08%" },
};

/** For the overlay only: the reference's green envelope, so the shapes can be compared. */
const REFERENCE_COLORS = {
  "--envelope-paper": "var(--color-secondary)",
  "--envelope-line": "var(--color-primary)",
} as CSSProperties;

/** Preview of the envelope animation: on the app's green band, as a storyboard, next to the reference, at sizes. */
export default function EnvelopePreviewPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header>
          <h1 className="text-2xl font-semibold">Koperta „wysłano”</h1>
          <p className="text-slate-600">
            Pętla 5 s: kartka wsuwa się do koperty, klapa się składa, opada zielona pieczątka i rysuje się na niej
            ptaszek, koperta drga „wysłana”, potem wszystko blednie i wraca. Referencja: design/envelope/reference.jpg.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Na zielonym pasie z aplikacji</h2>
          <div className="flex flex-wrap items-end justify-center gap-16 rounded-lg bg-(--color-secondary) px-6 py-12">
            <figure className="flex flex-col items-center gap-3">
              <SentEnvelope title="List zapieczętowany i wysłany" />
              <figcaption className="text-sm text-slate-700">Pętla, 182 px (koperta 170 px)</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <SentEnvelope loop={false} title="List zapieczętowany i wysłany" />
              <figcaption className="text-sm text-slate-700">Raz, zostaje na kadrze końcowym</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <SentEnvelope animated={false} title="List zapieczętowany i wysłany" />
              <figcaption className="text-sm text-slate-700">Kadr końcowy (też przy ograniczonym ruchu)</figcaption>
            </figure>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Klatki</h2>
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-(--color-secondary) p-6 sm:grid-cols-4">
            {MOMENTS.map(({ at, label }) => (
              <figure key={at} className="flex flex-col items-center gap-2">
                <SentEnvelope size={150} at={at} />
                <figcaption className="text-sm text-slate-700">{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Referencja</h2>
          <figure className="flex flex-col gap-2">
            <Image
              src={reference}
              alt="Referencja: kartka nad otwartą kopertą, kartka w połowie, zamknięta koperta z pieczątką"
              className="h-auto w-full rounded-lg ring-1 ring-slate-200"
              sizes="(min-width: 1152px) 1152px, 100vw"
              loading="eager"
            />
            <figcaption className="text-sm text-slate-600">Referencja (kolory z obrazu)</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-200" style={REFERENCE_COLORS}>
              <Image src={reference} alt="" className="h-auto w-full" sizes="(min-width: 1152px) 1152px, 100vw" />
              <div className="absolute opacity-60" style={OVERLAY.start}>
                <SentEnvelope at={0} className="block h-auto w-full" />
              </div>
              <div className="absolute opacity-60" style={OVERLAY.half}>
                <SentEnvelope at={1.15} className="block h-auto w-full" />
              </div>
              <div className="absolute opacity-60" style={OVERLAY.sealed}>
                <SentEnvelope animated={false} className="block h-auto w-full" />
              </div>
            </div>
            <figcaption className="text-sm text-slate-600">
              Nałożenie (komponent 60 % na referencji, w zielonych kolorach referencji)
            </figcaption>
          </figure>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Rozmiary</h2>
          <div className="flex flex-wrap items-end gap-8">
            {SIZES.map((size) => (
              <figure key={size} className="flex flex-col items-center gap-2">
                <SentEnvelope size={size} title="List zapieczętowany i wysłany" />
                <figcaption className="text-sm text-slate-600">{size} px</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
