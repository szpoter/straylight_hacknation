"use client";

import { useEffect, useMemo, useState } from "react";
import { FIELD_LABELS, type FieldKey, type KamilView } from "@/lib/kamil/contract";
import { formatLong } from "@/lib/rules/dates";
import { isDateKey, originText, showValue } from "./document-step";
import type { PageImage } from "./read-document";
import type { Action } from "./use-kamil-case";
import { buildZamPdf, renderPages } from "./zam-pdf";
import s from "./kamil.module.css";

const EDITABLE: FieldKey[] = [
  "father_first_name",
  "father_last_name",
  "father_pesel",
  "father_street",
  "father_house",
  "father_flat",
  "father_postcode",
  "father_city",
  "payer_nip",
  "payer_name",
  "bank_account",
  "child_first_name",
  "child_last_name",
  "child_birth_date",
  "child_birth_place",
  "child_pesel",
  "mother_first_name",
  "mother_last_name",
  "mother_pesel",
];

interface EditRowProps {
  fieldKey: FieldKey;
  view: KamilView;
  busy: boolean;
  send: (a: Action) => Promise<boolean>;
}

function EditRow({ fieldKey, view, busy, send }: EditRowProps) {
  const fact = view.facts[fieldKey];
  const [value, setValue] = useState(fact?.value ?? "");
  const id = `edit-${fieldKey}`;
  const changed = value.trim() !== (fact?.value ?? "");
  return (
    <div className={s.fieldBody}>
      <label className={s.fieldLabel} htmlFor={id}>
        {FIELD_LABELS[fieldKey]}
      </label>
      <div className={s.composer}>
        <input
          id={id}
          className={s.input}
          type={isDateKey(fieldKey) ? "date" : "text"}
          value={value}
          onChange={(e) => setValue(isDateKey(fieldKey) ? e.target.value : e.target.value.toLocaleUpperCase("pl-PL"))}
        />
        <button
          className={s.ghost}
          type="button"
          disabled={busy || !changed || !value.trim()}
          onClick={() =>
            send({ type: "confirm", key: fieldKey, value: value.trim(), origin: { kind: "user_edit", previous: fact?.value ?? null } })
          }
        >
          Zapisz
        </button>
      </div>
      {fact && <span className={s.origin}>{originText(fact.origin)}</span>}
    </div>
  );
}

interface Props {
  view: KamilView;
  busy: boolean;
  send: (a: Action) => Promise<boolean>;
}

export function ZamStep({ view, busy, send }: Props) {
  const [pages, setPages] = useState<PageImage[] | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const draft = view.draft;
  const hasDraft = !!draft;
  // The PDF depends only on confirmed facts, the computed period and the date.
  const signature = useMemo(
    () => JSON.stringify([view.facts, view.result.period, view.result.partNumber, view.result.status, view.today]),
    [view.facts, view.result, view.today],
  );

  useEffect(() => {
    if (!hasDraft) return;
    let cancelled = false;
    let url: string | null = null;
    (async () => {
      try {
        const pdf = await buildZamPdf(view);
        const images = await renderPages(pdf);
        if (cancelled) return;
        url = URL.createObjectURL(new Blob([pdf.slice().buffer], { type: "application/pdf" }));
        setPdfUrl(url);
        setPages(images);
        setPreviewError(null);
      } catch (error) {
        if (cancelled) return;
        setPreviewError(
          (error as Error).name === "TemplateMismatchError"
            ? "Wzór ZAM się zmienił. Eksport czeka na sprawdzenie mapy pól."
            : "Nie udało się przygotować podglądu.",
        );
      }
    })();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild only when the form content changes
  }, [signature, hasDraft]);

  const other = view.facts.other_title_paternity;

  return (
    <section className={s.card} aria-labelledby="zam-title">
      <h2 id="zam-title" className={s.cardTitle}>
        <span className={s.step}>4</span> Wniosek ZAM
      </h2>
      <p className={s.muted}>
        Aktualny wzór ZUS z {formatLong(view.form.version)} · SHA-256 {view.form.sha256.slice(0, 12)}…{" "}
        <a href={view.form.sourceUrl} target="_blank" rel="noreferrer">
          wzór na zus.pl
        </a>
      </p>

      {!view.readyForDraft && !draft && (
        <p>
          ZAM przygotuję, gdy będzie wynik „Przysługuje” i potwierdzone dane.
          {view.zamMissing.length > 0 && ` Brakuje: ${view.zamMissing.map((k) => FIELD_LABELS[k].toLowerCase()).join(", ")}.`}
        </p>
      )}
      {view.readyForDraft && !draft && (
        <button className={s.primary} type="button" disabled={busy} onClick={() => send({ type: "create_draft" })}>
          Przygotuj szkic ZAM
        </button>
      )}

      {draft && (
        <>
          <p>
            Szkic z {formatLong(draft.createdAt.slice(0, 10))}, wersja {draft.version}.{" "}
            {draft.stale ? <strong>Dane zmieniły się od zatwierdzenia podglądu. Sprawdź podgląd.</strong> : "Podgląd zatwierdzony."}
          </p>
          {previewError && <p className={s.error}>{previewError}</p>}
          {pages ? (
            <div className={s.pages}>
              {pages.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element -- data URL rendered from the generated PDF
                <img
                  key={p.page}
                  className={s.pageImg}
                  src={p.url}
                  alt={`ZAM, strona ${p.page} z wypełnionymi danymi`}
                  width={p.width}
                  height={p.height}
                />
              ))}
            </div>
          ) : (
            !previewError && <p className={s.progress}>Przygotowuję podgląd…</p>
          )}
          <div className={s.row}>
            {pdfUrl && (
              <a
                className={s.primary}
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                href={pdfUrl}
                download="ZAM-okres-ojcowski-demo.pdf"
              >
                Pobierz PDF do wydruku
              </a>
            )}
            <button className={s.secondary} type="button" onClick={() => setEditing((v) => !v)}>
              {editing ? "Wróć do szkicu" : "Popraw dane"}
            </button>
            {draft.stale && (
              <button className={s.secondary} type="button" disabled={busy} onClick={() => send({ type: "create_draft" })}>
                Zatwierdzam podgląd
              </button>
            )}
          </div>
          {editing && (
            <div className={s.editGrid}>
              {EDITABLE.map((key) => (
                <EditRow key={`${key}:${view.facts[key]?.value ?? ""}`} fieldKey={key} view={view} busy={busy} send={send} />
              ))}
              <div className={s.fieldBody}>
                <span className={s.fieldLabel}>{FIELD_LABELS.other_title_paternity}</span>
                <span className={s.value}>{other ? showValue("other_title_paternity", other.value) : "—"}</span>
                <div className={s.row}>
                  {(["nie", "tak"] as const).map((v) => (
                    <button
                      key={v}
                      className={s.ghost}
                      type="button"
                      disabled={busy || other?.value === v}
                      onClick={() =>
                        send({
                          type: "confirm",
                          key: "other_title_paternity",
                          value: v,
                          origin: { kind: "user_edit", previous: other?.value ?? null },
                        })
                      }
                    >
                      {v.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className={s.fieldBody}>
            <button
              className={s.secondary}
              type="button"
              disabled={busy || draft.stale || view.result.status !== "eligible" || view.submission?.draftVersion === draft.version}
              onClick={() => send({ type: "simulate_submit" })}
            >
              Wyślij w symulacji
            </button>
            <span className={s.origin}>Symulacja demo. Nic nie trafia do ZUS.</span>
          </div>
          {view.submission && (
            <p className={s.simulated} role="status">
              <strong>Symulacja wysyłki</strong> · {formatLong(view.submission.at.slice(0, 10))}, szkic w wersji {view.submission.draftVersion}.
              Wniosek nie został wysłany do ZUS. Prawdziwy ZAM złóż przez PUE/eZUS lub w placówce
              {view.result.deadline ? ` do ${formatLong(view.result.deadline)}` : ""}.
              {view.submission.draftVersion !== draft.version && " Szkic zmienił się po symulacji."}
            </p>
          )}
        </>
      )}
    </section>
  );
}
