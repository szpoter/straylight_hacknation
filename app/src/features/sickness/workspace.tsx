"use client";

import { useState } from "react";
import chat from "../chat/zusik.module.css";
import { CaseChatWindow, type CaseChatEntry } from "../chat/case-chat-window";
import { coverageAnswers as answers, sicknessInput } from "./chat-input";
import type { SicknessExchange, SicknessView } from "@/lib/sickness/types";
import { useCaseResource } from "@/features/chat/use-case-resource";
import { SicknessImport } from "./sickness-import";
import s from "./sickness.module.css";

function formatDate(iso: string | null) {
  return iso ? iso.split("-").reverse().join(".") : "data do ustalenia";
}

function AssessmentReply({ exchange, current }: { exchange: SicknessExchange; current: boolean }) {
  const { assessment, closed } = exchange;
  return (
    <div className={chat.aiMessage} data-chat-reply>
      {!current && <p className={s.period}>Wcześniejsza ocena</p>}
      {closed && <p>Ocena zakończona.</p>}
      {(!closed || !exchange.at) && <>
        {assessment.period.from && <p className={s.period}>Badany okres · {formatDate(assessment.period.from)} – {formatDate(assessment.period.to)}</p>}
        <p>{assessment.summary}</p>
        {assessment.reasons.length > 0 && <ul>{assessment.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
        {assessment.law.length > 0 && <details>
          <summary>Podstawa prawna oceny</summary>
          <ul>{assessment.law.map(law => <li key={law.id}><a href={law.url} target="_blank" rel="noreferrer">{law.title}</a></li>)}</ul>
        </details>}
        {assessment.question && <p>{assessment.question}</p>}
      </>}
    </div>
  );
}

function sicknessEntries(view: SicknessView | null): CaseChatEntry[] {
  if (!view) return [];
  const exchanges = view.history ?? [{
    version: view.version, at: "", message: undefined, assessment: view.assessment, closed: view.closed,
  }];
  const assessments = exchanges.map(exchange => ({
    id: "assessment-" + exchange.version, at: exchange.at,
    content: <>
      {exchange.message && <div className={chat.userRow}><p className={chat.userBubble}>{exchange.message}</p></div>}
      <AssessmentReply exchange={exchange} current={view.version === exchange.version} />
    </>,
  }));
  const sources = (view.sourceRequests ?? []).map(reply => ({
    id: reply.id, at: reply.at,
    content: <>
      <div className={chat.userRow}><p className={chat.userBubble}>{reply.message}</p></div>
      <div className={chat.aiMessage} data-chat-reply>
        <p>{reply.evidence.length ? "Do oceny użyłem poniższych dokumentów." : "Brakuje jeszcze potwierdzonych dokumentów do oceny."}</p>
        {!!reply.evidence.length && <ul>{reply.evidence.map(doc => <li key={doc.id}>
          {view.evidence.some(current => current.url === doc.url)
            ? <a href={doc.url} target="_blank" rel="noreferrer">{doc.title} · s. {doc.page}</a>
            : <>{doc.title} · s. {doc.page} (wcześniejszy dokument)</>}
        </li>)}</ul>}
        {!!reply.law.length && <><p>Podstawy prawne tej oceny</p><ul>{reply.law.map(law => <li key={law.id}>
          <a href={law.url} target="_blank" rel="noreferrer">{law.title}</a>
        </li>)}</ul></>}
      </div>
    </>,
  }));
  return [...assessments, ...sources].sort((a, b) => a.at.localeCompare(b.at));
}

export function SicknessWorkspace() {
  const { view, setView, busy, loaded, error, reload, send } = useCaseResource<SicknessView>(
    "/api/zusik/sickness",
    true,
    true,
  );
  const [editing, setEditing] = useState(false);
  const assessment = view?.assessment;
  async function onMessage(text: string, original = text): Promise<boolean | "ask"> {
    const action = sicknessInput(text, view, editing);
    if (action.type === "help") return "ask";
    if (action.type === "sources") {
      return view ? send({ ...action, requestId: crypto.randomUUID(), version: view.version, message: original }) : "ask";
    }
    const saved = await send({ ...action, message: original });
    if (saved) setEditing(false);
    return saved;
  }
  return (
    <CaseChatWindow scenario="chorobowe" label="Chorobowe w ciąży · Ocena prawa do zasiłku"
      entries={sicknessEntries(view)} introduction={<p className={chat.aiMessage}>Pomogę Ci sprawdzić, czy za dni zwolnienia przysługuje Ci zasiłek chorobowy.</p>}
      ready={loaded} busy={busy || !loaded} onMessage={onMessage}
      documents={view && (
          <details className={s.card} open>
            <summary>Dokumenty sprawy</summary>
            <ul>
              {view.evidence.map((e) => (
                <li key={e.id}>
                  <a href={e.url} target="_blank" rel="noreferrer">
                    {e.title} · s. {e.page}
                  </a>
                </li>
              ))}
            </ul>
            {(view.includeEmployment || view.canRestoreEmployment) && (
              <button
                className={s.secondary}
                disabled={busy}
                onClick={() =>
                  void send({ type: "evidence", version: view.version, includeEmployment: !view.includeEmployment })
                }
              >
                {view.includeEmployment ? "Wycofaj dowód dotyczący zatrudnienia" : "Dodaj dowód dotyczący zatrudnienia"}
              </button>
            )}
            <SicknessImport version={view.version} onSaved={setView} />
          </details>
      )}>
      {!view && loaded && <div className={chat.row8}>
        <button type="button" className={chat.secondaryButton} disabled={busy}
          onClick={() => void onMessage("Czy za dni zwolnienia dostanę zasiłek?")}>Czy za dni zwolnienia dostanę zasiłek?</button>
      </div>}
      {view && assessment && <div className={chat.row8}>
        {(editing || assessment.asksOtherCoverage) && answers.map(answer =>
          <button key={answer.value} type="button" className={chat.secondaryButton} disabled={busy}
            onClick={() => void onMessage(answer.text)}>{answer.text}</button>)}
        {view.otherCoverage && !editing && <button type="button" className={chat.secondaryButton} disabled={busy}
          onClick={() => setEditing(true)}>Popraw odpowiedź o ubezpieczeniu</button>}
        {!view.closed && assessment.status === "not_entitled_for_period" && <button type="button" className={chat.secondaryButton} disabled={busy}
          onClick={() => void onMessage("Zakończ ocenę")}>Zakończ ocenę</button>}
      </div>}
      {!loaded && !error && <p role="status">Wczytuję sprawę…</p>}
      {error && <p className={s.error} role="alert">{error}{" "}
        <button className={chat.secondaryButton} onClick={reload}>Wczytaj ponownie</button>
      </p>}
    </CaseChatWindow>
  );
}
