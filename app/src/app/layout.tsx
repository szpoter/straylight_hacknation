import type { Metadata, Viewport } from "next";
import { Domine, Inter } from "next/font/google";
import "./globals.css";

// Kroje z DESIGN.md: Domine (szeryf, nagłówki) i Inter (interfejs). Oba z polskimi znakami.
const domine = Domine({
  subsets: ["latin", "latin-ext"],
  variable: "--font-domine",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Przewodnik Rodzica · rodzina Oli",
  description:
    "Plan rodziny Oli. Sprawy, dokumenty i terminy rodziców w jednym miejscu.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${domine.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
