"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertIcon, ArrowLeftIcon, Button, ButtonLink, CheckIcon, Page, PageTitle, Panel, SectionTitle, Tag } from "@/components/ui";
import { useDemoSession } from "@/features/auth/demo-session";
import { OLA } from "@/lib/family/ola";
import { usePlan } from "@/features/family/PlanProvider";
import { todayInPoland, daysLeftLabel, formatLong } from "@/lib/demo/dates";
import { formFor, prefillContext, type Channel, type FormDef } from "@/lib/demo/forms";
import { docStatus, HANDOFF_RECORDED } from "@/lib/plan/status";
import type { DocCase } from "./model";
import { GROUP_TONE } from "./model";
import { Timeline } from "./CaseTimeline";
import { FormEditor } from "./FormEditor";
import { CheckAnswers, SendStep } from "./FormReview";
import { canEdit, documentDraft, initialValues, nextState, progress, sendEvents, validate, type Values } from "./flow";
import { buildTimeline } from "./timeline";

/** Krok sprawy w adresie (`?krok=`), żeby wiersz listy mógł prowadzić prosto do wniosku. */
export type Step = "wniosek" | "sprawdz" | "przekaz" | "podglad";
const STEP_TITLE: Record<Step, string> = { wniosek: "Wniosek", sprawdz: "Sprawdź odpowiedzi", przekaz: "Oznacz przekazanie wniosku", podglad: "Zapisany wniosek" };
const CORRECTION = "_korekta";

function BackLink() {
  return (
    <Link href="/dokumenty" className="inline-flex items-center gap-2 text-label underline decoration-outline underline-offset-4 hover:decoration-on-surface">
      <ArrowLeftIcon size={18} /> Wróć do listy
    </Link>
  );
}

export function CaseDetail({ id }: { id: string }) {
  const { plan, openZusik, patchStop, formValues, setFormValues } = usePlan();
  const stop = plan.stops.find((s) => s.id === id);
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const step = (params.get("krok") as Step | null) ?? undefined;
  const [focusField, setFocusField] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | undefined>();
  const def = formFor(id);
  const { key: draftKey, values: saved } = documentDraft(plan.id, id, formValues);
  const family = useDemoSession()?.family ?? OLA;
  const context = prefillContext(plan, {
    parentName: family.mother, secondParentName: family.father, employer: family.employer,
    childName: family.child, birthDate: family.birthDate,
  });
  const values = def ? initialValues(def, context, saved) : {};
  const top = useRef<HTMLDivElement>(null);

  const go = (next?: Step, field?: string) => {
    setFocusField(field);
    router.replace(next ? `${pathname}?krok=${next}` : pathname, { scroll: false });
  };
  useEffect(() => {
    if (!focusField) top.current?.scrollIntoView({ block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (!stop || !stop.doc || !stop.state) {
    return (
      <Page>
        <BackLink />
        <PageTitle className="mt-stack">Nie znaleźliśmy tej sprawy</PageTitle>
        <p className="mt-4 max-w-prose text-on-surface-variant">Ta sprawa nie należy do planu „{plan.name}”. Wróć do listy dokumentów, aby zobaczyć sprawy tego dziecka.</p>
      </Page>
    );
  }

  const c = stop as DocCase;
  const status = docStatus(c.state);
  const stages = buildTimeline(c);
  const sentOrLater = stages[0].status === "done";
  const zusik = (field?: string) => openZusik({ planId: plan.id, place: "Dokumenty", stopId: c.id, field, returnTo: `/dokumenty/${c.id}` });

  // Kroki wniosku: każdy zapisuje wartości i stan sprawy przez wspólny plan, więc ścieżka
  // na „Moim planie” i lista dokumentów zmieniają się razem z nim.
  const saveValues = (next: Values) => setFormValues(draftKey, next);
  const commitDraft = (d: FormDef) => {
    const valid = Object.keys(validate(d, values)).length === 0;
    const { done, total } = progress(d, values);
    // Sprawa „warunek” może być przygotowana wcześniej — stan zmieni się dopiero, gdy warunek zajdzie.
    const state = c.state === "warunek" ? c.state : nextState(c.state, "save", valid);
    patchStop(c.id, {
      state,
      doc: { hasDraft: true, note: valid ? "Wniosek uzupełniony — sprawdź i zatwierdź" : `Uzupełnione ${done} z ${total} pól`, lastEvent: `Szkic zapisany ${formatLong(todayInPoland())}` },
    });
    return valid;
  };
  const approve = () => {
    if (!def || Object.keys(validate(def, values)).length) {
      go("wniosek");
      return;
    }
    patchStop(c.id, { state: "zatwierdzony", doc: { note: "Zatwierdzony — gotowy do przekazania", lastEvent: `Zatwierdzony ${formatLong(todayInPoland())}` } });
    go("przekaz");
  };
  const send = (channel: Channel) => {
    if (c.state !== "zatwierdzony" || !def) return;
    if (Object.keys(validate(def, values)).length) {
      go("wniosek");
      return;
    }
    const today = todayInPoland();
    const correction = values[CORRECTION] === "1";
    patchStop(c.id, {
      state: nextState("zatwierdzony", "send", true),
      doc: { events: sendEvents(c.doc.events, channel, c.doc.recipient, today, correction), lastEvent: `Oznaczono przekazanie ${formatLong(today)}`, note: undefined, hasDraft: false },
    });
    saveValues({ ...values, [CORRECTION]: "" });
    setNotice(correction ? "Zapisano Twoją informację o przekazaniu korekty." : "Zapisano Twoją informację o przekazaniu wniosku.");
    go();
  };
  const startCorrection = () => {
    saveValues({ ...values, [CORRECTION]: "1" });
    patchStop(c.id, { state: nextState(c.state, "correct", true), doc: { hasDraft: true, note: "Korekta wysłanego wniosku", lastEvent: `Korekta rozpoczęta ${formatLong(todayInPoland())}` } });
    go("wniosek");
  };

  if (def && step && step !== "podglad" && !(step === "wniosek" ? canEdit(c.state) || c.state === "warunek" : step === "sprawdz" ? canEdit(c.state) : c.state === "zatwierdzony")) {
    // Nieaktualny krok w adresie (np. po wysłaniu) — wracamy do przeglądu.
    return <StaleStep onBack={() => go()} />;
  }

  if (def && step) {
    return (
      <Page className="pb-section-mobile md:pb-section">
        <div ref={top} className="scroll-mt-24" />
        <button type="button" onClick={() => go(step === "przekaz" ? "sprawdz" : undefined)} className="inline-flex items-center gap-2 text-label underline decoration-outline underline-offset-4 hover:decoration-on-surface">
          <ArrowLeftIcon size={18} /> {step === "przekaz" ? "Wróć do sprawdzania" : "Wróć do sprawy"}
        </button>
        <div className="mx-auto mt-stack flex max-w-column flex-col gap-stack">
          <header className="flex flex-col gap-2">
            <p className="text-meta text-on-surface-variant">
              {c.title} · {STEP_TITLE[step]}
            </p>
            <PageTitle>{def.name}</PageTitle>
            <p className="text-meta text-on-surface-variant">{def.fidelity}</p>
            {values[CORRECTION] === "1" && <p className="rounded-sm bg-tertiary p-3">Przygotuj korektę i przekaż ją odbiorcy. Poprzednia wersja zostaje w przebiegu sprawy.</p>}
          </header>
          {step === "wniosek" && (
            <>
              {c.doc.hasDraft && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant">
                  Potrzebujesz wyjaśnienia?
                  <button type="button" onClick={() => zusik(c.doc.note)} className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                    Zapytaj o ten wniosek
                  </button>
                </p>
              )}
              <FormEditor
                def={def}
                values={values}
                onChange={saveValues}
                focusField={focusField}
                submitLabel={c.state === "warunek" ? "Zapisz przygotowany wniosek" : "Zapisz i sprawdź"}
                onSubmit={() => {
                  commitDraft(def);
                  go(c.state === "warunek" ? undefined : "sprawdz");
                  if (c.state === "warunek") setNotice("Wniosek przygotowany. Złożysz go, gdy sprawa stanie się aktualna.");
                }}
                onSaveDraft={() => {
                  commitDraft(def);
                  setNotice("Szkic zapisany. Wrócisz do niego w każdej chwili.");
                  go();
                }}
              />
            </>
          )}
          {step === "sprawdz" && <CheckAnswers def={def} values={values} onChangeField={(f) => go("wniosek", f)} onApprove={approve} onBack={() => go()} />}
          {step === "przekaz" && <SendStep channels={def.channels} recipient={c.doc.recipient} onSend={send} onBack={() => go()} />}
          {step === "podglad" && <CheckAnswers def={def} values={values} onBack={() => go()} readOnly />}
        </div>
      </Page>
    );
  }

  return (
    <Page className="pb-section-mobile md:pb-section">
      <div ref={top} className="scroll-mt-24" />
      <BackLink />
      <header className="mt-stack flex flex-col gap-2">
        <p className="text-meta text-on-surface-variant">{plan.name}</p>
        <PageTitle>{c.title}</PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <span>{c.doc.recipient}</span>
          <Tag tone={c.state === "wezwanie" ? "accent" : GROUP_TONE[status.group]}>{status.label}</Tag>
          {c.doc.optional && <span className="text-meta text-on-surface-variant">Jeśli chcesz skorzystać</span>}
        </div>
      </header>

      {notice && (
        <p role="status" className="mt-stack flex max-w-prose items-start gap-2 rounded-lg bg-secondary p-4">
          <CheckIcon className="mt-0.5 shrink-0" /> {notice}
        </p>
      )}

      <Panel className="mt-stack max-w-prose" aria-labelledby="teraz">
        <SectionTitle id="teraz">Czy mam teraz coś zrobić?</SectionTitle>
        <NowCard c={c} def={def} filled={def ? progress(def, values) : undefined} onZusik={zusik} onStep={(s) => go(s)} onCorrect={startCorrection} />
      </Panel>

      {c.howTo && (
        <section aria-labelledby="jak-zlozyc" className="mt-stack max-w-prose">
          <SectionTitle id="jak-zlozyc" className="mb-4 md:mb-6">
            Jak złożyć
          </SectionTitle>
          <dl className="divide-y divide-outline border-y border-outline">
            {(
              [
                ["Co", c.howTo.co],
                ["Do kogo", c.howTo.doKogo],
                ["Do kiedy", c.howTo.doKiedy],
                ["Załączniki", c.howTo.zalaczniki],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 md:grid-cols-[10rem_1fr] md:gap-4">
                <dt className="text-meta text-on-surface-variant md:text-body">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {sentOrLater && (
        <section aria-labelledby="przebieg" className="mt-section-mobile md:mt-stack">
          <SectionTitle id="przebieg" className="mb-card">
            Przebieg sprawy
          </SectionTitle>
          <Timeline stages={stages} recipient={c.doc.recipient} />
        </section>
      )}

      <p className="mt-stack text-meta text-on-surface-variant">
        Źródło:{" "}
        <a href={c.source.url} target="_blank" rel="noreferrer" className="underline decoration-outline underline-offset-4 hover:decoration-on-surface">
          {c.source.label}
        </a>
      </p>
    </Page>
  );
}

function StaleStep({ onBack }: { onBack: () => void }) {
  return (
    <Page>
      <PageTitle className="mt-stack">Ten krok jest już za Tobą</PageTitle>
      <p className="mt-4 max-w-prose text-on-surface-variant">Stan sprawy się zmienił, np. wniosek został już oznaczony jako przekazany.</p>
      <Button variant="secondary" className="mt-stack" onClick={onBack}>
        Wróć do sprawy
      </Button>
    </Page>
  );
}

/** Przyciski kroku: główny i (opcjonalnie) drugorzędny, jednej szerokości. */
function Actions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:justify-center">{children}</div>;
}

function NowCard({
  c,
  def,
  filled,
  onZusik,
  onStep,
  onCorrect,
}: {
  c: DocCase;
  def?: FormDef;
  filled?: { done: number; total: number };
  onZusik: (field?: string) => void;
  onStep: (step: Step) => void;
  onCorrect: () => void;
}) {
  const summons = c.doc.summons;
  if (c.state === "wezwanie" && summons) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        {/* Brak tokenu koloru ostrzeżenia: akcent bursztynowy — do weryfikacji. */}
        <p className="flex items-start gap-2 rounded-sm bg-tertiary p-3">
          <AlertIcon className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Twój krok — uzupełnij dokumenty.</span> Pismo od {summons.from}, termin do {formatLong(summons.due)} ({daysLeftLabel(summons.due)}).
          </span>
        </p>
        <p className="text-on-surface-variant">{summons.text}</p>
        <ul className="flex flex-col gap-2">
          {summons.tasks.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-on-surface" />
              {t}
            </li>
          ))}
        </ul>
        <Actions>
          <Button onClick={() => onZusik("Uzupełnienie po wezwaniu")}>Zapytaj o wezwanie</Button>
          {def && (
            <Button variant="secondary" onClick={() => onStep("wniosek")}>
              Popraw wniosek samodzielnie
            </Button>
          )}
        </Actions>
      </div>
    );
  }

  switch (c.state) {
    case "szkic":
    case "aktualna":
    case "wypelniony":
    case "zatwierdzony":
      return (
        <div className="mt-4 flex flex-col gap-4">
          <p>
            {c.state === "aktualna" ? "Tak — ta sprawa czeka na rozpoczęcie." : c.state === "szkic" ? "Tak — szkic jest zapisany, ale niepełny." : c.state === "wypelniony" ? "Tak — sprawdź i zatwierdź wypełniony wniosek." : "Tak — przekaż zatwierdzony wniosek odbiorcy."}
            {c.doc.note && <span className="block text-on-surface-variant">{c.doc.note}</span>}
            {c.due && (
              <span className="block text-on-surface-variant">
                Termin: {formatLong(c.due)} · {daysLeftLabel(c.due)}
              </span>
            )}
          </p>
          {filled && c.state !== "zatwierdzony" && (
            <p className="text-meta text-on-surface-variant">
              Uzupełnione {filled.done} z {filled.total} wymaganych pól.
            </p>
          )}
          {def ? (
            <Actions>
              {c.state === "aktualna" && <Button onClick={() => onStep("wniosek")}>Rozpocznij wniosek</Button>}
              {c.state === "szkic" && <Button onClick={() => onStep("wniosek")}>Uzupełnij wniosek</Button>}
              {c.state === "wypelniony" && <Button onClick={() => onStep("sprawdz")}>Sprawdź i zatwierdź</Button>}
              {c.state === "zatwierdzony" && <Button onClick={() => onStep("przekaz")}>Oznacz przekazanie</Button>}
              {(c.state === "wypelniony" || c.state === "zatwierdzony") && (
                <Button variant="secondary" onClick={() => onStep("wniosek")}>
                  Edytuj wniosek
                </Button>
              )}
              {c.doc.hasDraft && (c.state === "aktualna" || c.state === "szkic") && (
                <Button variant="secondary" onClick={() => onZusik(c.doc.note)}>
                  Zapytaj o ten wniosek
                </Button>
              )}
            </Actions>
          ) : c.doc.hasDraft ? (
            <Button className="self-start" onClick={() => onZusik(c.doc.note)}>
              Zapytaj o ten wniosek
            </Button>
          ) : (
            <p className="text-on-surface-variant">Tę sprawę załatwiasz poza Zusikiem — szczegóły w „Jak złożyć” poniżej.</p>
          )}
        </div>
      );
    case "wyslano": {
      const recorded = c.doc.events?.some(e => e.title === HANDOFF_RECORDED);
      return (
        <div className="mt-4 flex flex-col gap-4">
          <p className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 shrink-0 text-primary" />
            {recorded ? "Przekazanie zostało oznaczone przez Ciebie. Status u odbiorcy możesz sprawdzić bezpośrednio u niego." : "Historia planu zawiera wcześniejszy wpis o przekazaniu wniosku. Status możesz sprawdzić u odbiorcy."}
          </p>
          <Actions>
            <ButtonLink href="#przebieg" variant="secondary">
              Zobacz przebieg sprawy
            </ButtonLink>
            {def && (
              <Button variant="secondary" onClick={() => onStep("podglad")}>
                Zobacz zapisany wniosek
              </Button>
            )}
            {def && (
              <Button variant="quiet" onClick={onCorrect}>
                Przygotuj korektę
              </Button>
            )}
          </Actions>
        </div>
      );
    }
    case "warunek":
      return (
        <div className="mt-4 flex flex-col gap-4">
          <p>
            Jeszcze nie. Ta sprawa stanie się aktualna: <span className="font-medium">{(c.condition ?? c.doc.note ?? "po zdarzeniu w planie").toLowerCase()}</span>.
          </p>
          {c.prepare && c.prepare.length > 0 ? (
            <div>
              <p className="mb-2 font-medium">Co przygotować</p>
              <ul className="flex flex-col gap-2">
                {c.prepare.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-on-surface" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            c.dueBasis && <p className="text-on-surface-variant">Termin: {c.dueBasis}.</p>
          )}
          {def && (
            <Button variant="secondary" className="self-start" onClick={() => onStep("wniosek")}>
              {c.doc.hasDraft ? "Wróć do przygotowanego wniosku" : "Przygotuj wniosek wcześniej"}
            </Button>
          )}
        </div>
      );
    default:
      return (
        <div className="mt-4 flex flex-col gap-2">
          <p>Nie, sprawa jest zakończona.</p>
          {(c.doc.result || c.doc.lastEvent) && <p className="text-on-surface-variant">{[c.doc.result, c.doc.lastEvent].filter(Boolean).join(" · ")}</p>}
          {c.state === "nie-korzystam" && <p className="text-on-surface-variant">Oznaczone „Nie korzystam”. Możesz to cofnąć w karcie przystanku na ścieżce.</p>}
        </div>
      );
  }
}
