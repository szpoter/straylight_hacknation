import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";

export const metadata: Metadata = {
  robots: { index: false },
};

// Krój ekranów eZUS i login.gov.pl.
const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-gov",
  display: "swap",
});

// Symulowana ścieżka wejścia: eZUS → login.gov.pl → Aplikacja mObywatel → dane z ZUS.
// Przebieg według ui/NIKODEM.md, punkt 6, wygląd ekranów jak na zrzutach eZUS i login.gov.pl.
// Każdy ekran sam wybiera ramę (AuthShell albo GovShell), obie z paskiem „Wersja demonstracyjna”.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={openSans.variable}>{children}</div>;
}
