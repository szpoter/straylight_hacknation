"use client";

import { useCallback, useMemo, useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/AppButton";
import { cn } from "@/components/ui/cn";
import { ChevronDownIcon, ListIcon, MapIcon } from "@/components/ui/icons";
import { Panel } from "@/components/ui/Panel";
import { formatShort } from "@/lib/demo/dates";
import type { Plan, StageId, Stop } from "@/lib/demo/types";
import { STAGE_ORDER, nearestStop, openCountInStage } from "@/lib/plan/path";
import { isResolved, pathStatus } from "@/lib/plan/status";
import { CheckIcon } from "@/components/ui/icons";
import { CaseCard } from "./CaseCard";
import { HorizontalPath } from "./HorizontalPath";
import { toItems } from "./layout";
import { useStageRows } from "./useStageRows";
import { VerticalPath } from "./VerticalPath";

/**
 * „Mój plan”: ścieżka z pionkiem, pod nią karta najbliższej sprawy. Kliknięcie przystanku
 * otwiera jego szczegóły w panelu (z prawej na komputerze, od dołu na telefonie), więc ścieżka
 * i najbliższa sprawa zostają na miejscu.
 *
 * Póki panel jest otwarty, ścieżka pokazuje stan z chwili otwarcia: po „Oznacz jako załatwione”
 * Bąbelek rusza na nowe pole dopiero po zamknięciu panelu, na oczach rodzica.
 */
export function JourneyMap() {
  const { plan, openZusik } = usePlan();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [frozen, setFrozen] = useState<Plan | null>(null);
  const shown = frozen && frozen.id === plan.id ? frozen : plan;

  const { pawn, blocks, pawnStop } = useStageRows(shown);
  const nearest = useMemo(() => nearestStop(plan.stops), [plan.stops]);
  const pawnStage = pawnStop?.stage ?? plan.stage;

  const [listView, setListView] = useState(false);
  // Etap widoczny na ścieżce (licznik „Etap N z 4” podąża za przewijaniem).
  const [viewStage, setViewStage] = useState<StageId>(pawnStage);
  const [focusPawn, setFocusPawn] = useState(0);
  const onViewStage = useCallback((stage: StageId) => setViewStage(stage), []);
  // Etapy przed etapem pionka, w których wszystko jest za rodzicem (np. „Planowanie” i „Ciąża”
  // przy urodzonym dziecku), startują zwinięte — widać je jako „N spraw · za Tobą”, można rozwinąć.
  const [collapsed, setCollapsed] = useState<Set<StageId>>(
    () =>
      new Set(
        STAGE_ORDER.slice(0, STAGE_ORDER.indexOf(pawnStage)).filter((st) => {
          const inStage = plan.stops.filter((s) => s.stage === st);
          return inStage.length > 0 && inStage.every(isResolved);
        }),
      ),
  );
  // Etapu z pionkiem nigdy nie zwijamy — inaczej Bąbelek nie miałby gdzie stanąć.
  const items = useMemo(() => toItems(blocks, new Set([...collapsed].filter((s) => s !== pawnStage)), isResolved), [blocks, collapsed, pawnStage]);
  const selected = plan.stops.find((s) => s.id === selectedId);

  const stageLabels = Object.fromEntries(STAGE_ORDER.map((s) => [s, plan.stages[s].label])) as Record<StageId, string>;
  const openCounts = Object.fromEntries(STAGE_ORDER.map((s) => [s, openCountInStage(plan.stops, s)])) as Record<StageId, number>;

  const select = (stop: Stop) => {
    setFrozen((f) => f ?? plan);
    setSelectedId(stop.id);
  };
  const closeSheet = () => {
    setSelectedId(undefined);
    setFrozen(null);
  };
  const expand = (stage: StageId) => setCollapsed((prev) => new Set([...prev].filter((s) => s !== stage)));
  const onPawn = () => openZusik({ planId: plan.id, place: "Mój plan", stopId: pawnStop?.id, returnTo: "/plan" });

  return (
    <div className="flex flex-col gap-stack">
      <div className="flex items-center justify-between gap-3">
        <h2 className="sr-only">Ścieżka planu</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-on-surface-variant" aria-live="polite">
          <span>
            Etap {STAGE_ORDER.indexOf(listView ? pawnStage : viewStage) + 1} z 4 ·{" "}
            <span className="text-on-surface">{plan.stages[listView ? pawnStage : viewStage].label}</span>
          </span>
          {!listView && viewStage !== pawnStage && (
            <button
              type="button"
              onClick={() => setFocusPawn((n) => n + 1)}
              className="hidden text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface md:inline"
            >
              Teraz jesteś na etapie: {plan.stages[pawnStage].label} · wróć
            </button>
          )}
        </p>
        <Button variant="secondary" size="sm" className={cn(!listView && "hidden md:inline-flex")} onClick={() => setListView((v) => !v)} aria-pressed={listView} data-tour="path-view">
          {listView ? <MapIcon size={18} /> : <ListIcon size={18} />}
          {listView ? "Ścieżka" : "Lista"}
        </Button>
      </div>

      {(listView || !pawnStop) && <Button variant="secondary" size="sm" onClick={onPawn}
        aria-label="Otwórz czat z Zusikiem" className="self-start">Zapytaj Zusika</Button>}
      {listView ? (
        <>
          {/* W widoku listy najbliższa sprawa stoi nad listą; na ścieżce — pod nią. */}
          <NearestPanel stop={nearest} upcoming={pawnStop} onOpen={select} />
          <StopList stops={plan.stops} stageLabels={stageLabels} pawnStopId={pawnStop?.id} />
        </>
      ) : (
        <>
          <div className="hidden md:block" data-tour="path">
            <HorizontalPath
              items={items}
              pawnIndex={pawn}
              pawnStop={pawnStop}
              stageLabels={stageLabels}
              selectedId={selected?.id}
              onSelect={select}
              onExpand={expand}
              onPawn={onPawn}
              onViewStage={onViewStage}
              focusPawnSignal={focusPawn}
            />
          </div>
          <div className="md:hidden" data-tour="path">
            <VerticalPath
              items={items}
              pawnIndex={pawn}
              pawnStop={pawnStop}
              stageLabels={stageLabels}
              openCounts={openCounts}
              selectedId={selected?.id}
              onSelect={select}
              onExpand={expand}
              onPawn={onPawn}
              onList={() => setListView(true)}
            />
          </div>
        </>
      )}

      {!listView && <div data-tour="nearest"><NearestPanel stop={nearest} upcoming={pawnStop} onOpen={select} /></div>}

      <BottomSheet
        open={Boolean(selected)}
        onClose={closeSheet}
        title={selected?.title ?? "Przystanek"}
        eyebrow={selected ? `${plan.stages[selected.stage].label}${selected.id === nearest?.id ? " · najbliższa sprawa" : ""}` : undefined}
      >
        {selected && <CaseCard stop={selected} isNearest={selected.id === nearest?.id} compact onLeave={closeSheet} />}
      </BottomSheet>
    </div>
  );
}

/**
 * Karta „Najbliższa sprawa”. Gdy nic nie czeka na rodzica, a pionek stoi na sprawie z warunkiem,
 * karta mówi, co będzie następne i od czego to zależy — tak jak dymek nad Bąbelkiem.
 */
function NearestPanel({ stop, upcoming, onOpen }: { stop?: Stop; upcoming?: Stop; onOpen: (stop: Stop) => void }) {
  if (!stop && upcoming && !isResolved(upcoming)) {
    return (
      <Panel aria-labelledby="case-card-title">
        <p className="text-meta text-on-surface-variant">Najbliższa sprawa</p>
        <h2 id="case-card-title" className="mt-1 font-serif text-title">
          Na dziś masz wszystko załatwione
        </h2>
        <p className="mt-3 max-w-prose">
          Następna sprawa: <span className="font-medium">{upcoming.title}</span>
          {upcoming.condition ? ` — ${upcoming.condition.charAt(0).toLowerCase()}${upcoming.condition.slice(1)}.` : "."}
        </p>
        <Button variant="secondary" className="mt-5" onClick={() => onOpen(upcoming)}>
          Zobacz szczegóły
        </Button>
      </Panel>
    );
  }
  return (
    <Panel aria-labelledby="case-card-title">
      <CaseCard stop={stop} isNearest headingId="case-card-title" />
    </Panel>
  );
}

/** Spokojny widok listy: każdy przystanek rozwija się w miejscu i pokazuje pełny opis. */
function StopList({ stops, stageLabels, pawnStopId }: { stops: Stop[]; stageLabels: Record<StageId, string>; pawnStopId?: string }) {
  return (
    <div className="flex flex-col gap-stack">
      {STAGE_ORDER.map((stage) => {
        const inStage = stops.filter((s) => s.stage === stage);
        if (inStage.length === 0) return null;
        return (
          <section key={stage} aria-labelledby={`list-${stage}`}>
            <h3 id={`list-${stage}`} className="mb-4 font-serif text-title">
              {stageLabels[stage]}
            </h3>
            <ol className="divide-y divide-outline border-y border-outline">
              {inStage.map((s) => (
                <li key={s.id}>
                  <details className="group" open={s.id === pawnStopId}>
                    <summary className="flex cursor-pointer list-none items-center gap-4 py-4 [&::-webkit-details-marker]:hidden">
                      <StatusDot stop={s} />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium">{s.title}</span>
                        <span className="text-meta text-on-surface-variant">
                          {pathStatus(s)} · {s.institution}
                          {s.due ? ` · do ${formatShort(s.due)}` : s.condition ? ` · ${s.condition}` : ""}
                        </span>
                      </span>
                      <ChevronDownIcon className="mr-2 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <div className="pb-6 pt-1 pl-10">
                      <CaseCard stop={s} isNearest={false} compact headingLevel="none" />
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/** Znacznik stanu w wierszu listy: ptaszek, gdy za rodzicem; kropka „Teraz”; pusty krąg w przyszłości. */
function StatusDot({ stop }: { stop: Stop }) {
  if (isResolved(stop)) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-on-surface" aria-hidden>
        <CheckIcon size={14} strokeWidth={2.5} />
      </span>
    );
  }
  const now = stop.state && stop.state !== "warunek";
  return <span aria-hidden className={cn("size-6 shrink-0 rounded-full border-2", now ? "border-primary bg-background" : "border-outline bg-background")} />;
}
