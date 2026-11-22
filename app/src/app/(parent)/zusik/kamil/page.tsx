import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import { KamilWorkspace } from "@/features/kamil/workspace";

// Fonts from DESIGN.md: Literata for headings, Inter for interface text.
const literata = Literata({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-serif" });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ZAM · zasiłek za okres ojcowski · Zusik",
  robots: { index: false },
};

export default function KamilPage() {
  return (
    <div className={`${literata.variable} ${inter.variable}`}>
      <KamilWorkspace />
    </div>
  );
}
