import { genitiveName, joinNames } from "@/features/onboarding/flow";
import { DEFAULT_PLAN_ID } from "@/lib/demo/fixtures";
import type { Plan } from "@/lib/demo/types";
import { OLA } from "@/lib/family/ola";

/** Imię w pasku: „Ola Lis” w scenariuszu Oli, w pozostałych imię dziecka z wybranego planu. */
export function childName(plan: Plan): string {
  return plan.id === DEFAULT_PLAN_ID ? OLA.child : plan.name;
}

/** Imiona dzieci scenariusza: „Ola Lis”, „Lena i Kuba”, „Antek”. */
export function childrenLabel(plan: Plan): string {
  if (plan.id === DEFAULT_PLAN_ID) return OLA.child;
  return plan.family ? joinNames(plan.family.names) : plan.name;
}

/**
 * Dopełniacz do „Rodzina …” i „Rodzice …”: „Oli Lis”, „Leny i Kuby”, „Antka”. Plan bez imion
 * (ciąża, „Dziecko 1”) nie ma czego odmienić, więc zwraca undefined.
 */
export function childrenGenitive(plan: Plan): string | undefined {
  if (plan.id === DEFAULT_PLAN_ID) return "Oli Lis";
  if (plan.situation === "ciaza" || plan.situation === "planuje") return undefined;
  const names = plan.family ? plan.family.names : [plan.name];
  if (names.some((n) => /^Dziecko( \d+)?$/.test(n))) return undefined;
  return joinNames(names.map(genitiveName));
}
