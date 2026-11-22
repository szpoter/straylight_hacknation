"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import type { FamilyChatScope } from "@/lib/zusik/conversation";
import { GeneralConversation } from "./case-chat-window";
import { usePhone, useVisualViewport } from "./use-chat-viewport";
import styles from "./parent-chat.module.css";

type FamilyPanel = {
  expanded: boolean;
  close: () => void;
  family?: FamilyChatScope;
  label?: string;
  introduction?: ReactNode;
};

export function ParentChat({ children, panel: familyPanel, topLauncher = false }: { children: ReactNode; panel?: FamilyPanel; topLauncher?: boolean }) {
  const [mode, setMode] = useState<"unopened" | "closed" | "split" | "full">("unopened");
  const dialog = useRef<HTMLDialogElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const id = useId();
  const opener = useRef<HTMLElement | null>(null);
  const mounted = familyPanel ? Boolean(familyPanel.family) : mode !== "unopened";
  const expanded = familyPanel?.expanded ?? (mode === "split" || mode === "full");
  const full = expanded && mode === "full";
  const close = () => {
    familyPanel?.close();
    setMode("closed");
  };
  const viewport = useVisualViewport();
  const phone = usePhone();
  const panelHeight = viewport ? Math.round(viewport.height * (mode === "full" ? 1 : 0.7)) : 0;

  useEffect(() => {
    const panel = dialog.current;
    if (!panel) return;
    if (!expanded) {
      if (panel.open) {
        panel.close();
        (opener.current?.isConnected ? opener.current : launcher.current ??
          document.querySelector<HTMLElement>('button[aria-label$="Otwórz czat z Zusikiem"]:not([hidden])'))?.focus({preventScroll: true});
      }
      return;
    }
    if (panel.open) panel.close();
    if (full) panel.showModal();
    else panel.show();
    panel.querySelector("textarea")?.focus({preventScroll: true});
  }, [expanded, full, familyPanel?.family?.planId, familyPanel?.family?.stopId]);

  return (
    <div className={styles.layout} data-split={expanded && !full || undefined}
      onClickCapture={event => {
        if (!expanded && event.target instanceof Element) opener.current = event.target.closest("button");
      }}>
      <div className={styles.page}>{children}</div>
      {!familyPanel && <button ref={launcher} type="button" className={styles.launcher} data-top={topLauncher || undefined} hidden={expanded}
        aria-label="Otwórz czat z Zusikiem" aria-controls={id} aria-expanded={expanded} onClick={() => setMode("split")}>
        <span aria-hidden="true"><Babelek state="available" /></span>Zapytaj Zusika
      </button>}
      <dialog ref={dialog} id={id} className={styles.panel} aria-label="Rozmowa z Zusikiem" data-full={full || undefined}
        style={phone && viewport ? {height: panelHeight, top: viewport.top + viewport.height - panelHeight, bottom: "auto"} : undefined}
        onCancel={event => { event.preventDefault(); close(); }}
        onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); close(); } }}>
        {mounted && <GeneralConversation key={JSON.stringify(familyPanel?.family)} family={familyPanel?.family}
          label={familyPanel?.label} introduction={familyPanel?.introduction} controls={{
          fullscreen: mode === "full",
          onFullscreen: () => setMode(mode === "full" ? "split" : "full"),
          onCollapse: close,
        }} />}
      </dialog>
    </div>
  );
}
