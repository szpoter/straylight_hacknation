import type { StageId, Stop } from "../demo/types";
import { isResolved } from "./status";

export const STAGE_ORDER: StageId[] = ["przed", "ciaza", "narodziny", "po"];

/** Rząd ścieżki: jeden przystanek albo dwa równoległe („i” między nimi). */
export type PathRow = { stage: StageId; stops: Stop[] };

export function toRows(stops: Stop[]): PathRow[] {
  const rows: PathRow[] = [];
  const placed = new Set<string>();
  const sorted = [...stops].sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage));
  for (const stop of sorted) {
    if (placed.has(stop.id)) continue;
    const partner = stop.parallelWith ? sorted.find((s) => s.id === stop.parallelWith) : undefined;
    const row = partner && !placed.has(partner.id) ? [stop, partner] : [stop];
    row.forEach((s) => placed.add(s.id));
    rows.push({ stage: stop.stage, stops: row });
  }
  return rows;
}

/**
 * Pole pionka: pierwszy rząd, w którym coś zostało do zrobienia. Wszystko przed nim jest
 * załatwione, odhaczone, wysłane albo oznaczone „Nie korzystam”. Sprawa zrobiona poza kolejnością
 * nie przesuwa pionka za niezałatwiony obowiązek. Gdy wszystko załatwione, pionek stoi na ostatnim rzędzie.
 */
export function pawnRowIndex(rows: PathRow[]): number {
  const index = rows.findIndex((row) => !row.stops.every(isResolved));
  return index === -1 ? rows.length - 1 : index;
}

/** Najbliższa sprawa: wezwanie, potem obowiązek z najbliższym terminem, potem dowolna aktualna sprawa. */
export function nearestStop(stops: Stop[]): Stop | undefined {
  const open = stops.filter((s) => !isResolved(s) && s.state && s.state !== "warunek");
  const summons = open.find((s) => s.state === "wezwanie");
  if (summons) return summons;
  const byDue = (a: Stop, b: Stop) => (a.due ?? "9999").localeCompare(b.due ?? "9999");
  const duties = open.filter((s) => s.kind === "obowiazek").sort(byDue);
  if (duties[0]) return duties[0];
  return open.sort(byDue)[0];
}

export function openCountInStage(stops: Stop[], stage: StageId): number {
  return stops.filter((s) => s.stage === stage && s.state && !isResolved(s) && s.state !== "warunek").length;
}
