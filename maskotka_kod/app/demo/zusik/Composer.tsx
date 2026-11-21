"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { MODELS, type ModelId } from "./services";
import { ArrowUpIcon, CheckIcon, ChevronDownIcon, FileIcon, PaperclipIcon, StopIcon } from "./icons";

export type Attachment = { id: string; name: string; status: "adding" | "ready" | "failed" };

type Props = {
  text: string;
  files: Attachment[];
  busy: boolean;
  model: ModelId;
  level: string | null;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onText: (text: string) => void;
  onAddFiles: (names: string[]) => void;
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
  onSend: () => void;
  onStop: () => void;
  onModel: (model: ModelId) => void;
  onLevel: (level: string) => void;
};

/** The composer: text on top; attachment on the left, model and send on the right (as in Claude). */
export function Composer(props: Props) {
  const { text, files, busy, model, level, textareaRef } = props;
  const fileInput = useRef<HTMLInputElement>(null);
  const canSend = !busy && (text.trim().length > 0 || files.some((f) => f.status === "ready")) && !files.some((f) => f.status === "adding");

  // grow the text area with its content (up to the CSS max-height)
  useEffect(() => {
    const area = textareaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${area.scrollHeight}px`;
  }, [text, textareaRef]);

  return (
    <div className={`zd-composer${busy ? " zd-composer--busy" : ""}`}>
      {files.length > 0 && (
        <ul className="zd-files" style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Załączniki">
          {files.map((file) => (
            <li key={file.id} className={`zd-file${file.status === "failed" ? " zd-file--failed" : ""}`}>
              <FileIcon />
              <span>
                <span className="zd-file__name">{file.name}</span>{" "}
                <span className="zd-status">
                  · {file.status === "adding" ? "Dodawanie…" : file.status === "ready" ? "Gotowy" : "Nie udało się dodać"}
                </span>
              </span>
              <span className="zd-row" style={{ gap: 8 }}>
                {file.status === "failed" && (
                  <button type="button" className="zd-link" onClick={() => props.onRetryFile(file.id)}>
                    Spróbuj ponownie
                  </button>
                )}
                <button type="button" className="zd-link" aria-label={`Usuń ${file.name}`} onClick={() => props.onRemoveFile(file.id)}>
                  Usuń
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <label className="zd-sr" htmlFor="zd-message">
        Wiadomość do Zusika
      </label>
      <textarea
        id="zd-message"
        ref={textareaRef}
        rows={1}
        value={text}
        placeholder="Zapytaj Zusika…"
        onChange={(event) => props.onText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (canSend) props.onSend();
          }
        }}
      />
      <div className="zd-composer__bar">
        <button type="button" className="zd-icon-btn" aria-label="Dołącz dokument" onClick={() => fileInput.current?.click()}>
          <PaperclipIcon />
        </button>
        <input
          ref={fileInput}
          type="file"
          hidden
          multiple
          onChange={(event) => {
            const names = Array.from(event.target.files ?? [], (file) => file.name);
            if (names.length) props.onAddFiles(names);
            event.target.value = "";
          }}
        />
        <span className="zd-composer__spacer" />
        <ModelMenu model={model} level={level} onModel={props.onModel} onLevel={props.onLevel} />
        {busy ? (
          <button type="button" className="zd-send" aria-label="Zatrzymaj odpowiedź" onClick={props.onStop}>
            <StopIcon />
          </button>
        ) : (
          <button type="button" className="zd-send" aria-label="Wyślij" disabled={!canSend} onClick={props.onSend}>
            <ArrowUpIcon />
          </button>
        )}
      </div>
    </div>
  );
}

/** "PLLuM ⌄" menu. "Poziom rozumowania" only for a model whose deployed API declares it. */
function ModelMenu({
  model,
  level,
  onModel,
  onLevel,
}: {
  model: ModelId;
  level: string | null;
  onModel: (model: ModelId) => void;
  onLevel: (level: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const levels = MODELS[model].reasoningLevels;
  const button = useRef<HTMLButtonElement>(null);
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  return (
    <div className="zd-menu-wrap" onKeyDown={(event) => event.key === "Escape" && open && close()}>
      <button
        ref={button}
        type="button"
        className="zd-model"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Model: ${MODELS[model].name}${levels && level ? `, poziom rozumowania ${level}` : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        {MODELS[model].name}
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="zd-menu zd-menu--up" role="menu" aria-label="Model">
          {(Object.keys(MODELS) as ModelId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={id === model}
              className="zd-menu__item"
              autoFocus={id === model}
              onClick={() => {
                onModel(id);
                close();
              }}
            >
              {MODELS[id].name}
              {id === model && <CheckIcon />}
            </button>
          ))}
          {levels && (
            <>
              <div className="zd-menu__sep" role="separator" />
              <div className="zd-menu__head" aria-hidden="true">
                Poziom rozumowania
              </div>
              {levels.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="menuitemradio"
                  aria-checked={option === level}
                  className="zd-menu__item"
                  onClick={() => {
                    onLevel(option);
                    close();
                  }}
                >
                  {option}
                  {option === level && <CheckIcon />}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
