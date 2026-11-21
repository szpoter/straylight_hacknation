"use client";


import { FIELD_LABELS, type KamilView } from "@/lib/kamil/contract";
import { formatLong } from "@/lib/rules/dates";
import { Crop, originText } from "./document-step";
import type { PageImage } from "./read-document";
import type { Action } from "./use-kamil-case";
import s from "./kamil.module.css";

/** Suggestions follow the conversation from TECH-SPEC-AGENT.md, scenario 2. */
function suggestions(view: KamilView): string[] {
  const asked = view.chat.filter((t) => t.role === "zusik").at(-1)?.text ?? "";
  if (view.chat.length === 0) return ["Prowadzę firmę. Chcę przez tydzień zająć się synem. Czy przysługuje mi wypłata?"];
  if (/Czy pobierałeś/.test(asked)) return ["Nie", "Tak"];
  if (!view.request?.start) return ["Od 8 grudnia. Jeden tydzień, drugi zostawię na później"];
  if (view.result.status === "eligible" && !view.reminder) return ["Przypomnij mi 4 grudnia", "Jednak od 11 stycznia"];
  return [];
}

interface Props {
  view: KamilView;
  pages: PageImage[] | null;
  busy: boolean;
  send: (a: Action) => Promise<boolean>;
}

export function ChatStep({ view, pages, busy, send }: Props) {
  const conflict = view.conflict;
  const docOrigin = conflict
    ? (view.candidates.find((c) => c.key === conflict.key)?.origin ??
      (view.facts[conflict.key]?.origin.kind === "document" ? view.facts[conflict.key]?.origin : null) ??
      null)
    : null;

  return (
    <section className={s.card} aria-labelledby="chat-title">
      <h2 id="chat-title" className={s.cardTitle}>
        <span className={s.step}>2</span> Rozmowa z Zusikiem
      </h2>
      <div className={s.chat} role="log" aria-live="polite" aria-label="Rozmowa">
        {view.chat.length === 0 && (
          <p className={s.bubbleZusik}>
            Cześć, Kamil. Zapytaj o zasiłek za okres ojcowski. Daty i terminy liczy kod, ja je wyjaśniam i podaję źródło.
          </p>
        )}
        {view.chat.map((turn) =>
          turn.role === "kamil" ? (
            <p key={turn.id} className={s.bubbleKamil}>
              {turn.text}
            </p>
          ) : (
            <div key={turn.id} className={s.bubbleZusik} data-chat-reply>
              <p>{turn.text}</p>
              {turn.citationIds && turn.citationIds.length > 0 && (
                <p className={s.author}>
                  Źródło:{" "}
                  {turn.citationIds.map((id, i) => {
                    const c = view.citations.find((x) => x.id === id);
                    return c ? (
                      <span key={id}>
                        {i > 0 && " · "}
                        <a href={`#src-${id}`}>{c.title.replace(/^ZUS, /, "")}</a>
                      </span>
                    ) : null;
                  })}
                </p>
              )}
            </div>
          ),
        )}
      </div>

      {conflict && (
        <div className={s.conflict} role="group" aria-labelledby="conflict-title">
          <p id="conflict-title">
            <strong>{FIELD_LABELS[conflict.key]}: dwie różne wartości.</strong> Której użyć?
          </p>
          <div className={s.compare}>
            <div className={s.fieldBody}>
              <span className={s.fieldLabel}>W dokumencie</span>
              {docOrigin?.kind === "document" && (
                <Crop page={pages?.find((p) => p.page === docOrigin.page)} box={docOrigin.box} label={FIELD_LABELS[conflict.key]} />
              )}
              <span className={s.value}>{formatLong(conflict.documentValue)}</span>
              {docOrigin && <span className={s.origin}>{originText(docOrigin)}</span>}
              <button
                className={s.secondary}
                type="button"
                disabled={busy}
                onClick={() => send({ type: "resolve_conflict", key: conflict.key, pick: "document" })}
              >
                Użyj daty z dokumentu
              </button>
            </div>
            <div className={s.fieldBody}>
              <span className={s.fieldLabel}>W rozmowie</span>
              <span className={s.value}>{formatLong(conflict.chatValue)}</span>
              <span className={s.origin}>„{conflict.chatQuote}”</span>
              <button
                className={s.secondary}
                type="button"
                disabled={busy}
                onClick={() => send({ type: "resolve_conflict", key: conflict.key, pick: "chat" })}
              >
                Użyj daty z rozmowy
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={s.suggestions}>
        {suggestions(view).map((sug) => (
          <button key={sug} className={s.ghost} type="button" disabled={busy} onClick={() => void send({ type: "chat", text: sug })}>
            {sug}
          </button>
        ))}
      </div>
    </section>
  );
}
