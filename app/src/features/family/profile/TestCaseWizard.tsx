"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AiTag, ArrowLeftIcon, Button, CheckIcon, FileIcon, Panel, TextField, UploadIcon, cn } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { TEST_FIELDS, type ReadField } from "./data";

const STEPS = ["Wgraj PDF", "Sprawdź dane", "Wynik"] as const;
type Step = 0 | 1 | 2;

/** „Przetestuj przykładową sprawę”: trzy kroki (ui/MACIEJ.md, element 7). */
export function TestCaseWizard() {
  const router = useRouter();
  const { selectPlan } = usePlan();
  const [step, setStep] = useState<Step>(0);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<ReadField[] | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const goTo = (s: Step) => {
    setStep(s);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const read = (f: File) => {
    setFile(f);
    setPending(null);
    setFields(null);
    setLoading(true);
    // TODO(backend): odczyt OCR (lib/ocr) zamiast symulacji.
    timer.current = setTimeout(() => {
      setFields(TEST_FIELDS.map((x) => ({ ...x })));
      setLoading(false);
      goTo(1);
    }, 1500);
  };

  const choose = (f: File | undefined) => {
    if (!f) return;
    if (f.type && f.type !== "application/pdf") return;
    if (file && fields) setPending(f);
    else read(f);
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

      <nav aria-label="Kroki sprawy testowej">
        <ol className="flex gap-2">
          {STEPS.map((label, i) => {
            const s = i as Step;
            const current = s === step;
            const done = s < step;
            return (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  disabled={!reachable(s)}
                  aria-current={current ? "step" : undefined}
                  onClick={() => goTo(s)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-full border px-3 py-2 text-meta font-medium disabled:cursor-not-allowed disabled:text-on-surface-variant",
                    current ? "border-on-surface bg-on-surface text-on-primary" : "border-outline bg-surface",
                  )}
                >
                  <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-meta", current ? "bg-surface text-on-surface" : done ? "bg-primary text-on-primary" : "bg-background")}>
                    {done ? <CheckIcon size={12} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <h1 ref={headingRef} tabIndex={-1} className="font-serif text-headline-mobile focus:outline-none md:text-headline">
        {STEPS[step]}
      </h1>

      {step === 0 && <UploadStep file={file} loading={loading} pending={pending} onChoose={choose} onConfirm={() => pending && read(pending)} onCancel={() => setPending(null)} onNext={fields ? () => goTo(1) : undefined} />}
      {step === 1 && fields && <ReviewStep fields={fields} setFields={setFields} onNext={() => goTo(2)} canNext={!missing} />}
      {step === 2 && fields && (
        <ResultStep
          fields={fields}
          onOpen={() => {
            selectPlan("test-alicja");
            router.push("/plan");
          }}
          onAnother={() => {
            setFile(null);
            setFields(null);
            goTo(0);
          }}
        />
      )}
    </div>
  );
}

function StickyNext({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-x-0 bottom-16 z-30 border-t border-outline bg-surface p-gutter-mobile md:static md:border-0 md:bg-transparent md:p-0 md:flex md:justify-end">{children}</div>;
}

function UploadStep({
  file,
  loading,
  pending,
  onChoose,
  onConfirm,
  onCancel,
  onNext,
}: {
  file: File | null;
  loading: boolean;
  pending: File | null;
  onChoose: (f: File | undefined) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onNext?: () => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <>
      <p className="text-lead text-on-surface-variant">Wgraj dokumenty sprawy w PDF (np. ZAM, Z-3, decyzję ZUS). Odczytamy dane i policzymy okres i kwotę.</p>
      {loading ? (
        <Panel aria-live="polite" className="flex items-center gap-3">
          <FileIcon className="shrink-0" />
          <span>Wczytujemy dokumenty…</span>
        </Panel>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            onChoose(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center has-focus-visible:outline-2 has-focus-visible:outline-on-surface",
            over ? "border-primary bg-background" : "border-on-surface-variant bg-surface",
          )}
        >
          <UploadIcon size={28} />
          <span className="font-medium">Wybierz plik PDF albo przeciągnij go tutaj</span>
          <span className="text-meta text-on-surface-variant">{file ? `Wczytany plik: ${file.name}` : "Tylko PDF. Plik zostaje w demo i nie jest udostępniany."}</span>
          <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => { onChoose(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      )}
      {pending && (
        <Panel role="alertdialog" aria-label="Podmienić plik?" className="flex flex-col gap-3 bg-background">
          <p>
            Podmienić „{file?.name}” na „{pending.name}”? Twoje poprawki odczytanych danych zostaną utracone.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onConfirm}>Podmień plik</Button>
            <Button variant="secondary" onClick={onCancel}>
              Zostaw obecny
            </Button>
          </div>
        </Panel>
      )}
      {onNext && !loading && !pending && (
        <StickyNext>
          <Button onClick={onNext} className="w-full md:w-auto">
            Dalej
          </Button>
        </StickyNext>
      )}
    </>
  );
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
      <p className="text-on-surface-variant">Sprawdź dane odczytane z dokumentów. Każde pole możesz poprawić przed wyliczeniem.</p>
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
                      <span className="rounded-sm bg-tertiary px-2 py-0.5 text-meta font-medium">Nie odczytaliśmy tej wartości</span>
                    ) : (
                      <span className="font-medium">{f.value}</span>
                    )}
                    <span className="text-meta text-on-surface-variant">· {f.source}</span>
                    {!empty && (f.edited ? <span className="text-meta text-on-surface-variant">· poprawione przez Ciebie</span> : <AiTag />)}
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
  const value = (id: string) => fields.find((f) => f.id === id)?.value ?? "";
  // TODO(backend): wynik z lib/rules i porównanie z decyzją w aktach sprawy.
  const steps = [
    { title: "Ubezpieczenie", text: `${value("tytul")} · chorobowe obowiązkowe, ciągłe od 1 marca 2021` },
    { title: "Prawo do świadczenia", text: "Przysługuje zasiłek macierzyński · okres wyczekiwania spełniony" },
    { title: "Okres i kwota", text: `Urlop macierzyński 20 tygodni od ${value("porod")} · podstawa ${value("podstawa")} · ${value("wyplata") || "sposób wypłaty do ustalenia"}` },
  ];
  return (
    <>
      <div role="status" className="flex items-center gap-3 rounded-lg bg-secondary p-card">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <CheckIcon size={18} strokeWidth={2.5} />
        </span>
        <div>
          <p className="font-serif text-title">Zgodne z decyzją ZUS</p>
          <p className="text-meta">Sprawa testowa · Alicja T.</p>
        </div>
      </div>
      <ol className="flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={s.title}>
            <Panel as="div" className="flex gap-4">
              <span className="font-serif text-title text-on-surface-variant">{i + 1}</span>
              <div>
                <h2 className="font-sans text-label font-medium">{s.title}</h2>
                <p className="text-on-surface-variant">{s.text}</p>
              </div>
            </Panel>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-3 md:flex-row">
        <Button onClick={onOpen}>Otwórz jako plan</Button>
        <Button variant="secondary" onClick={onAnother}>
          Wczytaj inną sprawę
        </Button>
      </div>
    </>
  );
}
