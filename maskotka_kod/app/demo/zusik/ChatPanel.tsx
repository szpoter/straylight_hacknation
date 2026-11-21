"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Draft } from "./data";
import type { Message } from "./agent";
import { MessageView, type MessageActions } from "./MessageView";
import { ExpandIcon, HistoryIcon, MinusIcon, MoreIcon, NewChatIcon, SplitIcon } from "./icons";

export type ThreadSummary = { id: string; title: string; caseLabel: string; updatedAt: number };

type Props = {
  threadId: string;
  caseLabel: string;
  messages: Message[];
  draft: Draft;
  phone: boolean;
  fullscreen: boolean;
  busy: boolean;
  showHistory: boolean;
  history: ThreadSummary[];
  starters: string[] | null;
  mascot: ReactNode;
  composer: ReactNode;
  /** The saved reading place of this thread, read when the thread opens. */
  readScroll: () => number | undefined;
  actions: MessageActions;
  onScrollSave: (top: number) => void;
  onStarter: (text: string) => void;
  onHistory: (open: boolean) => void;
  onPickThread: (id: string) => void;
  onNewThread: () => void;
  onFullscreen: () => void;
  onCollapse: () => void;
};

const DAY = 86_400_000;

function groupLabel(time: number, now: number) {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (time >= startOfToday) return "Dzisiaj";
  if (time >= startOfToday - DAY) return "Wczoraj";
  return "Wcześniej";
}

function timeLabel(time: number, group: string) {
  const date = new Date(time);
  return group === "Wcześniej"
    ? date.toLocaleDateString("pl-PL", { day: "numeric", month: "long" })
    : date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

export function ChatPanel(props: Props) {
  const { messages, phone, fullscreen, showHistory } = props;
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <section className="zd-chat" aria-label="Czat z Zusikiem" style={{ flex: 1 }}>
      <header className="zd-head">
        <div className="zd-head__title">
          <p className="zd-head__name">
            Zusik · asystent AI <span className="zd-badge zd-badge--ai">AI</span>
          </p>
          <p className="zd-head__case">{props.caseLabel}</p>
        </div>
        <button
          type="button"
          className="zd-icon-btn"
          aria-pressed={showHistory}
          aria-label={phone ? "Historia" : undefined}
          onClick={() => props.onHistory(!showHistory)}
        >
          <HistoryIcon />
          {!phone && "Historia"}
        </button>
        {phone ? (
          <div className="zd-menu-wrap" onKeyDown={(event) => event.key === "Escape" && setMoreOpen(false)}>
            <button type="button" className="zd-icon-btn" aria-label="Więcej" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
              <MoreIcon />
            </button>
            {moreOpen && (
              <div className="zd-menu zd-menu--down" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="zd-menu__item"
                  autoFocus
                  onClick={() => {
                    setMoreOpen(false);
                    props.onNewThread();
                  }}
                >
                  Nowa rozmowa
                </button>
              </div>
            )}
          </div>
        ) : (
          <button type="button" className="zd-icon-btn" aria-label="Nowa rozmowa" onClick={props.onNewThread}>
            <NewChatIcon />
          </button>
        )}
        <button type="button" className="zd-icon-btn" aria-label={fullscreen ? "Podziel ekran" : "Pełny ekran"} onClick={props.onFullscreen}>
          {fullscreen ? <SplitIcon /> : <ExpandIcon />}
        </button>
        <button type="button" className="zd-icon-btn" aria-label="Zwiń czat" onClick={props.onCollapse}>
          <MinusIcon />
        </button>
      </header>

      {showHistory ? (
        <History {...props} />
      ) : (
        <Thread key={props.threadId} {...props} messages={messages} />
      )}
    </section>
  );
}

function History({ history, threadId, onHistory, onPickThread }: Props) {
  const [now] = useState(() => Date.now());
  const groups = new Map<string, ThreadSummary[]>();
  [...history]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((entry) => {
      const label = groupLabel(entry.updatedAt, now);
      groups.set(label, [...(groups.get(label) ?? []), entry]);
    });
  return (
    <nav className="zd-history" aria-label="Historia rozmów">
      <button type="button" className="zd-btn zd-btn--ghost" style={{ justifySelf: "start" }} autoFocus onClick={() => onHistory(false)}>
        ← Wróć do rozmowy
      </button>
      {[...groups].map(([label, entries]) => (
        <div key={label} style={{ display: "grid", gap: 8 }}>
          <h3>{label}</h3>
          {entries.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="zd-history__item"
              aria-current={entry.id === threadId}
              onClick={() => onPickThread(entry.id)}
            >
              <span className="zd-history__top">
                <span>{entry.title}</span>
                <span className="zd-history__time">{timeLabel(entry.updatedAt, label)}</span>
              </span>
              <span className="zd-history__case">{entry.caseLabel}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

/** The conversation. New content keeps the reader's place; "↓ Nowa odpowiedź" brings them down. */
function Thread(props: Props) {
  const { messages, draft, phone, busy, mascot, actions, starters } = props;
  const list = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const latestAnswer = [...messages].reverse().find((m) => m.role === "assistant");
  /** Changes whenever Zusik's latest answer grows; compared with what the reader has seen. */
  const signature = `${messages.length}:${latestAnswer && "revealed" in latestAnswer ? `${latestAnswer.id}:${latestAnswer.revealed}:${latestAnswer.status}` : ""}`;
  const [view, setView] = useState({ atBottom: true, seen: signature });

  // restore the reading place of this thread when it opens again
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    el.scrollTop = props.readScroll() ?? el.scrollHeight;
    // only when the thread mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow new content only when the reader is already at the bottom
  useLayoutEffect(() => {
    const el = list.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [signature]);

  const onScroll = () => {
    const el = list.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    atBottom.current = bottom;
    props.onScrollSave(el.scrollTop);
    // at the bottom everything is seen; leaving the bottom remembers what was there at that moment
    setView((v) => {
      if (bottom) return v.atBottom && v.seen === signature ? v : { atBottom: true, seen: signature };
      return v.atBottom ? { atBottom: false, seen: signature } : v;
    });
  };

  const toBottom = () => {
    const el = list.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    atBottom.current = true;
    setView({ atBottom: true, seen: signature });
  };

  const newAnswer = !view.atBottom && signature !== view.seen;
  const lastIndex = messages.length - 1;

  return (
    <>
      <div ref={list} className={`zd-thread${phone ? " zd-thread--phone" : ""}`} onScroll={onScroll} aria-live="polite" aria-relevant="additions">
        <div className="zd-thread__spacer" />
        {messages.length === 0 && (
          <div className="zd-ai">
            <div className="zd-ai__margin" data-zusik-margin>
              {mascot}
            </div>
            <p className="zd-question">Pomogę Ci wypełnić ten wniosek.</p>
            <p className="zd-muted">Wybierz pytanie poniżej albo napisz własne.</p>
          </div>
        )}
        {messages.map((message, i) => (
          <MessageView
            key={message.id}
            message={message}
            draft={draft}
            latest={i === lastIndex || (i === lastIndex - 1 && messages[lastIndex].role === "user")}
            busy={busy}
            mascot={message === latestAnswer ? mascot : undefined}
            actions={actions}
          />
        ))}
      </div>
      <div className="zd-bottom">
        {!view.atBottom && (
          <button type="button" className="zd-down" aria-label={newAnswer ? undefined : "Wróć na dół"} onClick={toBottom}>
            ↓{newAnswer && " Nowa odpowiedź"}
          </button>
        )}
        {starters && (
          <div className="zd-starters" aria-label="Pytania na start">
            {starters.map((starter) => (
              <button key={starter} type="button" className="zd-starter" onClick={() => props.onStarter(starter)}>
                {starter}
                <span aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        )}
        {props.composer}
      </div>
    </>
  );
}
