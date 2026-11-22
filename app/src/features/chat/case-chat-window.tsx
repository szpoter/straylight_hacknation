"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import { ChatHeader } from "./chat-panel";
import { conversationInput } from "@/lib/zusik/conversation";
import { useZusikCase } from "./use-zusik-case";
import { TurnView } from "./turn-view";
import { Composer } from "./composer";
import type { Scenario } from "./scenario-nav";
import s from "./zusik.module.css";

export type CaseChatEntry = { id: string; at: string; content: ReactNode };

export function CaseChatWindow({ scenario, label, busy, ready, entries, introduction, children, documents, onMessage, notice }: {
  scenario: Scenario;
  label: string;
  busy: boolean;
  introduction?: ReactNode;
  entries: CaseChatEntry[];
  children?: ReactNode;
  ready: boolean;
  documents: ReactNode;
  onMessage?: (message: string, original: string) => Promise<boolean | "ask">;
  notice?: string | null;
}) {
  const chat = useZusikCase(scenario, ready);
  const [askNotice, setAskNotice] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const waiting = busy || chat.asking || chat.phase !== "ready";
  useEffect(() => {
    const viewport = thread.current;
    if (!viewport || !content.current) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) viewport.scrollTop = viewport.scrollHeight;
    });
    observer.observe(content.current);
    return () => observer.disconnect();
  }, []);
  const timeline: CaseChatEntry[] = [...entries, ...chat.conversation.map(item => ({
    id: item.requestId,
    at: item.createdAt ?? "",
    content: <div data-knowledge-turn className={s.messages}><TurnView item={item} asking={chat.asking} activity={chat.activity}
      partialText={chat.partialText} onRetry={id => void chat.retryAsk(id)} /></div>,
  }))].sort((a, b) => a.at.localeCompare(b.at));
  const submit = async () => {
    const message = text.trim();
    if (!message || waiting) return;
    setAskNotice(null);
    atBottom.current = true;
    const { text: body, reply } = conversationInput(message, scenario);
    const lastAnswer = [...chat.conversation].reverse().find(turn => turn.state === "done" && turn.answer?.status !== "conversation");
    const lastCaseAt = entries.at(-1)?.at ?? "";
    const previousAnswer = /(?:poprzedni|ostatni).*odpowiedzi/iu.test(body);
    const asksSource = /źród|cytat|podstaw|skąd/iu.test(body);
    const caseDocument = /formularz|dokumen|odpis|skan|pesel|adres|nazwisk/iu.test(body);
    const aboutLastAnswer = asksSource && (previousAnswer || !caseDocument && lastAnswer && (lastAnswer.createdAt ?? "") >= lastCaseAt);
    const result = !onMessage || reply || aboutLastAnswer ? "ask" : await onMessage(body, message);
    if (result === "ask") {
      const answer = await chat.ask(message);
      if (answer.kind === "unavailable" || answer.kind === "invalid") {
        setAskNotice(answer.kind === "invalid" ? "Wpisz pytanie w kilku słowach." : "Nie udało się odczytać odpowiedzi. Spróbuj ponownie.");
        return;
      }
    }
    if (result) {
      setText(current => current.trim() === message ? "" : current);
    }
  };
  return (
    <main className={s.root} data-zusik-workspace>
      <div className={s.caseLayout}>
        {!fullscreen && documents && <aside className={s.caseDocuments} aria-label="Dokumenty sprawy">{documents}</aside>}
        <section className={`${s.chat} ${s.caseWindow}`} aria-label="Czat z Zusikiem">
          <ChatHeader scenario={scenario} label={label} fullscreen={fullscreen} onFullscreen={documents ? () => setFullscreen(value => !value) : undefined} />
          <div ref={thread} className={s.thread} onScroll={event => {
            const viewport = event.currentTarget;
            atBottom.current = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 32;
          }}>
            <div ref={content} className={s.threadInner}>
              <div className={s.marginMascot} aria-hidden="true"><Babelek state={busy ? "searching" : "available"} /></div>
              <div className={s.messages} role="log" aria-label="Przebieg rozmowy" aria-relevant="additions">
                {introduction}
                {timeline.map(entry => <Fragment key={entry.id}>{entry.content}</Fragment>)}
                {children && <fieldset className={s.caseActions} disabled={busy || chat.asking}>{children}</fieldset>}
              </div>
            </div>
          </div>
          <div className={s.chatBottom}>
            {chat.phase === "error" && <button type="button" className={s.secondaryButton} onClick={() => void chat.restore()}>Ponów połączenie z czatem</button>}
            <Composer text={text} busy={waiting} notice={askNotice ?? notice ?? null} textareaRef={input} onText={setText} onSend={() => void submit()} />
          </div>
        </section>
      </div>
    </main>
  );
}
