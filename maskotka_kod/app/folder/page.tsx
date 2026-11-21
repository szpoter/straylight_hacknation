import type { Metadata } from "next";
import Image from "next/image";
import { FolderCards } from "@/components/folder/FolderCards";
import reference from "@/design/folder/reference.jpg";

export const metadata: Metadata = { title: "Teczka z karteczkami: podgląd animacji" };

/** Moments of the loop for the storyboard, with the brief's step they show. */
const MOMENTS = [
  { at: 0.3, label: "0,3 s · oddech" },
  { at: 1.0, label: "1,0 s · klapa się uchyla" },
  { at: 1.6, label: "1,6 s · karteczki wychodzą" },
  { at: 2.0, label: "2,0 s · wachlarz" },
  { at: 2.5, label: "2,5 s · ptaszek" },
  { at: 3.1, label: "3,1 s · pauza, unoszą się" },
  { at: 3.9, label: "3,9 s · wsuwają się" },
  { at: 4.3, label: "4,3 s · klapa się zamyka" },
] as const;

const SIZES = [96, 200, 320] as const;

/**
 * Where the drawing lands on the reference image (2048 px): the folder's 180 units are 801 px there, so the
 * 200-unit viewBox is 890 px wide; its top left is (1059.5, 558) for the open folder and (97.5, 558) for
 * the closed one.
 */
const OVERLAY = {
  open: { left: "51.73%", top: "27.24%", width: "43.46%" },
  closed: { left: "4.76%", top: "27.24%", width: "43.46%" },
};

/** Preview of the folder animation: on the app's green band, as a storyboard, next to the reference, at sizes. */
export default function FolderPreviewPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header>
          <h1 className="text-2xl font-semibold">Teczka z karteczkami</h1>
          <p className="text-slate-600">
            Pętla 4,5 s: teczka oddycha, klapa się uchyla, trzy karteczki wychodzą w wachlarz, na środkowej rysuje
            się ptaszek, potem wszystko wraca na miejsce. Referencja: design/folder/reference.jpg.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Na zielonym pasie z aplikacji</h2>
          <div className="flex flex-wrap items-end justify-center gap-16 rounded-lg bg-(--color-secondary) px-6 py-12">
            <figure className="flex flex-col items-center gap-3">
              <FolderCards size={200} title="Teczka z dokumentami, środkowy odhaczony" />
              <figcaption className="text-sm text-slate-700">Pętla, 200 px (teczka 180 px)</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <FolderCards size={200} loop={false} title="Teczka z dokumentami, środkowy odhaczony" />
              <figcaption className="text-sm text-slate-700">Raz, zostaje na kadrze końcowym</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-3">
              <FolderCards size={200} animated={false} title="Teczka z dokumentami, środkowy odhaczony" />
              <figcaption className="text-sm text-slate-700">Kadr końcowy (też przy ograniczonym ruchu)</figcaption>
            </figure>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Klatki</h2>
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-(--color-secondary) p-6 sm:grid-cols-4">
            {MOMENTS.map(({ at, label }) => (
              <figure key={at} className="flex flex-col items-center gap-2">
                <FolderCards size={160} at={at} />
                <figcaption className="text-sm text-slate-700">{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <Image
              src={reference}
              alt="Referencja: teczka zamknięta i otwarta z trzema karteczkami"
              className="h-auto w-full rounded-lg ring-1 ring-slate-200"
              sizes="(min-width: 768px) 50vw, 100vw"
              loading="eager"
            />
            <figcaption className="text-sm text-slate-600">Referencja (kolory z obrazu)</figcaption>
          </figure>
          <figure className="flex flex-col gap-2">
            <div className="relative overflow-hidden rounded-lg ring-1 ring-slate-200">
              <Image
                src={reference}
                alt=""
                className="h-auto w-full"
                sizes="(min-width: 768px) 50vw, 100vw"
                loading="eager"
              />
              <div className="absolute opacity-60" style={OVERLAY.closed}>
                <FolderCards at={0} className="block h-auto w-full" />
              </div>
              <div className="absolute opacity-60" style={OVERLAY.open}>
                <FolderCards animated={false} className="block h-auto w-full" />
              </div>
            </div>
            <figcaption className="text-sm text-slate-600">Nałożenie (komponent 60 % na referencji)</figcaption>
          </figure>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Rozmiary</h2>
          <div className="flex flex-wrap items-end gap-8">
            {SIZES.map((size) => (
              <figure key={size} className="flex flex-col items-center gap-2">
                <FolderCards size={size} title="Teczka z dokumentami" />
                <figcaption className="text-sm text-slate-600">{size} px</figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
