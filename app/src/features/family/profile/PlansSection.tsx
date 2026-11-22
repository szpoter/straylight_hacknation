"use client";

import { useState } from "react";
import { Button, ButtonLink, Panel, SectionTitle } from "@/components/ui";
import { formatLong } from "@/lib/demo/dates";
import { DEFAULT_PLAN_ID } from "@/lib/demo/fixtures";
import { SCENARIO_PLANS, scenarioOf } from "@/lib/demo/scenarios";
import type { Plan } from "@/lib/demo/types";
import { useDemoSession } from "@/features/auth/demo-session";
import { childName } from "@/features/family/family-name";
import { usePlan } from "@/features/family/PlanProvider";
import { genitiveName } from "@/features/onboarding/flow";

/**
 * Dzieci (i ciąże) tej rodziny z przyciskiem do planu każdego; dodanie kolejnego dziecka.
 * Dzieci dodane przez rodzica można usunąć; gotowych scenariuszy nie.
 */
export function PlansSection() {
  const family = useDemoSession()?.family;
  const { plan, familyPlans, selectPlan } = usePlan();
  if (!family) return null;
  const single = familyPlans.length === 1;
  return (
    <Panel aria-labelledby="dziecko">
      <SectionTitle id="dziecko">{single ? childName(familyPlans[0]) : "Dzieci"}</SectionTitle>
      <ul className="my-3 flex flex-col gap-1">
        {familyPlans.map((c) => (
          <li key={c.id} className="flex flex-col gap-2">
            <span>
              {!single && <span className="font-medium">{childName(c)} · </span>}
              {c.id === DEFAULT_PLAN_ID ? <BirthDate iso={family.birthDate} short={!single} /> : dateLine(c, !single)}
              {!SCENARIO_PLANS.some((p) => p.id === c.id) && <RemoveChild plan={c} />}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3">
        {familyPlans.map((c) => (
          <ButtonLink key={c.id} href="/plan" variant="secondary" onClick={() => selectPlan(c.id)}>
            {c.id === DEFAULT_PLAN_ID ? "Otwórz plan Oli" : single ? "Otwórz plan" : `Otwórz plan ${genitiveName(c.name)}`}
          </ButtonLink>
        ))}
        <ButtonLink href={`/start?rodzina=${encodeURIComponent(scenarioOf(plan))}`} variant="secondary">
          Dodaj dziecko albo ciążę
        </ButtonLink>
      </div>
    </Panel>
  );
}

/** „Usuń” z potwierdzeniem w miejscu (bez okna przeglądarki), jak „Zacznij od nowa” w Profilu. */
function RemoveChild({ plan }: { plan: Plan }) {
  const { removePlan } = usePlan();
  const [confirming, setConfirming] = useState(false);
  if (!confirming) {
    return (
      <Button variant="quiet" size="sm" className="ml-3 align-baseline" onClick={() => setConfirming(true)} aria-label={`Usuń plan „${plan.name}”`}>
        Usuń
      </Button>
    );
  }
  return (
    <span role="alertdialog" aria-labelledby={`usun-${plan.id}`} className="mt-2 flex flex-col gap-3 rounded-sm bg-tertiary p-4">
      <span id={`usun-${plan.id}`} className="font-medium">
        Usunąć plan „{plan.name}”? Znikną odhaczenia i wpisane wnioski z tego planu.
        {plan.family ? " Wspólne sprawy rodzeństwa (urlopy, zasiłek) zostaną w pozostałych planach." : ""}
      </span>
      <span className="flex flex-wrap gap-3">
        <Button variant="ink" size="sm" onClick={() => removePlan(plan.id)}>
          Usuń plan
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setConfirming(false)}>
          Zostaw
        </Button>
      </span>
    </span>
  );
}

/** „Data urodzenia: 10 listopada 2026”, a na liście kilku dzieci krócej: „ur. 10 listopada 2026”. */
function BirthDate({ iso, short }: { iso: string; short: boolean }) {
  return <>{short ? "ur. " : "Data urodzenia: "}<time dateTime={iso}>{formatLong(iso)}</time></>;
}

function dateLine(plan: Plan, short: boolean) {
  if (plan.keyDate && (plan.situation === "urodzone" || plan.situation === undefined)) return <BirthDate iso={plan.keyDate} short={short} />;
  return plan.keyDateLabel;
}
