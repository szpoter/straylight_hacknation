import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Babelek } from "@/components/mascot/Babelek";
import reference from "@/design/mascot/base.jpg";

export const metadata: Metadata = { title: "Bąbelek: podgląd maskotki" };

const SIZES = [48, 96, 256] as const;

/** Preview of the mascot: side by side with the reference, as an overlay, and at small sizes. */
export default function MascotPreviewPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header>
          <h1 className="text-2xl font-semibold">Bąbelek</h1>
          <p className="text-slate-600">Komponent SVG obok obrazu referencyjnego (design/mascot/base.jpg).</p>
          <nav className="mt-2 flex gap-4 text-sm">
            <Link href="/mascot/roadmap" className="underline">
              Demo: roadmapa
            </Link>
            <Link href="/mascot/hero" className="underline">
              Demo: hero ze scrollem
            </Link>
            <Link href="/mascot/zusik" className="underline">
              Makieta: stany Zusika
            </Link>
          </nav>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <figure className="flex flex-col gap-2">
            <Babelek frame="reference" title="Bąbelek" className="h-auto w-full rounded-lg ring-1 ring-slate-200" />
            <figcaption className="text-sm text-slate-600">Komponent</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            <Image
              src={reference}
              alt="Referencja: Bąbelek w pozie bazowej"
              className="h-auto w-full rounded-lg ring-1 ring-slate-200"
              sizes="(min-width: 768px) 33vw, 100vw"
              loading="eager"
            />
            <figcaption className="text-sm text-slate-600">Referencja</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
              <Image
                src={reference}
                alt=""
                className="h-auto w-full"
                sizes="(min-width: 768px) 33vw, 100vw"
                loading="eager"
              />
              <Babelek frame="reference" className="absolute inset-0 h-full w-full opacity-50" />
            </div>
            <figcaption className="text-sm text-slate-600">Nałożenie (komponent 50 % na referencji)</figcaption>
          </figure>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Rozmiary</h2>
          <div className="flex flex-wrap items-end gap-8">
            {SIZES.map((size) => (
              <figure key={size} className="flex flex-col items-center gap-2">
                <Babelek size={size} title="Bąbelek" />
                <figcaption className="text-sm text-slate-600">{size} px</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Animacja w spoczynku</h2>
          <p className="text-slate-600">
            Unoszenie, płynne kołysanie ciała, mruganie i rozglądanie się (prop <code>animated</code>).
          </p>
          <div className="flex flex-wrap items-end gap-8">
            <Babelek size={480} title="Bąbelek" animated />
            {SIZES.map((size) => (
              <figure key={size} className="flex flex-col items-center gap-2">
                <Babelek size={size} title="Bąbelek" animated />
                <figcaption className="text-sm text-slate-600">{size} px</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
