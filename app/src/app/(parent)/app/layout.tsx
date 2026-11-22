import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import "../zusik/zusik-globals.css";

const literata = Literata({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-serif" });
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = { title: "Sprawy rodziny Oli · Zusik", robots: { index: false } };

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-zusik-demo className={`${literata.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
