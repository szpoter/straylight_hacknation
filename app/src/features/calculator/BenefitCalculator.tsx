"use client";

import { useMemo, useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Button, TextButton } from "@/components/ui/AppButton";
import { cn } from "@/components/ui/cn";
import { Page, PageTitle } from "@/components/ui/Page";
import { blankCalculatorForm, computeForm, formFromPlan, otherVariant, type CalcForm } from "@/lib/plan/benefit-form";
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
  const family = usePlan();
  return <BenefitCalculatorForm family={family} />;
}

type CalculatorFamily = Pick<ReturnType<typeof usePlan>, "plan" | "calculator" | "saveCalculator" | "clearCalculator">;

export function BenefitCalculatorForm({ family }: { family?: CalculatorFamily }) {
  const fromChat = !family;
  const [draft, setDraft] = useState<CalcForm | null>(() => fromChat ? blankCalculatorForm() : null);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const form = draft ?? (family ? family.calculator ?? formFromPlan(family.plan) : blankCalculatorForm());
  const preset = BENEFIT_PRESETS.find((p) => p.id === presetId) ?? null;
  const update = (patch: Partial<CalcForm>) => {
    setDraft({ ...form, ...patch });
    setStatus(null);
  };

  const { result, problems } = useMemo(() => computeForm(form, { requireComplete: fromChat }), [form, fromChat]);
  const other = useMemo(() => (result ? computeForm(otherVariant(form), { requireComplete: fromChat }).result : null), [form, result, fromChat]);

  const loadPreset = (id: string) => {
    const p = BENEFIT_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setDraft(p.form);
    setStatus(null);
  };
  const loadPlan = () => {
    setPresetId(null);
    if (family) setDraft(formFromPlan(family.plan));
    setStatus(null);
  };
  const save = () => {
    if (!family) return;
    family.saveCalculator({ ...form, date: family.plan.keyDate ?? form.date });
    setDraft(null);
    setStatus(`Zapisano w planie „${family.plan.name}”. Terminy wniosków są na ścieżce w „Moim planie”.`);
  };
  const canSave = Boolean(result?.ok) && !presetId && Boolean(family?.plan.keyDate) && form.date === family?.plan.keyDate;

  return (
    <Page className="flex flex-col gap-10 pb-section-mobile md:gap-12 md:pb-section">
      <div className="flex max-w-prose flex-col gap-4">
        <PageTitle>Kalkulator zasiłku macierzyńskiego</PageTitle>
        <p className="text-lead text-on-surface-variant">
          {fromChat
            ? "Ręczna symulacja dla Twojej sprawy. Wpisz kwoty i daty z dokumentów oraz wybierz założenia do obliczeń."
            : "Ile czasu i ile pieniędzy — dla Ciebie i drugiego rodzica. Liczymy jak ZUS: z Twojej podstawy, dzień po dniu, z terminami wniosków."}
        </p>
      </div>

      {family && (
        <div className="flex flex-col gap-3">
          <p className="text-label font-medium">Zacznij od</p>
          <div className="flex flex-wrap gap-2">
            <Chip active={!presetId} onClick={loadPlan}>
              Mój plan: {family.plan.name}
            </Chip>
            {BENEFIT_PRESETS.map((p) => (
              <Chip key={p.id} active={presetId === p.id} onClick={() => loadPreset(p.id)}>
                Sprawa ZUS: {p.title}
              </Chip>
            ))}
          </div>
        </div>
      )}

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
          <SplitSection form={form} update={update} />
        </div>

        <aside id="wynik" aria-label="Wynik" className="flex min-w-0 scroll-mt-24 flex-col gap-4 lg:sticky lg:top-24">
          {result ? (
            <>
              <Summary result={result} other={other} form={form} onSwitchVariant={() => update({ variant: form.variant === "815" ? "100-70" : "815" })}>
                <div className="flex flex-col gap-3 empty:hidden">
                  {family && !presetId && (
                    <Button onClick={save} disabled={!canSave}>
                      {family.calculator ? "Zapisz zmiany w planie" : "Zapisz w planie"}
                    </Button>
                  )}
                  {family && !presetId && !canSave && result.ok && family.plan.keyDate && form.date !== family.plan.keyDate && (
                    <p className="text-meta text-on-surface-variant">Data różni się od daty w planie — zapis w planie używa daty z planu. Zmień ją w Profilu albo wróć do „Mój plan”.</p>
                  )}
                  {family && family.calculator && !presetId && (
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
              {preset && <PresetCheckList preset={preset} result={result} />}
            </>
          ) : (
            <p className="rounded-lg border border-outline p-gutter-mobile text-on-surface-variant md:p-card">
              {fromChat ? problems.map((problem) => problem.text).join(" ") : "Podaj datę, żeby zobaczyć wynik."}
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
