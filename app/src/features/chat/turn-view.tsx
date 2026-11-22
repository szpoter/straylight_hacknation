"use client";

import { useId, useRef, useState } from "react";
import { groundedClaims, pdfPage, type Answer, type Citation } from "./contract";
import type { ConversationItem } from "./use-zusik-case";
import s from "./zusik.module.css";

type Props = {
  item: ConversationItem;
  activity: string | null;
  partialText: string;
  asking: boolean;
  onRetry: (requestId: string) => void;
};

/** One question from the parent and Zusik's answer to it. */
export function TurnView({ item, activity, partialText, asking, onRetry }: Props) {
  return (
    <>
      <div className={s.userRow}>
        <p className={s.userBubble}>{item.question}</p>
      </div>
      {item.state === "sending" && (
        <>
          {activity && <Progress label={activity} />}
          {partialText && <p className={s.partialAnswer} aria-live="off">{partialText}</p>}
        </>
      )}
      {item.state === "lost" && (
        <div className={s.inlineError} role="alert">
          <span>Utracono połączenie. Pytanie jest zapisane w tej karcie.</span>
          <button type="button" className={s.secondaryButton} disabled={asking} onClick={() => onRetry(item.requestId)}>
            Ponów odpowiedź
          </button>
        </div>
      )}
      {item.state === "done" && item.answer && <AnswerView answer={item.answer} />}
    </>
  );
}

export function Progress({ label }: { label: string }) {
  return (
    <p className={s.progress} role="status">
      <span className={s.progressDot} aria-hidden="true" />
      {label}
    </p>
  );
}

export function AnswerView({ answer }: { answer: Answer }) {
  if (answer.status === "conversation") return <div className={s.aiMessage}><p>{answer.message}</p></div>;
  if (answer.status === "needs_clarification" && !groundedClaims(answer).claims.length) {
    return (
      <div className={s.aiMessage}>
        <p className={s.aiQuestion}>{answer.message ?? "Doprecyzuj, proszę, o co pytasz."}</p>
      </div>
    );
  }
  if (answer.status === "insufficient_evidence") {
    // No sources here on purpose: a missing basis is not shown as a reason to refuse the benefit.
    return (
      <div className={s.aiMessage}>
        {answer.message ? (
          <p>{answer.message}</p>
        ) : (
          <>
            <p>Materiały, które mam, nie wystarczają, żeby odpowiedzieć na to pytanie.</p>
            <p className={s.muted}>Brak podstawy w tych źródłach nie oznacza, że świadczenie Ci nie przysługuje.</p>
          </>
        )}
      </div>
    );
  }
  if (answer.status === "unavailable") {
    return (
      <div className={s.inlineError} role="alert">
        <span>{answer.message ?? "Baza wiedzy jest chwilowo niedostępna."}</span>
      </div>
    );
  }
  return <GroundedAnswer answer={answer} />;
}

function GroundedAnswer({ answer }: { answer: Answer }) {
  const { claims, citations } = groundedClaims(answer);
  const [open, setOpen] = useState<{ claim: number; id: string } | null>(null);
  const chips = useRef(new Map<string, HTMLButtonElement>());
  const baseId = useId();

  if (claims.length === 0) {
    return (
      <div className={s.aiMessage}>
        <p>Nie znalazłem w materiałach podstawy, którą mogę Ci pokazać przy tej odpowiedzi.</p>
      </div>
    );
  }

  const close = (claim: number, id: string) => {
    setOpen(null);
    chips.current.get(`${claim}:${id}`)?.focus();
  };

  return (
    <div className={s.aiMessage}>
      {claims.map((claim, claimIndex) => {
        const panelId = `${baseId}-c${claimIndex}`;
        const shown = open?.claim === claimIndex ? citations.find((c) => c.id === open.id) : undefined;
        return (
          <div key={claimIndex} className={s.claim}>
            <p>
              {claim.text}
              {claim.citationIds.map((id, i) => {
                const citation = citations.find((c) => c.id === id) as Citation;
                const expanded = open?.claim === claimIndex && open.id === id;
                return (
                  <button
                    key={id}
                    ref={(el) => {
                      if (el) chips.current.set(`${claimIndex}:${id}`, el);
                    }}
                    type="button"
                    className={s.footnote}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    aria-label={`Źródło ${claim.numbers[i]}: ${citation.title}${citation.locator ? `, ${citation.locator}` : ""}`}
                    onClick={() => (expanded ? close(claimIndex, id) : setOpen({ claim: claimIndex, id }))}
                  >
                    {claim.numbers[i]}
                  </button>
                );
              })}
            </p>
            <div id={panelId} hidden={!shown}>
              {shown && <SourceCard citation={shown} onClose={() => close(claimIndex, shown.id)} />}
            </div>
          </div>
        );
      })}
      {answer.message && <p className={s.muted}>{answer.message}</p>}
    </div>
  );
}

function SourceCard({ citation, onClose }: { citation: Citation; onClose: () => void }) {
  const page = citation.page ?? pdfPage(citation.url);
  const headings = citation.headingPath?.filter(Boolean) ?? [];
  return (
    <section className={s.source} aria-label={`Źródło: ${citation.title}`}>
      <p className={s.sourceTitle}>{citation.title}</p>
      {citation.locator && <p className={s.sourceLocator}>{citation.locator}</p>}
      {headings.length > 0 && <p className={s.sourceLocator}>Na stronie: {headings.join(" › ")}</p>}
      {citation.quote && <blockquote className={s.sourceQuote}>„{citation.quote}”</blockquote>}
      <div className={s.sourceActions}>
        {citation.url && (
          <a className={s.sourceLink} href={citation.url} target="_blank" rel="noopener noreferrer">
            {page ? `Otwórz dokument na s. ${page}` : "Otwórz dokument"}
            <span className={s.srOnly}> (w nowej karcie)</span>
          </a>
        )}
        <button type="button" className={s.textButton} onClick={onClose}>
          Zamknij źródło
        </button>
      </div>
      {citation.origin && <p className={s.sourceMeta}>
        {citation.origin === "official_live" ? "Pobrano ze strony ZUS" : "Z biblioteki źródeł"}
        {citation.retrievedAt && <span> · <time dateTime={citation.retrievedAt}>{citation.retrievedAt.slice(0, 10)}</time></span>}
      </p>}
      {citation.corpusVersion && <p className={s.sourceMeta}>Wersja materiałów: {citation.corpusVersion}</p>}
    </section>
  );
}
