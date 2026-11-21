import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { StartHeaderAside, StartPlaceholder } from "@/features/auth/start-placeholder";

export const metadata: Metadata = {
  title: "Przewodnik Rodzica · wersja demonstracyjna",
  robots: { index: false },
};

// Tymczasowy ekran po zalogowaniu demo. Docelowo pierwsze pytanie onboardingu
// z SPEC-PO-LOGOWANIU.md (zakres Macieja).
export default function StartPage() {
  return (
    <AuthShell aside={<StartHeaderAside />}>
      <StartPlaceholder />
    </AuthShell>
  );
}
