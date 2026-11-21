import type { Metadata, Viewport } from "next";
import { Inter, Literata } from "next/font/google";
import "./globals.css";

// Literata (nagłówki) i Inter (interfejs) według DESIGN.md. Oba mają polskie znaki i cyrylicę.
const literata = Literata({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400"],
  variable: "--font-literata",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zusik",
  description: "Zusik — przewodnik rodzica",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={`${literata.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
