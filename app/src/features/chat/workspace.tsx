"use client";

import { ScenarioNav } from "./scenario-nav";
import { useCaseResource } from "./use-case-resource";
import { MartaDraft, MartaInterview, type DeadlineSource } from "./marta-workflow";
import { checkedCopy } from "./marta-attachment";
import { martaInput } from "./marta-input";
import type { MartaView } from "@/lib/marta/types";
import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import type { ZusikState } from "@/components/mascot/types";
import type { Choice } from "@/lib/zusik/constants";
import { DRAFT_ID } from "./case-data";
import { ChatPanel } from "./chat-panel";
import { Composer } from "./composer";
import { DraftForm } from "./draft-form";
import { useZusikCase, type CaseError } from "./use-zusik-case";
import s from "./zusik.module.css";

const INVITE_KEY = `zusik:invite-dismissed:${DRAFT_ID}`;
const SHARE_MIN = 30;
const SHARE_MAX = 70;
const HIGHLIGHT_MS = 4_000;

const PHONE_QUERY = "(max-width: 767px)";
function subscribePhone(notify: () => void) {
  const list = window.matchMedia(PHONE_QUERY);
  list.addEventListener("change", notify);
  return () => list.removeEventListener("change", notify);
}

function usePhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

function subscribeViewport(notify: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", notify);
  viewport?.addEventListener("scroll", notify);
  return () => {
    viewport?.removeEventListener("resize", notify);
    viewport?.removeEventListener("scroll", notify);
  };
}

/** Visible height and offset; the visible area shrinks when the on-screen keyboard opens. */
function useVisualViewport(): { height: number; top: number } | null {
  const raw = useSyncExternalStore(
    subscribeViewport,
    () => `${Math.round(window.visualViewport?.height ?? window.innerHeight)}:${Math.round(window.visualViewport?.offsetTop ?? 0)}`,
    () => "",
  );
  if (!raw) return null;
  const [height, top] = raw.split(":").map(Number);
  return { height, top };
}

function subscribeStorage(notify: () => void) {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}

function readDismissed() {
  try {
    return window.localStorage.getItem(INVITE_KEY) === "1";
  } catch {
    return false;
  }
}

/** "Nie teraz" is remembered per draft in this browser; it is a convenience, not case data. */
function useInviteDismissed(): [boolean, () => void] {
  const [local, setLocal] = useState(false);
  const stored = useSyncExternalStore(subscribeStorage, readDismissed, () => true);
  const dismiss = () => {
    setLocal(true);
    try {
      window.localStorage.setItem(INVITE_KEY, "1");
    } catch {
      // storage unavailable: the invitation stays hidden for this visit only
    }
  };
  return [stored || local, dismiss];
}

function caseErrorText(error: CaseError | null): string | null {
  if (!error) return null;
  switch (error.kind) {
    case "config":
      return `Serwer nie ma jeszcze ustawionej konfiguracji (${error.variable ?? "brak nazwy"}). Sprawa otworzy się po jej uzupełnieniu.`;
    case "network":
      return "Brak połączenia z serwerem. Nic nie zostało utracone. Spróbuj ponownie.";
    case "forbidden":
      return "Nie udało się potwierdzić sesji. Odśwież stronę.";
    default:
      return "Nie udało się odczytać ani zapisać sprawy. Spróbuj ponownie.";
  }
}

export function ZusikWorkspace({ initialChatOpen = false, deadlineSource }: { initialChatOpen?: boolean; deadlineSource?:DeadlineSource }) {
  const zusik = useZusikCase();
  const marta = useCaseResource<MartaView>("/api/zusik/marta", initialChatOpen && zusik.view !== null, false);
  const phone = usePhone();
  const viewport = useVisualViewport();
  const [inviteDismissed, dismissInvite] = useInviteDismissed();

  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [chatShare, setChatShare] = useState(50);
  const [text, setText] = useState("");
  const [attachment,setAttachment] = useState<File|null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<Choice | null>(null);
  const [typingTick, setTypingTick] = useState(0);
  const [expiredSave, setExpiredSave] = useState<number | null>(null);

  const bubble = useRef<HTMLButtonElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const workArea = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const scrollMemory = useRef<number | null>(null);
  const focusBubble = useRef(false);

  const view = zusik.view;
  const awaiting = view?.state === "awaiting_choice";
  const activePreview = awaiting ? preview : null;
  const highlight = zusik.savedAt !== null && expiredSave !== zusik.savedAt;
  const busy = zusik.phase === "starting" || zusik.phase === "saving" || zusik.asking || marta.busy;
  const inviteVisible = !chatOpen && !inviteDismissed && !inviteAccepted;

  // the field outline after a confirmed save fades after a few seconds
  useEffect(() => {
    if (zusik.savedAt === null) return;
    const saved = zusik.savedAt;
    const timer = setTimeout(() => setExpiredSave(saved), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [zusik.savedAt]);

  // opening the chat moves focus to the message field; collapsing it returns focus to the bubble
  useEffect(() => {
    if (chatOpen) textarea.current?.focus({ preventScroll: true });
    else if (focusBubble.current) {
      focusBubble.current = false;
      bubble.current?.focus();
    }
  }, [chatOpen]);

  const openChat = () => {
    setChatOpen(true);
    setInviteAccepted(true);
  };

  const collapse = () => {
    focusBubble.current = true;
    setChatOpen(false);
  };

  /** Points at the saved field: on a computer in the draft on the left, on a phone above the chat. */
  const showField = () => {
    setFullscreen(false);
    requestAnimationFrame(() => {
      const el = field.current;
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      el.focus({ preventScroll: true });
    });
  };

  const send = async () => {
    const question = text.trim();
    if (!question || busy) return;
    setText("");
    setComposerNotice(null);
    if (initialChatOpen) {
      const intent = martaInput(question, marta.view, new Date().toLocaleDateString("sv-SE", {timeZone:"Europe/Warsaw"}));
      if (intent) {
        if ("notice" in intent) setComposerNotice(intent.notice);
        else if (!marta.loaded || !(await marta.send(intent.action))) {
          setText(question);
          setComposerNotice("Sprawdź stan sprawy i ponów zmianę.");
        }
        return;
      }
    }
    const outcome = await zusik.ask(question);
    if (outcome.kind === "invalid") {
      setText((current) => (current.trim() ? current : question));
      setComposerNotice("Napisz pytanie w kilku słowach (do kilkuset znaków) i wyślij je ponownie.");
    } else if (outcome.kind === "unavailable") {
      // keep what the parent wrote: put it back unless they already started a new message
      setText((current) => (current.trim() ? current : question));
      setComposerNotice(
        outcome.message ??
          (outcome.reason === "not_deployed"
            ? "Odpowiedzi z bazy wiedzy jeszcze nie są włączone. Twoje pytanie czeka w polu wiadomości."
            : "Baza wiedzy jest chwilowo niedostępna. Twoje pytanie czeka w polu wiadomości. Spróbuj za chwilę."),
      );
    }
  };

  const onSplitterPointer = (event: PointerEvent<HTMLDivElement>) => {
    const area = workArea.current;
    if (!area) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    const move = (e: globalThis.PointerEvent) => {
      const box = area.getBoundingClientRect();
      const share = ((box.right - e.clientX) / box.width) * 100;
      setChatShare(Math.round(Math.min(SHARE_MAX, Math.max(SHARE_MIN, share))));
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  };

  const onSplitterKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = { ArrowLeft: chatShare + 5, ArrowRight: chatShare - 5, Home: SHARE_MAX, End: SHARE_MIN }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setChatShare(Math.min(SHARE_MAX, Math.max(SHARE_MIN, next)));
  };

  const mascotState: ZusikState =
    zusik.phase === "error"
      ? "attention"
      : zusik.phase === "starting" || view?.state === "starting" || zusik.asking
        ? "searching"
        : zusik.phase === "saving"
          ? "writing"
          : highlight
            ? "confirming"
            : awaiting
              ? "waiting"
              : "available";

  const showForm = !chatOpen || !fullscreen;
  const formMode = chatOpen && phone ? "fragment" : "full";
  const split = chatOpen && !phone && !fullscreen;

  return (
    <div
      className={`${s.root} ${phone && chatOpen ? s.rootLocked : ""}`}
      data-zusik-workspace
      style={phone && chatOpen && viewport ? { height: viewport.height, top: viewport.top } : undefined}
    >
      <ScenarioNav current="marta" />

      <div ref={workArea} className={`${s.work} ${phone ? s.workColumn : ""}`}>
        {showForm && (
          <div
            id="zusik-draft"
            className={`${s.formPane} ${formMode === "fragment" ? s.formPaneFragment : ""} ${chatOpen ? "" : s.formPaneAlone}`}
            style={split ? { flexBasis: `${100 - chatShare}%` } : undefined}
            role="region"
            aria-label="Szkic wniosku"
          >
            {initialChatOpen ? <MartaDraft loaded={marta.loaded} source={deadlineSource} view={marta.view} phone={formMode === "fragment"} /> : <DraftForm
              savedChoice={view?.state === "completed" ? view.choice : null}
              pendingChoice={zusik.pendingChoice}
              preview={activePreview}
              mode={formMode}
              highlight={highlight}
              fieldRef={field}
              onDecide={openChat}
            />}
          </div>
        )}
        {split && (
          <div
            className={s.splitter}
            role="separator"
            tabIndex={0}
            aria-orientation="vertical"
            aria-controls="zusik-draft"
            aria-label="Szerokość czatu"
            aria-valuemin={SHARE_MIN}
            aria-valuemax={SHARE_MAX}
            aria-valuenow={chatShare}
            aria-valuetext={`Czat zajmuje ${chatShare}% szerokości`}
            onPointerDown={onSplitterPointer}
            onKeyDown={onSplitterKey}
          >
            <span aria-hidden="true" />
          </div>
        )}
        {chatOpen && (
          <div className={s.chatPane} style={split ? { flexBasis: `${chatShare}%` } : undefined}>
            <ChatPanel
              fullscreen={fullscreen}
              mascot={<Babelek animated state={mascotState} toward={phone ? 300 : 200} typingTick={typingTick} />}
              steps={{
                view,
                phase: zusik.phase,
                pendingChoice: zusik.pendingChoice,
                preview: activePreview,
                onPreview: setPreview,
                onAccept: (choice) => void zusik.choose(choice),
                onStart: () => void zusik.start(),
                onShowField: showField,
              }}
              workflow={initialChatOpen ? <MartaInterview fullscreen={fullscreen} scope={zusik.documentCache} state={marta} attachment={attachment} onAttach={setAttachment} /> : undefined}
              workflowVersion={marta.view?.version}
              activity={zusik.activity}
              partialText={zusik.partialText}
              conversation={zusik.conversation}
              caseError={caseErrorText(zusik.error)}
              notice={zusik.notice}
              readScroll={() => scrollMemory.current}
              onScrollSave={(top) => {
                scrollMemory.current = top;
              }}
              composer={
                <Composer
                  text={text}
                  busy={busy}
                  notice={composerNotice}
                  textareaRef={textarea}
                  attachment={attachment}
                  onAttach={initialChatOpen && !marta.view?.selected ? async (file)=>{
                    try { setAttachment(file ? await checkedCopy(file) : null); }
                    catch { setComposerNotice("Wybierz niepusty PDF, PNG lub JPEG do 25 MB.");return; }
                    setComposerNotice(file ? `Wybrano odpis: ${file.name}. Przy zatwierdzaniu wskaż, czy dołączyć go do wniosku.` : "Usunięto wybrany odpis.");
                  } : undefined}
                  onText={(value) => {
                    setText(value);
                    setTypingTick((tick) => tick + 1);
                  }}
                  onSend={() => void send()}
                />
              }
              onRetryAsk={(requestId) => void zusik.retryAsk(requestId)}
              onRetryCase={() => void zusik.restore()}
              onFullscreen={() => setFullscreen((value) => !value)}
              onCollapse={collapse}
            />
          </div>
        )}
      </div>

      {inviteVisible && (
        <div className={s.invite} role="dialog" aria-label="Zaproszenie Zusika">
          <p>Chcesz wypełnić ten wniosek z Zusikiem?</p>
          <div className={s.row8}>
            <button type="button" className={s.primaryButton} onClick={openChat}>
              Tak, pomóż
            </button>
            <button
              type="button"
              className={s.secondaryButton}
              onClick={() => {
                dismissInvite();
                bubble.current?.focus();
              }}
            >
              Nie teraz
            </button>
          </div>
        </div>
      )}

      {!chatOpen && (
        <button ref={bubble} type="button" className={s.bubble} aria-label="Otwórz czat z Zusikiem" onClick={openChat}>
          <Babelek animated entrance state="available" inviting={inviteVisible} toward={225} />
        </button>
      )}
    </div>
  );
}
