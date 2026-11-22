"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/components/ui/cn";
import { CloseIcon, InfoIcon } from "@/components/ui/icons";
import { Zusik } from "@/components/mascot/Zusik";
import { stepsFor, type GuideStep } from "./steps";

type Rect = { left: number; top: number; width: number; height: number };

/** Pierwszy widoczny element z danym `data-tour` (np. pasek kart na komputerze albo dolny pasek na telefonie). */
function findTarget(id: string): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)) {
    if (el.closest("[hidden]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}

const SEEN_KEY = "zusik:przewodnik-widziany";

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {}
}

/**
 * Przycisk „Jak to działa?” i przewodnik po bieżącej karcie: przyciemnienie z wycięciem wokół
 * elementu, karta z opisem, postęp, Pomiń / Wstecz / Dalej i klawiatura (strzałki, Esc).
 * `?przewodnik=1` w adresie otwiera go od razu (np. na prezentacji). Bez animacji (CLAUDE.md).
 * `steps` pozwala użyć przycisku poza kartami rodzica, z własną listą kroków.
 */
export function GuideButton({ steps }: { steps?: GuideStep[] } = {}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [unseen, setUnseen] = useState(false);
  const all = steps ?? stepsFor(pathname);

  useEffect(() => {
    if (params.get("przewodnik") !== "1" || !all.length) return;
    const id = requestAnimationFrame(() => {
      setOpen(true);
      markSeen();
    });
    return () => cancelAnimationFrame(id);
  }, [params, all.length]);

  // Kropka przy przycisku, dopóki rodzic choć raz nie otworzy przewodnika (tylko ta przeglądarka).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        setUnseen(window.localStorage.getItem(SEEN_KEY) !== "1" && !new URLSearchParams(window.location.search).has("przewodnik"));
      } catch {
        setUnseen(false);
      }
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const start = () => {
    setOpen(true);
    setUnseen(false);
    markSeen();
  };

  if (!all.length) return null;
  return (
    <>
      <button
        type="button"
        onClick={start}
        className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-outline px-3 text-meta font-medium hover:bg-surface"
        aria-haspopup="dialog"
      >
        <InfoIcon size={18} />
        <span className="max-sm:sr-only">Jak to działa?</span>
        {unseen && (
          <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-background bg-primary">
            <span className="sr-only"> (nowy przewodnik)</span>
          </span>
        )}
      </button>
      {open && <GuideTour steps={all} onClose={() => setOpen(false)} />}
    </>
  );
}

type Side = "below" | "above" | "over" | "centre";

function GuideTour({ steps: all, onClose }: { steps: GuideStep[]; onClose: () => void }) {
  // Kroki bez widocznego elementu pomijamy (inny widok, inny rozmiar ekranu). Sprawdzamy przy
  // każdym przejściu, bo strona sprawy może jeszcze się wczytywać, gdy przewodnik się otwiera.
  const shown = (s: GuideStep) => !s.target || Boolean(findTarget(s.target));
  const [index, setIndex] = useState(0);
  const steps = all.filter((s, i) => i === index || shown(s));
  const position = steps.indexOf(all[index]);
  const [spot, setSpot] = useState<Rect | null>(null);
  const [card, setCard] = useState<{ left: number; top: number; side: Side; caret: number } | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const step = all[index];
  const last = position === steps.length - 1;
  // Powitanie (pierwszy krok bez elementu) pokazuje Zusika i spis tego, co przewodnik omówi.
  const intro = position === 0 && !step?.target;

  const measure = useCallback(() => {
    const el = step?.target ? findTarget(step.target) : null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const c = cardRef.current;
    const cw = c?.offsetWidth ?? 360;
    const ch = c?.offsetHeight ?? 220;
    if (!el) {
      setSpot(null);
      setCard({ left: Math.round((vw - cw) / 2), top: Math.max(12, Math.round((vh - ch) / 2)), side: "centre", caret: 0 });
      return;
    }
    const r = el.getBoundingClientRect();
    const pad = 8;
    const s = {
      left: Math.max(0, r.left - pad),
      top: Math.max(0, r.top - pad),
      width: Math.min(vw, r.right + pad) - Math.max(0, r.left - pad),
      height: Math.min(vh, r.bottom + pad) - Math.max(0, r.top - pad),
    };
    setSpot(s);
    const clamp = (v: number, max: number) => Math.max(12, Math.min(v, max - 12));
    const gap = 16;
    const below = s.top + s.height + gap;
    const above = s.top - gap - ch;
    // Pod elementem, nad nim, a gdy element zajmuje cały ekran — przy dolnej krawędzi, na nim.
    const side: Side = below + ch <= vh - 12 ? "below" : above >= 12 ? "above" : "over";
    const top = side === "below" ? below : side === "above" ? above : vh - ch - 12;
    const left = Math.round(clamp(s.left + s.width / 2 - cw / 2, vw - cw));
    const caret = Math.max(24, Math.min(s.left + s.width / 2 - left, cw - 24));
    setCard({ left, top: Math.round(clamp(top, vh - ch)), side, caret });
  }, [step]);
  // Nowy krok: przewiń do elementu, potem zmierz.
  useLayoutEffect(() => {
    const el = step?.target ? findTarget(step.target) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      // Pod przyklejonym paskiem kart (56 px + 8 px odstępu) zostawiamy miejsce, żeby go nie zasłonił.
      const header = 80;
      const room = window.innerHeight - header;
      const offset = r.height < room * 0.6 ? header + (room - r.height) / 2 - 60 : header;
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - offset), behavior: "auto" });
    }
    const id = requestAnimationFrame(measure);
    nextRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(id);
  }, [step, measure]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onMove = () => measure();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
      opener?.focus?.({ preventScroll: true });
    };
  }, [measure]);

  const go = useCallback(
    (dir: 1 | -1) => {
      let i = index + dir;
      while (i >= 0 && i < all.length && all[i].target && !findTarget(all[i].target!)) i += dir;
      if (i < 0) return;
      if (i >= all.length) return onClose();
      setIndex(i);
    },
    [index, all, onClose],
  );
  const jump = (target: GuideStep) => setIndex(all.indexOf(target));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
      else if (e.key === "Tab") {
        // Fokus zostaje w karcie przewodnika.
        const buttons = [...(cardRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
        const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[(at + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
      } else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [go, onClose]);

  if (!step) return null;
  const veil = "color-mix(in srgb, var(--color-on-surface) 60%, transparent)";
  const round = spot && spot.height > 96 ? "var(--radius-lg)" : "var(--radius-sm)";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="guide-title" className="fixed inset-0 z-[70]">
      {spot ? (
        <div
          aria-hidden
          className="absolute"
          style={{ ...spot, borderRadius: round, boxShadow: `0 0 0 9999px ${veil}, 0 0 0 3px var(--color-primary)` }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: veil }} />
      )}
      <section
        ref={cardRef}
        className={cn(
          "absolute rounded-lg border border-outline bg-background p-gutter-mobile text-on-surface md:p-card",
          intro ? "w-[min(30rem,calc(100vw-2rem))]" : "w-[min(24rem,calc(100vw-2rem))]",
        )}
        style={card ? { left: card.left, top: card.top } : { visibility: "hidden" }}
      >
        {/* Ogonek dymka w stronę wskazanego elementu (jak w dymkach Zusika). */}
        {card && (card.side === "below" || card.side === "above") && (
          <span
            aria-hidden
            className={cn(
              "absolute size-3.5 rotate-45 border-outline bg-background",
              card.side === "below" ? "-top-[8px] border-l border-t" : "-bottom-[8px] border-b border-r",
            )}
            style={{ left: card.caret - 7 }}
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-meta text-on-surface-variant" aria-live="polite">
            Jak to działa · krok {position + 1} z {steps.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij przewodnik"
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface hover:text-on-surface"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        {/* Postęp: jeden odcinek na krok, wypełnione do bieżącego. */}
        <div aria-hidden className="mt-2 flex gap-1">
          {steps.map((s, i) => (
            <span key={s.title} className={cn("h-1 flex-1 rounded-full", i <= position ? "bg-primary" : "bg-outline")} />
          ))}
        </div>

        <div className={cn("mt-4", intro && "flex items-start gap-4")}>
          {intro && <Zusik size={64} className="mt-1 max-sm:hidden" />}
          <div className="min-w-0 flex-1">
            <h2 id="guide-title" className="font-serif text-title">
              {step.title}
            </h2>
            <p className="mt-2 text-on-surface-variant">{step.body}</p>
          </div>
        </div>

        {intro && steps.length > 1 && (
          <div className="mt-4 border-t border-outline pt-4">
            <p className="text-meta text-on-surface-variant">Co pokażemy</p>
            <ol className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
              {steps.slice(1).map((s, i) => (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => jump(s)}
                    className="flex w-full items-baseline gap-2 rounded-sm py-1 text-left text-meta hover:underline hover:decoration-outline hover:underline-offset-4"
                  >
                    <span className="w-4 shrink-0 text-on-surface-variant">{i + 2}.</span>
                    <span>{s.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2">
          {!last && (
            <button type="button" onClick={onClose} className="min-h-10 px-1 text-meta underline decoration-outline underline-offset-4 hover:decoration-on-surface">
              Pomiń
            </button>
          )}
          <span className="flex-1" />
          {position > 0 && (
            <button type="button" onClick={() => go(-1)} className="min-h-10 rounded-full border border-outline px-4 text-meta font-medium hover:bg-surface">
              Wstecz
            </button>
          )}
          <button ref={nextRef} type="button" onClick={() => go(1)} className="min-h-10 rounded-full bg-on-surface px-5 text-meta font-medium text-on-primary">
            {intro ? "Zaczynamy" : last ? "Gotowe" : "Dalej"}
          </button>
        </div>
        <p className="mt-3 hidden text-meta text-on-surface-variant md:block">Strzałki ← → przełączają kroki, Esc zamyka.</p>
      </section>
    </div>,
    document.body,
  );
}
