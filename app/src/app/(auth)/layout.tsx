import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";

export const metadata: Metadata = {
  robots: { index: false },
};

// Symulowana ścieżka wejścia: eZUS → login.gov.pl → Aplikacja mObywatel → dane z ZUS.
// Przebieg i teksty według ui/NIKODEM.md, punkt 6.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
