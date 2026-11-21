"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import type { RuleState } from "./mock-data";
import s from "./admin.module.css";

export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

const STATE_CLASS: Record<RuleState, string> = {
  Obowiązuje: s.badgeActive,
  Zaplanowana: s.badgePlanned,
  Szkic: s.badgeDraft,
  Historyczna: s.badgeHistoric,
};

export function StateBadge({ state }: { state: RuleState }) {
  return <span className={cx(s.badge, STATE_CLASS[state])}>{state}</span>;
}

export function Badge({ children, tone }: { children: ReactNode; tone: "active" | "planned" | "warn" | "historic" }) {
  const toneClass = {
    active: s.badgeActive,
    planned: s.badgePlanned,
    warn: s.badgeWarn,
    historic: s.badgeHistoric,
  }[tone];
  return <span className={cx(s.badge, toneClass)}>{children}</span>;
}

interface TileProps {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  className?: string;
  pressed?: boolean;
  onClick?: () => void;
}

export function StatTile({ label, value, note, className, pressed, onClick }: TileProps) {
  const body = (
    <>
      <span className={s.tileLabel}>{label}</span>
      <span className={s.tileValue}>{value}</span>
      {note ? <span className={s.tileNote}>{note}</span> : null}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={cx(s.tile, pressed && s.tileActive, className)}
        aria-pressed={pressed}
        onClick={onClick}
      >
        {body}
      </button>
    );
  }
  return <div className={cx(s.tile, className)}>{body}</div>;
}

export function Card({
  title,
  meta,
  children,
  className,
  id,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section className={cx(s.card, className)} aria-labelledby={title && id ? `${id}-title` : undefined}>
      {title ? (
        <div className={s.cardHead}>
          <h2 className={s.cardTitle} id={id ? `${id}-title` : undefined}>
            {title}
          </h2>
          {meta ? <span className={s.cardMeta}>{meta}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Pill tabs following the W3C APG tabs pattern (arrow keys wrap, Home/End). */
export function PillTabs<T extends string>({
  label,
  items,
  value,
  onChange,
  idPrefix,
}: {
  label: string;
  items: readonly T[];
  value: T;
  onChange: (next: T) => void;
  idPrefix: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    if (next === null) return;
    event.preventDefault();
    onChange(items[next]);
    refs.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className={s.tabs}>
      {items.map((item, index) => {
        const selected = item === value;
        return (
          <button
            key={item}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${index}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            className={s.tab}
            onClick={() => onChange(item)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
}

/** Side panel built on <dialog>: focus trap and Esc come from the browser. */
export function Drawer({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={s.drawer}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open ? (
        <div className={s.drawerInner}>
          <div className={s.drawerHead}>
            <div>
              {eyebrow ? <p className={s.eyebrow}>{eyebrow}</p> : null}
              <h2 className={s.drawerTitle}>{title}</h2>
            </div>
            <button type="button" className={s.btnSmall} onClick={onClose}>
              Zamknij
            </button>
          </div>
          {children}
          {footer ? <div className={s.drawerFoot}>{footer}</div> : null}
        </div>
      ) : null}
    </dialog>
  );
}
