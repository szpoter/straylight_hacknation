"use client";

import { useState } from "react";
import { FIELD_LABELS, formatDate, type Draft, type DraftId, type FieldKey } from "./data";
import type { PlanTarget } from "./MessageView";

type Props = {
  draft: Draft;
  /** "full": the whole form; "fragment": only the current field, above the chat on a phone. */
  mode: "full" | "fragment";
  focus: PlanTarget;
  /** The field Zusik just changed (outlined with the Border Beam) and a key to replay it. */
  changed: { field: FieldKey; key: number } | null;
  onChangeField: (field: FieldKey, iso: string) => void;
  onSwitchDraft: (id: DraftId) => void;
};

export function DraftForm({ draft, mode, focus, changed, onChangeField, onSwitchDraft }: Props) {
  const field = (key: FieldKey) => (
    <DateField
      key={`${key}-${changed?.field === key ? changed.key : 0}`}
      field={key}
      draft={draft}
      changed={changed?.field === key}
      onSave={(iso) => onChangeField(key, iso)}
    />
  );

  if (mode === "fragment")
    return (
      <div className="zd-form__inner">
        <p className="zd-crumb">{draft.title} · Szkic</p>
        {focus === "start" || focus === "end" ? field(focus) : focus === "attachment" ? <AttachmentRow draft={draft} /> : <Summary draft={draft} focused />}
      </div>
    );

  return (
    <div className="zd-form__inner">
      <div className="zd-row" style={{ justifyContent: "space-between" }}>
        <p className="zd-crumb">Dokumenty i wnioski › {draft.title.replace("Wniosek o ", "")}</p>
        <label className="zd-switch">
          Szkic
          <select value={draft.id} onChange={(event) => onSwitchDraft(event.target.value as DraftId)}>
            <option value="ola-ojcowski">Urlop ojcowski</option>
            <option value="ola-rodzicielski">Urlop rodzicielski</option>
          </select>
        </label>
      </div>
      <div className="zd-title-row">
        <h1 className="zd-title">{draft.title}</h1>
        <span className="zd-badge">Szkic</span>
      </div>
      <p className="zd-muted">Do pracodawcy · {draft.recipient}</p>
      <StaticField label="Wnioskodawca" value={draft.applicant} />
      <StaticField label="Dziecko" value={draft.child} />
      <StaticField label="Rodzaj urlopu" value={draft.kind} />
      <div className="zd-grid2">
        {field("start")}
        {field("end")}
      </div>
      <AttachmentRow draft={draft} />
      <Summary draft={draft} focused={focus === "summary"} />
    </div>
  );
}

function StaticField({ label, value }: { label: string; value: string }) {
  return (
    <div className="zd-field">
      <span className="zd-field__label">{label}</span>
      <div className="zd-field__box">{value}</div>
    </div>
  );
}

/** A date field with "Zmień": the parent can correct the value by hand, like a GOV.UK check-answers row. */
function DateField({ field, draft, changed, onSave }: { field: FieldKey; draft: Draft; changed: boolean; onSave: (iso: string) => void }) {
  const [editing, setEditing] = useState(false);
  const value = draft.fields[field].value;
  const [input, setInput] = useState(value ?? "");
  const id = `zd-field-${field}`;
  return (
    <div className={`zd-field${changed ? " zd-field--changed" : ""}`} data-field={field}>
      <span className="zd-field__label" id={`${id}-label`}>
        {FIELD_LABELS[field]}
        {!editing && (
          <button
            type="button"
            className="zd-link"
            aria-label={`${value ? "Zmień" : "Uzupełnij"}: ${FIELD_LABELS[field]}`}
            onClick={() => {
              setInput(value ?? "");
              setEditing(true);
            }}
          >
            {value ? "Zmień" : "Uzupełnij"}
          </button>
        )}
      </span>
      {editing ? (
        <form
          className="zd-field__edit"
          onSubmit={(event) => {
            event.preventDefault();
            if (input) onSave(input);
            setEditing(false);
          }}
        >
          <input id={id} type="date" aria-labelledby={`${id}-label`} value={input} autoFocus onChange={(event) => setInput(event.target.value)} />
          <button type="submit" className="zd-btn">
            Zapisz
          </button>
          <button type="button" className="zd-btn zd-btn--ghost" onClick={() => setEditing(false)}>
            Anuluj
          </button>
        </form>
      ) : (
        <div className={`zd-field__box${value ? "" : " zd-field__box--empty"}`} aria-labelledby={`${id}-label`} role="group">
          <span data-value>{value ? formatDate(value) : "Brakuje daty"}</span>
        </div>
      )}
      {changed && !editing && (
        <span className="zd-field__note" role="status">
          ✓ Zaktualizowano
        </span>
      )}
    </div>
  );
}

function AttachmentRow({ draft }: { draft: Draft }) {
  return (
    <div className="zd-field" data-field="attachment">
      <span className="zd-field__label">Załącznik</span>
      <div className={`zd-field__box${draft.attachment ? "" : " zd-field__box--empty"}`}>
        {draft.attachment ?? "Odpis aktu urodzenia · dołącz go w rozmowie z Zusikiem"}
      </div>
    </div>
  );
}

function Summary({ draft, focused }: { draft: Draft; focused: boolean }) {
  return (
    <section className={`zd-summary${focused ? " zd-summary--focus" : ""}`} data-field="summary" aria-label="Podsumowanie szkicu">
      <strong>Podsumowanie</strong>
      <span className="zd-muted">
        {FIELD_LABELS.start}: {formatDate(draft.fields.start.value)} · {FIELD_LABELS.end}: {formatDate(draft.fields.end.value)}
      </span>
      <span className="zd-muted">Załącznik: {draft.attachment ?? "brak"}</span>
    </section>
  );
}
