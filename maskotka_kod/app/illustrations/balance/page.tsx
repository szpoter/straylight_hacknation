import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import reference from "@/design/illustrations/waga.jpg";
import { BalanceScale } from "@/components/illustrations/BalanceScale";
import { BalanceFrames } from "./BalanceDemo";

export const metadata: Metadata = { title: "Ilustracja: waga" };

/*
 * Tokeny z DESIGN.md, te same co w app/src/app/globals.css. W aplikacji są globalne,
 * tu podajemy je stronie podglądu, żeby komponent dało się przenieść bez zmian.
 */
const APP_TOKENS = {
  "--color-primary": "#1a8648",
  "--color-secondary": "#a6d0b8",
  "--color-tertiary": "#fcdcaa",
  "--color-background": "#ffffff",
  "--color-surface": "#f5faf7",
  "--color-on-surface": "#283754",
  "--color-on-surface-variant": "#5e697f",
  "--color-outline": "#d4d7dd",
} as CSSProperties;

const BACKGROUNDS = [
  { token: "background", label: "Tło strony" },
  { token: "surface", label: "Karta" },
  { token: "secondary", label: "Blok i kafel ilustracji" },
];

/** Kadr komponentu (VIEWBOX) wycięty z obrazu 2048 × 2048: x 115–1933, y 269–1812. */
const REFERENCE_CROP: CSSProperties = {
  position: "absolute",
  left: `${(-115 / 1818) * 100}%`,
  top: `${(-269 / 1543) * 100}%`,
  width: `${(2048 / 1818) * 100}%`,
  maxWidth: "none",
  height: "auto",
};

export default function BalancePage() {
  return (
    <main style={APP_TOKENS} className="min-h-screen bg-white px-4 py-10 text-[#283754]">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="flex flex-col gap-2">
          <Link href="/mascot" className="text-sm underline">
            ← Podgląd maskotki
          </Link>
          <h1 className="text-2xl font-semibold">Waga: „Zaplanuj opiekę i policz zasiłek”</h1>
          <p className="text-[#5e697f]">
            SVG z kształtów zmierzonych na design/illustrations/waga.jpg, kolory z tokenów DESIGN.md, ruch z Motion.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Na tłach z DESIGN.md</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {BACKGROUNDS.map(({ token, label }) => (
              <figure
                key={token}
                className="flex flex-col gap-4 rounded-3xl border border-[#d4d7dd] p-6"
                style={{ background: `var(--color-${token})` }}
              >
                <BalanceScale className="w-full" />
                <figcaption className="font-serif text-xl">Zaplanuj opiekę i policz zasiłek</figcaption>
                <p className="text-sm text-[#5e697f]">
                  {label} · {token}
                </p>
              </figure>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Porównanie z referencją (kadr spoczynkowy)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <figure className="flex flex-col gap-2">
              <div className="relative aspect-[1818/1543] overflow-hidden border border-[#d4d7dd]">
                <Image src={reference} alt="Obraz referencyjny wagi" style={REFERENCE_CROP} />
              </div>
              <figcaption className="text-sm">Referencja</figcaption>
            </figure>
            <figure className="flex flex-col gap-2">
              <div className="border border-[#d4d7dd]">
                <BalanceScale time={3} className="block w-full" />
              </div>
              <figcaption className="text-sm">Komponent</figcaption>
            </figure>
            <figure className="flex flex-col gap-2">
              <div className="relative aspect-[1818/1543] overflow-hidden border border-[#d4d7dd]">
                <Image src={reference} alt="" style={REFERENCE_CROP} />
                <BalanceScale time={3} className="absolute inset-0 block w-full opacity-50" />
              </div>
              <figcaption className="text-sm">Nałożone (komponent 50%)</figcaption>
            </figure>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Klatki</h2>
          <BalanceFrames />
        </section>
      </div>
    </main>
  );
}
