"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SpeechBubble, Zusik, ZusikSays } from "@/components/mascot/Zusik";
import {
  Button,
  ChevronLeftIcon,
  ChoiceGroup,
  DateField,
  Disclosure,
  ProgressBar,
  SummaryList,
  Tag,
  TextButton,
  TextField,
  TextLink,
  cn,
  parseDateParts,
  type DateParts,
} from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { PARENT_PROFILE } from "@/lib/demo/fixtures";
import {
  CHILD_COUNTS,
  DATE_STEPS,
  JOB_CHANGE,
  LATER,
  OPTIONAL_STEPS,
  ROLES,
  SITUATIONS,
  nextStep,
  planReadyText,
  prevStep,
  progress,
  questionFor,
  sanitize,
  targetPlanId,
  warningCount,
  type Answers,
  type StepId,
} from "./flow";
import { clearSaved, loadSaved, save } from "./storage";
import { summaryRows, type SummaryRow } from "./summary";

type Screen = StepId | "start";

const EMPTY_DATE: DateParts = { day: "", month: "", year: "" };

function isoToParts(iso: string | undefined): DateParts {
  if (!iso || iso === LATER) return EMPTY_DATE;
  const [year, month, day] = iso.split("-");
  return { day: String(Number(day)), month: String(Number(month)), year };
}

export function Onboarding() {
  const router = useRouter();
  const { selectPlan } = usePlan();
  const [screen, setScreen] = useState<Screen>("start");
  const [answers, setAnswers] = useState<Answers>({});
  /** „Zmień” z podsumowania: po „Dalej” wracamy do podsumowania. */
  const [returnToSummary, setReturnToSummary] = useState(false);
  const [dateParts, setDateParts] = useState<DateParts>(EMPTY_DATE);
  const [dateError, setDateError] = useState<string>();
  const [nameDraft, setNameDraft] = useState("");
  const [showWhy, setShowWhy] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const loaded = useRef(false);

  // Wznowienie przerwanej rozmowy od ostatniego pytania.
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      /* eslint-disable react-hooks/set-state-in-effect -- odczyt po hydratacji */
      setAnswers(saved.answers);
      enter(saved.screen, saved.answers);
      setReturnToSummary(saved.returnToSummary);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) save({ screen, answers, returnToSummary });
  }, [screen, answers, returnToSummary]);

  // Po zmianie ekranu fokus trafia na pytanie.
  // TODO(motion) „Dymki i kolejne pytania” — zmiana dymka i kontrolek (design/motion.md, dostarcza zespół).
  useEffect(() => {
    if (screen !== "start" && loaded.current) headingRef.current?.focus();
  }, [screen]);

  function enter(next: Screen, current: Answers) {
    setScreen(next);
    setShowWhy(false);
    setDateError(undefined);
    if (next !== "start" && DATE_STEPS.includes(next)) setDateParts(isoToParts(current[next as keyof Answers] as string | undefined));
    if (next === "planName") setNameDraft(current.planName ?? "");
  }

  function update(patch: Partial<Answers>): Answers {
    const next = sanitize({ ...answers, ...patch });
    setAnswers(next);
    return next;
  }

  function advance(current: Answers) {
    if (screen === "start") return;
    if (returnToSummary) {
      // Zmiana mogła dodać nowe pytanie (np. datę po zmianie sytuacji) — wtedy idziemy dalej po kolei.
      const following = nextStep(screen, current);
      const missing = DATE_STEPS.includes(following) && current[following as keyof Answers] === undefined;
      const roleMissing = following === "role" && !current.role;
      if (!missing && !roleMissing) {
        setReturnToSummary(false);
        enter("summary", current);
        return;
      }
      enter(following, current);
      return;
    }
    enter(nextStep(screen, current), current);
  }

  function goBack() {
    if (screen === "start") return;
    setReturnToSummary(false);
    enter(prevStep(screen, answers), answers);
  }

  function onNext() {
    if (screen === "start") return;
    if (DATE_STEPS.includes(screen)) {
      const { iso, error } = parseDateParts(dateParts);
      if (error) {
        setDateError(error);
        return;
      }
      advance(update({ [screen]: iso }));
      return;
    }
    if (screen === "planName") {
      advance(update({ planName: nameDraft.trim() || undefined }));
      return;
    }
    advance(answers);
  }

  function onSkip() {
    if (screen === "planName") advance(update({ planName: undefined }));
    if (screen === "jobChange") advance(update({ jobChange: "pominieto" }));
  }

  function onLater() {
    if (screen === "start") return;
    advance(update({ [screen]: LATER }));
  }

  function finish() {
    clearSaved();
    selectPlan(targetPlanId(answers));
    router.push("/plan");
  }

  function browseExample() {
    clearSaved();
    selectPlan("przyklad");
    router.push("/plan");
  }

  if (screen === "start") {
    return (
      <Shell>
        <div className="flex flex-col gap-stack pt-8 md:pt-16">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
            <Zusik size={96} className="md:size-32" />
            <SpeechBubble className="w-full md:before:block before:hidden">
              <h1 className="font-serif text-title">Pomogę Ci ułożyć plan.</h1>
              <p className="mt-2 text-on-surface-variant">4 krótkie pytania · ok. 1 minuty</p>
            </SpeechBubble>
          </div>

          <Disclosure summary="Sprawdź dane startowe" className="border-y border-outline">
            <p className="mb-3 text-meta text-on-surface-variant">Dane z symulacji logowania. Urzędowych nie zmienisz tutaj.</p>
            <SummaryList rows={PARENT_PROFILE} />
          </Disclosure>

          <div className="flex flex-col gap-4">
            <Button onClick={() => enter("situation", answers)} className="w-full md:w-fit">
              Zaczynamy
            </Button>
            <TextButton onClick={browseExample}>Najpierw rozejrzę się bez dopasowania</TextButton>
            <TextLink href="/wsparcie" className="w-fit">
              Potrzebuję wsparcia w trudnej sytuacji
            </TextLink>
          </div>
        </div>
      </Shell>
    );
  }

  const { question, why } = questionFor(screen, answers);
  const isDate = DATE_STEPS.includes(screen);
  const isOptional = OPTIONAL_STEPS.includes(screen);
  const isSummary = screen === "summary";
  const canNext = (() => {
    switch (screen) {
      case "situation":
        return Boolean(answers.situation);
      case "role":
        return Boolean(answers.role);
      case "childCount":
        return Boolean(answers.childCount);
      case "jobChange":
        return Boolean(answers.jobChange && answers.jobChange !== "pominieto");
      default:
        return true;
    }
  })();
  const warnings = warningCount(answers);

  return (
    <Shell>
      <div className="flex items-center gap-3 pt-4 md:pt-8">
        <button type="button" onClick={goBack} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-label hover:bg-surface">
          <ChevronLeftIcon size={18} /> Wstecz
        </button>
        <div className="flex-1">
          <ProgressBar value={progress(screen, answers)} label="Postęp rozmowy z Zusikiem" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 pt-6 md:gap-stack md:pt-10">
        <ZusikSays size={40}>
          <SpeechBubble>
            {screen === "jobChange" && answers.planName && <p className="mb-2 text-on-surface-variant">{planReadyText(answers.planName)}.</p>}
            <h1 ref={headingRef} tabIndex={-1} className="font-serif text-title focus:outline-none">
              {question}
            </h1>
            {why && (
              <div className="mt-2">
                <TextButton onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy} className="text-meta">
                  Dlaczego pytamy?
                </TextButton>
                {showWhy && <p className="mt-2 text-meta text-on-surface-variant">{why}</p>}
              </div>
            )}
          </SpeechBubble>
        </ZusikSays>

        <div>
          {screen === "situation" && (
            <ChoiceGroup legend={question} legendHidden choices={SITUATIONS} value={answers.situation} onChange={(v) => update({ situation: v as Answers["situation"] })} />
          )}
          {screen === "role" && answers.situation && (
            <ChoiceGroup legend={question} legendHidden choices={ROLES[answers.situation]} value={answers.role} onChange={(v) => update({ role: v })} />
          )}
          {screen === "childCount" && (
            <ChoiceGroup legend={question} legendHidden columns={3} choices={CHILD_COUNTS} value={answers.childCount} onChange={(v) => update({ childCount: v })} />
          )}
          {screen === "jobChange" && (
            <ChoiceGroup
              legend={question}
              legendHidden
              columns={3}
              choices={JOB_CHANGE}
              value={answers.jobChange === "pominieto" ? undefined : answers.jobChange}
              onChange={(v) => update({ jobChange: v as Answers["jobChange"] })}
            />
          )}
          {isDate && (
            <DateField
              legend={question}
              hint={screen === "dueDate" ? "Na przykład 14 5 2027" : "Na przykład 10 11 2026"}
              value={dateParts}
              onChange={(v) => {
                setDateParts(v);
                setDateError(undefined);
              }}
              error={dateError}
            />
          )}
          {screen === "planName" && (
            <TextField
              label="Nazwa planu"
              hint="Imię dziecka albo własna nazwa. Możesz to zmienić później."
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Moje dziecko"
              autoComplete="off"
              onKeyDown={(e) => e.key === "Enter" && onNext()}
            />
          )}
          {isSummary && (
            <div className="flex flex-col gap-4">
              {warnings > 0 && (
                <div className="flex flex-col gap-2 rounded-lg border border-outline bg-surface p-gutter-mobile md:p-card">
                  <Tag tone="accent" className="w-fit">
                    {warnings === 1 ? "1 ostrzeżenie" : `${warnings} ostrzeżenia`}
                  </Tag>
                  <p className="text-meta">
                    Zmiana pracy przed porodem może oznaczać brak ubezpieczenia w dniu porodu. Pokażę to przy właściwej sprawie w planie.
                  </p>
                </div>
              )}
              <Disclosure summary="Sprawdź dane startowe" defaultOpen className="border-y border-outline">
                <SummaryList
                  rows={summaryRows(answers)}
                  onChange={(row) => {
                    const target = (row as SummaryRow).step;
                    if (!target) return;
                    setReturnToSummary(true);
                    enter(target, answers);
                  }}
                />
              </Disclosure>
            </div>
          )}
          {screen === "situation" && (
            <p className="mt-4">
              <Link href="/wsparcie" className="text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                Potrzebuję wsparcia w trudnej sytuacji
              </Link>
            </p>
          )}
        </div>

        {/* Stałe miejsce akcji: na telefonie przyklejone do dołu, na desktopie pod odpowiedziami przy prawej krawędzi. */}
        <div
          className={cn(
            "sticky bottom-0 -mx-gutter-mobile mt-auto border-t border-outline bg-background px-gutter-mobile pt-3 pb-[max(12px,env(safe-area-inset-bottom))]",
            "md:static md:mx-0 md:mt-0 md:border-0 md:bg-transparent md:p-0",
          )}
        >
          <div className="flex flex-col items-stretch gap-3 md:items-end">
            <div className="flex flex-col-reverse gap-3 md:flex-row md:items-center">
              {isOptional && (
                <Button variant="secondary" onClick={onSkip}>
                  Pomiń
                </Button>
              )}
              {isSummary ? (
                <Button onClick={finish}>Pokaż mój plan</Button>
              ) : (
                <Button onClick={onNext} disabled={!canNext}>
                  Dalej
                </Button>
              )}
            </div>
            {isDate && (
              <TextButton onClick={onLater} className="self-center md:self-end">
                Uzupełnię później
              </TextButton>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="px-gutter-mobile pt-4 md:px-gutter-desktop md:pt-6">
        <span className="font-serif text-title">Zusik</span>
      </header>
      <main className="mx-auto flex w-full max-w-column flex-1 flex-col px-gutter-mobile pb-6 md:pb-16">{children}</main>
    </div>
  );
}
