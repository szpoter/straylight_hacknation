"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_PLAN_ID, PLANS, getPlan } from "@/lib/demo/fixtures";
import type { Plan, Stop } from "@/lib/demo/types";

type StopPatch = Partial<Pick<Stop, "checked" | "state">>;

type PlanContextValue = {
  plans: Plan[];
  plan: Plan;
  selectPlan: (id: string) => void;
  /** Lokalna zmiana przystanku (np. prywatne „Odhaczone”). TODO(backend): zapis w sprawie. */
  patchStop: (stopId: string, patch: StopPatch) => void;
  /** Cofa zmiany rodzica przy przystanku (stan wraca do danych z plan/ZUS). */
  resetStop: (stopId: string) => void;
  /** Czy stan przystanku pochodzi od rodzica („Oznaczone przez Ciebie”). */
  isPatched: (stopId: string) => boolean;
  /** Kontekst do panelu Zusika (zakres Juliana): dziecko, sprawa, pole. */
  zusik: ZusikContext | null;
  openZusik: (context: ZusikContext) => void;
  closeZusik: () => void;
};

export type ZusikContext = { planId: string; place: string; stopId?: string; field?: string; returnTo?: string };

const PlanContext = createContext<PlanContextValue | null>(null);

const STORAGE_KEY = "zusik.activePlan";

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Prywatne okno lub zablokowane dane: działamy bez zapamiętania.
  }
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [planId, setPlanId] = useState(DEFAULT_PLAN_ID);
  const [patches, setPatches] = useState<Record<string, Record<string, StopPatch>>>({});
  const [zusik, setZusik] = useState<ZusikContext | null>(null);

  useEffect(() => {
    const saved = readStorage(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- odczyt po hydratacji
    if (saved && PLANS.some((p) => p.id === saved)) setPlanId(saved);
  }, []);

  const selectPlan = useCallback((id: string) => {
    setPlanId(id);
    writeStorage(STORAGE_KEY, id);
  }, []);

  const patchStop = useCallback(
    (stopId: string, patch: StopPatch) =>
      setPatches((prev) => ({ ...prev, [planId]: { ...prev[planId], [stopId]: { ...prev[planId]?.[stopId], ...patch } } })),
    [planId],
  );

  const resetStop = useCallback(
    (stopId: string) =>
      setPatches((prev) => {
        const next = { ...prev[planId] };
        delete next[stopId];
        return { ...prev, [planId]: next };
      }),
    [planId],
  );
  const isPatched = useCallback((stopId: string) => Boolean(patches[planId]?.[stopId]), [patches, planId]);

  const plan = useMemo(() => {
    const base = getPlan(planId);
    const planPatches = patches[planId];
    if (!planPatches) return base;
    return { ...base, stops: base.stops.map((s) => (planPatches[s.id] ? { ...s, ...planPatches[s.id] } : s)) };
  }, [planId, patches]);

  const value = useMemo<PlanContextValue>(
    () => ({ plans: PLANS, plan, selectPlan, patchStop, resetStop, isPatched, zusik, openZusik: setZusik, closeZusik: () => setZusik(null) }),
    [plan, selectPlan, patchStop, resetStop, isPatched, zusik],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan musi być użyte wewnątrz <PlanProvider>");
  return ctx;
}
