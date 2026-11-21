"use client";

import { useEffect, type RefObject } from "react";
import s from "./zusik.module.css";

type Props = {
  text: string;
  /** Zusik is working (start, save or a question on its way): the outline runs, sending waits. */
  busy: boolean;
  /** Shown above the field, e.g. when the knowledge base is unavailable and the text was kept. */
  notice: string | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onText: (text: string) => void;
  onSend: () => void;
};

/** The message field, laid out like Claude's: text on top, attachment left, send right. */
export function Composer({ text, busy, notice, textareaRef, onText, onSend }: Props) {
  const canSend = !busy && text.trim().length > 0;

  // grow the text area with its content (up to the CSS max-height)
  useEffect(() => {
    const area = textareaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }, [text, textareaRef]);

  return (
    <div className={s.composerWrap}>
      {notice && (
        <p className={s.composerNotice} role="status">
          {notice}
        </p>
      )}
      <div className={`${s.composer} ${busy ? s.composerBusy : ""}`}>
        <label className={s.srOnly} htmlFor="zusik-message">
          Wiadomość do Zusika
        </label>
        <textarea
          id="zusik-message"
          ref={textareaRef}
          rows={1}
          maxLength={500}
          value={text}
          placeholder="Zapytaj Zusika…"
          className={s.textarea}
          onChange={(event) => onText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
        <div className={s.composerBar}>
          <button
            type="button"
            className={s.iconButton}
            aria-label="Dołącz dokument"
            aria-disabled="true"
            aria-describedby="zusik-attach-note"
          >
            <PaperclipIcon />
          </button>
          <span id="zusik-attach-note" className={s.srOnly}>
            Dołączanie dokumentów pojawi się razem z zapisem szkicu.
          </span>
          <span className={s.composerHint} aria-hidden="true">
            {busy ? "Zusik pracuje…" : "Enter wysyła · Shift+Enter nowa linia"}
          </span>
          <button type="button" className={s.send} aria-label="Wyślij" disabled={!canSend} onClick={onSend}>
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function PaperclipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
