"use client";

import { ButtonLink } from "@/components/ui/AppButton";
import { useDemoSession } from "@/features/auth/demo-session";
import { AUTH_PATHS } from "@/features/auth/flow";

/**
 * Widoki po zalogowaniu wymagają sesji demo z logowania (Bartosz: `features/auth/demo-session.ts`,
 * sessionStorage — trwa do zamknięcia karty, odświeżenie nie wylogowuje). Bez sesji: prośba
 * o zalogowanie, tym samym tekstem co ekran zastępczy logowania.
 */
export function LoginGate({ children }: { children: React.ReactNode }) {
  const session = useDemoSession();
  // Serwer i pierwszy render w przeglądarce nie znają jeszcze sesji.
  if (session === undefined) return <div aria-busy="true" className="min-h-dvh" />;
  if (session === null) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-column flex-col items-center justify-center gap-6 px-gutter-mobile text-center">
        <h1 className="font-serif text-headline-mobile md:text-headline">Plan rodziny Oli</h1>
        <p className="text-lead text-on-surface-variant">
          Otwórz profil rodziny, żeby zobaczyć jej sprawy i terminy.
        </p>
        <div className="flex w-full max-w-sm flex-col gap-3">
          <ButtonLink href={AUTH_PATHS.login}>Zaloguj się</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Wróć na stronę główną
          </ButtonLink>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
