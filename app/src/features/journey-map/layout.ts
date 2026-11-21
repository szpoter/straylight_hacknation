import type { StageId, Stop } from "@/lib/demo/types";
import type { StageBlock } from "./useStageRows";

/** Element ścieżki po rozłożeniu: rząd przystanków albo zwinięty etap. */
export type PathItem =
  | { type: "row"; stage: StageId; index: number; stops: Stop[] }
  | { type: "collapsed"; stage: StageId; label: string; count: number; allDone: boolean };

export function toItems(blocks: StageBlock[], collapsed: Set<StageId>, isDone: (s: Stop) => boolean): PathItem[] {
  const items: PathItem[] = [];
  for (const block of blocks) {
    if (block.rows.length === 0) continue;
    if (collapsed.has(block.stage)) {
      const stops = block.rows.flatMap((r) => r.stops);
      items.push({ type: "collapsed", stage: block.stage, label: block.label, count: stops.length, allDone: stops.every(isDone) });
      continue;
    }
    for (const row of block.rows) items.push({ type: "row", stage: row.stage, index: row.index, stops: row.stops });
  }
  return items;
}

/** Łagodna fala: przesunięcie węzła względem osi (−1…1). */
export function wave(i: number): number {
  // Zaokrąglone, żeby serwer i przeglądarka liczyły identyczne pozycje (hydratacja).
  return Math.round(Math.sin(i * 0.9 + 0.4) * 1000) / 1000;
}

/** Gładka ścieżka przez punkty (krzywe z poziomymi lub pionowymi uchwytami). */
export function smoothPath(points: Array<[number, number]>, orientation: "horizontal" | "vertical"): string {
  if (points.length === 0) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (orientation === "horizontal") {
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    } else {
      const my = (y0 + y1) / 2;
      d += ` C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
    }
  }
  return d;
}
