"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { SpeechBubble } from "@/components/mascot/Zusik";
import { cn } from "@/components/ui/cn";
import { ArrowUpIcon, ListIcon } from "@/components/ui/icons";
import type { StageId, Stop } from "@/lib/demo/types";
import { STAGE_ORDER } from "@/lib/plan/path";
import { type PathItem } from "./layout";
import { CollapsedStage, StopLabel, StopNode, nodeTone, pawnBubble, pedestalGeometry } from "./shared";
import { TravellingZusik } from "./TravellingZusik";

const ROW = 132;
const STAGE_ROW = 64;
const AMP = 24; // w procentach szerokości
const PERIOD = 150; // px na radian — łagodna fala w dół, równe zakręty

/** Fala zależna od wysokości (jak na komputerze od x): węzły leżą na jednej gładkiej krzywej. */
const xAt = (y: number) => 50 + (Math.round(Math.sin(y / PERIOD + 0.4) * 1000) / 1000) * AMP;

type Line = { kind: "stage"; stage: StageId; y: number } | { kind: "item"; item: PathItem; i: number; y: number; x: number };

/**
 * Pionowa ścieżka na telefonie: węzły wiją się w dół, przyklejony baner etapu z „Lista”,
 * pływający „↑ Teraz”, gdy pionek zniknie z ekranu.
 */
export function VerticalPath({
  items,
  pawnIndex,
  pawnStop,
  stageLabels,
  openCounts,
  selectedId,
  onSelect,
  onExpand,
  onPawn,
  onList,
}: {
  items: PathItem[];
  pawnIndex: number;
  pawnStop?: Stop;
  stageLabels: Record<StageId, string>;
  openCounts: Record<StageId, number>;
  selectedId?: string;
  onSelect: (stop: Stop) => void;
  onExpand: (stage: StageId) => void;
  onPawn: () => void;
  onList: () => void;
}) {
  const pawnRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<Partial<Record<StageId, HTMLDivElement | null>>>({});
  const [pawnVisible, setPawnVisible] = useState(true);
  const [currentStage, setCurrentStage] = useState<StageId>(items[0]?.stage ?? "przed");

  // Układ: nagłówek etapu, potem jego rzędy.
  const lines: Line[] = [];
  let y = 0;
  let lastStage: StageId | undefined;
  items.forEach((item, i) => {
    if (item.stage !== lastStage) {
      lines.push({ kind: "stage", stage: item.stage, y });
      y += STAGE_ROW;
      lastStage = item.stage;
    }
    const isPawnRow = item.type === "row" && item.index === pawnIndex;
    if (isPawnRow) y += 140; // miejsce na dymek i lewitującego Bąbelka
    lines.push({ kind: "item", item, i, y: y + ROW / 2, x: xAt(y + ROW / 2) });
    y += ROW;
  });
  const height = y + 16;

  // Pozycja Bąbelka-pionka: nad podestem pionka (w parze: lewa ≈ 25%, prawa ≈ 75% szerokości).
  const pawnLine = lines.find((l): l is Extract<Line, { kind: "item" }> => l.kind === "item" && l.item.type === "row" && l.item.index === pawnIndex);
  const pawnPair = pawnLine?.item.type === "row" && pawnLine.item.stops.length === 2;
  const pawnX = !pawnLine ? 50 : pawnPair && pawnLine.item.type === "row" ? (pawnLine.item.stops[1].id === pawnStop?.id ? 75 : 25) : pawnLine.x;
  const pedestal = pedestalGeometry(64).height;
  const pawnY = pawnLine ? pawnLine.y - pedestal / 2 - 8 : 0;
  const itemYs = lines.filter((l) => l.kind === "item").map((l) => l.y);
  const waveD = (() => {
    if (itemYs.length === 0) return "";
    const from = itemYs[0];
    const to = itemYs[itemYs.length - 1];
    const pts: string[] = [];
    for (let yy = from; yy < to; yy += 8) pts.push(`${xAt(yy).toFixed(2)} ${yy}`);
    pts.push(`${xAt(to).toFixed(2)} ${to}`);
    return `M ${pts.join(" L ")}`;
  })();

  useEffect(() => {
    const el = pawnRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPawnVisible(entry.isIntersecting), { rootMargin: "-80px 0px -80px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [pawnIndex, items.length]);

  useEffect(() => {
    const onScroll = () => {
      let stage: StageId | undefined;
      for (const s of STAGE_ORDER) {
        const el = stageRefs.current[s];
        if (el && el.getBoundingClientRect().top < 140) stage = s;
      }
      if (stage) setCurrentStage(stage);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items.length]);

  const stageNumber = STAGE_ORDER.indexOf(currentStage) + 1;
  const open = openCounts[currentStage];

  return (
    <div className="relative">
      {/* Przyklejony baner etapu */}
      <div className="sticky top-[72px] z-30 -mx-gutter-mobile mb-2 bg-background px-gutter-mobile py-2">
        <div className="flex items-center gap-3 rounded-full bg-secondary py-1.5 pl-5 pr-1.5">
          <p className="min-w-0 flex-1 truncate text-meta" aria-live="polite">
            <span className="font-medium">
              Etap {stageNumber} · {stageLabels[currentStage]}
            </span>
            {open > 0 ? ` · ${open} ${open === 1 ? "sprawa" : open < 5 ? "sprawy" : "spraw"} do zrobienia` : ""}
          </p>
          <button type="button" onClick={onList} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-background px-4 text-meta font-medium">
            <ListIcon size={16} /> Lista
          </button>
        </div>
      </div>

      <div className="relative" style={{ height }}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
          <path d={waveD} className="fill-none stroke-outline" strokeWidth={6} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>

        {lines.map((line) => {
          if (line.kind === "stage") {
            return (
              <div
                key={`s-${line.stage}`}
                ref={(el) => {
                  stageRefs.current[line.stage] = el;
                }}
                className="absolute inset-x-0 flex items-center justify-center"
                style={{ top: line.y, height: STAGE_ROW }}
              >
                <h3 className="rounded-full bg-background px-4 font-serif text-title">{stageLabels[line.stage]}</h3>
              </div>
            );
          }
          const { item } = line;
          if (item.type === "collapsed") {
            return (
              <div key={`c-${item.stage}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${line.x}%`, top: line.y }}>
                <CollapsedStage item={item} onExpand={onExpand} labelClassName="top-full mt-2" />
              </div>
            );
          }
          const onPawnRow = item.index === pawnIndex;
          const pair = item.stops.length === 2;
          return (
            <Fragment key={`r-${item.index}`}>
              {onPawnRow && pawnStop && (
                <div ref={pawnRef} className="absolute inset-x-0 z-10 px-2" style={{ top: line.y - ROW / 2 - 132 }}>
                  <button type="button" onClick={onPawn} className="mx-auto block w-full max-w-72 text-left" aria-label={`${pawnBubble(pawnStop).lead} ${pawnBubble(pawnStop).text}. Otwórz czat z Zusikiem`}>
                    <SpeechBubble tail="bottom" className="px-4 py-2.5 text-meta">
                      <span className="font-medium">{pawnBubble(pawnStop).lead}</span> {pawnBubble(pawnStop).text}
                    </SpeechBubble>
                  </button>
                </div>
              )}
              {pair ? (
                <div className="absolute inset-x-0 grid -translate-y-1/2 grid-cols-[1fr_auto_1fr] items-center" style={{ top: line.y }}>
                  {item.stops.map((stop, k) => (
                    <Fragment key={stop.id}>
                      {k === 1 && <span className="rounded-full border border-outline bg-background px-2 text-meta font-medium">i</span>}
                      <div className="relative flex justify-center px-1">
                        <StopNode stop={stop} tone={nodeTone(stop, onPawnRow)} selected={selectedId === stop.id} onSelect={() => onSelect(stop)} size={64} />
                        <StopLabel stop={stop} className="absolute inset-x-1 top-full mt-2" />
                      </div>
                    </Fragment>
                  ))}
                </div>
              ) : (
                <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${line.x}%`, top: line.y }}>
                  <StopNode stop={item.stops[0]} tone={nodeTone(item.stops[0], onPawnRow)} selected={selectedId === item.stops[0].id} onSelect={() => onSelect(item.stops[0])} size={64} />
                  <StopLabel
                    stop={item.stops[0]}
                    align={line.x < 50 ? "left" : "right"}
                    className={cn("absolute top-1/2 w-[38vw] max-w-56 -translate-y-1/2", line.x < 50 ? "left-full ml-3" : "right-full mr-3")}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
        {pawnLine && pawnStop && <TravellingZusik x={pawnX} unit="%" y={pawnY} size={56} fullDropSpeed={60} />}
      </div>

      {!pawnVisible && (
        <button
          type="button"
          onClick={() => {
            const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            pawnRef.current?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
          }}
          className="fixed bottom-20 right-gutter-mobile z-40 inline-flex h-12 items-center gap-1.5 rounded-full bg-on-surface px-5 text-label font-medium text-on-primary"
        >
          <ArrowUpIcon size={18} /> Teraz
        </button>
      )}
    </div>
  );
}
