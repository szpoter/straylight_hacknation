"use client";

import { useEffect, useState, type RefObject } from "react";
import { AlertIcon, Button, CheckIcon, cn } from "@/components/ui";
import { daysLeftLabel, formatLong } from "@/lib/demo/dates";
import type { Plan } from "@/lib/demo/types";
import { planHighlights } from "@/lib/plan/build";
import type { Answers } from "./flow";

/** Kroki „układam plan”. */
function buildingSteps(answers: Answers): Array<{ text: string }> {
  const from = answers.situation === "ciaza" ? "od terminu porodu" : answers.situation === "planuje" ? "na najbliższe miesiące" : "od daty urodzenia";
  return [{ text: `Sprawdzam terminy ${from}…` }, { text: "Dobieram świadczenia i urlopy…" }, { text: "Liczę, co już za Tobą…" }];
}

const STEP_MS = 850;

/**
 * Chwila „układam plan”: linie pojawiają się po kolei (bez maskotki). Około 2,5 s;
 * przy ograniczonym ruchu od razu przechodzi dalej. Tempo do weryfikacji z zespołem.
 */
export function BuildingPlan({ answers, onDone }: { answers: Answers; onDone: () => void }) {
  const steps = buildingSteps(answers);
  const [done, setDone] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      onDone();
      return;
    }
    const timers = steps.map((_, i) => window.setTimeout(() => setDone(i + 1), STEP_MS * (i + 1)));
    timers.push(window.setTimeout(onDone, STEP_MS * steps.length + 400));
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-stack py-10 text-center" aria-live="polite">
      <h1 className="font-serif text-title">Układam Twój plan</h1>
      <ul className="flex w-full max-w-sm flex-col gap-3 text-left">
        {steps.map((s, i) => (
          <li key={s.text} className={cn("flex items-center gap-3 transition-opacity duration-300 motion-reduce:transition-none", i <= done ? "opacity-100" : "opacity-0")}>
            <span
              aria-hidden
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300",
                i < done ? "border-primary bg-primary text-on-primary" : "border-outline",
              )}
            >
              {i < done && <CheckIcon size={14} strokeWidth={3} />}
            </span>
            <span className={cn(i < done ? "text-on-surface" : "text-on-surface-variant")}>{s.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Wynik: plan powstał. Konkretne liczby z planu (ile spraw, co teraz, najbliższy termin),
 * żeby było widać, że coś się zadziało. Przy rodzeństwie — lista planów (osobny dla każdego
 * dziecka). „Zobacz mój plan” dopisuje plany do selektora i otwiera pierwszy.
 */
export function PlanReady({
  plans,
  estimatedDate,
  headingRef,
  onFinish,
  review,
}: {
  plans: Plan[];
  estimatedDate: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onFinish: () => void;
  review: React.ReactNode;
}) {
  const plan = plans[0];
  const many = plans.length > 1;
  // Liczby z całej rodziny: sprawy rodzeństwa sumują się, etapy liczymy z pierwszego planu.
  const all = plans.map((p) => planHighlights(p));
  // Wspólne sprawy rodzeństwa (urlopy, zasiłek) liczymy raz — to jedna sprawa w kilku planach.
  const unique = (pick: (p: Plan) => Plan["stops"]) => new Set(plans.flatMap((p) => pick(p).map((s) => (s.sharedGroup ? s.id : `${p.id}/${s.id}`)))).size;
  const isNow = (p: Plan) => (s: Plan["stops"][number]) => s.state === "aktualna" || ((s.kind === "informacja" || s.kind === "program-zdrowotny") && s.stage === p.stage);
  const h = {
    ...all[0],
    total: unique((p) => p.stops.filter((s) => s.state !== "minelo" && s.kind !== "dzieje-sie-samo")),
    now: unique((p) => p.stops.filter(isNow(p))),
    warnings: unique((p) => p.stops.filter((s) => s.risk)),
  };
  const nearest = all
    .map((x) => x.nearest)
    .filter((s): s is NonNullable<typeof s> => Boolean(s?.due))
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))[0];
  const stats: Array<[string, string]> = [
    [String(h.total), h.total === 1 ? "sprawa w planie" : h.total % 10 >= 2 && h.total % 10 <= 4 && (h.total < 12 || h.total > 14) ? "sprawy w planie" : "spraw w planie"],
    [String(h.now), "do zrobienia teraz"],
    [String(h.stages), h.stages === 1 ? "etap przed Tobą" : "etapy przed Tobą"],
  ];
  return (
    <div className="flex flex-1 flex-col gap-stack pt-6 md:pt-10">
      <div className="flex flex-col items-center gap-4 text-center transition-[opacity,translate] duration-500 starting:translate-y-3 starting:opacity-0 motion-reduce:transition-none">
        <h1 ref={headingRef} tabIndex={-1} className="font-serif text-headline-mobile focus:outline-none md:text-headline">
          {many ? "Wasze plany są gotowe" : "Twój plan jest gotowy"}
        </h1>
        {!many && (
          <p className="text-lead text-on-surface-variant">
            {plan.name} · {plan.keyDateLabel}
          </p>
        )}
      </div>

      {many && (
        <ul className="flex flex-col gap-3">
          {plans.map((p, i) => (
            <li key={p.id} className="flex items-center gap-4 rounded-lg border border-outline bg-background p-4">
              <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-title">
                {p.name.charAt(0)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">{p.name}</span>
                <span className="text-meta text-on-surface-variant">
                  {p.keyDateLabel} · {all[i].total} {all[i].total === 1 ? "sprawa" : "spraw"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="grid grid-cols-3 gap-3">
        {stats.map(([n, label]) => (
          <div key={label} className="flex flex-col items-center justify-center gap-1 rounded-lg border border-outline bg-background p-4 text-center">
            <dt className="order-2 text-meta text-on-surface-variant">{label}</dt>
            <dd className="order-1 font-serif text-headline-mobile text-primary">{n}</dd>
          </div>
        ))}
      </dl>

      {nearest?.due && (
        <div className="rounded-lg bg-tertiary p-gutter-mobile md:p-card">
          <p className="text-meta">Najbliższy termin</p>
          <p className="mt-1 font-serif text-title">{nearest.title}</p>
          <p className="mt-1">
            do {formatLong(nearest.due)} · <span className="font-medium">{daysLeftLabel(nearest.due)}</span>
          </p>
        </div>
      )}

      {(h.warnings > 0 || estimatedDate) && (
        <ul className="flex flex-col gap-2">
          {h.warnings > 0 && (
            <li className="flex items-start gap-2">
              <AlertIcon className="mt-0.5 shrink-0" />
              {h.warnings === 1 ? "1 ostrzeżenie" : `${h.warnings} ostrzeżenia`} — pokażę je przy właściwej sprawie.
            </li>
          )}
          {estimatedDate && (
            <li className="flex items-start gap-2 text-on-surface-variant">
              <AlertIcon className="mt-0.5 shrink-0" />
              Terminy liczę od przybliżonej daty. Popraw ją w Profilu, gdy będziesz znać dokładną.
            </li>
          )}
        </ul>
      )}

      {review}

      <div
        className={cn(
          "sticky bottom-0 -mx-gutter-mobile mt-auto border-t border-outline bg-background px-gutter-mobile pt-3 pb-[max(12px,env(safe-area-inset-bottom))]",
          "md:static md:mx-0 md:flex md:justify-center md:border-0 md:bg-transparent md:p-0",
        )}
      >
        <Button onClick={onFinish} className="w-full md:w-auto md:min-w-72">
          {many ? "Zobacz plany" : "Zobacz mój plan"}
        </Button>
      </div>
    </div>
  );
}
