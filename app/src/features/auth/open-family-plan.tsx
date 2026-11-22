"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/AppButton";
import { rememberActivePlan } from "@/features/family/PlanProvider";
import { DEFAULT_PLAN_ID } from "@/lib/demo/fixtures";
import { startDemoSession } from "./demo-session";

export function OpenFamilyPlan() {
  const router = useRouter();
  function openPlan() {
    startDemoSession("logowanie", "hero");
    rememberActivePlan(DEFAULT_PLAN_ID);
    router.replace("/plan");
  }
  return <Button onClick={openPlan} className="shrink-0">Otwórz plan rodziny Oli</Button>;
}
