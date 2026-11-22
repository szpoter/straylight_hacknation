"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ScenarioMenu, type Scenario } from "./scenario-nav";
import { CASE_LABEL } from "./case-data";
import { CaseSteps, type CaseStepsProps } from "./case-steps";
import { TurnView } from "./turn-view";
import type { ConversationItem } from "./use-zusik-case";
import s from "./zusik.module.css";

type Props = {
  fullscreen: boolean;
  mascot: ReactNode;
  steps: CaseStepsProps;
  conversation: ConversationItem[];
  caseError: string | null;
  notice: string | null;
  composer: ReactNode;
  workflow?: ReactNode;
  workflowVersion?: number;
  activity: string | null;
  partialText: string;
  /** Reading position of this conversation, kept while the panel is collapsed. */
  readScroll: () => number | null;
  onScrollSave: (top: number) => void;
  onRetryAsk: (requestId: string) => void;
  onRetryCase: () => void;
  onFullscreen: () => void;
  onCollapse: () => void;
};

export function ChatPanel(props: Props) {
  return (
    <section className={s.chat} aria-label="Czat z Zusikiem">
      <ChatHeader label={CASE_LABEL} scenario="marta" fullscreen={props.fullscreen} onFullscreen={props.onFullscreen} onCollapse={props.onCollapse} />
      <Thread {...props} />
    </section>
  );
}

export function ChatHeader({ label, scenario, fullscreen, onFullscreen, onCollapse }: {
  label: string;
  scenario: Scenario;
  fullscreen?: boolean;
  onFullscreen?: () => void;
  onCollapse?: () => void;
}) {
  return (
    <header className={s.chatHead}>
      <div className={s.chatHeadTitle}>
        <p className={s.chatName}>Zusik · asystent AI</p>
        <p className={s.chatCase}>{label}</p>
      </div>
      <ScenarioMenu current={scenario} label="Zmień sprawę" />
      {onFullscreen && <button type="button" className={s.iconButton} aria-label={fullscreen ? "Podziel ekran" : "Pełny ekran"} onClick={onFullscreen}>
        {fullscreen ? <SplitIcon /> : <ExpandIcon />}
      </button>}
      {onCollapse && <button type="button" className={s.iconButton} aria-label="Zwiń czat" onClick={onCollapse}>
        <MinusIcon />
      </button>}
    </header>
  );
}

/** The conversation. New content keeps the reader's place; "↓ Nowa odpowiedź" brings them down. */
function Thread(props: Props) {
  const { conversation, steps, mascot, caseError, notice } = props;
  const list = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const signature = `${props.workflowVersion ?? ""}:${steps.view?.state}:${steps.pendingChoice}:${steps.preview}:${conversation
    .map((item) => `${item.requestId}:${item.state}`)
    .join("|")}`;
  const [reader, setReader] = useState({ atBottom: true, seen: signature });

  // restore the reading place when the thread opens again
  useLayoutEffect(() => {
    const el = list.current;
    if (el) {
      el.scrollTop = props.readScroll() ?? el.scrollHeight;
      atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    }
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
  const asking = conversation.some((item) => item.state === "sending");

  return (
    <>
      <div ref={list} className={s.thread} onScroll={onScroll}>
        <div className={s.threadSpacer} />
        <div className={s.threadInner}>
          <div className={s.marginMascot} aria-hidden="true">
            {mascot}
          </div>
          <div ref={content} className={s.messages} role="log" aria-label="Przebieg rozmowy" aria-relevant="additions">
            {props.workflow ?? <CaseSteps {...steps} />}
            {conversation.map((item) => (
              <TurnView
                key={item.requestId}
                item={item}
                activity={props.activity}
                partialText={props.partialText}
                asking={asking}
                onRetry={props.onRetryAsk}
              />
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
