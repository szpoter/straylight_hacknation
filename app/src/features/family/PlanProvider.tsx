"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_PLAN_ID, getPlan } from "@/lib/demo/fixtures";
import { applyCalculatorToPlan, type CalcForm } from "@/lib/plan/benefit-form";
import { addDays, daysBetween, formatLong } from "@/lib/demo/dates";
import type { Plan, Stop } from "@/lib/demo/types";

/** Zmiana przystanku przez rodzica. `doc` scala się z `stop.doc` (np. nowa lista zdarzeń sprawy). */
export type StopPatch = Partial<Pick<Stop, "checked" | "state">> & { doc?: Partial<NonNullable<Stop["doc"]>> };

/** Wartości pól wniosku wpisane przez rodzica: id pola → wartość. */
export type FormValues = Record<string, string>;

/** Zmiany planu z Profilu: nazwa dziecka i data kluczowa (urodzenia albo termin porodu). */
export type PlanEdit = { name?: string; keyDate?: string };

const MONTHS_NOM = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];

/**
 * Nakłada zmiany z Profilu. Nowa data przesuwa terminy wszystkich przystanków o tyle samo dni —
 * w katalogu każdy termin liczy się od daty porodu (np. „21 dni od planowanej daty porodu”).
 * TODO(reguły): liczyć terminy z `lib/rules`, gdy powstaną (ui/MACIEJ-TODO.md, punkt 10).
 */
export function applyPlanEdit(base: Plan, edit?: PlanEdit): Plan {
  if (!edit) return base;
  let plan = { ...base, name: edit.name?.trim() || base.name };
  if (edit.keyDate && base.keyDate && edit.keyDate !== base.keyDate) {
    const shift = daysBetween(base.keyDate, edit.keyDate);
    const [y, m] = edit.keyDate.split("-").map(Number);
    // Plany z onboardingu mają `situation`; plan demo „Oczekiwane dziecko” — tylko rodzaj.
    const planned = base.situation ? base.situation === "ciaza" : base.kind === "planowane";
    const care = base.situation === "adopcja" || base.situation === "piecza";
    plan = {
      ...plan,
      keyDate: edit.keyDate,
      keyDateLabel: planned ? `Termin ${formatLong(edit.keyDate)}` : care ? `Pod opieką od ${formatLong(edit.keyDate, false)}` : `ur. ${formatLong(edit.keyDate, false)}`,
      shortInfo: planned ? `${MONTHS_NOM[m - 1]} ${y}` : base.shortInfo,
      stops: base.stops.map((s) => (s.due ? { ...s, due: addDays(s.due, shift) } : s)),
    };
  }
  return plan;
}

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
  /** Zmienia nazwę lub datę kluczową planu (Profil → „Edytuj plan”). TODO(backend): zapis. */
  updatePlan: (planId: string, edit: PlanEdit) => void;
  /** Dodaje plan utworzony w onboardingu i ustawia go jako wybrany. TODO(backend): zapis. */
  addPlan: (plan: Plan) => void;
  /** Dodaje kilka planów naraz (bliźnięta: plan na dziecko) i wybiera pierwszy. */
  addPlans: (plans: Plan[]) => void;
  /**
   * Usuwa plan dodany przez rodzica (nie z rejestru). Rodzeństwu z tej samej grupy zdejmuje
   * odsyłacz do usuniętego planu. Plany demo są tylko ukrywane.
   */
  removePlan: (planId: string) => void;
  /** Wartości formularza wniosku w wybranym planie (Dokumenty → edycja). */
  formValues: (stopId: string) => FormValues;
  setFormValues: (stopId: string, values: FormValues) => void;
  /** Zapisany kalkulator zasiłku w wybranym planie (wspólny dla rodzeństwa z jednego porodu). */
  calculator: CalcForm | undefined;
  /** Zapisuje kalkulator w planie — terminy wniosków trafiają na przystanki ścieżki. */
  saveCalculator: (form: CalcForm) => void;
  clearCalculator: () => void;
  /** Czyści cały zapamiętany stan demo (Profil). */
  resetAll: () => void;
  /** Kontekst do panelu Zusika (zakres Juliana): dziecko, sprawa, pole. */
  zusik: ZusikContext | null;
  openZusik: (context: ZusikContext) => void;
  closeZusik: () => void;
};

export type ZusikContext = { planId: string; place: string; stopId?: string; field?: string; returnTo?: string; collapsed?: boolean };

const PlanContext = createContext<PlanContextValue | null>(null);

const STORAGE_KEY = "zusik.activePlan";
/**
 * Stan rodzica zapamiętany w przeglądarce: odhaczenia, oznaczenia, edycje planów, plany
 * z onboardingu i wpisane wartości wniosków. TODO(backend): przenieść do bazy (sprawa, profil) —
 * na razie localStorage, żeby po odświeżeniu nic nie znikało. Patrz ui/MACIEJ-TODO.md, „Backend”.
 */
const STATE_KEY = "zusik.state.v1";
type Saved = {
  patches: Record<string, Record<string, StopPatch>>;
  edits: Record<string, PlanEdit>;
  created: Plan[];
  hidden?: string[];
  forms: Record<string, Record<string, FormValues>>;
  /** Kalkulator zasiłku: klucz planu (albo grupy rodzeństwa) → formularz. */
  calculators?: Record<string, CalcForm>;
};

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

/** Czy rodzic ma już plany dodane w onboardingu (odczyt zapisu poza Reactem, np. przed wczytaniem stanu). */
export function hasCreatedPlans(): boolean {
  try {
    const saved = JSON.parse(readStorage(STATE_KEY) ?? "{}") as Partial<Saved>;
    return Array.isArray(saved.created) && saved.created.length > 0;
  } catch {
    return false;
  }
}

/** Klucz zapisu kalkulatora: rodzeństwo z jednego porodu ma wspólne urlopy, więc jeden kalkulator. */
export function calculatorKey(plan: Pick<Plan, "id" | "family">): string {
  return plan.family?.groupId ?? plan.id;
}

function applyStopPatch(stop: Stop, patch: StopPatch): Stop {
  const { doc, ...rest } = patch;
  return { ...stop, ...rest, ...(doc && stop.doc ? { doc: { ...stop.doc, ...doc } } : {}) };
}

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [planId, setPlanId] = useState(DEFAULT_PLAN_ID);
  const [patches, setPatches] = useState<Record<string, Record<string, StopPatch>>>({});
  const [zusik, setZusik] = useState<ZusikContext | null>(null);
  const [edits, setEdits] = useState<Record<string, PlanEdit>>({});
  const [created, setCreated] = useState<Plan[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [forms, setForms] = useState<Record<string, Record<string, FormValues>>>({});
  const [calculators, setCalculators] = useState<Record<string, CalcForm>>({});
  const [loaded, setLoaded] = useState(false);
  const plans = useMemo(() => {
    const ola = getPlan(DEFAULT_PLAN_ID);
    return [applyCalculatorToPlan(ola, calculators[calculatorKey(ola)])];
  }, [calculators]);
  const updatePlan = useCallback((id: string, edit: PlanEdit) => setEdits((prev) => ({ ...prev, [id]: { ...prev[id], ...edit } })), []);

  // Odczyt po hydratacji (serwer nie zna localStorage).
  useEffect(() => {
    let saved: Partial<Saved> = {};
    try {
      saved = JSON.parse(readStorage(STATE_KEY) ?? "{}") as Partial<Saved>;
    } catch {
      saved = {};
    }
    const createdPlans = Array.isArray(saved.created) ? saved.created : [];
    /* eslint-disable react-hooks/set-state-in-effect -- odczyt po hydratacji */
    setPatches(saved.patches ?? {});
    setEdits(saved.edits ?? {});
    setCreated(createdPlans);
    setHidden(Array.isArray(saved.hidden) ? saved.hidden : []);
    setForms(saved.forms ?? {});
    setCalculators(saved.calculators && typeof saved.calculators === "object" ? saved.calculators : {});
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    writeStorage(STATE_KEY, JSON.stringify({ patches, edits, created, hidden, forms, calculators } satisfies Saved));
  }, [loaded, patches, edits, created, hidden, forms, calculators]);

  const selectPlan = useCallback((id: string) => {
    if (id !== DEFAULT_PLAN_ID) return;
    setPlanId(id);
    setZusik(null);
    writeStorage(STORAGE_KEY, id);
  }, []);

  /**
   * Plany, w których zapisujemy zmianę sprawy: wybrany plan, a przy sprawie wspólnej rodzeństwa
   * (`sharedGroup`, np. zasiłek przy bliźniętach) — wszystkie plany z tą samą sprawą w grupie.
   */
  const targetsFor = useCallback(
    (stopId: string): string[] => {
      const group = plans.find((p) => p.id === planId)?.stops.find((s) => s.id === stopId)?.sharedGroup;
      if (!group) return [planId];
      return plans.filter((p) => p.stops.some((s) => s.id === stopId && s.sharedGroup === group)).map((p) => p.id);
    },
    [plans, planId],
  );

  const patchStop = useCallback(
    (stopId: string, patch: StopPatch) => {
      const targets = targetsFor(stopId);
      setPatches((prev) => {
        const next = { ...prev };
        for (const id of targets) {
          const cur = prev[id]?.[stopId];
          const merged: StopPatch = { ...cur, ...patch, ...(cur?.doc || patch.doc ? { doc: { ...cur?.doc, ...patch.doc } } : {}) };
          next[id] = { ...prev[id], [stopId]: merged };
        }
        return next;
      });
    },
    [targetsFor],
  );

  const resetStop = useCallback(
    (stopId: string) => {
      const targets = targetsFor(stopId);
      setPatches((prev) => {
        const next = { ...prev };
        for (const id of targets) {
          const forPlan = { ...prev[id] };
          delete forPlan[stopId];
          next[id] = forPlan;
        }
        return next;
      });
    },
    [targetsFor],
  );
  const isPatched = useCallback((stopId: string) => Boolean(patches[planId]?.[stopId]), [patches, planId]);

  const addPlan = useCallback(
    (next: Plan) => {
      setCreated((prev) => [next, ...prev.filter((p) => p.id !== next.id)]);
      selectPlan(next.id);
    },
    [selectPlan],
  );
  const addPlans = useCallback(
    (next: Plan[]) => {
      if (next.length === 0) return;
      const ids = new Set(next.map((p) => p.id));
      setCreated((prev) => [...next, ...prev.filter((p) => !ids.has(p.id))]);
      selectPlan(next[0].id);
    },
    [selectPlan],
  );
  const removePlan = useCallback(
    (id: string) => {
      const target = plans.find((p) => p.id === id);
      if (!target || target.kind === "rejestr") return;
      if (created.some((p) => p.id === id)) {
        setCreated((prev) =>
          prev
            .filter((p) => p.id !== id)
            .map((p) => {
              if (!p.family || p.family.groupId !== target.family?.groupId) return p;
              const names = p.family.names.filter((n) => n !== target.name);
              // Zostało jedno dziecko — to już nie rodzeństwo; sprawy wspólne zostają w jego planie.
              if (names.length < 2) return { ...p, family: undefined, stops: p.stops.map((st) => ({ ...st, sharedGroup: undefined })) };
              const primary = p.family.primaryPlanId === id ? prev.find((q) => q.id !== id && q.family?.groupId === p.family?.groupId) : undefined;
              return { ...p, family: { ...p.family, names, ...(primary ? { primaryPlanId: primary.id, primaryName: primary.name } : {}) } };
            }),
        );
      } else setHidden((prev) => [...prev, id]);
      if (planId === id) {
        const fallback = plans.find((p) => p.id !== id);
        if (fallback) selectPlan(fallback.id);
      }
    },
    [plans, created, planId, selectPlan],
  );
  const formValues = useCallback((stopId: string) => forms[planId]?.[stopId] ?? {}, [forms, planId]);
  const setFormValues = useCallback(
    (stopId: string, values: FormValues) => {
      const targets = targetsFor(stopId);
      setForms((prev) => {
        const next = { ...prev };
        for (const id of targets) next[id] = { ...prev[id], [stopId]: values };
        return next;
      });
    },
    [targetsFor],
  );
  const resetAll = useCallback(() => {
    setPatches({});
    setEdits({});
    setCreated([]);
    setHidden([]);
    setForms({});
    setCalculators({});
    selectPlan(DEFAULT_PLAN_ID);
  }, [selectPlan]);

  const plan = useMemo(() => {
    const base = plans.find((p) => p.id === planId) ?? getPlan(planId);
    const planPatches = patches[planId];
    if (!planPatches) return base;
    return { ...base, stops: base.stops.map((s) => (planPatches[s.id] ? applyStopPatch(s, planPatches[s.id]) : s)) };
  }, [planId, patches, plans]);

  const currentKey = calculatorKey(plan);
  const calculator = calculators[currentKey];
  const saveCalculator = useCallback((form: CalcForm) => setCalculators((prev) => ({ ...prev, [currentKey]: form })), [currentKey]);
  const clearCalculator = useCallback(
    () =>
      setCalculators((prev) => {
        const next = { ...prev };
        delete next[currentKey];
        return next;
      }),
    [currentKey],
  );

  const value = useMemo<PlanContextValue>(
    () => ({
      plans,
      plan,
      selectPlan,
      patchStop,
      resetStop,
      isPatched,
      updatePlan,
      addPlan,
      addPlans,
      removePlan,
      formValues,
      setFormValues,
      calculator,
      saveCalculator,
      clearCalculator,
      resetAll,
      zusik,
      openZusik: setZusik,
      closeZusik: () => setZusik(current => current && { ...current, collapsed: true }),
    }),
    [plans, plan, selectPlan, patchStop, resetStop, isPatched, updatePlan, addPlan, addPlans, removePlan, formValues, setFormValues, calculator, saveCalculator, clearCalculator, resetAll, zusik],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlan musi być użyte wewnątrz <PlanProvider>");
  return ctx;
}
