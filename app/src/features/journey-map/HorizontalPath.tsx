"use client";

import { useEffect, useRef } from "react";
import { SpeechBubble } from "@/components/mascot/Zusik";
import { Button } from "@/components/ui/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { formatLong } from "@/lib/demo/dates";
import type { StageId, Stop } from "@/lib/demo/types";
import { smoothPath, wave, type PathItem } from "./layout";
import { CollapsedStage, StopLabel, StopNode, nodeTone, pedestalGeometry } from "./shared";
import { TravellingZusik } from "./TravellingZusik";

const COL = 208; // szerokość kolumny przystanku
const PAD = 8;
const HEADER = 96; // nazwa etapu (do 2 wierszy) i trymestr
const BAND = 128; // pas nad falą: podpisy albo Bąbelek nad pionkiem
const AMP = 44;
const NODE = 72;
const PAWN_NODE = 80;
const ZUSIK = 72; // Bąbelek lewitujący nad podestem pionka
const HOVER = 10; // odstęp Bąbelka nad blatem
const MID = HEADER + BAND + AMP;
const HEIGHT = MID + AMP + 120;

type Placed = { item: PathItem; x: number; y: number; width: number; left: number };

function place(items: PathItem[]): { placed: Placed[]; width: number } {
  let left = PAD;
  const placed = items.map((item, i) => {
    // Zwinięty etap dostaje półtorej kolumny, żeby zmieściła się jego nazwa.
    const width = item.type === "collapsed" ? COL * 1.5 : item.stops.length > 1 ? COL * 2 : COL;
    const p = { item, x: left + width / 2, y: MID + wave(i) * AMP, width, left };
    left += width;
    return p;
  });
  return { placed, width: left + PAD };
}

/**
 * Pozioma ścieżka-wąż na komputerze, bez ramki — bezpośrednio na tle strony. Przewijanie gestem
 * albo przyciskami „Poprzedni etap” / „Następny etap”. Przy wejściu ustawia się na polu pionka.
 */
export function HorizontalPath({
  items,
  pawnIndex,
  pawnStop,
  stageLabels,
  selectedId,
  onSelect,
  onExpand,
  onPawn,
  onViewStage,
  focusPawnSignal,
}: {
  items: PathItem[];
  pawnIndex: number;
  pawnStop?: Stop;
  stageLabels: Record<StageId, string>;
  selectedId?: string;
  onSelect: (stop: Stop) => void;
  onExpand: (stage: StageId) => void;
  onPawn: () => void;
  /** Etap widoczny na środku ścieżki — do licznika „Etap N z 4”. */
  onViewStage: (stage: StageId) => void;
  /** Zmiana wartości przewija ścieżkę do pionka („Wróć do Teraz”). */
  focusPawnSignal: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const { placed, width } = place(items);
  const pawnPlaced = placed.find((p) => p.item.type === "row" && p.item.index === pawnIndex);
  const pawnRow = pawnPlaced?.item.type === "row" ? pawnPlaced.item : undefined;
  const pawnX = !pawnPlaced || !pawnRow ? 0 : pawnRow.stops.length === 2 ? pawnPlaced.x + (pawnRow.stops[1].id === pawnStop?.id ? COL / 2 : -COL / 2) : pawnPlaced.x;
  const pawnTop = pawnPlaced ? pawnPlaced.y - pedestalGeometry(PAWN_NODE).height / 2 - HOVER : 0;

  // Zakres każdego etapu: nazwa ma szerokość etapu i zawija się, zamiast nachodzić na sąsiada.
  const stages = placed.reduce<Array<{ stage: StageId; left: number; right: number }>>((acc, p) => {
    const last = acc[acc.length - 1];
    if (last && last.stage === p.item.stage) last.right = p.left + p.width;
    else acc.push({ stage: p.item.stage, left: p.left, right: p.left + p.width });
    return acc;
  }, []);

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollToPawn = (smooth: boolean) => {
    const el = scroller.current;
    if (!el || !pawnPlaced) return;
    el.scrollTo({ left: Math.max(0, pawnX - el.clientWidth / 3), behavior: smooth && !reduceMotion() ? "smooth" : "auto" });
  };

  // Przy wejściu ustawiamy ścieżkę na pionku; później przewija tylko rodzic (albo „Wróć do Teraz”).
  useEffect(() => {
    scrollToPawn(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (focusPawnSignal > 0) scrollToPawn(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusPawnSignal]);

  // Licznik etapu śledzi to, co jest na środku widoku.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const report = () => {
      if (el.clientWidth === 0) return; // ścieżka ukryta (telefon)
      const center = el.scrollLeft + el.clientWidth / 2;
      const s = stages.find((st) => center >= st.left && center < st.right) ?? (center < (stages[0]?.left ?? 0) ? stages[0] : stages[stages.length - 1]);
      if (s) onViewStage(s.stage);
    };
    report();
    el.addEventListener("scroll", report, { passive: true });
    return () => el.removeEventListener("scroll", report);
  }, [stages, onViewStage]);

  const substages = placed.flatMap((p, i) => {
    if (p.item.type !== "row") return [];
    const sub = p.item.stops[0].substage;
    const prev = placed[i - 1]?.item;
    const prevSub = prev?.type === "row" ? prev.stops[0].substage : undefined;
    return sub && sub !== prevSub ? [{ key: `sub-${p.item.index}`, label: sub, x: p.left + 16 }] : [];
  });

  const scrollToStage = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const current = el.scrollLeft;
    const target = dir === 1 ? stages.find((s) => s.left > current + 4) : [...stages].reverse().find((s) => s.left < current - 4);
    el.scrollTo({ left: target ? target.left : dir === 1 ? el.scrollWidth : 0, behavior: reduceMotion() ? "auto" : "smooth" });
  };

  const points = placed.flatMap<[number, number]>((p) =>
    p.item.type === "row" && p.item.stops.length === 2 ? [[p.x - COL / 2, p.y], [p.x + COL / 2, p.y]] : [[p.x, p.y]],
  );
  const donePoints = pawnPlaced ? points.filter(([x]) => x <= pawnX) : [];

  return (
    <div>
      <div
        ref={scroller}
        className="-mx-gutter-mobile overflow-x-auto overscroll-x-contain px-gutter-mobile [scrollbar-width:none] md:-mx-gutter-desktop md:px-gutter-desktop [&::-webkit-scrollbar]:hidden"
        aria-label="Ścieżka planu, przewijana w poziomie"
      >
        <div className="relative" style={{ width, height: HEIGHT }}>
          {stages.map((s, i) => (
            <div key={s.stage} className="absolute top-0 bottom-0" style={{ left: s.left, width: s.right - s.left }}>
              {i > 0 && <span aria-hidden className="absolute left-0 top-2 bottom-6 w-px bg-outline" />}
              <h3 className="px-4 pt-2 font-serif text-title">{stageLabels[s.stage]}</h3>
            </div>
          ))}
          {substages.map((sub) => (
            <span key={sub.key} className="absolute whitespace-nowrap text-meta text-on-surface-variant" style={{ left: sub.x, top: HEADER - 24 }}>
              {sub.label}
            </span>
          ))}

          <svg className="pointer-events-none absolute inset-0" width={width} height={HEIGHT} aria-hidden>
            <path d={smoothPath(points, "horizontal")} className="fill-none stroke-outline" strokeWidth={6} strokeLinecap="round" />
            {donePoints.length > 1 && <path d={smoothPath(donePoints, "horizontal")} className="fill-none stroke-secondary" strokeWidth={6} strokeLinecap="round" />}
          </svg>

          {placed.map((p, i) => {
            const labelAbove = wave(i) < 0; // podest wysoko → podpis nad nim, nisko → pod nim
            if (p.item.type === "collapsed") {
              return (
                <div key={`c-${p.item.stage}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>
                  <CollapsedStage item={p.item} onExpand={onExpand} labelClassName={labelAbove ? "bottom-full mb-3" : "top-full mt-3"} />
                </div>
              );
            }
            const row = p.item;
            const onPawnRow = row.index === pawnIndex;
            return row.stops.map((stop, k) => {
              const x = row.stops.length === 2 ? p.x + (k === 0 ? -COL / 2 : COL / 2) : p.x;
              const isPawn = onPawnRow && stop.id === pawnStop?.id;
              // Na rzędzie pionka podpisy zawsze pod spodem — nad polem lewituje Bąbelek.
              const below = onPawnRow || !labelAbove;
              return (
                <div key={stop.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: p.y }}>
                  <StopNode stop={stop} tone={nodeTone(stop, onPawnRow)} selected={selectedId === stop.id} onSelect={() => onSelect(stop)} size={isPawn ? PAWN_NODE : NODE} />
                  <StopLabel stop={stop} className={`absolute left-1/2 w-44 -translate-x-1/2 ${below ? "top-full mt-3" : "bottom-full mb-3"}`} />
                </div>
              );
            });
          })}

          {placed.map((p) =>
            p.item.type === "row" && p.item.stops.length === 2 ? (
              <span key={`and-${p.item.index}`} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-outline bg-surface px-2 text-meta font-medium" style={{ left: p.x, top: p.y }}>
                i
              </span>
            ) : null,
          )}

          {pawnPlaced && pawnStop && (
            <TravellingZusik x={pawnX} y={pawnTop} size={ZUSIK} fullDropSpeed={700}>
              <button
                type="button"
                onClick={onPawn}
                className="pointer-events-auto absolute bottom-1/2 left-full ml-2 block w-56 text-left"
                aria-label={`Następny krok: ${pawnStop.title}. Otwórz czat z Zusikiem`}
              >
                <SpeechBubble className="px-4 py-2.5 text-meta">
                  <span className="font-medium">Następny krok:</span> {pawnStop.title}
                  {pawnStop.due ? ` · do ${formatLong(pawnStop.due, false)}` : ""}
                </SpeechBubble>
              </button>
            </TravellingZusik>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-3">
        <Button variant="secondary" size="sm" onClick={() => scrollToStage(-1)}>
          <ChevronLeftIcon size={18} /> Poprzedni etap
        </Button>
        <Button variant="secondary" size="sm" onClick={() => scrollToStage(1)}>
          Następny etap <ChevronRightIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
