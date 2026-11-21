"use client";

import { useRef, useState } from "react";
import { CaseChatWindow } from "../chat/case-chat-window";
import { coverageAnswers as answers, sicknessInput } from "./chat-input";
import type { SicknessView } from "@/lib/sickness/types";
import { useCaseResource } from "@/features/chat/use-case-resource";
import { SicknessImport } from "./sickness-import";
import s from "./sickness.module.css";

function formatDate(iso: string | null) {
  return iso ? iso.split("-").reverse().join(".") : "data do ustalenia";
}

export function SicknessWorkspace() {
  const { view, setView, busy, loaded, error, reload, send } = useCaseResource<SicknessView>(
    "/api/zusik/sickness",
    true,
    true,
  );
  const [editing, setEditing] = useState(false);
  const assessment = view?.assessment;
  const documents = useRef<HTMLDetailsElement>(null);
  async function onMessage(text: string): Promise<boolean | "ask"> {
    const action = sicknessInput(text, view, editing);
    if (action.type === "help") return "ask";
    if (action.type === "sources") {
      if (documents.current) {
        documents.current.open = true;
        documents.current.querySelector("summary")?.focus();
      }
      return true;
    }
    const saved = await send(action);
    if (saved) setEditing(false);
    return saved;
  }
  return (
    <CaseChatWindow scenario="chorobowe" label="Chorobowe w ciąży · Ocena prawa do zasiłku"
      ready={loaded} busy={busy || !loaded} onMessage={onMessage}
      documents={view && (
          <details className={s.card} ref={documents} open>
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
        <section className={s.card} aria-labelledby="sick-chat">
          <h1 id="sick-chat">Chorobowe w ciąży</h1>
          {!view ? (
            <>
              <p>Przejrzymy zwolnienie i ustalenia o ubezpieczeniu za te same dni.</p>
              <button disabled={busy || !loaded} onClick={() => void send({ type: "start" })}>
                Czy za dni zwolnienia dostanę zasiłek?
              </button>
            </>
          ) : (
            <>
              <p className={s.user}>Mam zwolnienie w ciąży. Czy za te dni dostanę zasiłek chorobowy?</p>
              {assessment && (
                <>
                  <p className={s.period}>
                    Badany okres · {formatDate(assessment.period?.from)} – {formatDate(assessment.period?.to)}
                  </p>
                  <p className={s.result} aria-live="polite" data-chat-reply>
                    {assessment.summary}
                  </p>
                  {assessment.reasons.length > 0 && (
                    <ul>
                      {assessment.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  )}
                  {assessment.law.length > 0 && (
                    <details>
                      <summary>Podstawa prawna oceny</summary>
                      <ul>
                        {assessment.law.map((law) => (
                          <li key={law.id}>
                            <a href={law.url} target="_blank" rel="noreferrer">{law.title}</a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {view.otherCoverage && (
                    <p className={s.user}>{answers.find((answer) => answer.value === view.otherCoverage)?.text}</p>
                  )}
                  {
                    <>
                      {assessment.question && (
                        <p>
                          <strong data-chat-reply>{assessment.question}</strong>
                        </p>
                      )}
                      {(editing || assessment.asksOtherCoverage) && (
                        <div className={s.actions}>
                          {answers.map(({ value, text }) => (
                            <button
                              key={value}
                              disabled={busy}
                              onClick={async () => {
                                if (await send({ type: "confirm", version: view.version, answer: value }))
                                  setEditing(false);
                              }}
                            >
                              {text}
                            </button>
                          ))}
                        </div>
                      )}
                      {view.otherCoverage && !editing && (
                        <button className={s.secondary} disabled={busy} onClick={() => setEditing(true)}>
                          Popraw odpowiedź o ubezpieczeniu
                        </button>
                      )}
                      {!view.closed && assessment.status === "not_entitled_for_period" && (
                        <button disabled={busy} onClick={() => void send({ type: "close", version: view.version })}>
                          Zakończ ocenę
                        </button>
                      )}
                    </>
                  }
                  {view.closed && <p role="status" data-chat-reply>Ocena zakończona.</p>}
                </>
              )}
            </>
          )}
          {!loaded && !error && <p role="status">Wczytuję sprawę…</p>}
          {error && (
            <p className={s.error} role="alert">
              {error}{" "}
              <button className={s.secondary} onClick={reload}>
                Wczytaj ponownie
              </button>
            </p>
          )}
        </section>
    </CaseChatWindow>
  );
}
