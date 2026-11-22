"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Zusik } from "../mascot/Zusik";
import { ParentChat } from "@/features/chat/parent-chat";

/**
 * Bąbelek Zusika w prawym dolnym rogu (na telefonie nad dolnym paskiem). Na „Moim planie”
 * ukryty — czat otwiera pionek na ścieżce (ui/MACIEJ.md, element 8).
 */
export function ZusikFab() {
  const pathname = usePathname();
  const { plan, openZusik, zusik } = usePlan();
  const [inviting, setInviting] = useState(false);
  const stop = plan.stops.find(item => pathname === "/dokumenty/" + item.id);
  if (pathname === "/plan") return null;
  return (
    <button
      hidden={Boolean(zusik && !zusik.collapsed && zusik.planId === plan.id)}
      type="button"
      onClick={() => openZusik({ planId: plan.id, place: pathname, stopId: stop?.id, returnTo: pathname })}
      onPointerEnter={() => setInviting(true)}
      onPointerLeave={() => setInviting(false)}
      onFocus={() => setInviting(true)}
      onBlur={() => setInviting(false)}
      aria-label="Otwórz czat z Zusikiem"
      data-tour="zusik"
      className="fixed bottom-16 right-0 z-[45] overflow-visible rounded-lg px-4 pt-12 pb-4 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-on-surface md:bottom-2 md:right-6"
    >
      {/* Pole przycisku jest większe niż Bąbelek (padding, u góry więcej na podskoki), więc animacje
          wejścia i powitania mieszczą się w nim; Bąbelek stoi tam, gdzie wcześniej (16 px od dołu
          paska na telefonie, 24 px od rogu na komputerze). z-[45]: nad dolnym paskiem (z-40),
          żeby wjeżdżając z dołu nie chował się za nim. */}
      {/* Spoczynek „available”; najechanie lub fokus — Zusik wita się (inviting) w stronę strony. */}
      <Zusik size={88} animated state="available" inviting={inviting} toward={200} entrance />
    </button>
  );
}

const pageLabels: Record<string, string> = {
  "/dokumenty": "Dokumenty", "/profil": "Profil", "/wsparcie": "Wsparcie", "/profil/sprawa-testowa": "Sprawa testowa",
};

/** The map pawn, document actions and floating mascot open the same live chat. */
export function FamilyChatShell({ children }: { children: ReactNode }) {
  const { plan, zusik, closeZusik } = usePlan();
  const context = zusik?.planId === plan.id ? zusik : null;
  const stop = plan.stops.find(item => item.id === context?.stopId);
  const title = stop?.title ?? (context && (pageLabels[context.place] ?? context.place));
  return (
    <ParentChat panel={{
      expanded: Boolean(context && !context.collapsed),
      close: closeZusik,
      family: context ? {planId: plan.id, stopId: stop?.id} : undefined,
      label: [plan.name, title].filter(Boolean).join(" · "),
      introduction: stop && <p>O co chcesz zapytać w sprawie „{stop.title}”?{context?.field && <> Wybrane pole lub zadanie: {context.field}.</>}</p>,
    }}>
      {children}
      <ZusikFab />
    </ParentChat>
  );
}
