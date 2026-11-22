"use client";

import { useMemo, useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Button, TextButton } from "@/components/ui/AppButton";
import { cn } from "@/components/ui/cn";
import { Page, PageTitle } from "@/components/ui/Page";
import { computeForm, formFromPlan, otherVariant, type CalcForm } from "@/lib/plan/benefit-form";
import { BENEFIT_PRESETS } from "@/lib/plan/benefit-presets";
import { pln } from "./ui";
import { BasisSection, SituationSection, SplitSection } from "./FormSections";
import { Deadlines, HowCalculated, MonthlyTable, Periods, PresetCheckList, Problems, Summary, Timeline } from "./Results";

/**
 * Zintegrowany kalkulator zasiłku macierzyńskiego (treść zadania ZUS, s. 13: „wszystkie
 * kalkulatory … w formie zintegrowanego kalkulatora z możliwością wybrania odpowiednich opcji”):
 * urodzenie / adopcja / rodzina zastępcza, oboje rodzice, łączenie z pracą, „Za życiem”,
 * wcześniak, indywidualna podstawa i przykładowe sprawy z zestawu ZUS.
 */
export function BenefitCalculator() {
  const { plan, calculator, saveCalculator, clearCalculator } = usePlan();
  const [draft, setDraft] = useState<CalcForm | null>(null);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const form = draft ?? calculator ?? formFromPlan(plan);
  const preset = BENEFIT_PRESETS.find((p) => p.id === presetId) ?? null;
  const update = (patch: Partial<CalcForm>) => {
    setDraft({ ...form, ...patch });
    setStatus(null);
  };

  const { result, problems } = useMemo(() => computeForm(form), [form]);
  const other = useMemo(() => (result ? computeForm(otherVariant(form)).result : null), [form, result]);

  const loadPreset = (id: string) => {
    const p = BENEFIT_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setDraft(p.form);
    setStatus(null);
  };
  const loadPlan = () => {
    setPresetId(null);
    setDraft(formFromPlan(plan));
    setStatus(null);
  };
  const save = () => {
    saveCalculator({ ...form, date: plan.keyDate ?? form.date });
    setDraft(null);
    setStatus(`Zapisano w planie „${plan.name}”. Terminy wniosków są na ścieżce w „Moim planie”.`);
  };
  const canSave = Boolean(result?.ok) && !presetId && Boolean(plan.keyDate) && form.date === plan.keyDate;

  return (
    <Page className="flex flex-col gap-10 pb-section-mobile md:gap-12 md:pb-section">
      <div className="flex max-w-prose flex-col gap-4">
        <PageTitle>Kalkulator zasiłku macierzyńskiego</PageTitle>
        <p className="text-lead text-on-surface-variant">
          Ile czasu i ile pieniędzy — dla Ciebie i drugiego rodzica. Liczymy jak ZUS: z Twojej podstawy, dzień po dniu, z terminami wniosków.
        </p>
      </div>

      <div className="flex flex-col gap-3" data-tour="calc-start">
        <p className="text-label font-medium">Zacznij od</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={!presetId} onClick={loadPlan}>
            Mój plan: {plan.name}
          </Chip>
          {BENEFIT_PRESETS.map((p) => (
            <Chip key={p.id} active={presetId === p.id} onClick={() => loadPreset(p.id)}>
              Sprawa ZUS: {p.title}
            </Chip>
          ))}
        </div>
      </div>

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
          <div data-tour="calc-situation"><SituationSection form={form} update={update} problems={problems} /></div>
          <div data-tour="calc-basis"><BasisSection form={form} update={update} problems={problems} basisA={result?.basis.A ?? null} basisB={result?.basis.B ?? null} /></div>
          <div data-tour="calc-split"><SplitSection form={form} update={update} /></div>
        </div>

        <aside id="wynik" aria-label="Wynik" data-tour="calc-result" className="flex min-w-0 scroll-mt-24 flex-col gap-4 lg:sticky lg:top-24">
          {result ? (
            <>
              <Summary result={result} other={other} form={form} onSwitchVariant={() => update({ variant: form.variant === "815" ? "100-70" : "815" })}>
                <div className="flex flex-col gap-3 empty:hidden">
                  {!presetId && (
                    <Button onClick={save} disabled={!canSave}>
                      {calculator ? "Zapisz zmiany w planie" : "Zapisz w planie"}
                    </Button>
                  )}
                  {!presetId && !canSave && result.ok && plan.keyDate && form.date !== plan.keyDate && (
                    <p className="text-meta text-on-surface-variant">Data różni się od daty w planie — zapis w planie używa daty z planu. Zmień ją w Profilu albo wróć do „Mój plan”.</p>
                  )}
                  {calculator && !presetId && (
                    <TextButton
                      className="self-start"
                      onClick={() => {
                        clearCalculator();
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
              {preset && <PresetCheckList preset={preset} result={result} />}
            </>
          ) : (
            <p className="rounded-lg border border-outline p-gutter-mobile text-on-surface-variant md:p-card">Podaj datę, żeby zobaczyć wynik.</p>
          )}
        </aside>
      </div>

      {result && (
        <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6 md:gap-8">
            <div data-tour="calc-timeline"><Timeline result={result} /></div>
            <Periods result={result} />
          </div>
          <div className="flex min-w-0 flex-col gap-6 md:gap-8">
            <div data-tour="calc-deadlines"><Deadlines result={result} /></div>
            <MonthlyTable result={result} form={form} />
            <div data-tour="calc-how"><HowCalculated result={result} /></div>
          </div>
        </div>
      )}
    </Page>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("min-h-10 rounded-full border px-4 text-left text-meta font-medium transition-colors duration-150", active ? "border-on-surface bg-on-surface text-on-primary" : "border-outline bg-background hover:bg-surface")}
    >
      {children}
    </button>
  );
}
