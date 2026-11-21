"use client";

import type { Choice } from "@/lib/zusik/constants";
import { CHOICE_FIELD_LABEL, CHOICE_TEXT, EMPTY_CHOICE_TEXT } from "./case-data";
import type { ClientView } from "./contract";
import { Progress } from "./turn-view";
import type { Phase } from "./use-zusik-case";
import s from "./zusik.module.css";

export type CaseStepsProps = {
  view: ClientView | null;
  phase: Phase;
  pendingChoice: Choice | null;
  preview: Choice | null;
  onPreview: (choice: Choice | null) => void;
  onAccept: (choice: Choice) => void;
  onStart: () => void;
  onShowField: () => void;
};

/**
 * The saved part of the case (step 1): start, Zusik's question, the parent's choice and its save.
 * Three distinct moments for the form field: a proposal (nothing sent), the parent's acceptance
 * (request on its way) and the confirmed save (the server says the case is completed).
 */
export function CaseSteps({ view, phase, pendingChoice, preview, onPreview, onAccept, onStart, onShowField }: CaseStepsProps) {
  const state = view?.state ?? "empty";
  return (
    <>
      <div className={s.aiMessage}>
        <p>Pomogę Ci przygotować wniosek do Studia Lipa. Zacznijmy od tego, jak chcecie z Pawłem korzystać z urlopu.</p>
        {phase === "restoring" && <Progress label="Wczytuję Twoją sprawę…" />}
        {state === "empty" && phase !== "starting" && phase !== "restoring" && (
          <div className={s.stack8}>
            <button type="button" className={s.primaryButton} onClick={onStart} disabled={phase !== "ready"}>
              Zaplanuj urlop z Zusikiem
            </button>
            <p className={s.muted}>Zusik sprawdzi przepisy i zada Ci jedno pytanie.</p>
          </div>
        )}
      </div>

      {(phase === "starting" || state === "starting") && <Progress label="Szukam w materiałach ZUS…" />}

      {state === "awaiting_choice" && view && (
        <ChoiceQuestion view={view} pendingChoice={pendingChoice} preview={preview} onPreview={onPreview} onAccept={onAccept} />
      )}

      {state === "completed" && view?.choice && (
        <>
          <div className={s.userRow}>
            <p className={s.userBubble}>{CHOICE_TEXT[view.choice].long}</p>
          </div>
          <div className={s.aiMessage}>
            <p className={s.confirmLine}>
              <span aria-hidden="true">✓</span> Zapisałem Twój wybór w sprawie.
            </p>
            <div className={s.annotation}>
              <button type="button" className={s.annotationField} onClick={onShowField}>
                {CHOICE_FIELD_LABEL} <span aria-hidden="true">↗</span>
              </button>
              <span>
                <span className={s.strike}>{EMPTY_CHOICE_TEXT}</span> → {CHOICE_TEXT[view.choice].short}
              </span>
              <span className={s.muted}>Zapisane w sprawie Oli</span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ChoiceQuestion({
  view,
  pendingChoice,
  preview,
  onPreview,
  onAccept,
}: Pick<CaseStepsProps, "pendingChoice" | "preview" | "onPreview" | "onAccept"> & { view: ClientView }) {
  const grounded = view.providers.qdrant === "ok" && view.providers.sherlock === "ok";
  const selected = pendingChoice ?? preview;
  return (
    <div className={s.aiMessage}>
      <p className={s.aiQuestion}>{view.question}</p>
      <p className={s.muted}>
        {grounded
          ? "Pytanie przygotowane na podstawie fragmentu z bazy wiedzy."
          : "Wyszukiwanie było niedostępne, więc pytam bez wskazania fragmentu."}
      </p>
      <div className={s.choiceRow} role="group" aria-label="Twoja odpowiedź">
        {view.choices.map((choice) => (
          <button
            key={choice}
            type="button"
            className={s.choice}
            aria-pressed={selected === choice}
            disabled={pendingChoice !== null}
            onClick={() => onPreview(selected === choice ? null : choice)}
          >
            {CHOICE_TEXT[choice].long}
          </button>
        ))}
      </div>
      {selected && (
        <div className={s.proposal} aria-live="polite" aria-busy={pendingChoice !== null}>
          <p className={s.proposalLabel}>{CHOICE_FIELD_LABEL}</p>
          <p className={s.proposalDiff}>
            <span className={s.strike}>{EMPTY_CHOICE_TEXT}</span> <span aria-hidden="true">→</span>
            <span className={s.srOnly}>zmienię na</span> <strong>{CHOICE_TEXT[selected].short}</strong>
          </p>
          <p className={s.muted}>
            {pendingChoice ? "Zapisuję w sprawie…" : "Propozycja. Nic jeszcze nie zapisano. Sprawdź pole w szkicu."}
          </p>
          <div className={s.row8}>
            <button type="button" className={s.primaryButton} disabled={pendingChoice !== null} onClick={() => onAccept(selected)}>
              {pendingChoice ? "Zapisywanie…" : "Zapisz w szkicu"}
            </button>
            {!pendingChoice && (
              <button type="button" className={s.secondaryButton} onClick={() => onPreview(null)}>
                Anuluj
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
