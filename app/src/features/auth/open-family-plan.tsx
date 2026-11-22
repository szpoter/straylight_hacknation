"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/AppButton";
import { startDemoSession } from "./demo-session";

export function OpenFamilyPlan() {
  const router = useRouter();
  function openPlan() {
    startDemoSession("logowanie", "hero");
    router.replace("/plan");
  }
  return <Button onClick={openPlan} className="shrink-0">Otwórz plan rodziny Oli</Button>;
}
