"use client";

import { usePlan } from "@/features/family/PlanProvider";
import { Calculator } from "@/features/calculator/Calculator";
import { ButtonLink } from "@/components/ui/AppButton";
import { Page, PageTitle } from "@/components/ui/Page";
import { Tag } from "@/components/ui/Tag";
import { JourneyMap } from "./JourneyMap";

/** Karta „Mój plan”: ścieżka, najbliższa sprawa, kalkulator. Zmiana dziecka przełącza wszystko naraz. */
export function PlanView() {
  const { plan } = usePlan();
  const title = plan.kind === "rejestr" || plan.kind === "planowane" ? `Plan dla ${genitive(plan.name)}` : plan.name;
  return (
    <Page className="flex flex-col gap-section-mobile pb-section-mobile md:gap-section md:pb-section">
      <div className="flex flex-col gap-6" key={plan.id}>
        {plan.kind === "przyklad" && (
          <div className="flex flex-col gap-3 rounded-lg bg-secondary p-gutter-mobile md:flex-row md:items-center md:justify-between md:p-card">
            <p>
              <Tag tone="accent">Przykład</Tag> <span className="ml-2">To plan przykładowy. Nic nie zapisujemy w Twoim profilu.</span>
            </p>
            <ButtonLink href="/start" variant="ink" size="sm">
              Dopasuj plan do siebie
            </ButtonLink>
          </div>
        )}
        {plan.kind === "test" && (
          <p className="flex items-center gap-2 text-on-surface-variant">
            <Tag tone="accent">Test</Tag> Sprawa testowa — wszystkie pola można edytować, bez łączenia z Twoimi danymi.
          </p>
        )}
        <PageTitle>{title}</PageTitle>
        <JourneyMap />
      </div>
      <Calculator key={`calc-${plan.id}`} />
    </Page>
  );
}

function genitive(name: string): string {
  if (name === "Oczekiwane dziecko") return "oczekiwanego dziecka";
  if (/la$/.test(name)) return name.replace(/a$/, "i"); // Ola → Oli
  if (/ja$/.test(name)) return name.replace(/ja$/, "i"); // Maja → Mai
  if (/a$/.test(name)) return name.replace(/a$/, "y");
  return name;
}
