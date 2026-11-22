import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import {
  getChatEffort, getChatModel, getChatVerification, setChatEffort, setChatModel, setChatVerification, subscribeChatModel,
  type ChatEffort, type ChatModelChoice, type ChatVerification,
} from "./model-selection";
import s from "./zusik.module.css";

const models = { pllum: "PLLuM", bielik: "Bielik" } as const;
const verifications = { standard: "Standardowa", extra: "Dodatkowa" } as const;
type Option = ChatModelChoice | ChatVerification | ChatEffort;

export function ModelPicker() {
  const selected = useSyncExternalStore(subscribeChatModel, getChatModel, () => "bielik" as const);
  const verification = useSyncExternalStore(subscribeChatModel, getChatVerification, () => "standard" as const);
  const effort = useSyncExternalStore(subscribeChatModel, getChatEffort, () => "default" as const);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>(`[data-option="${selected}"]`)?.focus();
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open, selected]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]'));
    const index = options.findIndex(option => option === event.target);
    const next: Record<string, number> = {
      ArrowDown: (index + 1) % options.length,
      ArrowUp: (index - 1 + options.length) % options.length,
      Home: 0, End: options.length - 1,
    };
    if (Object.hasOwn(next, event.key)) {
      event.preventDefault();
      options[next[event.key]].focus();
    }
  }

  function option(value: Option, label: string, checked: boolean, choose: () => void) {
    return <button type="button" role="menuitemradio" aria-checked={checked} data-option={value}
      tabIndex={-1} className={s.modelOption} onClick={() => { choose(); close(); }}>
      <span>{label}</span>
      {checked && <span aria-hidden="true">✓</span>}
    </button>;
  }

  return (
    <div ref={root} className={s.modelPicker} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button type="button" ref={trigger} className={s.iconButton}
        aria-label={`Wybierz model, aktualnie ${models[selected]}`}
        aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
          }
        }}>
        {models[selected]}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div id={menuId} className={s.modelMenu} role="menu" aria-label="Model odpowiedzi" onKeyDown={navigate}>
        <div role="group" aria-label="Model">
          {option("pllum", models.pllum, selected === "pllum", () => setChatModel("pllum"))}
          {option("bielik", models.bielik, selected === "bielik", () => setChatModel("bielik"))}
        </div>
        {selected === "bielik" && <>
          <div role="group" aria-labelledby={menuId + "-effort"} className={s.modelSettingsGroup}>
            <div id={menuId + "-effort"}>Poziom rozumowania</div>
            {option("default", "Domyślne", effort === "default", () => setChatEffort("default"))}
            {option("low", "Niski", effort === "low", () => setChatEffort("low"))}
            {option("high", "Wysoki", effort === "high", () => setChatEffort("high"))}
          </div>
          <div role="group" aria-labelledby={menuId + "-verification"} className={s.modelSettingsGroup}>
            <div id={menuId + "-verification"}>Weryfikacja źródeł</div>
            {option("standard", verifications.standard, verification === "standard", () => setChatVerification("standard"))}
            {option("extra", verifications.extra, verification === "extra", () => setChatVerification("extra"))}
          </div>
        </>}
      </div>}
    </div>
  );
}
