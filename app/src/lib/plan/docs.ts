import type { DocGoal, Stop } from "../demo/types";
import { docStatus, type DocGroup } from "./status";

export const GOAL_LABEL: Record<DocGoal, string> = {
  urlopy: "Urlopy",
  swiadczenia: "Świadczenia i zasiłki",
  rejestracja: "Rejestracja i ubezpieczenie",
  zdrowie: "Zdrowie i opieka",
};

export const GOAL_ORDER: DocGoal[] = ["urlopy", "swiadczenia", "rejestracja", "zdrowie"];

/** Sprawy z wierszem w „Dokumentach i wnioskach”. */
export function docCases(stops: Stop[]): Array<Stop & { doc: NonNullable<Stop["doc"]>; state: NonNullable<Stop["state"]> }> {
  return stops.filter((s): s is Stop & { doc: NonNullable<Stop["doc"]>; state: NonNullable<Stop["state"]> } => Boolean(s.doc && s.state));
}

export function countByGroup(stops: Stop[]): Record<DocGroup, number> {
  const counts: Record<DocGroup, number> = { "do-zalatwienia": 0, wyslane: 0, "na-pozniej": 0, zakonczone: 0 };
  for (const c of docCases(stops)) counts[docStatus(c.state).group] += 1;
  return counts;
}
