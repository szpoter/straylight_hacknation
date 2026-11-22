"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Zusik } from "../mascot/Zusik";
import { ButtonLink } from "../ui/AppButton";
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
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[70dvh] flex-col rounded-t-lg border border-outline bg-background md:inset-y-2 md:right-2 md:left-auto md:max-h-none md:w-[400px] md:rounded-lg"
    >
      <div className="flex items-center justify-between border-b border-outline px-card py-4">
        <div>
          <p className="font-medium">Zusik · asystent AI</p>
          <p className="text-meta text-on-surface-variant">{[planName, zusik.place, zusik.field].filter(Boolean).join(" · ")}</p>
        </div>
        <button type="button" onClick={closeZusik} aria-label="Zwiń czat" className="rounded-full p-2 hover:bg-surface">
          <CloseIcon />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-card text-center text-on-surface-variant">
        <Zusik size={72} animated state="waiting" toward={90} />
        <p>Rozmowa z Zusikiem przy wniosku działa na osobnym ekranie: formularz obok czatu, odpowiedzi z przypisami do przepisów.</p>
        {/* Ekrany Juliana: /zusik (wniosek o urlop rodzicielski), /zusik/kamil (ZAM z odpisem aktu). TODO(julian): panel w tym miejscu. */}
        <ButtonLink href="/zusik">Otwórz rozmowę z Zusikiem</ButtonLink>
        <ButtonLink href="/zusik/kamil" variant="secondary">
          Wniosek ZAM z odpisem aktu
        </ButtonLink>
      </div>
    </aside>
  );
}
