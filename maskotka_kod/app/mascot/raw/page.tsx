import type { Metadata } from "next";
import { Babelek } from "@/components/mascot/Babelek";

export const metadata: Metadata = { title: "Bąbelek: render 1:1" };

/** The mascot alone on the full 2048 × 2048 reference canvas. Screenshotted by scripts/mascot-diff.ts. */
export default function MascotRawPage() {
  return (
    <main data-mascot-raw className="bg-white">
      <Babelek frame="reference" size={2048} className="block" />
    </main>
  );
}
