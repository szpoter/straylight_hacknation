"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Zusik } from "../mascot/Zusik";
import { CloseIcon } from "../ui/icons";

/**
 * Bąbelek Zusika w prawym dolnym rogu (na telefonie nad dolnym paskiem). Na „Moim planie”
 * ukryty — czat otwiera pionek na ścieżce (ui/MACIEJ.md, element 8).
 */
export function ZusikFab() {
  const pathname = usePathname();
  const { plan, openZusik, zusik } = usePlan();
  const [inviting, setInviting] = useState(false);
  if (pathname === "/plan" || zusik) return null;
  return (
    <button
      type="button"
      onClick={() => openZusik({ planId: plan.id, place: pathname, returnTo: pathname })}
      onPointerEnter={() => setInviting(true)}
      onPointerLeave={() => setInviting(false)}
      onFocus={() => setInviting(true)}
      onBlur={() => setInviting(false)}
      aria-label="Otwórz czat z Zusikiem"
      className="fixed bottom-20 right-gutter-mobile z-40 rounded-full md:bottom-6 md:right-gutter-desktop"
    >
      {/* Spoczynek „available”; najechanie lub fokus — Zusik wita się (inviting) w stronę strony. */}
      <Zusik size={88} animated state="available" inviting={inviting} toward={200} entrance />
    </button>
  );
}

/**
 * Miejsce na panel Juliana (ui/JULIAN.md). Przekazuje kontekst dziecka, sprawy i pola.
 * TODO(julian): podmienić na panel czatu i widok dzielony.
 */
export function ZusikPanelSlot() {
  const { zusik, closeZusik, plans } = usePlan();
  if (!zusik) return null;
  const planName = plans.find((p) => p.id === zusik.planId)?.name;
  return (
    <aside
      aria-label="Zusik · asystent AI"
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col rounded-t-lg border border-outline bg-surface md:inset-y-2 md:right-2 md:left-auto md:max-h-none md:w-[400px] md:rounded-lg"
    >
      <div className="flex items-center justify-between border-b border-outline px-card py-4">
        <div>
          <p className="font-medium">Zusik · asystent AI</p>
          <p className="text-meta text-on-surface-variant">{[planName, zusik.place, zusik.field].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={closeZusik} aria-label="Zwiń czat" className="rounded-full p-2 hover:bg-background">
          <CloseIcon />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-card text-center text-on-surface-variant">
        <Zusik size={72} animated state="waiting" toward={90} />
        <p>Tu otworzy się panel rozmowy z Zusikiem (zakres Juliana).</p>
      </div>
    </aside>
  );
}
