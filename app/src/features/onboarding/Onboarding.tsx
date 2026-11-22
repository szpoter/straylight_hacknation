"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SpeechBubble, Zusik } from "@/components/mascot/Zusik";
import type { ZusikState } from "@/components/mascot/babelek/types";
import {
  Button,
  ChevronLeftIcon,
  DateField,
  Disclosure,
  FieldError,
  LockIcon,
  ProgressBar,
  Segmented,
  SummaryList,
  TextButton,
  TextField,
  cn,
  parseDateParts,
  type DateParts,
} from "@/components/ui";
import { useDemoSession } from "@/features/auth/demo-session";
import { ParentChat } from "@/features/chat/parent-chat";
import { firstVisitAfterLogin } from "@/features/family/LoginGate";
import { hasCreatedPlans, usePlan } from "@/features/family/PlanProvider";
import type { Plan } from "@/lib/demo/types";
import { buildPlans } from "@/lib/plan/build";
import {
  CHOICE_STEPS,
  DATE_STEPS,
  JOB_CHANGE,
  MAX_CHILDREN,
  OPTIONAL_STEPS,
  ROLES,
  SITUATIONS,
  ZUS_EMPLOYMENT,
  childCountChoices,
  childTotal,
  employmentChoices,
  estimateChoices,
  hasAnswer,
  nextStep,
  prevStep,
  progress,
  questionFor,
  sanitize,
  steps,
  toBuildAnswers,
  validateDate,
  zusikLine,
  type Answers,
  type Choice,
  type DateKey,
  type StepId,
} from "./flow";
import { BuildingPlan, PlanReady } from "./PlanReveal";
import { clearSaved, loadSaved, save } from "./storage";
import { OFFICIAL_ROWS, summaryRows, type SummaryRow } from "./summary";

type Screen = StepId | "start";
type DateMode = "exact" | "approx";

const EMPTY_DATE: DateParts = { day: "", month: "", year: "" };

/**
 * Wejście pytania: lekkie pojawienie się z przesunięciem (CSS @starting-style).
 * Ruch do weryfikacji z zespołem (CLAUDE.md: animacje dostarcza zespół).
 */
const ENTER = "transition-[opacity,translate] duration-300 ease-out starting:translate-y-2 starting:opacity-0 motion-reduce:transition-none";

function isoToParts(iso: string | undefined): DateParts {
  if (!iso) return EMPTY_DATE;
  const [year, month, day] = iso.split("-");
  return { day: String(Number(day)), month: String(Number(month)), year };
}

function choicesFor(step: StepId, answers: Answers): Choice[] {
  switch (step) {
    case "situation":
      return SITUATIONS;
    case "role":
      return answers.situation ? ROLES[answers.situation] : [];
    case "childCount":
      return childCountChoices(answers.situation);
    case "employment":
      return employmentChoices(answers);
    case "jobChange":
      return JOB_CHANGE;
    default:
      return [];
  }
}

/** Odpowiedź z karty → zmiana w odpowiedziach. */
function choicePatch(step: StepId, value: string): Partial<Answers> {
  switch (step) {
    case "situation":
      return { situation: value as Answers["situation"] };
    case "role":
      return { role: value };
    case "childCount":
      return { childCount: value as Answers["childCount"] };
    case "employment":
      return { employment: value as Answers["employment"], employmentFromZus: value === ZUS_EMPLOYMENT.employment };
    default:
      return { jobChange: value as Answers["jobChange"] };
  }
}

/**
 * Onboarding w stylu aplikacji typu Duolingo / Cal AI: jedno pytanie na ekran, duże karty,
 * pasek postępu, Zusik reagujący na odpowiedzi. Wybór karty tylko zaznacza — dalej idzie się
 * przyciskiem „Dalej”. Na końcu plan układa się na oczach rodzica i widać konkretne liczby.
 *
 * Gdy z rejestru znamy już dziecko (plan z kłódką), rodzic może od razu przejść do jego planu,
 * bez odpowiadania na pytania.
 */
export function Onboarding() {
  const router = useRouter();
  const { plans, addPlans, selectPlan } = usePlan();
  const session = useDemoSession();
  // „Wpisz dane samodzielnie” albo nieudane wczytanie: bez podpowiedzi z ZUS.
  const zusData = session?.data === "zus";
  const [screen, setScreen] = useState<Screen>("start");
  const [answers, setAnswers] = useState<Answers>({});
  /** „Zmień” z ekranu gotowego planu: po odpowiedzi wracamy do niego. */
  const [returnToSummary, setReturnToSummary] = useState(false);
  const [dateParts, setDateParts] = useState<DateParts>(EMPTY_DATE);
  const [dateMode, setDateMode] = useState<DateMode>("exact");
  const [approx, setApprox] = useState<string>();
  const [error, setError] = useState<string>();
  const [names, setNames] = useState<string[]>([]);
  const [planName, setPlanName] = useState("");
  const [typingTick, setTypingTick] = useState(0);
  const [showWhy, setShowWhy] = useState(false);
  /** Ekran końcowy: najpierw „układam plan”, potem wynik. */
  const [built, setBuilt] = useState(false);
  const [planId, setPlanId] = useState("plan-nowy");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const loaded = useRef(false);

  // Dzieci znane z rejestru (dane urzędowe) — można od razu przejść do ich planu.
  const known = plans.filter((p) => p.kind === "rejestr");

  // Wznowienie przerwanej rozmowy od ostatniego pytania.
  useEffect(() => {
    const saved = loadSaved();
    // Logowanie kończy się na /start. Rodzic, który ma już plan i nie jest w trakcie pytań, wraca od razu do planu.
    if (session && firstVisitAfterLogin(session.loggedInAt) && (!saved || saved.screen === "start") && hasCreatedPlans()) {
      router.replace("/plan");
      return;
    }
    if (saved) {
      /* eslint-disable react-hooks/set-state-in-effect -- odczyt po hydratacji */
      const restored = sanitize(saved.answers ?? {});
      setAnswers(restored);
      // Zapis ze starszej wersji pytań albo ekran, który po zmianie odpowiedzi nie istnieje → od początku.
      const valid = saved.screen === "start" || (saved.screen !== "summary" && steps(restored).includes(saved.screen));
      const target = valid ? saved.screen : restored.situation ? "situation" : "start";
      enter(target, restored);
      setReturnToSummary(Boolean(saved.returnToSummary));
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tylko przy wejściu na ekran (sesja jest już znana: LoginGate)
  }, []);

  useEffect(() => {
    if (loaded.current) save({ screen, answers, returnToSummary });
  }, [screen, answers, returnToSummary]);

  // Po zmianie ekranu fokus trafia na pytanie.
  useEffect(() => {
    if (screen !== "start" && loaded.current) headingRef.current?.focus();
  }, [screen, built]);

  const builtPlans = useMemo<Plan[]>(() => (screen === "summary" ? buildPlans(toBuildAnswers(answers), planId) : []), [screen, answers, planId]);
  const estimatedDate = toBuildAnswers(answers).dateEstimated;

  function enter(next: Screen, current: Answers) {
    setScreen(next);
    setShowWhy(false);
    setError(undefined);
    if (next === "start") return;
    if (DATE_STEPS.includes(next)) {
      const key = next as DateKey;
      const value = current[key];
      const wasEstimate = Boolean(value && current.estimated?.[key]);
      setDateMode(wasEstimate ? "approx" : "exact");
      setApprox(wasEstimate ? value : undefined);
      setDateParts(wasEstimate ? EMPTY_DATE : isoToParts(value));
    }
    if (next === "names") {
      const total = childTotal(current);
      setNames(Array.from({ length: total }, (_, i) => current.names?.[i] ?? ""));
    }
    if (next === "planName") setPlanName(current.planName ?? "");
    if (next === "employment" && !current.employment && zusData) {
      // Z ZUS znamy tytuł ubezpieczenia — zaznaczamy go, rodzic tylko potwierdza.
      setAnswers((a) => ({ ...a, employment: ZUS_EMPLOYMENT.employment, employmentFromZus: true }));
    }
    if (next === "summary") {
      setBuilt(false);
      setPlanId(`plan-${Date.now()}`);
    }
  }

  function update(patch: Partial<Answers>): Answers {
    const next = sanitize({ ...answers, ...patch });
    setAnswers(next);
    return next;
  }

  function advance(current: Answers, from: Screen = screen) {
    if (from === "start") return;
    if (returnToSummary) {
      // Zmiana mogła dodać nowe pytanie (np. imiona po zmianie liczby dzieci) — wtedy po kolei.
      const following = nextStep(from, current);
      const unanswered =
        (DATE_STEPS.includes(following) && !current[following as DateKey]) ||
        (following === "names" && (current.names?.length ?? 0) < childTotal(current)) ||
        (CHOICE_STEPS.includes(following) && !hasAnswer(following, current) && following !== "jobChange");
      if (!unanswered) {
        setReturnToSummary(false);
        enter("summary", current);
        return;
      }
      enter(following, current);
      return;
    }
    enter(nextStep(from, current), current);
  }

  function goBack() {
    if (screen === "start") return;
    setReturnToSummary(false);
    enter(prevStep(screen, answers), answers);
  }

  function onNext() {
    if (screen === "start") return;
    if (DATE_STEPS.includes(screen)) {
      const key = screen as DateKey;
      if (dateMode === "approx") {
        if (!approx) return setError("Wybierz przybliżoną datę albo wpisz dokładną.");
        return advance(update({ [key]: approx, estimated: { ...answers.estimated, [key]: true } }));
      }
      const empty = !dateParts.day && !dateParts.month && !dateParts.year;
      if (empty) return setError("Wpisz datę albo wybierz „Wiem mniej więcej”.");
      const { iso, error: parseError } = parseDateParts(dateParts);
      if (parseError || !iso) return setError(parseError);
      const contextError = validateDate(screen, iso);
      if (contextError) return setError(contextError);
      return advance(update({ [key]: iso, estimated: { ...answers.estimated, [key]: false } }));
    }
    if (screen === "names") return advance(update({ names: names.map((n) => n.trim()) }));
    if (screen === "planName") return advance(update({ planName: planName.trim() || undefined }));
    if (CHOICE_STEPS.includes(screen) && !hasAnswer(screen, answers)) return setError("Wybierz jedną odpowiedź.");
    advance(answers);
  }

  function onSkip() {
    if (screen === "names") advance(update({ names: names.map(() => "") }));
    if (screen === "planName") advance(update({ planName: undefined }));
    if (screen === "jobChange") advance(update({ jobChange: "pominieto" }));
  }

  function finish() {
    if (builtPlans.length === 0) return;
    clearSaved();
    addPlans(builtPlans);
    router.push("/plan");
  }

  function openKnown(id: string) {
    clearSaved();
    selectPlan(id);
    router.push("/plan");
  }

  function browseExample() {
    clearSaved();
    selectPlan("przyklad");
    router.push("/plan");
  }

  if (screen === "start") {
    // Po logowaniu rodzic trafia tutaj — czat z Zusikiem (zakres Juliana, `features/chat/parent-chat.tsx`)
    // jest dostępny obok ekranu startowego. Na ekranach pytań go nie ma: przycisk czatu w rogu
    // zasłaniałby na telefonie przyklejony pasek „Dalej”; tam rodzic ma Zusika w dymku.
    return (
      <ParentChat>
      <Shell>
        <div className={cn("flex flex-1 flex-col items-center gap-stack pt-8 pb-20 text-center md:pt-14", ENTER)}>
          <Zusik size={128} animated entrance state="available" toward={270} />
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-headline-mobile md:text-headline">Ułóżmy Twój plan</h1>
            <p className="text-lead text-on-surface-variant">Kilka krótkich pytań, ok. 1 minuty. Na końcu zobaczysz wszystkie sprawy z terminami.</p>
          </div>

          {known.length > 0 && (
            <section aria-labelledby="znane-dzieci" className="w-full rounded-lg border border-outline bg-background p-gutter-mobile text-left md:p-card">
              <h2 id="znane-dzieci" className="font-serif text-title">
                {known.length > 1 ? "Znamy już Twoje dzieci" : "Znamy już Twoje dziecko"}
              </h2>
              <p className="mt-1 text-on-surface-variant">
                Dane z rejestru PESEL (symulacja). Plan jest gotowy — nie musisz odpowiadać na pytania.
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {known.map((p) => (
                  <li key={p.id} className="flex flex-col gap-3 rounded-sm bg-surface p-4 sm:flex-row sm:items-center">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{p.name}</span>
                      <span className="inline-flex items-center gap-1 text-meta text-on-surface-variant">
                        <LockIcon size={14} /> {p.keyDateLabel} · rejestr PESEL
                      </span>
                    </span>
                    <Button onClick={() => openKnown(p.id)} className="sm:min-w-48">
                      Otwórz plan
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <Button variant={known.length > 0 ? "secondary" : "primary"} onClick={() => enter("situation", answers)} className="w-full">
              {known.length > 0 ? "Dodaj inne dziecko albo ciążę" : "Zaczynamy"}
            </Button>
            <TextButton onClick={browseExample}>Najpierw rozejrzę się na przykładzie</TextButton>
            <Link href="/wsparcie" className="text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface">
              Potrzebuję wsparcia w trudnej sytuacji
            </Link>
          </div>

          <Disclosure summary="Co już o Tobie wiemy" className="w-full border-y border-outline text-left">
            <p className="mb-3 max-w-prose text-meta text-on-surface-variant">
              {zusData
                ? "W tej symulacji z logowania przez mObywatel bierzemy imię i nazwisko, a z ZUS — ubezpieczenie i pracodawcę. Etapu rodzicielstwa i terminu porodu te dane nie zawierają, więc o nie zapytamy."
                : "Z logowania przez mObywatel bierzemy imię i nazwisko. Danych z ZUS w tej sesji nie wczytano, więc o pracę zapytamy."}
            </p>
            <SummaryList rows={zusData ? OFFICIAL_ROWS : OFFICIAL_ROWS.filter((r) => r.source !== "zus")} />
          </Disclosure>
        </div>
      </Shell>
      </ParentChat>
    );
  }

  if (screen === "summary" && builtPlans.length > 0) {
    return (
      <Shell>
        <TopRow onBack={goBack} value={1} />
        {!built ? (
          <BuildingPlan answers={answers} onDone={() => setBuilt(true)} />
        ) : (
          <PlanReady
            plans={builtPlans}
            line={zusikLine("summary", answers)}
            estimatedDate={estimatedDate}
            headingRef={headingRef}
            onFinish={finish}
            review={
              <Disclosure summary="Sprawdź odpowiedzi" className="border-y border-outline">
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
            }
          />
        )}
      </Shell>
    );
  }

  const step = screen;
  const { question, why, sources } = questionFor(step, answers);
  const isDate = DATE_STEPS.includes(step);
  const isChoice = CHOICE_STEPS.includes(step);
  const isOptional = OPTIONAL_STEPS.includes(step);
  const current = (answers as Record<string, unknown>)[step] as string | undefined;
  const mascotState: ZusikState = ((step === "names" || step === "planName") && typingTick > 0) || isDate ? "waiting" : "available";
  const total = childTotal(answers);

  return (
    <Shell>
      <TopRow onBack={goBack} value={progress(step, answers)} />

      <form
        key={step}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
        className={cn("flex flex-1 flex-col gap-6 pt-6 md:gap-stack md:pt-10", ENTER)}
      >
        {/* Zusik z dymkiem: reakcja na poprzednią odpowiedź, pod nią pytanie. */}
        <div className="flex items-end gap-3">
          <Zusik size={72} animated state={mascotState} typingTick={typingTick} toward={0} className="shrink-0" />
          <SpeechBubble className="mb-4 flex-1 px-4 py-3">
            <p>{zusikLine(step, answers)}</p>
          </SpeechBubble>
        </div>

        <div>
          <h1 ref={headingRef} tabIndex={-1} className="font-serif text-title focus:outline-none md:text-headline-mobile">
            {question}
          </h1>
          {why && (
            <div className="mt-2">
              <TextButton onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy} className="text-meta">
                Dlaczego pytamy?
              </TextButton>
              {showWhy && (
                <div className="mt-2 flex max-w-prose flex-col gap-1 text-meta text-on-surface-variant">
                  <p>{why}</p>
                  {sources && sources.length > 0 && (
                    <p>
                      Źródło:{" "}
                      {sources.map((src, i) => (
                        <span key={src.url}>
                          {i > 0 && " · "}
                          <a href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                            {src.label}
                            <span className="sr-only"> (otwiera się w nowej karcie)</span>
                          </a>
                        </span>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {isChoice && (
            <OptionCards
              label={question}
              choices={choicesFor(step, answers)}
              value={step === "jobChange" && current === "pominieto" ? undefined : current}
              columns={step === "jobChange" ? 3 : 1}
              onChoose={(v) => {
                update(choicePatch(step, v));
                setError(undefined);
              }}
            />
          )}

          {isDate && (
            <div className="flex flex-col gap-5">
              <Segmented<DateMode>
                label="Jak podasz datę"
                options={[
                  { value: "exact", label: "Znam datę" },
                  { value: "approx", label: "Wiem mniej więcej" },
                ]}
                value={dateMode}
                onChange={(m) => {
                  setDateMode(m);
                  setError(undefined);
                }}
              />
              {dateMode === "exact" ? (
                <DateField
                  legend={question}
                  hint={step === "dueDate" ? "Na przykład 14 5 2027" : "Na przykład 10 11 2026"}
                  value={dateParts}
                  onChange={(v) => {
                    setDateParts(v);
                    setError(undefined);
                  }}
                  error={error}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-meta text-on-surface-variant">Policzę od przybliżonej daty. Dokładną wpiszesz później w Profilu.</p>
                  <OptionCards
                    label="Przybliżona data"
                    choices={estimateChoices(step)}
                    value={approx}
                    columns={step === "dueDate" ? 3 : 2}
                    onChoose={(v) => {
                      setApprox(v);
                      setError(undefined);
                    }}
                    compact
                  />
                </div>
              )}
            </div>
          )}

          {step === "names" && (
            <div className="flex flex-col gap-4">
              {names.map((value, i) => (
                <div key={i} className="flex items-end gap-3">
                  <TextField
                    className="flex-1"
                    label={total > 1 ? `Imię ${i + 1}. dziecka` : "Imię dziecka"}
                    value={value}
                    maxLength={40}
                    autoComplete="off"
                    autoFocus={i === 0}
                    placeholder={i === 0 ? "Np. Ola" : i === 1 ? "Np. Ala" : undefined}
                    onChange={(e) => {
                      const next = [...names];
                      next[i] = e.target.value;
                      setNames(next);
                      setTypingTick((t) => t + 1);
                    }}
                  />
                  {answers.childCount === "3" && names.length > 3 && i >= 3 && (
                    <TextButton onClick={() => setNames(names.filter((_, j) => j !== i))} className="mb-3 text-meta">
                      Usuń
                    </TextButton>
                  )}
                </div>
              ))}
              {answers.childCount === "3" && names.length < MAX_CHILDREN && (
                <TextButton onClick={() => setNames([...names, ""])} className="w-fit">
                  + Dodaj kolejne dziecko
                </TextButton>
              )}
              <p className="text-meta text-on-surface-variant">
                {total > 1 ? "Każde dziecko dostanie osobny plan. Imiona zmienisz później w Profilu." : "Imię zmienisz później w Profilu."}
              </p>
            </div>
          )}

          {step === "planName" && (
            <TextField
              label="Podpis planu"
              hint="Np. imię, jeśli już je wybraliście. Zmienisz go później."
              value={planName}
              maxLength={40}
              onChange={(e) => {
                setPlanName(e.target.value);
                setTypingTick((t) => t + 1);
              }}
              placeholder={total > 1 ? "Np. Nasze bliźnięta" : "Np. Maluszek"}
              autoComplete="off"
              autoFocus
            />
          )}

          {error && !isDate && <FieldError id="onboarding-error">{error}</FieldError>}
          {error && isDate && dateMode === "approx" && <FieldError id="onboarding-error">{error}</FieldError>}

          {step === "situation" && (
            <p className="mt-1">
              <Link href="/wsparcie" className="text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                Potrzebuję wsparcia w trudnej sytuacji
              </Link>
            </p>
          )}
        </div>

        <ActionBar>
          <Button type="submit" className="w-full md:w-auto md:min-w-48">
            {returnToSummary ? "Zapisz i wróć" : "Dalej"}
          </Button>
          {isOptional && (
            <TextButton onClick={onSkip} className="self-center md:self-auto">
              Pomiń
            </TextButton>
          )}
        </ActionBar>
      </form>
    </Shell>
  );
}

/**
 * Duże karty wyboru: kliknięcie zaznacza (nie przechodzi dalej). Wszystkie karty w rzędzie mają
 * tę samą wysokość. Przyciski z `aria-pressed` — strzałki nie przeskakują pytań.
 */
function OptionCards({
  label,
  choices,
  value,
  onChoose,
  columns = 1,
  compact,
}: {
  label: string;
  choices: Choice[];
  value?: string;
  onChoose: (value: string) => void;
  columns?: 1 | 2 | 3;
  compact?: boolean;
}) {
  return (
    <ul aria-label={label} className={cn("grid auto-rows-fr gap-3", columns === 2 && "grid-cols-1 sm:grid-cols-2", columns === 3 && "grid-cols-1 sm:grid-cols-3")}>
      {choices.map((c) => {
        const selected = value === c.value;
        return (
          <li key={c.value} className="flex">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onChoose(c.value)}
              className={cn(
                "flex w-full items-center gap-4 rounded-lg border-2 bg-background text-left transition-[border-color,background-color] duration-150 motion-reduce:transition-none",
                compact ? "min-h-14 px-4 py-3" : "min-h-16 px-5 py-4",
                selected ? "border-primary bg-surface" : "border-outline hover:border-on-surface-variant",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{c.label}</span>
                {c.hint && <span className="mt-0.5 block text-meta text-on-surface-variant">{c.hint}</span>}
              </span>
              <span
                aria-hidden
                className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-primary bg-primary" : "border-outline")}
              >
                {selected && <span className="size-2 rounded-full bg-on-primary" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function TopRow({ onBack, value }: { onBack: () => void; value: number }) {
  return (
    <div className="flex items-center gap-3 pt-4 md:pt-8">
      <button type="button" onClick={onBack} aria-label="Wstecz" className="-ml-2 inline-flex size-11 items-center justify-center rounded-full hover:bg-surface">
        <ChevronLeftIcon />
      </button>
      <div className="flex-1">
        <ProgressBar value={value} label="Postęp rozmowy z Zusikiem" />
      </div>
    </div>
  );
}

/**
 * Pasek działań. Telefon: przyklejony do dołu, „Dalej” na całą szerokość, „Pomiń” pod nim.
 * Komputer: pod treścią, „Dalej” po prawej, „Pomiń” obok po lewej — jak w Duolingo.
 */
function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "sticky bottom-0 -mx-gutter-mobile mt-auto border-t border-outline bg-background px-gutter-mobile pt-3 pb-[max(12px,env(safe-area-inset-bottom))]",
        "md:static md:mx-0 md:mt-4 md:border-t md:bg-transparent md:px-0 md:pt-6 md:pb-0",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row-reverse md:items-center md:justify-between">{children}</div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col">
      <header className="px-gutter-mobile pt-4 md:px-gutter-desktop md:pt-6">
        <span className="font-serif text-title">Zusik</span>
      </header>
      <main className="mx-auto flex w-full max-w-column flex-1 flex-col px-gutter-mobile pb-6 md:pb-16">{children}</main>
    </div>
  );
}
