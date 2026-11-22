"use client";

import { PageTitle } from "@/components/ui";
import { childrenGenitive } from "@/features/family/family-name";
import { usePlan } from "@/features/family/PlanProvider";

/** Tytuł Profilu według wybranego scenariusza: „Rodzina Oli Lis”, „Rodzina Leny i Kuby”. */
export function FamilyTitle({ className }: { className?: string }) {
  // Nazwa od dzieci, od których rodzina się zaczęła; dodane później jej nie zmieniają.
  const children = childrenGenitive(usePlan().familyPlans[0]);
  return <PageTitle className={className}>{children ? `Rodzina ${children}` : "Profil rodziny"}</PageTitle>;
}
