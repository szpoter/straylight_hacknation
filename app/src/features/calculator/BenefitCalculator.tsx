"use client";

import { useMemo, useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Button, TextButton } from "@/components/ui/AppButton";
import { Page, PageTitle } from "@/components/ui/Page";
import { computeForm, formFromPlan, otherVariant, type CalcForm } from "@/lib/plan/benefit-form";
import { useRuleSchedule } from "@/features/family/RuleScheduleContext";
import { Payer } from "./Payer";
import { CasePdf } from "./CasePdf";
import { BENEFIT_PRESETS } from "@/lib/plan/benefit-presets";
import { pln } from "./ui";
import { BasisSection, SituationSection, SplitSection } from "./FormSections";
import { Deadlines, HowCalculated, MonthlyTable, Periods, Problems, Summary, Timeline } from "./Results";

/**
 * Zintegrowany kalkulator zasiłku macierzyńskiego (treść zadania ZUS, s. 13: „wszystkie
 * kalkulatory … w formie zintegrowanego kalkulatora z możliwością wybrania odpowiednich opcji”):
 * urodzenie / adopcja / rodzina zastępcza, oboje rodzice, łączenie z pracą, „Za życiem”,
 * wcześniak, indywidualna podstawa.
 */
export function BenefitCalculator() {
  const schedule = useRuleSchedule();
  const family = usePlan();
  const [draft, setDraft] = useState<CalcForm | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const form = draft ?? family.calculator ?? formFromPlan(family.plan, undefined, schedule);
  const update = (patch: Partial<CalcForm>) => {
    setDraft({ ...form, ...patch });
    setStatus(null);
  };

  const { result, problems } = useMemo(() => computeForm(form, { requireComplete: true, schedule }), [form, schedule]);
  const other = useMemo(() => (result ? computeForm(otherVariant(form), { requireComplete: true, schedule }).result : null), [form, result, schedule]);

  const save = () => {
    family.saveCalculator({ ...form, date: family.plan.keyDate ?? form.date });
    setDraft(null);
    setStatus(`Zapisano w planie „${family.plan.name}”. Terminy wniosków są na ścieżce w „Moim planie”.`);
  };
  const canSave = Boolean(result?.ok) && Boolean(family.plan.keyDate) && form.date === family.plan.keyDate;

  return (
    <Page className="flex flex-col gap-10 pb-section-mobile md:gap-12 md:pb-section">
      <div className="flex max-w-prose flex-col gap-4">
        <PageTitle>Kalkulator zasiłku macierzyńskiego</PageTitle>
        <p className="text-lead text-on-surface-variant">
          Wpisz podstawy wynagrodzenia, aby porównać warianty urlopu rodziny Oli i terminy złożenia wniosków.
        </p>
      </div>

      <details className="rounded-lg border border-outline p-gutter-mobile">
        <summary>Sprawdź przykładową sprawę lub dokument PDF</summary>
        <div className="mt-4 grid grid-cols-1 gap-4">
          <p>Wybór przykładu zastępuje dane formularza na ekranie. Plan rodziny zachowuje zapisane dane.</p>
          {BENEFIT_PRESETS.map(preset => <Button key={preset.id} variant="secondary" className="min-h-12 h-auto! whitespace-normal! py-2" onClick={() => update(preset.form)}>{preset.title}</Button>)}
          <CasePdf onBasis={known => update({ A: { ...form.A, mode: "known", known } })} />
        </div>
      </details>

      {result && (
        <a href="#wynik" className="-mt-4 flex items-center justify-between gap-4 rounded-lg bg-surface px-gutter-mobile py-4 lg:hidden">
          <span className="flex flex-col">
            <span className="text-meta text-on-surface-variant">Łącznie, brutto</span>
            <span className="font-serif text-title">{pln(result.totals.all)}</span>
          </span>
          <span className="text-meta font-medium underline underline-offset-4 decoration-outline">Szczegóły wyniku</span>
        </a>
      )}

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col gap-6 md:gap-8">
          <SituationSection form={form} update={update} problems={problems} />
          <BasisSection form={form} update={update} problems={problems} basisA={result?.basis.A ?? null} basisB={result?.basis.B ?? null} />
          <Payer key={`A-${form.date}-${form.A.title}`} parent="Pierwszy rodzic" date={form.date} title={form.A.title} schedule={schedule} />
          {form.hasB && <Payer key={`B-${form.date}-${form.B.title}`} parent="Drugi rodzic" date={form.date} title={form.B.title} schedule={schedule} />}
          <SplitSection form={form} update={update} />
        </div>

        <aside id="wynik" aria-label="Wynik" className="flex min-w-0 scroll-mt-24 flex-col gap-4 lg:sticky lg:top-24">
          {result ? (
            <>
              <Summary result={result} other={other} form={form} onSwitchVariant={() => update({ variant: form.variant === "815" ? "100-70" : "815" })}>
                <div className="flex flex-col gap-3 empty:hidden">
                  <Button onClick={save} disabled={!canSave}>
                    {family.calculator ? "Zapisz zmiany w planie" : "Zapisz w planie"}
                  </Button>
                  {!canSave && result.ok && family.plan.keyDate && form.date !== family.plan.keyDate && (
                    <p className="text-meta text-on-surface-variant">Data różni się od daty w planie — zapis w planie używa daty z planu. Zmień ją w Profilu albo przywróć datę z planu.</p>
                  )}
                  {family.calculator && (
                    <TextButton
                      className="self-start"
                      onClick={() => {
                        family.clearCalculator();
                        setDraft(null);
                        setStatus("Usunięto zapis kalkulatora z planu.");
                      }}
                    >
                      Usuń zapis z planu
                    </TextButton>
                  )}
                  {status && (
                    <p role="status" className="rounded-sm bg-secondary p-3 text-meta">
                      {status}
                    </p>
                  )}
                </div>
              </Summary>
              <Problems result={result} />
            </>
          ) : (
            <p className="rounded-lg border border-outline p-gutter-mobile text-on-surface-variant md:p-card">
              {[...new Set(problems.map((problem) => problem.text))].join(" ")}
            </p>
          )}
        </aside>
      </div>

      {result && (
        <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6 md:gap-8">
            <Timeline result={result} />
            <Periods result={result} />
          </div>
          <div className="flex min-w-0 flex-col gap-6 md:gap-8">
            <Deadlines result={result} />
            <MonthlyTable result={result} form={form} />
            <HowCalculated result={result} />
          </div>
        </div>
      )}
    </Page>
  );
}
