import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import { ZusikWorkspace } from "@/features/chat/workspace";
import "./zusik-globals.css";

// Fonts from DESIGN.md: Literata for headings, Inter for interface text.
const literata = Literata({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-serif" });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Wniosek o urlop rodzicielski · Zusik",
  robots: { index: false },
};

export default function ZusikPage() {
  return (
    <main className={`${literata.variable} ${inter.variable}`}>
      <ZusikWorkspace />
    </main>
  );
}
