"use client";

import { useMemo } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { ButtonLink } from "@/components/ui/AppButton";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { DEMO_TODAY, formatLong } from "@/lib/demo/dates";
import { computeForm, formFromPlan } from "@/lib/plan/benefit-form";
import { Timeline } from "./Results";
import { pln } from "./ui";

/**
 * Karta kalkulatora na „Moim planie”: wynik dla danych planu (albo zapisanego kalkulatora),
 * najbliższy termin i wejście do pełnego kalkulatora (/kalkulator).
 */
export function Calculator() {
  const { plan, calculator } = usePlan();
  const form = useMemo(() => (calculator ? { ...calculator, date: plan.keyDate ?? calculator.date } : formFromPlan(plan)), [calculator, plan]);
  const { result } = useMemo(() => computeForm(form), [form]);

  if (!plan.keyDate || plan.situation === "planuje") {
    return (
      <section id="kalkulator" aria-labelledby="calc-title" className="scroll-mt-24">
        <Panel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="calc-title" className="font-serif text-title">
              Ile czasu i jaki zasiłek?
            </h2>
            <p className="mt-1 text-on-surface-variant">Policz urlopy i zasiłek obojga rodziców — wystarczy przewidywana data porodu.</p>
          </div>
          <ButtonLink href="/kalkulator" variant="secondary" size="sm">
            Otwórz kalkulator
          </ButtonLink>
        </Panel>
      </section>
    );
  }

  const next = result?.deadlines.find((d) => d.date >= DEMO_TODAY) ?? result?.deadlines[0];
  return (
    <section id="kalkulator" aria-labelledby="calc-title" className="scroll-mt-24">
      <div className="mb-6 flex max-w-prose flex-col gap-2">
        <h2 id="calc-title" className="font-serif text-headline-mobile md:text-headline">
          Ile czasu i jaki zasiłek?
        </h2>
        <p className="text-on-surface-variant">
          {calculator ? (
            <>
              <Tag tone="brand">Zapisane w planie</Tag> <span className="ml-1">Twój podział urlopu i wariant wypłaty.</span>
            </>
          ) : (
            "Przykładowe wynagrodzenia — wpisz swoje w kalkulatorze, a terminy trafią na ścieżkę."
          )}
        </p>
      </div>
      {result && result.ok ? (
        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Panel className="flex flex-col gap-4">
            <div>
              <p className="text-meta text-on-surface-variant">Zasiłek łącznie, brutto · {form.variant === "815" ? "81,5% przez cały okres" : "100%, potem 70%"}</p>
              <p className="font-serif text-headline-mobile">{pln(result.totals.all, false)}</p>
            </div>
            {result.span && (
              <p className="text-meta">
                Z dzieckiem w domu {Math.round(result.span.days / 7)} tyg. — do {formatLong(result.span.to)}
              </p>
            )}
            {next && (
              <p className="rounded-sm bg-surface p-3 text-meta">
                <span className="font-medium">Najbliższy termin: {formatLong(next.date)}</span>
                <br />
                {next.label}
              </p>
            )}
            <ButtonLink href="/kalkulator">{calculator ? "Zmień w kalkulatorze" : "Policz dokładnie"}</ButtonLink>
          </Panel>
          <Timeline result={result} />
        </div>
      ) : (
        <Panel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>Zapisany podział wymaga poprawy — otwórz kalkulator.</p>
          <ButtonLink href="/kalkulator" size="sm">
            Otwórz kalkulator
          </ButtonLink>
        </Panel>
      )}
    </section>
  );
}
