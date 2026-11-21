import { useMemo } from "react";
import type { Plan, StageId } from "@/lib/demo/types";
import { isResolved } from "@/lib/plan/status";
import { STAGE_ORDER, pawnRowIndex, toRows, type PathRow } from "@/lib/plan/path";

export type StageBlock = { stage: StageId; label: string; rows: Array<PathRow & { index: number }> };

/** Rzędy ścieżki pogrupowane w etapy, z indeksem rzędu pionka. */
export function useStageRows(plan: Plan) {
  return useMemo(() => {
    const rows = toRows(plan.stops);
    const pawn = pawnRowIndex(rows);
    const blocks: StageBlock[] = STAGE_ORDER.map((stage) => ({
      stage,
      label: plan.stages[stage].label,
      rows: rows.map((r, index) => ({ ...r, index })).filter((r) => r.stage === stage),
    }));
    return { rows, pawn, blocks, pawnStop: rows[pawn]?.stops.find((s) => !isResolved(s)) ?? rows[pawn]?.stops[0] };
  }, [plan]);
}
