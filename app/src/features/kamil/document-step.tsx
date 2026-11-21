"use client";

import { useState } from "react";
import { FIELD_LABELS, type Box, type FieldKey, type KamilView, type Origin } from "@/lib/kamil/contract";
import { formatShort, isValidIso } from "@/lib/rules/dates";
import type { PageImage } from "./read-document";
import type { Action } from "./use-kamil-case";
import s from "./kamil.module.css";

const DOC_KEYS: FieldKey[] = [
  "child_first_name",
  "child_last_name",
  "child_birth_date",
  "child_birth_place",
  "child_pesel",
  "mother_first_name",
  "mother_last_name",
];

export const isDateKey = (key: FieldKey) => key === "child_birth_date";

export function showValue(key: FieldKey, value: string): string {
  if (isDateKey(key) && isValidIso(value)) return formatShort(value);
  if (value === "tak" || value === "nie") return value.toUpperCase();
  return value;
}

export function originText(origin: Origin): string {
  switch (origin.kind) {
    case "document":
      return `Dokument „${origin.fileName}”, s. ${origin.page} · ${origin.method === "pdf_text" ? "tekst PDF" : `OCR ${origin.confidence}%`}`;
    case "user_edit":
      return origin.previous ? `Poprawione przez Ciebie (odczytano: ${origin.previous})` : "Wpisane przez Ciebie";
    case "chat":
      return `Z rozmowy: „${origin.quote.slice(0, 60)}${origin.quote.length > 60 ? "…" : ""}”`;
    case "profile":
      return origin.source;
  }
}

/** Shows the part of the page where the value was read, with some margin. */
export function Crop({ page, box, label }: { page: PageImage | undefined; box: Box; label: string }) {
  if (!page) return <div className={`${s.crop} ${s.cropMissing}`}>Wycinek wróci po ponownym dodaniu dokumentu</div>;
  const pad = 0.015;
  const bx = Math.max(0, box.x - pad);
  const by = Math.max(0, box.y - pad);
  const bw = Math.min(1 - bx, box.w + pad * 2);
  const bh = Math.min(1 - by, box.h + pad * 2);
  return (
    <div
      role="img"
      aria-label={`Wycinek dokumentu: ${label}`}
      className={s.crop}
      style={{
        aspectRatio: `${(bw * page.width) / (bh * page.height)}`,
        backgroundImage: `url(${page.url})`,
        backgroundSize: `${100 / bw}% auto`,
        backgroundPosition: `${bw < 1 ? (bx / (1 - bw)) * 100 : 0}% ${bh < 1 ? (by / (1 - bh)) * 100 : 0}%`,
      }}
    />
  );
}

interface RowProps {
  fieldKey: FieldKey;
  value: string;
  origin: Origin;
  confirmed: boolean;
  needsReview: boolean;
  reason: string | null;
  pages: PageImage[] | null;
  busy: boolean;
  send: (a: Action) => Promise<boolean>;
}

function FieldRow({ fieldKey, value, origin, confirmed, needsReview, reason, pages, busy, send }: RowProps) {
  const [editing, setEditing] = useState(needsReview && !confirmed);
  const [draft, setDraft] = useState(value);
  const label = FIELD_LABELS[fieldKey];
  const page = origin.kind === "document" ? pages?.find((p) => p.page === origin.page) : undefined;
  const inputId = `field-${fieldKey}`;

  const save = async (next: string) => {
    const unchanged = next === value;
    const ok = await send({
      type: "confirm",
      key: fieldKey,
      value: next,
      origin: unchanged ? origin : { kind: "user_edit", previous: value || null },
    });
    if (ok) setEditing(false);
  };

  return (
    <li className={`${s.field} ${needsReview && !confirmed ? s.fieldReview : ""} ${confirmed ? s.fieldDone : ""}`}>
      {origin.kind === "document" ? (
        <Crop page={page} box={origin.box} label={label} />
      ) : (
        <div className={`${s.crop} ${s.cropMissing}`}>Brak wycinka: wartość nie pochodzi z dokumentu</div>
      )}
      <div className={s.fieldBody}>
        <label className={s.fieldLabel} htmlFor={inputId}>
          {label}
        </label>
        {editing ? (
          <>
            <input
              id={inputId}
              className={s.input}
              type={isDateKey(fieldKey) ? "date" : "text"}
              value={draft}
              onChange={(e) => setDraft(isDateKey(fieldKey) ? e.target.value : e.target.value.toLocaleUpperCase("pl-PL"))}
            />
            <div className={s.row}>
              <button className={s.ghost} type="button" disabled={busy || !draft.trim()} onClick={() => save(draft.trim())}>
                Zapisz
              </button>
              <button className={s.ghost} type="button" onClick={() => setEditing(false)}>
                Anuluj
              </button>
            </div>
          </>
        ) : (
          <>
            <output id={inputId} className={s.value}>
              {value ? showValue(fieldKey, value) : "—"}
            </output>
            <div className={s.row}>
              {!confirmed && !needsReview && (
                <button className={s.ghost} type="button" disabled={busy} onClick={() => save(value)}>
                  Zgadza się
                </button>
              )}
              <button
                className={s.ghost}
                type="button"
                onClick={() => {
                  setDraft(value);
                  setEditing(true);
                }}
              >
                Popraw
              </button>
            </div>
          </>
        )}
        {needsReview && !confirmed && reason && <span className={s.reason}>Do sprawdzenia: {reason}</span>}
        <span className={s.origin}>{confirmed ? `Potwierdzone · ${originText(origin)}` : originText(origin)}</span>
      </div>
    </li>
  );
}

interface Props {
  view: KamilView;
  pages: PageImage[] | null;
  busy: boolean;
  reading: string | null;
  readError: string | null;
  onFile: (file: File) => void;
  onSample: (path: string, name: string) => void;
  send: (a: Action) => Promise<boolean>;
}

export function DocumentStep({ view, pages, busy, reading, readError, onFile, onSample, send }: Props) {
  const rows = DOC_KEYS.flatMap((key) => {
    const candidate = view.candidates.find((c) => c.key === key);
    if (candidate) {
      return [{ key, value: candidate.value, origin: candidate.origin, confirmed: false, needsReview: candidate.needsReview, reason: candidate.reason }];
    }
    const fact = view.facts[key];
    if (fact) return [{ key, value: fact.value, origin: fact.origin, confirmed: true, needsReview: false, reason: null }];
    return [];
  });
  const pending = view.candidates.filter((c) => !c.needsReview);

  return (
    <section className={s.card} aria-labelledby="doc-title">
      <h2 id="doc-title" className={s.cardTitle}>
        <span className={s.step}>1</span> Odpis aktu urodzenia
      </h2>
      <p className={s.muted}>
        Dokument czytam w Twojej przeglądarce i nigdzie go nie wysyłam. Do sprawy zapisuję tylko potwierdzone wartości i miejsce na
        stronie, z którego pochodzą.
      </p>
      <div className={s.row}>
        <label className={s.fileLabel}>
          Dodaj plik (PDF lub zdjęcie)
          <input
            className={s.fileInput}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            disabled={!!reading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className={s.row}>
        <span className={s.muted}>Przykład z danymi fikcyjnymi:</span>
        <button className={s.ghost} type="button" disabled={!!reading} onClick={() => onSample("/demo/kamil/odpis-aktu-urodzenia.pdf", "odpis-aktu-urodzenia.pdf")}>
          PDF z tekstem
        </button>
        <button className={s.ghost} type="button" disabled={!!reading} onClick={() => onSample("/demo/kamil/odpis-aktu-urodzenia-skan.jpg", "odpis-aktu-urodzenia-skan.jpg")}>
          Skan
        </button>
        <button className={s.ghost} type="button" disabled={!!reading} onClick={() => onSample("/demo/kamil/odpis-aktu-urodzenia-plama.jpg", "odpis-aktu-urodzenia-plama.jpg")}>
          Skan z plamą
        </button>
      </div>
      {reading && (
        <p className={s.progress} role="status" aria-live="polite">
          {reading}
        </p>
      )}
      {readError && <p className={s.error}>{readError}</p>}
      {rows.length > 0 && (
        <>
          <ul className={s.fields}>
            {rows.map((row) => (
              <FieldRow
                key={`${row.key}:${row.value}:${row.confirmed}`}
                fieldKey={row.key}
                value={row.value}
                origin={row.origin}
                confirmed={row.confirmed}
                needsReview={row.needsReview}
                reason={row.reason}
                pages={pages}
                busy={busy}
                send={send}
              />
            ))}
          </ul>
          {pending.length > 1 && (
            <button
              className={s.secondary}
              type="button"
              disabled={busy}
              onClick={async () => {
                for (const c of pending) await send({ type: "confirm", key: c.key, value: c.value, origin: c.origin });
              }}
            >
              Wszystko się zgadza ({pending.length})
            </button>
          )}
        </>
      )}
    </section>
  );
}
