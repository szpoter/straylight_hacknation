"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import type { Plan } from "@/lib/demo/types";
import { cn } from "../ui/cn";
import { CheckIcon, ChevronDownIcon, LockIcon, PlusIcon } from "../ui/icons";
import { Tag } from "../ui/Tag";

function KindMark({ plan }: { plan: Plan }) {
  switch (plan.kind) {
    case "rejestr":
      return (
        <span className="inline-flex items-center gap-1 text-meta text-on-surface-variant">
          <LockIcon size={14} /> dane z rejestru
        </span>
      );
    case "planowane":
      return <span className="text-meta text-on-surface-variant">planowane</span>;
    case "test":
      return <Tag tone="accent">Test</Tag>;
    case "przyklad":
      return <Tag tone="accent">Przykład</Tag>;
  }
}

/** Selektor dziecka: nazwa planu i data kluczowa, lista z rodzajem planu (ui/MACIEJ.md, element 2). */
export function ChildSelector({ className }: { className?: string }) {
  const { plans, plan, selectPlan } = usePlan();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const displayName = plan.kind === "test" || plan.kind === "przyklad" ? plan.name.split(" · ")[0] : plan.name;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 items-center gap-2 rounded-full px-3 py-1 text-left hover:bg-background"
      >
        <span className="flex flex-col leading-tight">
          <span className="font-serif text-title leading-none">{displayName}</span>
          <span className="text-meta text-on-surface-variant">{plan.keyDateLabel}</span>
        </span>
        <ChevronDownIcon size={18} className={cn("transition-transform duration-200", open && "rotate-180")} />
        <span className="sr-only">Zmień dziecko lub plan</span>
      </button>

      {open && (
        <div id={listId} className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-32px))] rounded-lg border border-outline bg-surface p-2">
          <ul className="flex flex-col">
            {plans.map((p) => {
              const active = p.id === plan.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      selectPlan(p.id);
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    className={cn("flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left hover:bg-background", active && "bg-background")}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-medium">{p.kind === "test" || p.kind === "przyklad" ? p.name : `${p.name} · ${p.shortInfo}`}</span>
                      <KindMark plan={p} />
                    </span>
                    {active && <CheckIcon size={18} className="text-primary" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-1 flex flex-col border-t border-outline pt-1">
            <Link href="/start" className="flex items-center gap-2 rounded-sm px-3 py-2.5 hover:bg-background" onClick={() => setOpen(false)}>
              <PlusIcon size={18} /> Dodaj dziecko lub plan
            </Link>
            <Link href="/profil/sprawa-testowa" className="flex items-center gap-2 rounded-sm px-3 py-2.5 hover:bg-background" onClick={() => setOpen(false)}>
              <PlusIcon size={18} /> Wczytaj przykładową sprawę
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
