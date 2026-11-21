"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import type { ZusikState } from "@/components/mascot/types";
import { afterSave, nextQuestion, planReply, totalUnits, type AssistantMessage, type Message, type Pending, type SaveRecord, type Segment } from "./agent";
import { ChatPanel } from "./ChatPanel";
import { Composer, type Attachment } from "./Composer";
import { DRAFT_CASE, FIELD_LABELS, STARTERS, formatDate, initialDrafts, type DraftId, type FieldKey } from "./data";
import { DraftForm } from "./DraftForm";
import type { MessageActions, PlanTarget } from "./MessageView";
import { MODELS, applyTestParams, connectionDropsNow, saveField, testControls, uploadFile, wait, type ModelId } from "./services";
import "./zusik-demo.css";

declare global {
  interface Window {
    zusikTest?: typeof testControls;
  }
}

type Thread = {
  id: string;
  title: string;
  draftId: DraftId;
  caseLabel: string;
  updatedAt: number;
  messages: Message[];
  /** The unsent message and files stay with the thread they were written in. */
  text: string;
  files: Attachment[];
  pending: Pending;
};

type Run = { stopped: boolean };

const INVITE_KEY = "zusik-demo:invite-dismissed:";
let idCounter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter += 1)}`;

function seedThreads(now: number): Record<string, Thread> {
  const today1042 = new Date(now).setHours(10, 42, 0, 0);
  const earlierToday = today1042 < now ? today1042 : now - 60_000;
  const done = (id: string, segments: Segment[]): AssistantMessage => ({
    id,
    role: "assistant",
    activity: "available",
    steps: ["Sprawdzam Twój szkic"],
    segments,
    revealed: totalUnits(segments),
    status: "done",
    tableReady: true,
    suggestions: [],
  });
  const threads: Thread[] = [
    { id: "t-new", title: "Nowa rozmowa", draftId: "ola-ojcowski", caseLabel: DRAFT_CASE["ola-ojcowski"], updatedAt: now, messages: [], text: "", files: [], pending: null },
    {
      id: "t-change",
      title: "Zmiana daty urlopu ojcowskiego",
      draftId: "ola-ojcowski",
      caseLabel: "Ola · Wniosek do pracodawcy",
      updatedAt: earlierToday,
      messages: [
        { id: "m-c1", role: "user", text: "Chcę zmienić datę urlopu ojcowskiego", files: [] },
        done("m-c2", [
          { kind: "p", text: "Mogę to zrobić w szkicu Oli, w polu „Początek urlopu”." },
          { kind: "question", text: "Od którego dnia chcesz zacząć urlop?", datePicker: "start" },
        ]),
      ],
      text: "",
      files: [],
      pending: { field: "start" },
    },
    {
      id: "t-compare",
      title: "Porównanie wariantów urlopu",
      draftId: "ola-rodzicielski",
      caseLabel: "Ola · Kalkulator · Wariant B",
      updatedAt: now - 86_400_000,
      messages: [
        { id: "m-v1", role: "user", text: "Czym różnią się moje dwa warianty?", files: [] },
        done("m-v2", [{ kind: "p", text: "Porównałem oba warianty urlopu rodzicielskiego Marty i Pawła." }, { kind: "table" }]),
      ],
      text: "",
      files: [],
      pending: null,
    },
    {
      id: "t-docs",
      title: "Dokumenty po narodzinach Oli",
      draftId: "ola-rodzicielski",
      caseLabel: "Ola · Mój plan",
      updatedAt: now - 6 * 86_400_000,
      messages: [
        { id: "m-d1", role: "user", text: "Jakie dokumenty przygotować?", files: [] },
        done("m-d2", [{ kind: "p", text: "Do wniosku u pracodawcy wystarczy odpis aktu urodzenia Oli. Masz go już w szkicu." }]),
      ],
      text: "",
      files: [],
      pending: null,
    },
  ];
  return Object.fromEntries(threads.map((t) => [t.id, t]));
}

function usePhone() {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(max-width: 767px)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );
}

/** Height of the visible area, which shrinks when the on-screen keyboard opens on a phone. */
function useVisualHeight() {
  return useSyncExternalStore(
    (notify) => {
      const viewport = window.visualViewport;
      viewport?.addEventListener("resize", notify);
      return () => viewport?.removeEventListener("resize", notify);
    },
    () => window.visualViewport?.height ?? window.innerHeight,
    () => 0,
  );
}

const readDismissed = (): DraftId[] =>
  (["ola-ojcowski", "ola-rodzicielski"] as DraftId[]).filter((id) => {
    try {
      return window.localStorage.getItem(INVITE_KEY + id) === "1";
    } catch {
      return false;
    }
  });

export default function ZusikDemo() {
  const reduceMotion = useReducedMotion() ?? false;
  const phone = usePhone();
  const visualHeight = useVisualHeight();

  const [drafts, setDrafts] = useState(initialDrafts);
  const [threads, setThreads] = useState(() => seedThreads(Date.now()));
  const [activeId, setActiveId] = useState("t-new");
  const [chatOpen, setChatOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatShare, setChatShare] = useState(50);
  const [focus, setFocus] = useState<PlanTarget>("start");
  const [changed, setChanged] = useState<{ field: FieldKey; key: number } | null>(null);
  const [blur, setBlur] = useState(false);
  const [dismissed, setDismissed] = useState<DraftId[]>(readDismissed);
  const [accepted, setAccepted] = useState<DraftId[]>([]);
  const [model, setModel] = useState<ModelId>("pllum");
  const [level, setLevel] = useState<string | null>(null);
  const [typingTick, setTypingTick] = useState(0);
  const [flying, setFlying] = useState(false);

  const draftsRef = useRef(drafts);
  const threadsRef = useRef(threads);
  useEffect(() => {
    draftsRef.current = drafts;
    threadsRef.current = threads;
  }, [drafts, threads]);

  const runs = useRef(new Map<string, Run>());
  const scrolls = useRef(new Map<string, number>());
  const bubble = useRef<HTMLButtonElement>(null);
  const workArea = useRef<HTMLDivElement>(null);
  const formPane = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const focusBubble = useRef(false);
  const flyX = useMotionValue(0);
  const flyY = useMotionValue(0);

  const thread = threads[activeId];
  const draft = drafts[thread.draftId];
  const latest = [...thread.messages].reverse().find((m): m is AssistantMessage => m.role === "assistant");
  const busy = latest ? latest.status === "working" || latest.status === "streaming" : false;
  const inviteVisible = !chatOpen && !dismissed.includes(draft.id) && !accepted.includes(draft.id);

  useEffect(() => {
    window.zusikTest = testControls;
    applyTestParams(window.location.search);
  }, []);

  // opening the chat moves focus to the message field; collapsing it returns focus to the bubble
  useEffect(() => {
    if (chatOpen) textarea.current?.focus({ preventScroll: true });
    else if (focusBubble.current) {
      focusBubble.current = false;
      bubble.current?.focus();
    }
  }, [chatOpen]);

  // ---- state helpers -------------------------------------------------------------------------

  const patchThread = useCallback((id: string, change: (t: Thread) => Partial<Thread>) => {
    setThreads((all) => ({ ...all, [id]: { ...all[id], ...change(all[id]) } }));
  }, []);

  const patchMessage = useCallback(
    (threadId: string, messageId: string, change: (m: AssistantMessage) => Partial<AssistantMessage>) => {
      setThreads((all) => {
        const t = all[threadId];
        return {
          ...all,
          [threadId]: {
            ...t,
            messages: t.messages.map((m) => (m.id === messageId && m.role === "assistant" ? { ...m, ...change(m) } : m)),
          },
        };
      });
    },
    [],
  );

  /** Writes a field and updates the ref at once, so the reply planned right after sees the new value. */
  const writeField = useCallback((draftId: DraftId, field: FieldKey, value: string, source: "zusik" | "parent") => {
    const all = draftsRef.current;
    const d = all[draftId];
    const updated = { ...all, [draftId]: { ...d, fields: { ...d.fields, [field]: { value, version: d.fields[field].version + 1, source } } } };
    draftsRef.current = updated;
    setDrafts(updated);
  }, []);

  /** Zusik's change lands: the form blurs for a moment, then the changed field gets the green beam. */
  const highlight = useCallback((field: FieldKey) => {
    const key = Date.now();
    setChanged({ field, key });
    // the outline fades after a few seconds; a newer highlight keeps its own timer
    window.setTimeout(() => setChanged((current) => (current?.key === key ? null : current)), 5000);
  }, []);

  const showChange = useCallback(
    (field: FieldKey) => {
      setFocus(field);
      highlight(field);
      if (reduceMotion) return;
      setBlur(true);
      window.setTimeout(() => setBlur(false), 260);
    },
    [highlight, reduceMotion],
  );

  // ---- the pencil: Zusik flies from the margin to a visible field and back ---------------------

  const flyPencil = useCallback(
    async (field: FieldKey, run: Run) => {
      const margin = document.querySelector("[data-zusik-margin]")?.getBoundingClientRect();
      const target = document.querySelector(`[data-field="${field}"] .zd-field__box`)?.getBoundingClientRect();
      const pane = formPane.current?.getBoundingClientRect();
      const visible = target && pane && target.top >= pane.top && target.bottom <= pane.bottom && target.width > 0;
      if (reduceMotion || !margin || !target || !visible) return false; // the field is off screen: write in place
      flyX.set(margin.left);
      flyY.set(margin.top);
      setFlying(true);
      const to = { x: target.left + Math.min(160, target.width * 0.4), y: target.top - 30 };
      await Promise.all([
        animate(flyX, to.x, { duration: 0.7, ease: "easeInOut" }),
        animate(flyY, [margin.top, Math.min(margin.top, to.y) - 50, to.y], { duration: 0.7, ease: "easeInOut" }),
      ]);
      if (!run.stopped) await wait(700);
      await Promise.all([
        animate(flyX, margin.left, { duration: 0.6, ease: "easeInOut" }),
        animate(flyY, [to.y, Math.min(margin.top, to.y) - 50, margin.top], { duration: 0.6, ease: "easeInOut" }),
      ]);
      setFlying(false);
      return true;
    },
    [flyX, flyY, reduceMotion],
  );

  // ---- streaming an answer ---------------------------------------------------------------------

  const stream = useCallback(
    async (threadId: string, messageId: string, segments: Segment[], run: Run) => {
      const total = totalUnits(segments);
      const tableAt = (() => {
        let units = 0;
        for (const s of segments) {
          if (s.kind === "table") return units + 1;
          units += s.kind === "p" || s.kind === "question" ? s.text.length : 1;
        }
        return -1;
      })();
      const drops = connectionDropsNow();
      let revealed = 0;
      let tableReady = false;
      patchMessage(threadId, messageId, () => ({ status: "streaming", revealed: 0, activity: "answering" }));
      while (revealed < total) {
        if (run.stopped) return;
        if (tableAt > 0 && revealed >= tableAt && !tableReady) {
          patchMessage(threadId, messageId, (m) => ({ activity: "calculating", steps: [...m.steps, "Liczę porównanie"] }));
          await wait(1400);
          tableReady = true;
          patchMessage(threadId, messageId, () => ({ tableReady: true, activity: "answering" }));
          continue;
        }
        if (drops && revealed > total * 0.45) {
          patchMessage(threadId, messageId, () => ({ status: "disconnected", activity: "attention" }));
          return;
        }
        revealed = reduceMotion ? (tableAt > 0 && !tableReady ? tableAt : total) : Math.min(total, revealed + 3);
        const shown = revealed;
        patchMessage(threadId, messageId, () => ({ revealed: shown }));
        await wait(reduceMotion ? 0 : 28);
      }
      patchMessage(threadId, messageId, (m) => ({
        status: "done",
        activity: m.save?.status === "failed" ? "attention" : m.save?.status === "saved" ? "confirming" : "available",
      }));
    },
    [patchMessage, reduceMotion],
  );

  // ---- saving a field --------------------------------------------------------------------------

  const runSave = useCallback(
    async (threadId: string, messageId: string, field: FieldKey, value: string, run: Run) => {
      const draftId = threadsRef.current[threadId].draftId;
      const before = draftsRef.current[draftId].fields[field].value;
      const label = FIELD_LABELS[field];
      const record: SaveRecord = { field, from: before, to: value, status: "saving" };
      patchMessage(threadId, messageId, () => ({ activity: "checking", steps: ["Sprawdzam datę…"], save: record }));
      await wait(reduceMotion ? 200 : 800);
      patchMessage(threadId, messageId, (m) => ({ activity: "writing", steps: [...m.steps, `Wpisuję: ${label.toLowerCase()}, ${formatDate(value)}`] }));
      const [ok] = await Promise.all([saveField(draftId, field, value), flyPencil(field, run)]);
      let saved: SaveRecord;
      if (ok) {
        writeField(draftId, field, value, "zusik");
        showChange(field);
        saved = { ...record, status: "saved" };
      } else {
        saved = { ...record, status: "failed", versionAtFail: draftsRef.current[draftId].fields[field].version };
      }
      if (run.stopped) {
        patchMessage(threadId, messageId, () => ({
          save: saved,
          activity: ok ? "confirming" : "attention",
          stopNote: `Zatrzymano odpowiedź · ${ok ? `W szkicu zapisano ${formatDate(value)}` : "Data nie została zapisana"}`,
        }));
        return;
      }
      const reply = afterSave(draftsRef.current[draftId], saved);
      patchMessage(threadId, messageId, (m) => ({
        save: saved,
        activity: ok ? "confirming" : "attention",
        steps: [...m.steps, ok ? "Zapis potwierdzony" : "Zapis się nie udał"],
        segments: reply.segments,
        suggestions: reply.suggestions,
      }));
      patchThread(threadId, () => ({ pending: reply.pending }));
      await stream(threadId, messageId, reply.segments, run);
    },
    [flyPencil, patchMessage, patchThread, reduceMotion, showChange, stream, writeField],
  );

  // ---- replying to the parent ------------------------------------------------------------------

  const reply = useCallback(
    async (threadId: string, text: string, files: string[]) => {
      const t = threadsRef.current[threadId];
      const plan = planReply(text, files, draftsRef.current[t.draftId], t.pending);
      const messageId = newId("a");
      const run: Run = { stopped: false };
      runs.current.set(threadId, run);
      const message: AssistantMessage = {
        id: messageId,
        role: "assistant",
        activity: "reading",
        steps: ["Czytam Twoją wiadomość"],
        segments: [],
        revealed: 0,
        status: "working",
        suggestions: [],
      };
      patchThread(threadId, (current) => ({ messages: [...current.messages, message] }));

      if (plan.type === "save") return runSave(threadId, messageId, plan.field, plan.value, run);

      if (plan.type === "attach") {
        patchMessage(threadId, messageId, () => ({ activity: "reading", steps: [`Dodaję „${plan.name}” do szkicu`] }));
        await wait(900);
        if (run.stopped) return;
        setDrafts((all) => ({ ...all, [t.draftId]: { ...all[t.draftId], attachment: plan.name } }));
        const after = { ...draftsRef.current[t.draftId], attachment: plan.name };
        const added: Segment = { kind: "p", text: `✓ Dodałem „${plan.name}” do szkicu Oli jako odpis aktu urodzenia.` };
        // the parent may have asked something in the same message: answer it after the file
        const rest = text ? planReply(text, [], after, t.pending) : null;
        const next = rest?.type === "answer" ? rest : { ...nextQuestion(after), segments: [{ kind: "plan" } as Segment, nextQuestion(after).segment] };
        const segments: Segment[] = [added, ...next.segments];
        patchMessage(threadId, messageId, () => ({ segments, suggestions: next.suggestions }));
        patchThread(threadId, () => ({ pending: next.pending }));
        return stream(threadId, messageId, segments, run);
      }

      patchMessage(threadId, messageId, () => ({ activity: plan.activity, steps: [plan.steps[0]] }));
      await wait(reduceMotion ? 200 : 900);
      for (const step of plan.steps.slice(1)) {
        if (run.stopped) return;
        patchMessage(threadId, messageId, (m) => ({ steps: [...m.steps, step] }));
        await wait(reduceMotion ? 100 : 600);
      }
      if (run.stopped) return;
      patchMessage(threadId, messageId, () => ({ segments: plan.segments, suggestions: plan.suggestions }));
      patchThread(threadId, () => ({ pending: plan.pending }));
      await stream(threadId, messageId, plan.segments, run);
    },
    [patchMessage, patchThread, reduceMotion, runSave, stream],
  );

  const send = useCallback(
    (text: string, files: string[] = []) => {
      const threadId = activeId;
      const user: Message = { id: newId("u"), role: "user", text, files };
      patchThread(threadId, (t) => ({
        messages: [...t.messages, user],
        text: "",
        files: [],
        updatedAt: Date.now(),
        title: t.title === "Nowa rozmowa" ? text.slice(0, 48) || "Nowa rozmowa" : t.title,
      }));
      void reply(threadId, text, files);
    },
    [activeId, patchThread, reply],
  );

  const stop = useCallback(() => {
    const run = runs.current.get(activeId);
    if (!run || !latest) return;
    run.stopped = true;
    patchMessage(activeId, latest.id, (m) => ({
      status: "stopped",
      activity: "available",
      stopNote:
        m.save?.status === "saving"
          ? "Zatrzymano odpowiedź · Sprawdzam zapis daty…"
          : m.save?.status === "saved"
            ? `Zatrzymano odpowiedź · W szkicu zapisano ${formatDate(m.save.to)}`
            : "Zatrzymano odpowiedź",
    }));
  }, [activeId, latest, patchMessage]);

  // ---- actions inside messages -----------------------------------------------------------------

  const showTarget = useCallback(
    (target: PlanTarget, withHighlight: boolean) => {
      setFocus(target);
      setFullscreen(false);
      setShowHistory(false);
      if (withHighlight && (target === "start" || target === "end")) highlight(target);
      window.requestAnimationFrame(() =>
        document.querySelector(`[data-field="${target}"]`)?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }),
      );
    },
    [highlight, reduceMotion],
  );

  const actions: MessageActions = {
    onFieldLink: (field) => showTarget(field, true),
    onPlanStep: (target) => showTarget(target, false),
    onSuggestion: (text) => {
      patchThread(activeId, () => ({ text }));
      window.requestAnimationFrame(() => {
        const area = textarea.current;
        area?.focus();
        area?.setSelectionRange(text.length, text.length);
      });
    },
    onPickDate: (iso) => send(formatDate(iso)),
    onRetryAnswer: (messageId) => {
      const message = threadsRef.current[activeId].messages.find((m) => m.id === messageId);
      if (message?.role !== "assistant") return;
      const run: Run = { stopped: false };
      runs.current.set(activeId, run);
      void stream(activeId, messageId, message.segments, run);
    },
    onRetrySave: async (messageId) => {
      const threadId = activeId;
      const message = threadsRef.current[threadId].messages.find((m) => m.id === messageId);
      if (message?.role !== "assistant" || !message.save) return;
      const { field, to, versionAtFail } = message.save;
      const draftId = threadsRef.current[threadId].draftId;
      patchMessage(threadId, messageId, (m) => ({ save: { ...m.save!, status: "retrying" }, activity: "checking", steps: [...m.steps, "Ponawiam zapis"] }));
      await wait(500);
      const current = draftsRef.current[draftId].fields[field];
      if (current.version !== versionAtFail) {
        // the parent changed the field after the failure: keep their value
        patchMessage(threadId, messageId, (m) => ({ save: { ...m.save!, status: "manual" }, activity: "available", steps: [...m.steps, "Pole zmieniono ręcznie, zostawiam Twoją wartość"] }));
        setFocus(field);
        return;
      }
      patchMessage(threadId, messageId, () => ({ activity: "writing" }));
      const ok = await saveField(draftId, field, to);
      if (ok) {
        writeField(draftId, field, to, "zusik");
        showChange(field);
        patchMessage(threadId, messageId, (m) => ({ save: { ...m.save!, from: current.value, status: "saved" }, activity: "confirming", steps: [...m.steps, "Zapis potwierdzony"] }));
      } else {
        patchMessage(threadId, messageId, (m) => ({
          save: { ...m.save!, status: "failed", versionAtFail: draftsRef.current[draftId].fields[field].version },
          activity: "attention",
        }));
      }
    },
  };

  // ---- attachments -----------------------------------------------------------------------------

  const upload = useCallback(
    async (threadId: string, file: Attachment) => {
      const ok = await uploadFile(file.name);
      patchThread(threadId, (t) => ({ files: t.files.map((f) => (f.id === file.id ? { ...f, status: ok ? "ready" : "failed" } : f)) }));
    },
    [patchThread],
  );

  // ---- panel ---------------------------------------------------------------------------------

  const openChat = useCallback(() => {
    setChatOpen(true);
    setAccepted((list) => (list.includes(draft.id) ? list : [...list, draft.id]));
  }, [draft.id]);

  const collapse = () => {
    focusBubble.current = true;
    setChatOpen(false);
    setShowHistory(false);
  };

  const switchDraft = (id: DraftId) => {
    const existing = Object.values(threadsRef.current)
      .filter((t) => t.draftId === id)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (existing) setActiveId(existing.id);
    else newThread(id);
    setShowHistory(false);
    setFocus("start");
  };

  const newThread = (draftId: DraftId = draft.id) => {
    const id = newId("t");
    setThreads((all) => ({
      ...all,
      [id]: { id, title: "Nowa rozmowa", draftId, caseLabel: DRAFT_CASE[draftId], updatedAt: Date.now(), messages: [], text: "", files: [], pending: null },
    }));
    setActiveId(id);
    setShowHistory(false);
  };

  const onSplitterPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const area = workArea.current;
    if (!area) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const box = area.getBoundingClientRect();
      setChatShare(Math.round(Math.min(70, Math.max(30, ((box.right - e.clientX) / box.width) * 100))));
    };
    const target = event.currentTarget;
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };

  // ---- Zusik -----------------------------------------------------------------------------------

  const waiting = !busy && Boolean(thread.pending?.field) && latest?.status === "done" && latest.save?.status !== "failed";
  const mascotState: ZusikState = !latest ? "available" : busy || latest.activity === "confirming" || latest.activity === "attention" ? latest.activity : waiting ? "waiting" : "available";
  const marginMascot = flying ? null : (
    <Babelek animated state={mascotState} toward={phone ? 300 : 200} typingTick={typingTick} className="h-auto w-full" />
  );

  const composer = (
    <Composer
      text={thread.text}
      files={thread.files}
      busy={busy}
      model={model}
      level={MODELS[model].reasoningLevels ? level : null}
      textareaRef={textarea}
      onText={(text) => {
        patchThread(activeId, () => ({ text }));
        setTypingTick((tick) => tick + 1);
      }}
      onAddFiles={(names) => {
        const added = names.map((name): Attachment => ({ id: newId("f"), name, status: "adding" }));
        patchThread(activeId, (t) => ({ files: [...t.files, ...added] }));
        added.forEach((file) => void upload(activeId, file));
      }}
      onRemoveFile={(id) => patchThread(activeId, (t) => ({ files: t.files.filter((f) => f.id !== id) }))}
      onRetryFile={(id) => {
        const file = thread.files.find((f) => f.id === id);
        if (!file) return;
        patchThread(activeId, (t) => ({ files: t.files.map((f) => (f.id === id ? { ...f, status: "adding" } : f)) }));
        void upload(activeId, file);
      }}
      onSend={() => send(thread.text.trim(), thread.files.filter((f) => f.status === "ready").map((f) => f.name))}
      onStop={stop}
      onModel={setModel}
      onLevel={setLevel}
    />
  );

  const showForm = !chatOpen || !fullscreen;
  const formMode = chatOpen && phone ? "fragment" : "full";

  return (
    <div
      className={`zd${phone && chatOpen && visualHeight > 0 && visualHeight < 560 ? " zd--compact" : ""}`}
      lang="pl"
      style={phone && chatOpen && visualHeight ? { height: visualHeight, bottom: "auto" } : undefined}
    >
      <div ref={workArea} className={`zd-work${phone ? " zd-work--column" : ""}`}>
        {showForm && (
          <div
            ref={formPane}
            className={`zd-form${formMode === "fragment" ? " zd-form--fragment" : ""}${blur ? " zd-form--blur" : ""}`}
            style={!phone && chatOpen ? { flex: `0 0 ${100 - chatShare}%` } : { flex: phone && chatOpen ? undefined : 1 }}
            aria-label="Szkic wniosku"
            role="region"
          >
            <DraftForm
              draft={draft}
              mode={formMode}
              focus={focus}
              changed={changed}
              onChangeField={(field, iso) => {
                writeField(draft.id, field, iso, "parent");
                setFocus(field);
              }}
              onSwitchDraft={switchDraft}
            />
          </div>
        )}
        {chatOpen && !phone && !fullscreen && (
          <button
            type="button"
            className="zd-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="Szerokość czatu"
            aria-valuemin={30}
            aria-valuemax={70}
            aria-valuenow={chatShare}
            onPointerDown={onSplitterPointer}
            onKeyDown={(event) => {
              const delta = { ArrowLeft: 5, ArrowRight: -5, Home: 70 - chatShare, End: 30 - chatShare }[event.key];
              if (delta === undefined) return;
              event.preventDefault();
              setChatShare((share) => Math.min(70, Math.max(30, share + delta)));
            }}
          >
            <span />
          </button>
        )}
        {chatOpen && (
          <ChatPanel
            threadId={thread.id}
            caseLabel={thread.caseLabel}
            messages={thread.messages}
            draft={draft}
            phone={phone}
            fullscreen={fullscreen}
            busy={busy}
            showHistory={showHistory}
            history={Object.values(threads).map(({ id, title, caseLabel, updatedAt }) => ({ id, title, caseLabel, updatedAt }))}
            starters={thread.messages.length === 0 ? STARTERS[draft.id] : null}
            mascot={marginMascot}
            composer={composer}
            readScroll={() => scrolls.current.get(thread.id)}
            actions={actions}
            onScrollSave={(top) => scrolls.current.set(thread.id, top)}
            onStarter={actions.onSuggestion}
            onHistory={setShowHistory}
            onPickThread={(id) => {
              setActiveId(id);
              setShowHistory(false);
              setFocus("start");
            }}
            onNewThread={() => newThread()}
            onFullscreen={() => setFullscreen((value) => !value)}
            onCollapse={collapse}
          />
        )}
      </div>

      {inviteVisible && (
        <div className="zd-invite" role="dialog" aria-label="Zaproszenie Zusika">
          <span>Chcesz wypełnić ten wniosek z Zusikiem?</span>
          <div className="zd-invite__actions">
            <button
              type="button"
              className="zd-btn"
              onClick={() => {
                openChat();
                if (thread.messages.length === 0) send("Tak, pomóż");
              }}
            >
              Tak, pomóż
            </button>
            <button
              type="button"
              className="zd-btn zd-btn--ghost"
              onClick={() => {
                try {
                  window.localStorage.setItem(INVITE_KEY + draft.id, "1");
                } catch {
                  // storage unavailable: the invitation stays hidden for this session only
                }
                setDismissed((list) => [...list, draft.id]);
                bubble.current?.focus();
              }}
            >
              Nie teraz
            </button>
          </div>
        </div>
      )}

      {!chatOpen && (
        <button ref={bubble} type="button" className="zd-corner" aria-label="Otwórz czat z Zusikiem" onClick={openChat}>
          <Babelek animated entrance state="available" inviting={inviteVisible} toward={225} className="h-auto w-full" />
        </button>
      )}

      {flying && (
        <motion.div className="zd-flyer" style={{ x: flyX, y: flyY }} aria-hidden="true">
          <Babelek animated state="writing" toward={90} className="h-auto w-full" />
        </motion.div>
      )}
    </div>
  );
}
