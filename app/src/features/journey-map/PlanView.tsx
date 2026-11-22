"use client";

import Link from "next/link";
import { usePlan } from "@/features/family/PlanProvider";
import { genitiveName } from "@/features/onboarding/flow";
import type { Plan } from "@/lib/demo/types";
import { Calculator } from "@/features/calculator/Calculator";
import { ButtonLink } from "@/components/ui/AppButton";
import { Page, PageTitle } from "@/components/ui/Page";
import { Tag } from "@/components/ui/Tag";
import { JourneyMap } from "./JourneyMap";

/** Karta „Mój plan”: ścieżka, najbliższa sprawa, kalkulator. Zmiana dziecka przełącza wszystko naraz. */
export function PlanView() {
  const { plan, plans, selectPlan } = usePlan();
  const title = planTitle(plan);
  const family = plan.family;
  const siblings = family ? plans.filter((p) => p.family?.groupId === family.groupId && p.id !== plan.id) : [];
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
        {family && (
          // Rodzeństwo z jednego porodu: osobne plany, wspólne sprawy rodzica w planie pierwszego dziecka.
          <div className="flex flex-col gap-3 rounded-lg border border-outline p-gutter-mobile md:flex-row md:items-center md:justify-between md:p-card">
            <p>
              <span className="font-medium">{family.label === "bliźnięta" ? "Bliźnięta" : "Rodzeństwo"}: </span>
              {family.names.join(" i ")}.{" "}
Urlopy i zasiłek to wspólne sprawy — są w każdym planie i zmieniają się razem.
            </p>
            <div className="flex flex-wrap gap-2">
              {siblings.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectPlan(s.id)}
                  className="min-h-10 rounded-full border border-on-surface px-4 text-meta font-medium hover:bg-surface"
                >
                  Plan {genitiveName(s.name)}
                </button>
              ))}
            </div>
          </div>
        )}
        <JourneyMap />
        {/* Wejście do „Wsparcia” z planu (SPEC-PO-LOGOWANIU: dostępne z każdego miejsca planu). */}
        <p className="text-meta text-on-surface-variant">
          Trudna sytuacja — strata, wcześniak, choroba dziecka?{" "}
          <Link href="/wsparcie" data-tour="support" className="font-medium text-on-surface underline underline-offset-4 decoration-outline hover:decoration-on-surface">
            Zobacz wsparcie
          </Link>
        </p>
      </div>
      <div data-tour="plan-calculator"><Calculator key={`calc-${plan.id}`} /></div>
    </Page>
  );
}

/** Tytuł karty: „Plan dla Oli”, „Plan dla oczekiwanego dziecka”, „Plan „Maluszek””. */
function planTitle(plan: Plan): string {
  if (plan.kind === "test" || plan.kind === "przyklad") return plan.name;
  const fixed: Record<string, string> = {
    "Oczekiwane dziecko": "Plan dla oczekiwanego dziecka",
    "Oczekiwane bliźnięta": "Plan dla oczekiwanych bliźniąt",
    "Oczekiwane dzieci": "Plan dla oczekiwanych dzieci",
    "Plan na rodzicielstwo": "Plan na rodzicielstwo",
    Dziecko: "Plan dla dziecka",
  };
  if (fixed[plan.name]) return fixed[plan.name];
  const numbered = plan.name.match(/^Dziecko (\d+)$/);
  if (numbered) return `Plan dla dziecka ${numbered[1]}`;
  // Imiona (dziecko urodzone, adopcja) odmieniamy; własny podpis planu w ciąży zostawiamy w cudzysłowie.
  if (plan.situation === "ciaza") return `Plan „${plan.name}”`;
  return `Plan dla ${genitiveName(plan.name)}`;
}
