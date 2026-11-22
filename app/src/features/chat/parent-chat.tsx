"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import { GeneralConversation } from "./case-chat-window";
import { usePhone, useVisualViewport } from "./use-chat-viewport";
import styles from "./parent-chat.module.css";

export function ParentChat({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<"unopened" | "closed" | "split" | "full">("unopened");
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const id = useId();
  const expanded = mode === "split" || mode === "full";
  const viewport = useVisualViewport();
  const phone = usePhone();
  const panelHeight = viewport ? Math.round(viewport.height * (mode === "full" ? 1 : 0.7)) : 0;

  useEffect(() => {
    const panel = dialog.current;
    if (!panel || mode === "unopened") return;
    if (panel.open) panel.close();
    if (mode === "closed") {
      launcher.current?.focus({preventScroll: true});
      return;
    }
    if (mode === "full") panel.showModal();
    else panel.show();
    panel.querySelector("textarea")?.focus({preventScroll: true});
  }, [mode]);

  return (
    <div className={styles.layout} data-split={mode === "split" || undefined}>
      <div className={styles.page}>{children}</div>
      <button ref={launcher} type="button" className={styles.launcher} hidden={expanded}
        aria-label="Otwórz czat z Zusikiem" aria-controls={id} aria-expanded={expanded} onClick={() => setMode("split")}>
        <span aria-hidden="true"><Babelek state="available" /></span>Zapytaj Zusika
      </button>
      <dialog ref={dialog} id={id} className={styles.panel} aria-label="Rozmowa z Zusikiem" data-full={mode === "full" || undefined}
        style={phone && viewport ? {height: panelHeight, top: viewport.top + viewport.height - panelHeight, bottom: "auto"} : undefined}
        onCancel={event => { event.preventDefault(); setMode("closed"); }}
        onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); setMode("closed"); } }}>
        {mode !== "unopened" && <GeneralConversation controls={{
          fullscreen: mode === "full",
          onFullscreen: () => setMode(mode === "full" ? "split" : "full"),
          onCollapse: () => setMode("closed"),
        }} />}
      </dialog>
    </div>
  );
}
