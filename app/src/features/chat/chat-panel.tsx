"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CASE_LABEL, STARTERS } from "./case-data";
import { CaseSteps, type CaseStepsProps } from "./case-steps";
import { TurnView } from "./turn-view";
import type { ConversationItem } from "./use-zusik-case";
import s from "./zusik.module.css";

type Props = {
  phone: boolean;
  fullscreen: boolean;
  showHistory: boolean;
  mascot: ReactNode;
  steps: CaseStepsProps;
  conversation: ConversationItem[];
  caseError: string | null;
  notice: string | null;
  composer: ReactNode;
  /** Reading position of this conversation, kept while the panel is collapsed or shows the history. */
  readScroll: () => number | null;
  onScrollSave: (top: number) => void;
  onRetryAsk: (requestId: string) => void;
  onRetryCase: () => void;
  onStarter: (text: string) => void;
  onHistory: (open: boolean) => void;
  onNewChat: () => void;
  onFullscreen: () => void;
  onCollapse: () => void;
};

export function ChatPanel(props: Props) {
  return (
    <section className={s.chat} aria-label="Czat z Zusikiem">
      <ChatHeader {...props} />
      {props.showHistory ? <History onBack={() => props.onHistory(false)} /> : <Thread {...props} />}
    </section>
  );
}

function ChatHeader({ phone, fullscreen, showHistory, onHistory, onNewChat, onFullscreen, onCollapse }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <header className={s.chatHead}>
      <div className={s.chatHeadTitle}>
        <p className={s.chatName}>
          Zusik · asystent AI{" "}
          <span className={s.aiBadge} aria-label="treści generowane przez AI">
            AI
          </span>
        </p>
        <p className={s.chatCase}>{CASE_LABEL}</p>
      </div>
      <button type="button" className={s.headButton} aria-pressed={showHistory} onClick={() => onHistory(!showHistory)}>
        <HistoryIcon />
        <span className={phone ? s.srOnly : undefined}>Historia</span>
      </button>
      {phone ? (
        <div className={s.menuWrap} onKeyDown={(event) => event.key === "Escape" && setMoreOpen(false)}>
          <button
            type="button"
            className={s.iconButton}
            aria-label="Więcej"
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
          >
            <MoreIcon />
          </button>
          {moreOpen && (
            <div className={s.menu} role="menu">
              <button
                type="button"
                role="menuitem"
                className={s.menuItem}
                autoFocus
                onClick={() => {
                  setMoreOpen(false);
                  onNewChat();
                }}
              >
                Nowa rozmowa
              </button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" className={s.iconButton} aria-label="Nowa rozmowa" onClick={onNewChat}>
          <NewChatIcon />
        </button>
      )}
      <button type="button" className={s.iconButton} aria-label={fullscreen ? "Podziel ekran" : "Pełny ekran"} onClick={onFullscreen}>
        {fullscreen ? <SplitIcon /> : <ExpandIcon />}
      </button>
      <button type="button" className={s.iconButton} aria-label="Zwiń czat" onClick={onCollapse}>
        <MinusIcon />
      </button>
    </header>
  );
}

function History({ onBack }: { onBack: () => void }) {
  return (
    <nav className={s.history} aria-label="Historia rozmów">
      <button type="button" className={s.secondaryButton} autoFocus onClick={onBack}>
        ← Wróć do rozmowy
      </button>
      <h3 className={s.historyGroup}>Ta sprawa</h3>
      <button type="button" className={s.historyItem} aria-current="true" onClick={onBack}>
        <span className={s.historyTop}>Urlop rodzicielski Marty</span>
        <span className={s.muted}>{CASE_LABEL}</span>
      </button>
      <p className={s.muted}>Wcześniejsze rozmowy pojawią się tu, gdy serwer zacznie zapisywać kilka rozmów dla jednej sprawy.</p>
    </nav>
  );
}

/** The conversation. New content keeps the reader's place; "↓ Nowa odpowiedź" brings them down. */
function Thread(props: Props) {
  const { conversation, steps, mascot, caseError, notice } = props;
  const list = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const signature = `${steps.view?.state}:${steps.pendingChoice}:${steps.preview}:${conversation
    .map((item) => `${item.requestId}:${item.state}`)
    .join("|")}`;
  const [reader, setReader] = useState({ atBottom: true, seen: signature });

  // restore the reading place when the thread opens again
  useLayoutEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = props.readScroll() ?? el.scrollHeight;
    // only when the thread mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // follow new content only when the reader is already at the bottom
  useLayoutEffect(() => {
    const el = list.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [signature]);

  // content can also grow without a new message (a source opens, fonts load): stay pinned at the bottom
  useEffect(() => {
    const el = list.current;
    const inner = content.current;
    if (!el || !inner) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  const onScroll = () => {
    const el = list.current;
    if (!el) return;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    atBottom.current = bottom;
    props.onScrollSave(el.scrollTop);
    setReader((current) => {
      if (bottom) return current.atBottom && current.seen === signature ? current : { atBottom: true, seen: signature };
      return current.atBottom ? { atBottom: false, seen: signature } : current;
    });
  };

  const toBottom = () => {
    const el = list.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    atBottom.current = true;
    setReader({ atBottom: true, seen: signature });
  };

  const newAnswer = !reader.atBottom && signature !== reader.seen;
  const showStarters = conversation.length === 0;

  return (
    <>
      <div ref={list} className={s.thread} onScroll={onScroll}>
        <div className={s.threadSpacer} />
        <div className={s.threadInner}>
          <div className={s.marginMascot} aria-hidden="true">
            {mascot}
          </div>
          <div ref={content} className={s.messages} aria-live="polite" aria-relevant="additions">
            <CaseSteps {...steps} />
            {conversation.map((item) => (
              <TurnView key={item.requestId} item={item} onRetry={props.onRetryAsk} />
            ))}
            {notice && (
              <p className={s.notice} role="status">
                {notice}
              </p>
            )}
            {caseError && (
              <div className={s.inlineError} role="alert">
                <span>{caseError}</span>
                <button type="button" className={s.secondaryButton} onClick={props.onRetryCase}>
                  Spróbuj ponownie
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={s.chatBottom}>
        {!reader.atBottom && (
          <button type="button" className={s.toBottom} aria-label={newAnswer ? undefined : "Wróć na dół"} onClick={toBottom}>
            ↓{newAnswer && " Nowa odpowiedź"}
          </button>
        )}
        {showStarters && (
          <div className={s.starters} role="group" aria-label="Pytania na start">
            {STARTERS.map((starter) => (
              <button key={starter} type="button" className={s.starter} onClick={() => props.onStarter(starter)}>
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

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function HistoryIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </svg>
  );
}
function NewChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function ExpandIcon() {
  return (
    <svg {...iconProps}>
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
    </svg>
  );
}
function SplitIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12h14" />
    </svg>
  );
}
function MoreIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}
