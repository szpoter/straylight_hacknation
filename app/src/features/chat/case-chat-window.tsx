"use client";

import { useRef, useState, type ReactNode } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import { ChatHeader } from "./chat-panel";
import { Composer } from "./composer";
import type { Scenario } from "./scenario-nav";
import s from "./zusik.module.css";

export function CaseChatWindow({ scenario, label, busy, children, onMessage, notice }: {
  scenario: Scenario;
  label: string;
  busy: boolean;
  children: ReactNode;
  onMessage: (message: string) => Promise<boolean>;
  notice?: string | null;
}) {
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const submit = async () => {
    const message = text.trim();
    if (!message || busy) return;
    if (await onMessage(message)) {
      setText(current => current.trim() === message ? "" : current);
      requestAnimationFrame(() => {
        if (thread.current?.contains(document.activeElement)) return;
        const replies = thread.current?.querySelectorAll("[data-chat-reply]");
        replies?.item(replies.length - 1)?.scrollIntoView({ block: "nearest" });
      });
    }
  };
  return (
    <main className={s.root} data-zusik-workspace>
      <section className={`${s.chat} ${s.caseWindow}`} aria-label="Czat z Zusikiem">
        <ChatHeader scenario={scenario} label={label} />
        <div ref={thread} className={s.thread}>
          <div className={s.threadInner}>
            <div className={s.marginMascot} aria-hidden="true"><Babelek state={busy ? "searching" : "available"} /></div>
            <div className={s.messages}>{children}</div>
          </div>
        </div>
        <div className={s.chatBottom}>
          <Composer text={text} busy={busy} notice={notice ?? null} textareaRef={input} onText={setText} onSend={() => void submit()} />
        </div>
      </section>
    </main>
  );
}
