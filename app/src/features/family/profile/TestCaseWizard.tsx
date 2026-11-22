"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowLeftIcon, Button, ButtonLink, CheckIcon, Panel, TextField, cn } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { TEST_FIELDS, type ReadField } from "./data";

const STEPS = ["Wybierz sprawę", "Sprawdź dane", "Podsumowanie"] as const;
type Step = 0 | 1 | 2;

/** „Przetestuj przykładową sprawę”: trzy kroki (ui/MACIEJ.md, element 7). */
export function TestCaseWizard() {
  const router = useRouter();
  const { selectPlan } = usePlan();
  const [step, setStep] = useState<Step>(0);
  const [fields, setFields] = useState<ReadField[] | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const goTo = (s: Step) => {
    setStep(s);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const missing = fields?.some((f) => f.missing && !f.value);
  const reachable = (s: Step) => s === 0 || (s === 1 && fields !== null) || (s === 2 && fields !== null && !missing);

  return (
    <div className="mx-auto flex max-w-column flex-col gap-6 pb-24 md:pb-0">
      {step > 0 && (
        <button type="button" onClick={() => goTo((step - 1) as Step)} className="inline-flex items-center gap-2 self-start underline underline-offset-4 decoration-outline hover:decoration-on-surface">
          <ArrowLeftIcon size={18} /> Wstecz
        </button>
      )}

      {/* Trzy pełne pigułki potrzebują ok. 520 px. Węższy ekran (telefon): pozostałe kroki tylko
          z numerem, podpis widać przy bieżącym (czytnik ekranu nadal czyta wszystkie nazwy). */}
      <nav aria-label="Kroki sprawy testowej">
        <ol className="flex gap-2">
          {STEPS.map((label, i) => {
            const s = i as Step;
            const current = s === step;
            const done = s < step;
            return (
              <li key={label} className={cn("flex-1 max-[540px]:min-w-0", !current && "max-[540px]:flex-none")}>
                <button
                  type="button"
                  disabled={!reachable(s)}
                  aria-current={current ? "step" : undefined}
                  onClick={() => goTo(s)}
                  className={cn(
                    "flex w-full items-center gap-2 max-[540px]:min-w-0 rounded-full border px-3 py-2 text-meta font-medium disabled:cursor-not-allowed disabled:text-on-surface-variant",
                    current ? "border-on-surface bg-on-surface text-on-primary" : "border-outline bg-background",
                  )}
                >
                  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-meta", current ? "bg-background text-on-surface" : done ? "bg-primary text-on-primary" : "bg-surface")}>
                    {done ? <CheckIcon size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("truncate", !current && "max-[540px]:sr-only")}>{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <h1 ref={headingRef} tabIndex={-1} className="font-serif text-headline-mobile focus:outline-none md:text-headline">
        {STEPS[step]}
      </h1>

      {step === 0 && (
        <>
          <Panel className="flex flex-col items-start gap-3">
            <h2 className="font-serif text-title">Przykład Alicji T.</h2>
            <p className="text-on-surface-variant">Przećwicz sprawdzanie pól wniosku na fikcyjnych danych. Jedno pole uzupełnisz samodzielnie.</p>
            <Button onClick={() => {
              setFields(fields ?? TEST_FIELDS.map(field => ({ ...field })));
              goTo(1);
            }}>
              {fields ? "Wróć do danych przykładu" : "Rozpocznij przykład"}
            </Button>
          </Panel>
          <Panel className="flex flex-col items-start gap-3">
            <h2 className="font-serif text-title">Odczyt pliku PDF w czacie</h2>
            <p className="text-on-surface-variant">Wybierz rodzaj dokumentu. W czacie dodasz plik i sprawdzisz odczytane z niego dane.</p>
            <ButtonLink href="/app/kamil" variant="secondary">Odpis aktu urodzenia do wniosku ZAM</ButtonLink>
            <ButtonLink href="/app/chorobowe" variant="secondary">Dokumenty do sprawy chorobowego w ciąży</ButtonLink>
          </Panel>
        </>
      )}
      {step === 1 && fields && <ReviewStep fields={fields} setFields={setFields} onNext={() => goTo(2)} canNext={!missing} />}
      {step === 2 && fields && (
        <ResultStep
          fields={fields}
          onOpen={() => {
            selectPlan("test-alicja");
            router.push("/plan");
          }}
          onAnother={() => {
            setFields(null);
            goTo(0);
          }}
        />
      )}
    </div>
  );
}

function StickyNext({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-x-0 bottom-16 z-30 border-t border-outline bg-background p-gutter-mobile md:static md:border-0 md:bg-transparent md:p-0 md:flex md:justify-end">{children}</div>;
}

function ReviewStep({
  fields,
  setFields,
  onNext,
  canNext,
}: {
  fields: ReadField[];
  setFields: (f: ReadField[]) => void;
  onNext: () => void;
  canNext: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const save = (id: string) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, value: draft.trim(), edited: true } : f)));
    setEditing(null);
  };
  return (
    <>
      <p className="text-on-surface-variant">Sprawdź fikcyjne dane Alicji. Możesz je zmienić na potrzeby tego przykładu.</p>
      <ul className="divide-y divide-outline border-y border-outline">
        {fields.map((f) => {
          const empty = f.missing && !f.value;
          return (
            <li key={f.id} className="flex flex-col gap-2 py-4">
              {editing === f.id ? (
                <form
                  className="flex flex-col gap-3 md:flex-row md:items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    save(f.id);
                  }}
                >
                  <TextField label={f.label} value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1" autoFocus hint={f.id === "wyplata" ? "Np. 81,5% przez cały okres albo 100%, potem 70%" : undefined} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Zapisz</Button>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(null)}>Anuluj</Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
                  <span className="text-meta text-on-surface-variant">{f.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(f.id);
                      setDraft(f.value);
                    }}
                    className="row-span-2 font-medium underline underline-offset-4 decoration-outline hover:decoration-on-surface"
                  >
                    {empty ? "Uzupełnij" : "Zmień"}
                    <span className="sr-only"> {f.label.toLowerCase()}</span>
                  </button>
                  <span className="flex flex-wrap items-center gap-2">
                    {empty ? (
                      <span className="rounded-sm bg-tertiary px-2 py-0.5 text-meta font-medium">Do uzupełnienia</span>
                    ) : (
                      <span className="font-medium">{f.value}</span>
                    )}
                    <span className="text-meta text-on-surface-variant">{f.edited ? "Wpisane przez Ciebie" : "Przykład · " + f.source}</span>
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <StickyNext>
        <Button onClick={onNext} disabled={!canNext} className="w-full md:w-auto">
          Dalej
        </Button>
      </StickyNext>
      {!canNext && <p className="text-meta text-on-surface-variant">Uzupełnij brakujące pole, żeby zobaczyć wynik.</p>}
    </>
  );
}

function ResultStep({ fields, onOpen, onAnother }: { fields: ReadField[]; onOpen: () => void; onAnother: () => void }) {
  return (
    <>
      <p className="text-on-surface-variant">Tak wyglądają dane po Twoim sprawdzeniu przykładowej sprawy. Możesz teraz otworzyć gotowy plan Alicji.</p>
      <dl className="divide-y divide-outline border-y border-outline">
        {fields.map(field => (
          <div key={field.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
            <dt className="text-on-surface-variant">{field.label}</dt>
            <dd className="font-medium">{field.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 md:flex-row">
        <Button onClick={onOpen}>Otwórz przykładowy plan Alicji</Button>
        <Button variant="secondary" onClick={onAnother}>
          Zacznij od nowa
        </Button>
      </div>
    </>
  );
}
