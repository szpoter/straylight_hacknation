"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useDemoSession } from "@/features/auth/demo-session";
import { usePlan } from "@/features/family/PlanProvider";
import { planAnswer, sessionLeaveStatus, type LocalPlan, type PlanAnswer } from "@/lib/zusik/plan-answer";
import { Babelek } from "@/components/mascot/Babelek";
import { ChatHeader } from "./chat-panel";
import { conversationInput, type CaseName, type FamilyChatScope } from "@/lib/zusik/conversation";
import { newRequestId, useZusikCase } from "./use-zusik-case";
import { TurnView } from "./turn-view";
import { Composer } from "./composer";
import { ChatStarters } from "./scenario-nav";
import { CaseFileUpload, useCaseFile } from "./case-file-upload";
import s from "./zusik.module.css";

export type CaseChatEntry = { id: string; at: string; content: ReactNode };

type EmbeddedControls = { fullscreen: boolean; onFullscreen: () => void; onCollapse: () => void };

type GeneralProps = { controls?: EmbeddedControls; label?: string; introduction?: ReactNode; family?: FamilyChatScope };

export function PlanConversation(props: GeneralProps) {
  const { plan, isPatched } = usePlan();
  const family = useDemoSession()?.family;
  return <GeneralConversation key={plan.id} {...props} localPlan={{ plan, isPatched, family, selectedStopId: props.family?.stopId }} />;
}

export function GeneralConversation({ controls, label = "Rozmowa ogólna", introduction, family, localPlan }: GeneralProps & { localPlan?: LocalPlan }) {
  return <CaseChatWindow scenario="ogolna" family={family} localPlan={localPlan} label={label} ready busy={false} entries={[]} documents={null}
    controls={controls} introduction={introduction ?? <p>{localPlan ? "Możesz zapytać o stan swoich spraw w planie albo o zasady świadczenia." : "O jakie świadczenie albo dokument chcesz zapytać?"}</p>} />;
}

export function CaseChatWindow({ scenario, label, busy, ready, entries, introduction, children, documents, onMessage, notice, controls, family, localPlan }: {
  scenario: CaseName;
  localPlan?: LocalPlan;
  family?: FamilyChatScope;
  label: string;
  busy: boolean;
  introduction?: ReactNode;
  entries: CaseChatEntry[];
  children?: ReactNode;
  ready: boolean;
  documents: ReactNode;
  onMessage?: (message: string, original: string) => Promise<boolean | "ask">;
  notice?: string | null;
  controls?: EmbeddedControls;
}) {
  const chat = useZusikCase(scenario, ready, family);
  const pdf = useCaseFile();
  const [planTurns, setPlanTurns] = useState<{ id: string; at: string; question: string; answer: PlanAnswer }[]>([]);
  const [readingPlan, setReadingPlan] = useState(false);
  const planLock = useRef(false);
  const [askNotice, setAskNotice] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const waiting = pdf.active ? !pdf.canAsk : busy || readingPlan || chat.asking || (!localPlan && chat.phase !== "ready");
  useEffect(() => {
    const viewport = thread.current;
    if (!viewport || !content.current) return;
    const observer = new ResizeObserver(() => {
      if (atBottom.current) viewport.scrollTop = viewport.scrollHeight;
    });
    observer.observe(content.current);
    return () => observer.disconnect();
  }, []);
  const timeline: CaseChatEntry[] = [...entries, ...pdf.entries, ...planTurns.map(turn => ({
    id: turn.id, at: turn.at, content: <div className={s.messages} data-plan-turn>
      <div className={s.userRow}><p className={s.userBubble}>{turn.question}</p></div>
      <div className={s.aiMessage}>
        {turn.answer.lines.map((line, i) => <p key={i}>{line}</p>)}
        {turn.answer.readLeave && <Link href="/app" className={s.secondaryButton}>Otwórz sprawę urlopu rodzicielskiego</Link>}
      </div>
    </div>,
  })), ...chat.conversation.map(item => ({
    id: item.requestId,
    at: item.createdAt ?? "",
    content: <div data-knowledge-turn className={s.messages}><TurnView item={item} asking={chat.asking} activity={chat.activity}
      partialText={chat.partialText} onRetry={id => void chat.retryAsk(id)} />
      {scenario === "ogolna" && /(?:oblicz|policz|wysokoś|kwot)/iu.test(item.question) && /macierzyń/iu.test(item.question) && (
        <a className={s.secondaryButton} href="/app/kalkulator" target="_blank" rel="noopener noreferrer">Otwórz kalkulator dla swojej sprawy</a>
      )}
    </div>,
  }))].sort((a, b) => a.at.localeCompare(b.at));
  const submit = async (draft = text) => {
    const message = draft.trim();
    if (!message || waiting || planLock.current) return;
    setAskNotice(null);
    atBottom.current = true;
    if (pdf.active) {
      if (pdf.ask(message)) setText("");
      return;
    }
    const { text: body, reply } = conversationInput(message, scenario);
    if (localPlan) {
      const lastLocal = planTurns.at(-1);
      const previous = lastLocal && timeline.at(-1)?.id === lastLocal.id ? lastLocal.answer : undefined;
      const answer = planAnswer(body, localPlan, previous);
      if (answer) {
        planLock.current = true;
        setReadingPlan(true);
        try {
          if (answer.readLeave) {
            try {
              const response = await fetch("/api/zusik/marta", { cache: "no-store", signal: AbortSignal.timeout(3_000) });
              if (!response.ok) throw new Error("Session read failed");
              const sessionStatus = sessionLeaveStatus((await response.json()).view, localPlan.family);
              if (sessionStatus) {
                answer.lines.push(sessionStatus);
                answer.sourceExplanation += " Stan osobnego wniosku pochodzi z zapisu sprawy urlopowej w tej sesji.";
              }
            } catch {
              answer.lines.push("Dodatkowy stan wniosku w sprawie urlopu rodzicielskiego jest teraz niedostępny.");
            }
          }
          setPlanTurns(turns => [...turns, { id: newRequestId(), at: new Date().toISOString(), question: message, answer }]);
          setText(current => current.trim() === message ? "" : current);
        } finally {
          planLock.current = false;
          setReadingPlan(false);
        }
        return;
      }
      if (chat.phase !== "ready") {
        setAskNotice(chat.phase === "error" ? "Brak połączenia ze źródłami publicznymi. Ponów połączenie z czatem."
          : "Trwa łączenie ze źródłami publicznymi. Spróbuj ponownie po nawiązaniu połączenia.");
        return;
      }
    }
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
  const Container = controls ? "div" : "main";
  return (
    <Container className={s.root} data-zusik-workspace>
      <div className={s.caseLayout}>
        {!fullscreen && documents && <aside className={s.caseDocuments} aria-label="Dokumenty sprawy">{documents}</aside>}
        <section className={`${s.chat} ${s.caseWindow}`} aria-label="Czat z Zusikiem">
          <ChatHeader scenario={scenario} label={label} fullscreen={controls?.fullscreen ?? fullscreen} onCollapse={controls?.onCollapse}
            onFullscreen={controls?.onFullscreen ?? (documents ? () => setFullscreen(value => !value) : undefined)} />
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
            {scenario === "ogolna" && !pdf.active && !timeline.length && <ChatStarters disabled={waiting} onSelect={prompt => {
              setText(prompt);
              void submit(prompt);
            }} />}
            {!pdf.active && chat.phase === "error" && <button type="button" className={s.secondaryButton} onClick={() => void chat.restore()}>Ponów połączenie z czatem</button>}
            <Composer fileControl={scenario === "ogolna" ? <CaseFileUpload state={pdf} /> : undefined}
              text={text} busy={waiting} notice={askNotice ?? notice ?? null} textareaRef={input} onText={setText} onSend={() => void submit()} />
          </div>
        </section>
      </div>
    </Container>
  );
}
