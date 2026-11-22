"use client";

import type { Ref } from "react";
import type { Choice } from "@/lib/zusik/constants";
import {
  CHOICE_FIELD_LABEL,
  CHOICE_TEXT,
  DRAFT_TITLE,
  EMPTY_CHOICE_TEXT,
  PENDING_ROWS,
  PROFILE_ROWS,
  RECIPIENT,
  type ProfileRow,
} from "./case-data";
import s from "./zusik.module.css";

type Props = {
  savedChoice: Choice | null;
  pendingChoice: Choice | null;
  preview: Choice | null;
  /** "full": the whole draft; "fragment": only the current field, above the chat on a phone. */
  mode: "full" | "fragment";
  /** The field just got a confirmed save: outline it once (Border Beam). */
  highlight: boolean;
  fieldRef: Ref<HTMLDivElement>;
  onDecide: () => void;
};

/** Marta's draft as a GOV.UK "check answers" list. One field is stored on the server today. */
export function DraftForm({ savedChoice, pendingChoice, preview, mode, highlight, fieldRef, onDecide }: Props) {
  const field = (
    <ChoiceField
      saved={savedChoice}
      pending={pendingChoice}
      preview={preview}
      highlight={highlight}
      fieldRef={fieldRef}
      onDecide={onDecide}
    />
  );

  if (mode === "fragment") {
    return (
      <div className={s.fragment}>
        <p className={s.crumb}>{DRAFT_TITLE} · Szkic</p>
        <dl className={s.summary}>{field}</dl>
      </div>
    );
  }

  return (
    <div className={s.sheet}>
      <p className={s.crumb}>Dokumenty i wnioski › {DRAFT_TITLE}</p>
      <div className={s.titleRow}>
        <h1 className={s.title}>{DRAFT_TITLE}</h1>
        <span className={s.badge}>Szkic</span>
      </div>
      <p className={s.muted}>Do pracodawcy · {RECIPIENT}</p>

      <dl className={s.summary}>
        {PROFILE_ROWS.map((row) => (
          <StaticRow key={row.key} row={row} />
        ))}
        {field}
        {PENDING_ROWS.map((row) => (
          <StaticRow key={row.key} row={row} />
        ))}
      </dl>
    </div>
  );
}

function StaticRow({ row }: { row: ProfileRow }) {
  return (
    <div className={s.summaryRow}>
      <dt className={s.summaryKey}>{row.label}</dt>
      <dd className={s.summaryValue}>
        {row.value}
        {row.note && <span className={s.summaryNote}>{row.note}</span>}
      </dd>
    </div>
  );
}

function ChoiceField({
  saved,
  pending,
  preview,
  highlight,
  fieldRef,
  onDecide,
}: {
  saved: Choice | null;
  pending: Choice | null;
  preview: Choice | null;
  highlight: boolean;
  fieldRef: Ref<HTMLDivElement>;
  onDecide: () => void;
}) {
  const proposed = pending ?? preview;
  const classes = [s.summaryRow, s.choiceField, highlight ? s.beam : "", !saved && proposed ? s.proposed : ""].join(" ");
  return (
    <div ref={fieldRef} tabIndex={-1} className={classes} data-field="choice">
      <dt className={s.summaryKey}>{CHOICE_FIELD_LABEL}</dt>
      <dd className={s.summaryValue}>
        {saved ? (
          <>
            {CHOICE_TEXT[saved].long}
            <span className={s.savedNote} role={highlight ? "status" : undefined}>
              ✓ Zapisane w sprawie
            </span>
          </>
        ) : proposed ? (
          <>
            <span>
              <span className={s.strike}>{EMPTY_CHOICE_TEXT}</span> → <strong>{CHOICE_TEXT[proposed].short}</strong>
            </span>
            <span className={s.summaryNote}>{pending ? "Twoja decyzja · zapisuję…" : "Propozycja · jeszcze niezapisana"}</span>
          </>
        ) : (
          <span className={s.emptyValue}>{EMPTY_CHOICE_TEXT}</span>
        )}
      </dd>
      <dd className={s.summaryAction}>
        {!saved && (
          <button type="button" className={s.textButton} onClick={onDecide}>
            {proposed ? "Dokończ w rozmowie" : "Ustal z Zusikiem"}
            <span className={s.srOnly}>: {CHOICE_FIELD_LABEL}</span>
          </button>
        )}
      </dd>
    </div>
  );
}
