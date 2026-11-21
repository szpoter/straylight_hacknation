"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CaseName } from "@/lib/zusik/conversation";
import { ASK_STREAM, readAskStream } from "@/lib/zusik/ask-stream";
import type { Choice } from "@/lib/zusik/constants";
import { answerFromAskBody, turnsFromView, type Answer, type ClientView, type Turn } from "./contract";

/**
 * Talks to the existing Zusik routes (step 1) and to the proposed POST /api/zusik/ask (step 2).
 * Rules from the task: restore the session and read the view first; start only after a user action;
 * a choice continues the same thread; after 409 read the current state; F5 only reads.
 */

export type CaseErrorKind = "config" | "storage" | "network" | "forbidden";
export type CaseError = { kind: CaseErrorKind; variable?: string };
export type Phase = "restoring" | "ready" | "starting" | "saving" | "error";

/** A question asked in this tab that is not (yet) in view.turns. */
export type LocalAsk = {
  requestId: string;
  question: string;
  state: "sending" | "lost" | "done";
  answer?: Answer;
};

export type AskOutcome =
  | { kind: "answered" }
  | { kind: "lost" }
  | { kind: "invalid" }
  | { kind: "unavailable"; reason: "not_deployed" | "service_down"; message?: string | null };

/** One entry of the visible conversation: a saved turn or a question still on its way. */
export type ConversationItem = { requestId: string; question: string; state: LocalAsk["state"]; answer?: Answer };

type Payload = { documentCache?:string; view?: ClientView; error?: string; variable?: string };

const ASK_TIMEOUT_MS = 70_000;
const POLL_MS = 1_500;
const POLL_LIMIT = 20;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(url: string, init?: RequestInit): Promise<{ status: number; body: Payload }> {
  const res = await fetch(url, { cache: "no-store", ...init });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as Payload };
}

const post = (url: string, body?: object, signal?: AbortSignal) =>
  call(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

function errorFrom(status: number, body: Payload): CaseError {
  if (status === 403) return { kind: "forbidden" };
  if (body.error === "config_missing") return { kind: "config", variable: body.variable };
  return { kind: "storage" };
}

export function newRequestId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Saved turns first (server order), then this tab's questions that the server has not listed yet. */
export function mergeConversation(saved: Turn[], local: LocalAsk[]): ConversationItem[] {
  const known = new Set(saved.map((turn) => turn.requestId));
  return [
    ...saved.map((turn) => ({ requestId: turn.requestId, question: turn.question, state: "done" as const, answer: turn })),
    ...local.filter((ask) => !known.has(ask.requestId)),
  ];
}

export function useZusikCase(scenario: CaseName = "marta", sessionReady = true) {
  const [view, setView] = useState<ClientView | null>(null);
  const [documentCache,setDocumentCache]=useState("");
  const [phase, setPhase] = useState<Phase>("restoring");
  const [error, setError] = useState<CaseError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [activity, setActivity] = useState<string | null>(null);
  const [partialText, setPartialText] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);
  const [asks, setAsks] = useState<LocalAsk[]>([]);
  /** When this tab last got a confirmed save of the choice (drives the field highlight). */
  const [savedAt, setSavedAt] = useState<number | null>(null);
  /** One mutation at a time: repeated clicks while a request runs are ignored. */
  const inFlight = useRef(false);
  const asking = useRef(new Set<string>());

  const fail = useCallback((caseError: CaseError) => {
    setError(caseError);
    setPhase("error");
  }, []);

  /** Back to "ready" unless a request on the way reported an error that the parent must see. */
  const markReady = useCallback(() => setPhase((current) => (current === "error" ? current : "ready")), []);

  const readState = useCallback(async (): Promise<ClientView | null> => {
    const state = await call("/api/zusik/state?scenario=" + scenario);
    if (state.status >= 400 || !state.body.view) {
      fail(errorFrom(state.status, state.body));
      return null;
    }
    setView(state.body.view);
    return state.body.view;
  }, [fail, scenario]);

  /** Waits while another request holds the case (202) or a start is still running. */
  const settle = useCallback(
    async (current: ClientView | null) => {
      let latest = current;
      for (let i = 0; i < POLL_LIMIT && latest?.state === "starting"; i += 1) {
        await sleep(POLL_MS);
        latest = await readState();
      }
      return latest;
    },
    [readState],
  );

  const restore = useCallback(async () => {
    setPhase("restoring");
    setError(null);
    try {
      if (scenario === "marta") {
        const session = await post("/api/zusik/session");
        if (session.status >= 400) return fail(errorFrom(session.status, session.body));
        setDocumentCache(session.body.documentCache ?? "");
      }
      const current = await readState();
      if (!current) return;
      if (current.state === "starting") {
        setPhase("starting");
        await settle(current);
      }
      markReady();
    } catch {
      fail({ kind: "network" });
    }
  }, [fail, markReady, readState, settle, scenario]);

  useEffect(() => {
    // Rebuild the screen from the server on every load, also after F5 or reopening the tab. Read only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sessionReady) void restore();
  }, [restore, sessionReady]);

  const start = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPhase("starting");
    setNotice(null);
    try {
      const res = await post("/api/zusik", { action: "start" });
      if (res.status >= 400) return fail(errorFrom(res.status, res.body));
      if (res.body.view) setView(res.body.view);
      if (res.status === 202 || res.body.view?.state === "starting") await settle(res.body.view ?? null);
      markReady();
    } catch {
      fail({ kind: "network" });
    } finally {
      inFlight.current = false;
    }
  }, [fail, markReady, settle]);

  const checkpointId = view?.checkpointId ?? null;

  /** Saves the parent's accepted choice in the same thread. Success is what the server confirms. */
  const choose = useCallback(
    async (choice: Choice) => {
      if (inFlight.current || !checkpointId) return;
      inFlight.current = true;
      setPendingChoice(choice);
      setPhase("saving");
      setNotice(null);
      try {
        const res = await post("/api/zusik", { action: "resume", choice, expectedCheckpointId: checkpointId });
        if (res.status === 409) {
          setNotice("Sprawa zmieniła się w innej karcie. Pokazuję aktualny stan.");
          await readState();
        } else if (res.status === 202) {
          setNotice("Poprzedni zapis jeszcze trwa. Sprawdzam wynik…");
          await sleep(POLL_MS);
          await readState();
        } else if (res.status >= 400) {
          return fail(errorFrom(res.status, res.body));
        } else if (res.body.view) {
          setView(res.body.view);
          if (res.body.view.state === "completed" && res.body.view.choice === choice) setSavedAt(Date.now());
        }
        markReady();
      } catch {
        // The response was lost: the save may or may not have happened. Reading the state tells which.
        setNotice("Utracono połączenie podczas zapisu. Sprawdzam, co zapisano…");
        try {
          await readState();
          markReady();
        } catch {
          fail({ kind: "network" });
        }
      } finally {
        setPendingChoice(null);
        inFlight.current = false;
      }
    },
    [checkpointId, fail, markReady, readState],
  );

  /** Sends (or re-sends with the same requestId) a question to the knowledge base. */
  const send = useCallback(
    async (requestId: string, question: string): Promise<AskOutcome> => {
      if (activeRequest.current || asking.current.has(requestId)) return { kind: "lost" };
      asking.current.add(requestId);
      const upsert = (patch: Partial<LocalAsk>) =>
        setAsks((list) =>
          list.some((item) => item.requestId === requestId)
            ? list.map((item) => (item.requestId === requestId ? { ...item, ...patch } : item))
            : [...list, { requestId, question, state: "sending", ...patch }],
        );
      const drop = () => setAsks((list) => list.filter((item) => item.requestId !== requestId));
      upsert({ state: "sending" });
      const controller = new AbortController();
      activeRequest.current = controller;
      setActivity("Wysyłam pytanie…");
      setPartialText("");
      const request = async () => {
        const response = await fetch("/api/zusik/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: ASK_STREAM },
          body: JSON.stringify({ question, requestId, scenario }),
          cache: "no-store",
          signal: controller.signal,
        });
        return readAskStream(response, setActivity, async (text) => {
          setActivity(null);
          if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setPartialText((previous) => previous + text);
            return;
          }
          const words = text.match(/\s*\S+\s*/g) ?? [text];
          const step = Math.max(2, Math.ceil(words.length / 18));
          for (let i = 0; i < words.length; i += step) {
            controller.signal.throwIfAborted();
            const part = words.slice(i, i + step).join("");
            setPartialText((previous) => previous + part);
            await sleep(24);
          }
        });
      };
      const timer = setTimeout(() => controller.abort(), ASK_TIMEOUT_MS);
      try {
        let res = await request();
        // 202: the same request is still running on the server. Ask again with the same requestId.
        for (let i = 0; res.status === 202 && i < POLL_LIMIT; i += 1) {
          await sleep(POLL_MS);
          res = await request();
        }
        const body = res.body as Payload & { turn?: { message?: string } };
        if (res.status === 404 || res.status === 405 || (res.status === 500 && body.error === "config_missing")) {
          drop();
          return { kind: "unavailable", reason: "not_deployed" };
        }
        if (res.status === 400) {
          drop();
          return { kind: "invalid" };
        }
        if (res.status === 503) {
          drop();
          return { kind: "unavailable", reason: "service_down", message: body.turn?.message ?? null };
        }
        if (res.status === 409) {
          // The requestId was used with different text: show what the server has saved.
          drop();
          await readState().catch(() => null);
          return { kind: "lost" };
        }
        const answer = res.status < 400 ? answerFromAskBody(res.body, requestId) : null;
        if (!answer) {
          upsert({ state: "lost" });
          return { kind: "lost" };
        }
        if (answer.status === "unavailable") {
          drop();
          return { kind: "unavailable", reason: "service_down", message: answer.message };
        }
        upsert({ state: "done", answer });
        return { kind: "answered" };
      } catch {
        upsert({ state: "lost" });
        return { kind: "lost" };
      } finally {
        clearTimeout(timer);
        activeRequest.current = null;
        setActivity(null);
        setPartialText("");
        asking.current.delete(requestId);
      }
    },
    [readState, scenario],
  );

  const ask = useCallback((question: string) => send(newRequestId(), question), [send]);
  const retryAsk = useCallback(
    (requestId: string) => {
      const pending = asks.find((item) => item.requestId === requestId);
      return pending ? send(requestId, pending.question) : Promise.resolve<AskOutcome>({ kind: "lost" });
    },
    [asks, send],
  );

  return {
    view,
    documentCache,
    phase,
    error,
    notice,
    pendingChoice,
    savedAt,
    activity,
    partialText,
    conversation: mergeConversation(turnsFromView(view), asks),
    asking: asks.some((item) => item.state === "sending"),
    restore,
    start,
    choose,
    ask,
    retryAsk,
    dismissNotice: () => setNotice(null),
  };
}
