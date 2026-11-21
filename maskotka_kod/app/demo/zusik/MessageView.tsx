"use client";

import { useState, type ReactNode } from "react";
import { COMPARISON, FIELD_LABELS, SOURCES, addDays, formatDate, type Draft, type FieldKey, type SourceId } from "./data";
import { segmentUnits, type AssistantMessage, type Message, type SaveRecord, type Segment } from "./agent";
import { DatePicker } from "./DatePicker";
import { FileIcon, FlagIcon } from "./icons";

export type PlanTarget = FieldKey | "attachment" | "summary";

export type MessageActions = {
  onFieldLink: (field: FieldKey) => void;
  onPlanStep: (target: PlanTarget) => void;
  onRetrySave: (messageId: string) => void;
  onRetryAnswer: (messageId: string) => void;
  onSuggestion: (text: string) => void;
  onPickDate: (iso: string) => void;
};

type Props = {
  message: Message;
  draft: Draft;
  latest: boolean;
  busy: boolean;
  /** Zusik on the margin; given only to the latest answer, so there is one Zusik at a time. */
  mascot?: ReactNode;
  actions: MessageActions;
};

export function MessageView({ message, draft, latest, busy, mascot, actions }: Props) {
  if (message.role === "user")
    return (
      <div className="zd-user">
        {message.text && <span>{message.text}</span>}
        {message.files.map((name) => (
          <span key={name} className="zd-user__file">
            <FileIcon /> {name}
          </span>
        ))}
      </div>
    );
  return <AssistantView message={message} draft={draft} latest={latest} busy={busy} mascot={mascot} actions={actions} />;
}

function AssistantView({ message, draft, latest, busy, mascot, actions }: Props & { message: AssistantMessage }) {
  const [processOpen, setProcessOpen] = useState(false);
  let left = message.revealed;
  const visible: { segment: Segment; text?: string }[] = [];
  for (const segment of message.segments) {
    if (left <= 0) break;
    const units = segmentUnits(segment);
    visible.push({ segment, text: "text" in segment ? segment.text.slice(0, left) : undefined });
    left -= units;
  }
  const working = message.status === "working" || message.status === "streaming";
  const processLabel = working
    ? message.steps[message.steps.length - 1]
    : message.save
      ? "Przebieg zmiany"
      : "Przebieg";

  return (
    <div className="zd-ai" data-message={message.id}>
      {mascot && <div className="zd-ai__margin" data-zusik-margin>{mascot}</div>}
      <button type="button" className="zd-process" aria-expanded={processOpen} onClick={() => setProcessOpen((v) => !v)}>
        <span key={processLabel} className="zd-process__label" aria-live="polite">
          {processLabel}
        </span>
        <span aria-hidden="true">{processOpen ? "⌄" : "›"}</span>
      </button>
      {processOpen && (
        <ol className="zd-process__steps">
          {message.steps.map((step, i) => (
            <li key={`${step}-${i}`}>{step}</li>
          ))}
        </ol>
      )}
      {visible.map(({ segment, text }, i) => (
        <SegmentView
          key={i}
          segment={segment}
          text={text ?? ""}
          message={message}
          draft={draft}
          interactive={latest && !busy}
          actions={actions}
        />
      ))}
      {message.status === "stopped" && <p className="zd-note">{message.stopNote ?? "Zatrzymano odpowiedź"}</p>}
      {message.status === "disconnected" && (
        <div className="zd-row">
          <span className="zd-note zd-note--error">Utracono połączenie</span>
          <button type="button" className="zd-btn zd-btn--ghost" onClick={() => actions.onRetryAnswer(message.id)}>
            Ponów odpowiedź
          </button>
        </div>
      )}
      {latest && message.status === "done" && message.suggestions.length > 0 && (
        <div className="zd-chips" aria-label="Podpowiedzi">
          {message.suggestions.map((suggestion) => (
            <button key={suggestion} type="button" className="zd-chip" onClick={() => actions.onSuggestion(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SegmentView({
  segment,
  text,
  message,
  draft,
  interactive,
  actions,
}: {
  segment: Segment;
  text: string;
  message: AssistantMessage;
  draft: Draft;
  interactive: boolean;
  actions: MessageActions;
}) {
  switch (segment.kind) {
    case "p":
      return segment.cite && text.length === segment.text.length ? (
        <Cited text={text} source={segment.cite} />
      ) : (
        <p>{text}</p>
      );
    case "question":
      return (
        <>
          <p className="zd-question">{text}</p>
          {segment.datePicker && text.length === segment.text.length && interactive && message.status === "done" && (
            <DatePicker month={draft.fields[segment.datePicker].value?.slice(0, 7) ?? draft.pickerMonth} onPick={actions.onPickDate} />
          )}
        </>
      );
    case "save":
      return message.save ? <SaveOutcome save={message.save} draft={draft} messageId={message.id} actions={actions} /> : null;
    case "deadline":
      return <Deadline draft={draft} />;
    case "plan":
      return <MiniPlan draft={draft} onStep={actions.onPlanStep} />;
    case "table":
      return <Comparison ready={Boolean(message.tableReady)} />;
  }
}

/** A sentence with its source: a small label that expands the exact RAG fragment under the sentence. */
function Cited({ text, source }: { text: string; source: SourceId }) {
  const [open, setOpen] = useState(false);
  const fragment = SOURCES[source];
  return (
    <div className="zd-ai" style={{ gap: 8 }}>
      <p>
        {text}
        <button type="button" className="zd-cite" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          Pokaż fragment poradnika · {fragment.publisher}, {fragment.page}
        </button>
      </p>
      {open && <SourceBox source={source} />}
    </div>
  );
}

function SourceBox({ source }: { source: SourceId }) {
  const fragment = SOURCES[source];
  return (
    <div className="zd-source">
      <span className="zd-source__meta">
        {fragment.title} · {fragment.publisher} · {fragment.year} · {fragment.page}
      </span>
      <span>„{fragment.quote}”</span>
      <a href={fragment.href} target="_blank" rel="noreferrer">
        Otwórz stronę w PDF
      </a>
    </div>
  );
}

function SaveOutcome({ save, draft, messageId, actions }: { save: SaveRecord; draft: Draft; messageId: string; actions: MessageActions }) {
  const label = FIELD_LABELS[save.field];
  const current = draft.fields[save.field].value;
  if (save.status === "saved")
    return (
      <div className="zd-annotation">
        <button type="button" className="zd-annotation__field" onClick={() => actions.onFieldLink(save.field)}>
          {label} ↗
        </button>
        <span className="zd-annotation__change">
          {save.from ? `${formatDate(save.from, false)} → ` : ""}
          {formatDate(save.to, false)}
        </span>
        <span className="zd-annotation__saved">Zapisane w szkicu Oli</span>
      </div>
    );
  if (save.status === "manual")
    return (
      <div className="zd-annotation">
        <span>W szkicu jest już Twoja poprawka.</span>
        <span>
          <button type="button" className="zd-annotation__field" onClick={() => actions.onFieldLink(save.field)}>
            {label} ↗
          </button>
          : {formatDate(current)}
        </span>
      </div>
    );
  if (save.status === "failed" || save.status === "retrying")
    return (
      <div className="zd-error" role="alert">
        <span className="zd-error__title">Nie udało się zapisać daty {formatDate(save.to)}</span>
        <span>
          Teraz w polu „{label}”: {formatDate(current)}
        </span>
        <button
          type="button"
          className="zd-btn zd-btn--ghost"
          style={{ justifySelf: "start" }}
          disabled={save.status === "retrying"}
          onClick={() => actions.onRetrySave(messageId)}
        >
          {save.status === "retrying" ? "Zapisywanie…" : "Ponów zapis"}
        </button>
      </div>
    );
  return null;
}

/** "⚑ Złóż wniosek do 11 czerwca": 7 days before the start date in the draft (KP art. 182³ § 2). */
function Deadline({ draft }: { draft: Draft }) {
  const [open, setOpen] = useState(false);
  const start = draft.fields.start.value;
  if (!start) return <p className="zd-note">Podaj początek urlopu, a policzę termin złożenia wniosku.</p>;
  return (
    <div className="zd-deadline">
      <span className="zd-deadline__main">
        <FlagIcon />
        Złóż wniosek do {formatDate(addDays(start, -7), false)}
      </span>
      <span className="zd-deadline__ref">Początek urlopu ojcowskiego · {formatDate(start, false)}</span>
      <button type="button" className="zd-link" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Skąd ten termin?
      </button>
      {open && <SourceBox source="paternityDeadline" />}
    </div>
  );
}

/** The parent's next steps; a dot fills only when the task is really done in the draft. */
function MiniPlan({ draft, onStep }: { draft: Draft; onStep: (target: PlanTarget) => void }) {
  const steps: { label: string; done: boolean; target: PlanTarget }[] = [
    { label: "Podaj datę początku", done: Boolean(draft.fields.start.value), target: "start" },
    { label: "Podaj datę zakończenia", done: Boolean(draft.fields.end.value), target: "end" },
    { label: "Dodaj odpis aktu urodzenia", done: Boolean(draft.attachment), target: "attachment" },
    { label: "Sprawdź szkic", done: false, target: "summary" },
  ];
  return (
    <div className="zd-plan" role="group" aria-label="Plan sprawy">
      <span className="zd-plan__title">Plan sprawy</span>
      {steps.map((step) => (
        <button key={step.label} type="button" className="zd-plan__step" onClick={() => onStep(step.target)}>
          <span className={`zd-plan__dot${step.done ? " zd-plan__dot--done" : ""}`} aria-hidden="true" />
          <span>{step.label}</span>
          <span className="zd-sr">{step.done ? ", zrobione" : ", do zrobienia"}</span>
        </button>
      ))}
    </div>
  );
}

/** Calculator comparison: a table skeleton first, then the table in the same place. */
function Comparison({ ready }: { ready: boolean }) {
  if (!ready)
    return (
      <div className="zd-skeleton" aria-label="Liczę porównanie…" role="status">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} style={{ width: i === 0 ? "60%" : "100%" }} />
        ))}
      </div>
    );
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="zd-table-wrap" tabIndex={0} role="region" aria-label="Porównanie wariantów">
        <table className="zd-table">
          <thead>
            <tr>
              <th scope="col">Wynik</th>
              {COMPARISON.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {row.values.map((value, i) => (
                  <td key={i}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="zd-note">{COMPARISON.assumptions}</p>
      <p>{COMPARISON.difference}</p>
    </div>
  );
}
