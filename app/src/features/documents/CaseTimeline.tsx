"use client";

import { useState } from "react";
import { cn, DoneMark } from "@/components/ui";
import { formatLong } from "@/lib/demo/dates";
import type { TimelineStage } from "./timeline";

function StageMark({ stage, index }: { stage: TimelineStage; index: number }) {
  if (stage.status === "done") return <DoneMark className="size-8!" />;
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border text-meta font-medium",
        stage.status === "current" ? "border-2 border-primary bg-surface" : "border-outline bg-surface text-on-surface-variant",
      )}
    >
      {index + 1}
    </span>
  );
}

function StageCaption({ stage }: { stage: TimelineStage }) {
  if (stage.status === "current") return <span className="text-meta font-medium text-primary">Teraz</span>;
  if (stage.status === "future") return <span className="text-meta text-on-surface-variant">Przed Tobą</span>;
  return <span className="text-meta text-on-surface-variant">{stage.date ? formatLong(stage.date) : "Zakończone"}</span>;
}

function StageDetails({ stage, recipient }: { stage: TimelineStage; recipient: string }) {
  return (
    <div className="flex flex-col gap-3">
      {stage.id === "wyslano" && stage.date && (
        <p>
          {formatLong(stage.date)} · {recipient}
        </p>
      )}
      {stage.detail && <p className={cn(stage.status !== "done" && "text-on-surface-variant")}>{stage.detail}</p>}
      {stage.entries.length > 0 && (
        <ol className="flex flex-col gap-3 border-l border-outline pl-4">
          {stage.entries.map((e, i) => (
            <li key={`${e.date}-${i}`} className="flex flex-col">
              <span className="text-meta text-on-surface-variant">
                {formatLong(e.date)}
                {e.author && ` · ${e.author}`}
              </span>
              <span className="font-medium">{e.title}</span>
              {e.detail && <span className="text-meta">{e.detail}</span>}
            </li>
          ))}
        </ol>
      )}
      {!stage.detail && stage.entries.length === 0 && stage.status === "future" && <p className="text-on-surface-variant">Ten etap jest przed Tobą.</p>}
    </div>
  );
}

/** Desktop: poziomy pasek etapów ze szczegółami pod spodem. Telefon: pionowa lista, wybrany etap rozwinięty. */
export function Timeline({ stages, recipient }: { stages: TimelineStage[]; recipient: string }) {
  const initial = stages.find((s) => s.status === "current")?.id ?? stages.findLast((s) => s.status === "done")?.id ?? stages[0].id;
  const [selected, setSelected] = useState(initial);
  const active = stages.find((s) => s.id === selected) ?? stages[0];

  return (
    <div>
      <ol className="flex flex-col lg:grid lg:grid-cols-4">
        {stages.map((stage, i) => {
          const isSel = stage.id === selected;
          return (
            <li key={stage.id} id={`etap-${stage.id}`} className="relative flex gap-3 pb-6 last:pb-0 lg:flex-col lg:gap-2 lg:pb-0 lg:pr-4">
              {i < stages.length - 1 && (
                <span aria-hidden className={cn("absolute bg-outline", "left-4 top-8 h-[calc(100%-2rem)] w-px lg:left-8 lg:top-4 lg:h-px lg:w-[calc(100%-2rem)]", stage.status === "done" && "bg-primary")} />
              )}
              <StageMark stage={stage} index={i} />
              <div className="flex min-w-0 flex-1 flex-col">
                <button
                  type="button"
                  aria-expanded={isSel}
                  aria-current={stage.status === "current" ? "step" : undefined}
                  onClick={() => setSelected(stage.id)}
                  className={cn("text-left font-medium underline-offset-4 hover:underline", isSel && "lg:underline")}
                >
                  {i + 1}. {stage.label}
                </button>
                <StageCaption stage={stage} />
                {isSel && (
                  <div className="mt-3 lg:hidden">
                    <StageDetails stage={stage} recipient={recipient} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-card hidden border-t border-outline pt-card lg:block">
        <p className="mb-2 text-meta text-on-surface-variant">{active.label}</p>
        <StageDetails stage={active} recipient={recipient} />
      </div>
    </div>
  );
}
