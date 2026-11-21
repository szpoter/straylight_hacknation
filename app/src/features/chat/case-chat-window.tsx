"use client";

import { useRef, useState, type ReactNode } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import { ChatHeader } from "./chat-panel";
import { conversationInput } from "@/lib/zusik/conversation";
import { useZusikCase } from "./use-zusik-case";
import { TurnView } from "./turn-view";
import { Composer } from "./composer";
import type { Scenario } from "./scenario-nav";
import s from "./zusik.module.css";

export function CaseChatWindow({ scenario, label, busy, ready, children, documents, onMessage, notice }: {
  scenario: Scenario;
  label: string;
  busy: boolean;
  children: ReactNode;
  ready: boolean;
  documents: ReactNode;
  onMessage: (message: string) => Promise<boolean | "ask">;
  notice?: string | null;
}) {
  const chat = useZusikCase(scenario, ready);
  const [askNotice, setAskNotice] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const submit = async () => {
    const message = text.trim();
    if (!message || busy || chat.asking) return;
    setAskNotice(null);
    const { text: body, reply } = conversationInput(message, scenario);
    const aboutLastAnswer = /(?:poprzedni|ostatni).*odpowiedzi/iu.test(body) && /źród|cytat|podstaw|skąd/iu.test(body);
    const result = reply || aboutLastAnswer ? "ask" : await onMessage(body);
    if (result === "ask") {
      const answer = await chat.ask(message);
      if (answer.kind === "unavailable" || answer.kind === "invalid") {
        setAskNotice(answer.kind === "invalid" ? "Wpisz pytanie w kilku słowach." : "Nie udało się odczytać odpowiedzi. Spróbuj ponownie.");
        return;
      }
    }
    if (result) {
      setText(current => current.trim() === message ? "" : current);
      requestAnimationFrame(() => {
        if (thread.current?.contains(document.activeElement)) return;
        const replies = thread.current?.querySelectorAll(result === "ask" ? "[data-knowledge-turn]" : "[data-chat-reply]");
        replies?.item(replies.length - 1)?.scrollIntoView({ block: "nearest" });
      });
    }
  };
  return (
    <main className={s.root} data-zusik-workspace>
      <div className={s.caseLayout}>
        {!fullscreen && documents && <aside className={s.caseDocuments} aria-label="Dokumenty sprawy">{documents}</aside>}
        <section className={`${s.chat} ${s.caseWindow}`} aria-label="Czat z Zusikiem">
          <ChatHeader scenario={scenario} label={label} fullscreen={fullscreen} onFullscreen={() => setFullscreen(value => !value)} />
          <div ref={thread} className={s.thread}>
            <div className={s.threadInner}>
              <div className={s.marginMascot} aria-hidden="true"><Babelek state={busy ? "searching" : "available"} /></div>
              <div className={s.messages}>
                {children}
                {chat.conversation.map(item => <div key={item.requestId} data-knowledge-turn><TurnView item={item} asking={chat.asking}
                  activity={chat.activity} partialText={chat.partialText} onRetry={id => void chat.retryAsk(id)} /></div>)}
              </div>
            </div>
          </div>
          <div className={s.chatBottom}>
            <Composer text={text} busy={busy || chat.asking} notice={askNotice ?? notice ?? null} textareaRef={input} onText={setText} onSend={() => void submit()} />
          </div>
        </section>
      </div>
    </main>
  );
}
