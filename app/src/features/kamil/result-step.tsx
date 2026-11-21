"use client";

import { useState } from "react";
import type { KamilView } from "@/lib/kamil/contract";
import { formatLong, formatRange, weekday } from "@/lib/rules/dates";
import type { Action } from "./use-kamil-case";
import s from "./kamil.module.css";

const STATUS: Record<KamilView["result"]["status"], string> = {
  eligible: "Przysługuje",
  needs_info: "Brakuje danych",
  not_eligible: "Nie przysługuje",
};

interface Props {
  view: KamilView;
  busy: boolean;
  send: (a: Action) => Promise<boolean>;
}

export function ResultStep({ view, busy, send }: Props) {
  const r = view.result;
  const [reminder, setReminder] = useState(view.reminder?.date ?? "");

  return (
    <section className={s.card} aria-labelledby="result-title">
      <h2 id="result-title" className={s.cardTitle}>
        <span className={s.step}>3</span> Okres, prawo i termin
      </h2>
      <p>
        <strong>{STATUS[r.status]}</strong>
        {r.status === "needs_info" && r.question ? ` · ${r.question}` : ""}
      </p>
      {r.period && r.deadline && (
        <>
          <p className={s.big}>
            {formatRange(r.period.start, r.period.end)} · {r.period.days} dni · część {r.partNumber}
          </p>
          <div className={s.dates}>
            <div className={`${s.dateBox} ${s.deadline}`}>
              <span className={s.fieldLabel}>Termin złożenia ZAM w ZUS</span>
              <p className={s.big}>{formatLong(r.deadline)}</p>
              <span className={s.origin}>{weekday(r.deadline)}, ostatni dzień przed początkiem okresu</span>
            </div>
            <div className={s.dateBox}>
              <span className={s.fieldLabel}>Twoje przypomnienie</span>
              {view.reminder ? (
                <>
                  <p className={s.big}>{formatLong(view.reminder.date)}</p>
                  <span className={s.origin}>{weekday(view.reminder.date)} · tylko w planie Zusika, ZUS go nie zna</span>
                </>
              ) : (
                <p className={s.origin}>Nie ustawiono</p>
              )}
              <div className={s.row}>
                <input
                  aria-label="Data przypomnienia"
                  className={s.input}
                  type="date"
                  min={view.today}
                  max={r.deadline}
                  value={reminder}
                  onChange={(e) => setReminder(e.target.value)}
                />
                <button
                  className={s.ghost}
                  type="button"
                  disabled={busy || !reminder}
                  onClick={() => send({ type: "set_reminder", date: reminder })}
                >
                  Ustaw
                </button>
              </div>
            </div>
          </div>
          {r.daysLeftAfter !== null && (
            <p className={s.muted}>
              Po tej części zostanie {r.daysLeftAfter} dni okresu ojcowskiego. Ostatni możliwy dzień:{" "}
              {r.lastAllowedDay ? formatLong(r.lastAllowedDay) : "—"}
            </p>
          )}
        </>
      )}
      {r.reasons.length > 0 && (
        <ul className={s.reasons}>
          {r.reasons.map((reason) => (
            <li key={`${reason.ruleId}-${reason.text}`}>
              {reason.ok ? "✓ " : "✗ "}
              {reason.text}{" "}
              {reason.citationId ? (
                <a href={`#src-${reason.citationId}`}>[źródło]</a>
              ) : (
                <span className={s.origin}>(założenie profilu demonstracyjnego)</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {view.citations.length > 0 && (
        <div className={s.sources}>
          {view.citations.map((c) => (
            <div key={c.id} id={`src-${c.id}`} className={s.source}>
              <a href={c.url} target="_blank" rel="noreferrer">
                {c.title}
              </a>
              <blockquote>„{c.quote}”</blockquote>
              <span className={s.origin}>Pobrano {formatLong(c.fetchedAt)}</span>
            </div>
          ))}
        </div>
      )}
      <p className={s.origin}>Reguła {r.rulesVersion}. Daty liczy kod, model tylko je opisuje.</p>
    </section>
  );
}
