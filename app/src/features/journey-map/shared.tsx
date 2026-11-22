"use client";

import { AlertIcon, AutoIcon, CheckIcon, DutyIcon, FormIcon, HeartIcon, InfoIcon } from "@/components/ui/icons";
import { cn } from "@/components/ui/cn";
import { formatLong, formatShort } from "@/lib/demo/dates";
import type { StageId, Stop, StopKind } from "@/lib/demo/types";
import { isResolved, pathStatus } from "@/lib/plan/status";
import type { PathItem } from "./layout";

export const KIND_LABEL: Record<StopKind, string> = {
  obowiazek: "Obowiązek",
  "na-wniosek": "Na wniosek",
  informacja: "Informacja",
  "program-zdrowotny": "Program zdrowotny",
  "dzieje-sie-samo": "Dzieje się samo",
};

const KIND_ICON: Record<StopKind, typeof DutyIcon> = {
  obowiazek: DutyIcon,
  "na-wniosek": FormIcon,
  informacja: InfoIcon,
  "program-zdrowotny": HeartIcon,
  "dzieje-sie-samo": AutoIcon,
};

/**
 * Wygląd podestu. Wszystko, co za rodzicem (załatwione, odhaczone, wysłane, „Nie korzystam”),
 * ma jeden wygląd — różnicę mówi podpis pod podestem, nie kolor.
 */
export type NodeTone = "done" | "pawn" | "future" | "nothing";

export function nodeTone(stop: Stop, onPawnRow: boolean): NodeTone {
  if (onPawnRow && !isResolved(stop)) return "pawn";
  if (stop.kind === "dzieje-sie-samo") return "nothing";
  if (isResolved(stop)) return "done";
  return "future";
}

const LOOK: Record<NodeTone, { top: string; side: string; icon: string; dashed?: boolean }> = {
  done: { top: "fill-secondary stroke-primary", side: "fill-primary stroke-primary", icon: "text-on-surface" },
  pawn: { top: "fill-background stroke-primary", side: "fill-secondary stroke-primary", icon: "text-primary" },
  future: { top: "fill-background stroke-on-surface-variant", side: "fill-outline stroke-on-surface-variant", icon: "text-on-surface-variant" },
  nothing: { top: "fill-background stroke-on-surface-variant", side: "fill-surface stroke-on-surface-variant", icon: "text-on-surface-variant", dashed: true },
};

export function pedestalGeometry(size: number) {
  const rx = size / 2 - 2;
  const ry = Math.round(size * 0.2);
  const depth = Math.round(size * 0.24);
  return { rx, ry, depth, height: ry * 2 + depth + 10 };
}

/**
 * Podest 3D: blat (elipsa), walec pod nim i cień. Wybrany podest unosi się lekko i ma
 * ciemniejszy obrys blatu — bez obręczy dookoła.
 */
export function Pedestal({
  size,
  tone,
  selected,
  icon,
  badge,
}: {
  size: number;
  tone: NodeTone;
  selected?: boolean;
  icon: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const { rx, ry, depth, height } = pedestalGeometry(size);
  const look = LOOK[tone];
  const stroke = tone === "pawn" || selected ? 2 : 1.25;
  const dash = look.dashed ? "4 3" : undefined;
  return (
    <span className={cn("relative block transition-transform duration-200", selected ? "-translate-y-1.5" : "group-hover/pedestal:-translate-y-1")} style={{ width: size, height }}>
      <svg width={size} height={height} viewBox={`${-size / 2} ${-ry - 1} ${size} ${height}`} className="overflow-visible" aria-hidden>
        <ellipse cx={0} cy={depth + 7} rx={rx} ry={ry * 0.75} className="fill-on-surface" opacity={selected ? 0.14 : 0.08} />
        <path d={`M ${-rx} 0 L ${-rx} ${depth} A ${rx} ${ry} 0 0 0 ${rx} ${depth} L ${rx} 0 Z`} className={look.side} strokeWidth={stroke} strokeDasharray={dash} />
        <ellipse cx={0} cy={0} rx={rx} ry={ry} className={cn(look.top, selected && "stroke-on-surface")} strokeWidth={stroke} strokeDasharray={dash} />
      </svg>
      <span className={cn("absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center", look.icon)} style={{ top: ry + 1 }}>
        {icon}
      </span>
      {badge}
    </span>
  );
}

/** Przystanek na ścieżce jako przycisk z podestem. `size` to szerokość podestu. */
export function StopNode({
  stop,
  tone,
  selected,
  onSelect,
  size = 72,
}: {
  stop: Stop;
  tone: NodeTone;
  selected: boolean;
  onSelect: () => void;
  size?: number;
}) {
  const Icon = tone === "done" ? CheckIcon : KIND_ICON[stop.kind];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${stop.title}. ${KIND_LABEL[stop.kind]}. ${pathStatus(stop)}${stop.due ? `, termin ${formatLong(stop.due)}` : ""}`}
      className="group/pedestal block shrink-0 rounded-full focus-visible:outline-offset-8"
    >
      <Pedestal
        size={size}
        tone={tone}
        selected={selected}
        icon={<Icon size={size >= 64 ? 22 : 18} strokeWidth={tone === "done" ? 2.5 : 1.75} />}
        badge={
          stop.risk && (
            <span className="absolute -right-2 -top-3 flex size-6 items-center justify-center rounded-full border border-on-surface bg-tertiary text-on-surface" title="Ostrzeżenie">
              <AlertIcon size={14} />
            </span>
          )
        }
      />
    </button>
  );
}

/**
 * Podpis przystanku: nazwa (najwyżej 2 wiersze, pełna w podpowiedzi), status, a pod nim termin
 * albo warunek — każdy w osobnym wierszu, żeby dłuższe nazwy nie mieszały się ze stanem.
 */
export function StopLabel({ stop, align = "center", className }: { stop: Stop; align?: "center" | "left" | "right"; className?: string }) {
  const status = pathStatus(stop);
  const due = stop.due ? `do ${formatShort(stop.due)}` : stop.condition;
  return (
    <span className={cn("flex flex-col gap-0.5", align === "center" && "items-center text-center", align === "right" && "items-end text-right", className)}>
      <span className="line-clamp-2 text-meta font-medium leading-snug text-on-surface" title={stop.title}>
        {stop.title}
      </span>
      <span className="text-meta leading-snug text-on-surface-variant">{status}</span>
      {due && <span title={due} className={cn("line-clamp-2 text-meta leading-snug", stop.due && !isResolved(stop) ? "text-on-surface" : "text-on-surface-variant")}>{due}</span>}
    </span>
  );
}

/** „1 sprawa”, „2 sprawy”, „5 spraw”. */
export function sprawy(n: number): string {
  const tens = n % 100;
  if (n === 1) return "1 sprawa";
  if (n % 10 >= 2 && n % 10 <= 4 && (tens < 12 || tens > 14)) return `${n} sprawy`;
  return `${n} spraw`;
}

/** Zwinięty etap (np. „Planowanie”, gdy rodzic jest już dalej) — też jako podest. */
export function CollapsedStage({
  item,
  onExpand,
  labelClassName,
  size = 72,
}: {
  item: Extract<PathItem, { type: "collapsed" }>;
  onExpand: (stage: StageId) => void;
  labelClassName?: string;
  size?: number;
}) {
  return (
    <>
      <button type="button" onClick={() => onExpand(item.stage)} className="group/pedestal block rounded-full" aria-label={`Pokaż etap ${item.label}: ${sprawy(item.count)}`}>
        <Pedestal
          size={size}
          tone={item.allDone ? "done" : "future"}
          icon={item.allDone ? <CheckIcon size={22} strokeWidth={2.5} /> : <span className="text-meta font-medium">{item.count}</span>}
        />
      </button>
      <span className={cn("absolute left-1/2 flex w-48 -translate-x-1/2 flex-col items-center text-center", labelClassName)}>
        <span className="text-meta font-medium">
          {sprawy(item.count)}
          {item.allDone ? " · za Tobą" : ""}
        </span>
        <button type="button" onClick={() => onExpand(item.stage)} className="text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface">
          Pokaż etap
        </button>
      </span>
    </>
  );
}

/**
 * Tekst dymka nad pionkiem. Gdy pionek stoi na sprawie z warunkiem (np. „Po nadaniu numeru PESEL”),
 * mówimy, na co czekamy — inaczej dymek „Następny krok” przeczyłby karcie „Na dziś masz wszystko załatwione”.
 */
export function pawnBubble(stop: Stop): { lead: string; text: string } {
  if (stop.state === "warunek") return { lead: "Czekamy:", text: `${stop.condition ?? "na swój czas"}. Potem: ${stop.title}` };
  return { lead: "Następny krok:", text: `${stop.title}${stop.due ? ` · do ${formatLong(stop.due, false)}` : ""}` };
}
