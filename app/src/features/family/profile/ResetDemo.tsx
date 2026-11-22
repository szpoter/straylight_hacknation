"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Panel, SectionTitle } from "@/components/ui";
import { endDemoSession } from "@/features/auth/demo-session";
import { usePlan } from "@/features/family/PlanProvider";

/**
 * „Dane demonstracyjne”: wraca do stanu startowego (plany z onboardingu, odhaczenia, wnioski
 * i przerwany onboarding znikają), kończy sesję demo i wraca na stronę główną — pokaz zaczyna
 * się od nowa od logowania. Potwierdzenie w miejscu, bez okna przeglądarki. Dotyczy tylko tej
 * przeglądarki (zapis w localStorage i sessionStorage).
 */
export function ResetDemo() {
  const { resetAll } = usePlan();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    resetAll();
    try {
      window.localStorage.removeItem("zusik.onboarding");
    } catch {
      // Prywatne okno lub zablokowane dane — nic do usunięcia.
    }
    endDemoSession();
    router.push("/");
  };

  return (
    <Panel aria-labelledby="dane-demo">
      <SectionTitle id="dane-demo" className="mb-2">
        Dane demonstracyjne
      </SectionTitle>
      <p className="mb-4 max-w-prose text-on-surface-variant">
        Postęp, dodane plany i wpisane wnioski są zapisane tylko w tej przeglądarce. Możesz zacząć od nowa: usuniemy je, wylogujemy Cię z wersji demo i wrócisz na stronę główną.
      </p>
      {!confirming ? (
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Zacznij od nowa
        </Button>
      ) : (
        <div role="alertdialog" aria-labelledby="dane-demo-pytanie" className="flex flex-col gap-3 rounded-sm bg-tertiary p-4">
          <p id="dane-demo-pytanie" className="font-medium">
            Usunąć postęp, dodane plany i wpisane wnioski z tej przeglądarki i wylogować?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="ink" onClick={reset}>
              Zacznij od nowa
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Zostaw
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
