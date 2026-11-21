"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, LockIcon, Panel, PlusIcon, SectionTitle, Tag, cn } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import type { Plan } from "@/lib/demo/types";

function KindLabel({ plan }: { plan: Plan }) {
  if (plan.kind === "rejestr")
    return (
      <span className="inline-flex items-center gap-1 text-meta text-on-surface-variant">
        <LockIcon size={14} /> dane z rejestru
      </span>
    );
  if (plan.kind === "planowane") return <span className="text-meta text-on-surface-variant">planowane</span>;
  return <Tag tone="accent">{plan.kind === "test" ? "Test" : "Przykład"}</Tag>;
}

/** „Dzieci i plany”: karty planów z etykietą rodzaju i „Edytuj plan”. */
export function PlansSection() {
  const { plans, plan: active, selectPlan } = usePlan();
  const router = useRouter();
  return (
    <Panel aria-labelledby="dzieci-plany">
      <SectionTitle id="dzieci-plany" className="mb-4">
        Dzieci i plany
      </SectionTitle>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {plans.map((p) => {
          const isActive = p.id === active.id;
          return (
            <li key={p.id} className={cn("flex flex-col gap-3 rounded-lg border p-4", isActive ? "border-2 border-primary bg-background" : "border-outline")}>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-title">{p.name}</span>
                <span className="text-meta text-on-surface-variant">
                  {p.keyDateLabel} · etap „{p.stages[p.stage].label}”
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  <KindLabel plan={p} />
                  {isActive && <span className="text-meta font-medium">Wybrany w pasku</span>}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="self-start"
                onClick={() => {
                  selectPlan(p.id);
                  router.push("/plan");
                }}
              >
                Edytuj plan<span className="sr-only"> {p.name}</span>
              </Button>
            </li>
          );
        })}
        <li>
          <Link
            href="/start"
            className="flex h-full min-h-32 items-center justify-center gap-2 rounded-lg border border-dashed border-on-surface-variant p-4 font-medium hover:bg-background"
          >
            <PlusIcon /> Dodaj dziecko lub plan
          </Link>
        </li>
      </ul>
    </Panel>
  );
}
