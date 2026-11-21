"use client";

import chat from "../chat/zusik.module.css";
import { FIELD_LABELS, type KamilView } from "@/lib/kamil/contract";
import { formatLong } from "@/lib/rules/dates";
import { Crop, originText } from "./document-step";
import type { PageImage } from "./read-document";
import type { Action } from "./use-kamil-case";
import s from "./kamil.module.css";
import type { CaseChatEntry } from "../chat/case-chat-window";

/** Suggestions follow the conversation from TECH-SPEC-AGENT.md, scenario 2. */
function suggestions(view: KamilView): string[] {
  const asked = view.chat.filter((t) => t.role === "zusik").at(-1)?.text ?? "";
  if (view.chat.length === 0) return ["Prowadzę firmę. Chcę przez tydzień zająć się synem. Czy przysługuje mi wypłata?"];
  if (/Czy pobierałeś/.test(asked)) return ["Nie", "Tak"];
  if (!view.request?.start) return ["Od 8 grudnia. Jeden tydzień, drugi zostawię na później"];
  if (view.result.status === "eligible" && !view.reminder) return ["Przypomnij mi 4 grudnia", "Jednak od 11 stycznia"];
  return [];
}

export function kamilEntries(view: KamilView | null): CaseChatEntry[] {
  if (!view) return [];
  return view.chat.map(turn => ({
    id: turn.id,
    at: turn.at,
    content: turn.role === "kamil" ? (
      <div className={chat.userRow}><p className={chat.userBubble}>{turn.text}</p></div>
    ) : (
      <div className={chat.aiMessage} data-chat-reply>
        <p className={s.reply}>{turn.text}</p>
        {turn.citationIds?.length ? (
          <p className={s.author}>Źródło: {turn.citationIds.map((id, i) => {
            const citation = view.citations.find(item => item.id === id);
            return citation && <span key={id}>{i > 0 && " · "}
              <a href={citation.url} target="_blank" rel="noreferrer">{citation.title.replace(/^ZUS, /, "")}</a>
            </span>;
          })}</p>
        ) : null}
      </div>
    ),
  }));
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
    <>
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
    </>
  );
}
